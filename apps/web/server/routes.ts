import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
// No longer needed for our simplified approach
import { storage } from "./storage";
import emailConfig from './config/email';
import { FsnDomain, AdminLog } from "@shared/schema";
import { VaultItemType } from "@shared/vault";
import { encrypt, decrypt, generateItemId } from "./crypto";
import { processIncomingEmail } from "./email";
import { sendWelcomeEmail } from "./welcome-email";
import { runMigration } from "./db-migration";
import { sendVerificationEmail } from "./emailService";
import { sendCongratulationsEmail } from "./congratulations-email";
// Import security middleware
import { authLimiter, emailLimiter, fsnNameLimiter, standardLimiter } from "./middleware/rate-limiter";
import { validateBody, validateParams } from "./middleware/validate";
import { loginSchema, registrationSchema, fsnNameCheckSchema } from "./validation/auth-schemas";
// Import FSN validation utility
import { validateFsnName, sanitizeFsnName } from "./validation/fsn-validation";
// Import file upload security utilities
import { 
  validateFileType, 
  validateFileSize, 
  generateSecureFilename, 
  extractFileFromBase64, 
  scanFileContent 
} from "./middleware/file-upload-security";
// Import with ES dynamic imports
import type { Router } from "express";
import discRoutes from "./routes/disc";

export async function registerRoutes(app: Express): Promise<Server> {
  // Run database migrations to ensure schema is up to date
  try {
    const migrationResult = await runMigration();
    console.log("Database migration result:", migrationResult);
  } catch (error) {
    console.error("Failed to run database migration:", error);
  }

  // Middleware for parsing JSON bodies with increased limit
  app.use(express.json({ limit: '50mb' }));
  
  // Dynamically import routers to avoid CommonJS/ESM issues
  try {
    // Import messages router
    const messagesModule = await import('./routes/fsn-messages');
    app.use('/api/fsn/messages', messagesModule.default);
    
    // Import contacts router
    const contactsModule = await import('./routes/fsn-contacts');
    app.use('/api/fsn/contacts', contactsModule.default);
    
    // Import simple contacts router for address book
    const simpleContactsModule = await import('./routes/contacts');
    app.use('/api/contacts', simpleContactsModule.default);
    
    // Import wallet router
    const walletModule = await import('./routes/wallet');
    app.use('/api/wallet', walletModule.default);
    
    // Import email router
    const emailModule = await import('./routes/email');
    app.use('/api/email', emailModule.default);
    
    // Import vault API router for email test functionality
    const vaultApiModule = await import('./routes/api/vault');
    app.use('/api/vault', vaultApiModule.default);
    
    // Import user routes for password management
    const userModule = await import('./routes/user');
    app.use('/api/user', userModule.default);
    
    // Import beacon routes for Phase 0 recast functionality
    const beaconModule = await import('./routes/beacon');
    app.use('/api/beacon', beaconModule.default);
    
    // Import rewards routes for Phase 0 rewards UI feedback system
    const rewardsModule = await import('./routes/rewards');
    app.use('/api/rewards', rewardsModule.default);
    
    // Import FSN mirror routes for blockchain integration
    const fsnMirrorModule = await import('./routes/fsn-mirror');
    app.use('/api/fsn', fsnMirrorModule.default);
    
    // Import cron routes for daily XP minting
    const cronModule = await import('./routes/cron');
    app.use('/api/cron', cronModule.default);
    
    // Import vault routes for secure file storage
    const vaultModule = await import('./routes/vault');
    app.use('/api/vault', vaultModule.default);
    
    // Import leaderboard routes
    try {
      const leaderboardModule = await import('./routes/leaderboard');
      app.use('/api/leaderboard', leaderboardModule.default);
    } catch (error) {
      console.warn('Leaderboard routes not available:', error.message);
    }
    
    // Import referral routes  
    try {
      const referralModule = await import('./routes/referrals');
      app.use('/api/referrals', referralModule.default);
    } catch (error) {
      console.warn('Referral routes not available:', error.message);
    }
    
    // Import AI agents router - disabled until fixed
    // const aiAgentsModule = await import('./routes/ai-agents');
    // app.use('/api/ai/agents', aiAgentsModule.default);
    
    // Skip problematic routers for now
    // We'll implement these routes directly if needed
  } catch (error) {
    console.error("Error loading route modules:", error);
  }

  // Serve image files directly to bypass Vite middleware
  app.get('/api/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.resolve('./public', filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  });

  // Serve attached assets (badge images, etc.)
  app.use('/attached_assets', express.static(path.resolve('./attached_assets')));
  
  // Login API endpoint with rate limiting and validation to prevent brute force attacks and input-based attacks
  app.post("/api/user/login", authLimiter, validateBody(loginSchema), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      console.log(`Login attempt for username: ${username}`);
      
      // Try to find user by username first
      let user = await storage.getUserByUsername(username);
      
      // If not found by username, check if username is actually an FSN name
      if (!user) {
        console.log(`User not found by username, checking if ${username} is an FSN name`);
        // Get FSN domain by name
        const domain = await storage.getFsnDomain(username);
        if (domain && domain.owner_id) {
          console.log(`Found FSN domain ${username} owned by user ${domain.owner_id}`);
          // If found, get the user by ID
          user = await storage.getUser(domain.owner_id);
        }
      }
      
      // Still no user found
      if (!user) {
        console.log(`No user found for login ${username}`);
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Verify password (simple comparison for now)
      console.log(`Password check: provided='${password}', stored='${user.password}', match=${user.password === password}`);
      if (user.password !== password) {
        console.log(`Password verification failed for user ${username}`);
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      console.log(`Login successful for user ${username} (ID: ${user.id})`);
      
      // Get user's FSN domains
      const domains = await storage.getAllFsnDomains(1000, 0);
      const userDomains = domains.filter(domain => domain.owner_id === user.id);
      const fsnName = userDomains.length > 0 ? userDomains[0].name : '';
      
      // Store user data in session and force save
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.fsnName = fsnName;
      req.session.isLoggedIn = true;
      req.session.loginTime = Date.now();
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        } else {
          console.log('Session saved successfully for user:', user.id);
        }
      });
      
      // Return user info
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        fsnName: fsnName,
        sessionBased: true // Let client know we're using sessions now
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed, please try again" });
    }
  });
  
  // Session-based logout endpoint
  // Handle both GET and POST logout requests
  const handleLogout = (req: any, res: any) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('fsn.session'); // Clear session cookie
        return res.json({ success: true, message: "Logged out successfully" });
      });
    } else {
      return res.json({ success: true, message: "Already logged out" });
    }
  };

  app.get("/api/logout", handleLogout);
  app.post("/api/logout", handleLogout);

  // Session check endpoint - check if user is logged in
  app.get("/api/session/check", (req, res) => {
    if (req.session && req.session.userId && req.session.isLoggedIn) {
      return res.json({
        isLoggedIn: true,
        userId: req.session.userId,
        username: req.session.username,
        fsnName: req.session.fsnName,
        loginTime: req.session.loginTime
      });
    } else {
      return res.json({ isLoggedIn: false });
    }
  });

  // Get user profile (for authenticated users)
  app.get("/api/user/profile", async (req, res) => {
    try {
      // Get user ID from session
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's FSN domains
      const domains = await storage.getAllFsnDomains(1000, 0);
      const userDomains = domains.filter(domain => domain.owner_id === user.id);
      const fsnName = userDomains.length > 0 ? userDomains[0].name : '';

      // Return user profile data
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        userType: user.userType,
        fsnName: fsnName
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });
  
  // FSN Domain availability check (with rate limiting)
  app.get("/api/fsn/check/:name", fsnNameLimiter, async (req, res) => {
    try {
      const name = req.params.name;
      if (!name || name.length < 3) {
        return res.status(400).json({ 
          error: "Name must be at least 3 characters long" 
        });
      }
      
      const availability = await storage.checkFsnNameAvailability(name);
      return res.json(availability);
    } catch (error) {
      console.error("Error checking domain availability:", error);
      return res.status(500).json({ error: "Failed to check domain availability" });
    }
  });

  // FSN Domain availability check via query parameter (simplified for testing)
  app.get("/api/fsn/check-availability", fsnNameLimiter, async (req, res) => {
    try {
      const name = req.query.name as string;
      if (!name || name.length < 3) {
        return res.status(400).json({ 
          error: "Name must be at least 3 characters long" 
        });
      }
      
      // Simplified availability check for testing
      const normalizedName = name.toLowerCase().trim();
      
      // Check against reserved names
      const reservedNames = ['admin', 'support', 'api', 'www', 'test', 'root', 'system'];
      if (reservedNames.includes(normalizedName)) {
        return res.json({ available: false, reason: 'This name is reserved' });
      }
      
      // For testing, assume most names are available
      return res.json({ available: true });
    } catch (error) {
      console.error("Error checking domain availability:", error);
      return res.status(500).json({ error: "Failed to check domain availability" });
    }
  });
  
  // Get user IP address for identity verification
  app.get("/api/user/ip", async (req, res) => {
    try {
      // Get IP address from various sources
      const ip = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]) ||
                 'unknown';
      
      return res.json({ 
        ip: ip === '::1' ? '127.0.0.1' : ip // Convert IPv6 localhost to IPv4
      });
    } catch (error) {
      console.error("Error getting user IP:", error);
      return res.status(500).json({ error: "Failed to get IP address" });
    }
  });

  // Set user password
  app.post("/api/user/set-password", async (req, res) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId || !password) {
        return res.status(400).json({ error: "User ID and password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" });
      }
      
      // Update user password
      const success = await storage.updateUserPassword(userId, password);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      return res.json({ 
        success: true, 
        message: "Password set successfully"
      });
      
    } catch (error) {
      console.error("Error setting password:", error);
      return res.status(500).json({ error: "Failed to set password" });
    }
  });

  // Get user verification status
  app.get("/api/user/verification-status", async (req, res) => {
    try {
      const userId = 7; // TODO: Get from session
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`🔍 Email verification check for user ${userId}: ${user.isEmailVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
      
      // In wallet-first mode, always return verified
      if (!emailConfig.isRequired()) {
        return res.json({
          emailVerified: true,
          phoneVerified: false,
          email: user.email || null,
          phone: null
        });
      }
      
      // Check for actual verified codes in the database
      let emailVerified = await storage.isEmailVerified(userId);
      const phoneVerified = await storage.isPhoneVerified(userId);
      
      // SOULBOUND CHECK: If user's email is bound to an FSN identity, mark as unverified for new claims
      if (emailVerified && user.email) {
        const existingFsnDomains = await storage.getFsnDomainsByOwner(userId);
        if (existingFsnDomains.length > 0) {
          console.log(`🚫 SOULBOUND DETECTED: User ${userId} email ${user.email} is bound to ${existingFsnDomains.length} FSN(s) - returning unverified for new claims`);
          emailVerified = false; // Block verification status for FSN-bound emails
        }
      }
      
      return res.json({
        emailVerified,
        phoneVerified,
        email: emailVerified ? user.email : null, // Only show email after verification is complete
        phone: null
      });
    } catch (error) {
      console.error("Error checking verification status:", error);
      return res.status(500).json({ error: "Failed to check verification status" });
    }
  });

  // Enhanced FSN domain claim with identity verification
  app.post("/api/fsn/claim", async (req, res) => {
    try {
      const { 
        name, 
        userId, 
        ownerEmail, 
        ownerPhone, 
        deviceFingerprint, 
        registrationIP, 
        xpAtClaim, 
        verificationMethod
      } = req.body;
      
      // Validation
      if (!name || name.length < 3 || name.length > 20) {
        return res.status(400).json({ 
          error: "Name must be 3-20 characters long" 
        });
      }
      
      if (!/^[a-z0-9-]+$/.test(name)) {
        return res.status(400).json({ 
          error: "Name can only contain lowercase letters, numbers, and hyphens" 
        });
      }
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Check if user exists and get their verification status
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // HARD RULE: MANDATORY EMAIL VERIFICATION - NO EXCEPTIONS (with master bypass for testing)
      const masterBypass = await storage.checkMasterCodeUsage(userId);
      const emailVerified = masterBypass || await storage.isEmailVerified(userId);
      const phoneVerified = await storage.isPhoneVerified(userId);
      
      console.log('VERIFICATION CHECK:', { userId, emailVerified, phoneVerified, masterBypass });
      
      if (!emailVerified) {
        console.log('BLOCKING FSN claim - email NOT verified');
        return res.status(403).json({ 
          error: "Email verification is REQUIRED before claiming FSN names",
          requiresVerification: true
        });
      }
      
      if (masterBypass) {
        console.log(`🔓 MASTER BYPASS: User ${userId} allowed to claim FSN via master code`);
      }
      
      // Check availability first
      const availability = await storage.checkFsnNameAvailability(name);
      if (!availability.available) {
        return res.status(409).json({ 
          error: "Domain name is not available", 
          reason: availability.reason 
        });
      }
      
      // Create FSN domain in database
      console.log('Creating FSN domain:', { name, userId, deviceFingerprint, registrationIP });
      
      const fsnDomain = await storage.createFsnDomain({
        name,
        status: 'registered',
        owner_id: userId,
        ownerEmail: ownerEmail,
        deviceFingerprint: deviceFingerprint,
        registrationIP: registrationIP,
        xpAtClaim: 50,
        verificationMethod: verificationMethod || 'email',
        isEmailVerified: true,
        isPhoneVerified: false
      });
      
      // Award XP for claiming
      await storage.awardXP(userId, 50, 'fsn_claim', `Claimed FSN domain: ${name}`);
      
      console.log('FSN domain created successfully:', fsnDomain);
      
      return res.json({
        success: true,
        domain: name,
        message: `Successfully claimed ${name}!`,
        xpAwarded: 50,
        verificationMethod: verificationMethod,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error claiming FSN domain:", error);
      return res.status(500).json({ error: "Failed to claim domain" });
    }
  });

  // Register FSN domain (legacy endpoint - kept for compatibility)
  app.post("/api/fsn/register", async (req, res) => {
    try {
      const { name, userId } = req.body;
      
      if (!name || name.length < 3) {
        return res.status(400).json({ 
          error: "Name must be at least 3 characters long" 
        });
      }
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check availability first
      const availability = await storage.checkFsnNameAvailability(name);
      if (!availability.available) {
        return res.status(409).json({ 
          error: "Domain name is not available", 
          reason: availability.reason 
        });
      }
      
      // Register the domain using legacy method
      const domain = await storage.registerFsnName(name, userId);
      if (!domain) {
        return res.status(500).json({ error: "Failed to register domain" });
      }
      
      // Update user XP
      await storage.updateUserStats(userId, { 
        xpPoints: 100, // Award XP for registering a domain
      });
      
      return res.status(201).json(domain);
    } catch (error) {
      console.error("Error registering domain:", error);
      return res.status(500).json({ error: "Failed to register domain" });
    }
  });
  
  // Register new user with FSN name - unified endpoint (with rate limiting and input validation)
  app.post("/api/user/register", authLimiter, validateBody(registrationSchema), async (req, res) => {
    try {
      const { username, email, password, fsnName } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ 
          error: "Username and password are required" 
        });
      }
      
      if (!fsnName || fsnName.length < 3) {
        return res.status(400).json({ 
          error: "FSN name must be at least 3 characters long" 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already taken" });
      }
      
      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ error: "Email already in use" });
        }
      }
      
      // Check FSN name availability
      const availability = await storage.checkFsnNameAvailability(fsnName);
      if (!availability.available) {
        return res.status(409).json({ 
          error: "FSN name is not available", 
          reason: availability.reason 
        });
      }
      
      // TODO: In production, hash the password before storing
      // const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password,  // In production, use hashedPassword
      });
      
      // Register FSN name for the user
      const domain = await storage.registerFsnName(fsnName, user.id);
      if (!domain) {
        // If domain registration fails, still return user but with warning
        return res.status(201).json({ 
          user,
          warning: "User created but FSN name registration failed" 
        });
      }
      
      // Send welcome email to the new user
      if (user.email) {
        try {
          await sendWelcomeEmail(user, fsnName);
          console.log(`Welcome email sent to ${user.email} for FSN name: ${fsnName}`);
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Continue even if email fails - don't block user registration
        }
      }
      
      // Initialize user stats with XP for claiming name
      await storage.updateUserStats(user.id, {
        xpPoints: 100,
        level: 1
      });
      
      return res.status(201).json({
        user,
        domain,
        message: "User registered successfully with FSN name"
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ error: "Failed to register user" });
    }
  });

  // NEW: Register and verify endpoint for fresh users coming from claim flow
  app.post("/api/register-and-verify", authLimiter, async (req, res) => {
    try {
      const { email, fsnName, address } = req.body;
      
      // Check if email is required using config
      if (emailConfig.isRequired() && (!email || !email.includes('@'))) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      
      if (!fsnName || fsnName.length < 3) {
        return res.status(400).json({ error: "FSN name must be at least 3 characters long" });
      }

      // Wallet-first mode: use address if no email required
      if (!emailConfig.isRequired() && address) {
        // Create user with wallet address only
        const userData = {
          username: fsnName,
          email: email || null,
          password_hash: null, // No password needed for wallet-first
          user_type: 'user',
          is_admin: false
        };
        
        const user = await storage.createUser(userData);
        return res.status(201).json({ 
          success: true,
          userId: user.id,
          message: "User created successfully - wallet-first mode" 
        });
      }
      
      // Check if someone already has this username (may not have claimed FSN yet)
      const existingUsername = await storage.getUserByUsername(fsnName);
      console.log('Checking username:', fsnName, 'Found:', !!existingUsername);
      
      if (existingUsername) {
        console.log('Existing user details:', { 
          id: existingUsername.id, 
          email: existingUsername.email, 
          inputEmail: email,
          emailMatch: existingUsername.email === email,
          isEmailVerified: existingUsername.is_email_verified 
        });
        
        // If user exists but hasn't verified email, allow them to re-verify with same email
        if (existingUsername.email === email && !existingUsername.is_email_verified) {
          console.log('ALLOWING RE-VERIFICATION: User exists but not verified, resending verification to same email');
          try {
            // Generate proper 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            await storage.storeVerificationCode(existingUsername.id, email, verificationCode);
            await sendVerificationEmail(email, verificationCode);
            console.log('Re-sent verification email to existing user:', existingUsername.id);
          } catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
          }
          return res.status(201).json({ 
            success: true,
            userId: existingUsername.id,
            message: "Verification code resent to your email." 
          });
        } else {
          console.log('BLOCKING: FSN name taken by different user or already verified');
          return res.status(409).json({ error: "This FSN name is already taken by another user" });
        }
      }
      
      console.log('No existing username found, checking email separately');
      
      // Check if email already exists (for completely different users)
      const existingUser = await storage.getUserByEmail(email);
      console.log('Checking email separately:', email, 'Found:', !!existingUser);
      if (existingUser) {
        return res.status(409).json({ error: "Email already in use" });
      }
      
      // Check FSN name availability (in case someone registered with different username)
      const availability = await storage.checkFsnNameAvailability(fsnName);
      if (!availability.available) {
        return res.status(409).json({ 
          error: "FSN name is not available", 
          reason: availability.reason 
        });
      }
      
      // Create new user with minimal info (password will be set later)
      const tempPassword = Math.random().toString(36).substring(2, 12); // Temporary password
      
      // Generate unique username if FSN name is already taken
      let username = fsnName;
      let counter = 1;
      let userExists = await storage.getUserByUsername(username);
      while (userExists) {
        username = `${fsnName}_${counter}`;
        userExists = await storage.getUserByUsername(username);
        counter++;
      }
      
      const user = await storage.createUser({
        username: username, // Use unique username
        email,
        password: tempPassword, // Will require password setup later
        emailVerified: false
      });
      
      console.log('Created new user for verification:', user.id, email);
      
      // Send email verification
      try {
        // Generate proper 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await storage.storeVerificationCode(user.id, email, verificationCode);
        await sendVerificationEmail(email, verificationCode);
        console.log('Verification email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the registration, user can retry verification
      }
      
      return res.status(201).json({ 
        success: true,
        userId: user.id,
        message: "User created successfully. Please verify your email." 
      });
      
    } catch (error) {
      console.error("Error in register-and-verify:", error);
      return res.status(500).json({ error: "Failed to create user account" });
    }
  });

  // Set password for new users after email verification
  app.post("/api/user/set-password", authLimiter, async (req, res) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update user password (in production, hash the password first)
      await storage.updateUser(userId, { password });
      console.log('Password updated for user:', userId);
      
      return res.json({ 
        success: true,
        message: "Password set successfully" 
      });
      
    } catch (error) {
      console.error("Error setting password:", error);
      return res.status(500).json({ error: "Failed to set password" });
    }
  });
  
  // Get user's FSN domains
  app.get("/api/fsn/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get all domains and filter by owner
      const allDomains = await storage.getAllFsnDomains(1000, 0);
      const userDomains = allDomains.filter(domain => domain.owner_id === userId);
      
      return res.json(userDomains);
    } catch (error) {
      console.error("Error fetching user domains:", error);
      return res.status(500).json({ error: "Failed to fetch user domains" });
    }
  });
  
  // Get user stats
  app.get("/api/user/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get user stats or initialize if not found
      let stats = await storage.getUserStats(userId);
      
      if (!stats) {
        // Create default stats if none exist
        stats = await storage.updateUserStats(userId, {
          xpPoints: 100, // Initial XP for new users
          level: 1,
          signalsSent: 0,
          connectionsCount: 0
        });
      }
      
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Get current user stats (session-based)
  app.get("/api/user/stats", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get user stats or initialize if not found
      let stats = await storage.getUserStats(userId);
      
      if (!stats) {
        // Create default stats if none exist
        stats = await storage.updateUserStats(userId, {
          xpPoints: 100, // Initial XP for new users
          level: 1,
          signalsSent: 0,
          connectionsCount: 0
        });
      }
      
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Create user session after FSN claiming
  app.post("/api/fsn/create-session", async (req, res) => {
    try {
      const { fsnName, walletAddress } = req.body;
      
      if (!fsnName || !walletAddress) {
        return res.status(400).json({ error: "FSN name and wallet address required" });
      }
      
      // Check if user already exists with this wallet address
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        // Create new user for this wallet
        user = await storage.createUser({
          username: fsnName,
          email: `${fsnName}@fsn.local`, // Temporary email
          password: '', // No password for wallet-only users
          walletAddress: walletAddress,
          fsnName: fsnName,
          emailVerified: true, // Auto-verify for blockchain-based claims
          role: 'user'
        });
        console.log('Created new user for FSN claim:', user.id, fsnName);
      } else {
        // Update existing user's FSN name if needed
        if (user.fsnName !== fsnName) {
          await storage.updateUser(user.id, { fsnName });
          console.log('Updated FSN name for existing user:', user.id, fsnName);
        }
      }
      
      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.fsnName = fsnName;
      req.session.isLoggedIn = true;
      
      console.log('Session created for user:', user.id, fsnName);
      
      return res.json({ 
        success: true,
        userId: user.id,
        fsnName: fsnName,
        message: "Session created successfully" 
      });
      
    } catch (error) {
      console.error("Error creating FSN session:", error);
      return res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Check if wallet already owns an FSN name (soulbound enforcement)
  app.get("/api/fsn/check-wallet/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      // Check if user exists with this wallet address
      const user = await storage.getUserByWalletAddress(address);
      
      if (user && user.fsnName) {
        return res.json({ 
          hasName: true, 
          fsnName: user.fsnName,
          message: "Wallet already owns an FSN name" 
        });
      } else {
        return res.json({ 
          hasName: false, 
          fsnName: null,
          message: "Wallet available for registration" 
        });
      }
      
    } catch (error) {
      console.error("Error checking wallet:", error);
      return res.status(500).json({ error: "Failed to check wallet" });
    }
  });

  // Reset user verification status for testing
  app.post("/api/user/reset-verification", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      
      // Delete all verification codes for this user
      await storage.deleteUserVerificationCodes(userId);
      
      return res.json({ success: true, message: "Verification status reset" });
    } catch (error) {
      console.error("Error resetting verification:", error);
      return res.status(500).json({ error: "Failed to reset verification" });
    }
  });
  
  // Update user stats (including quest data)
  app.patch("/api/user/stats/:userId", standardLimiter, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const updates = req.body;
      
      // Update user stats
      const updatedStats = await storage.updateUserStats(userId, updates);
      if (!updatedStats) {
        return res.status(404).json({ error: "User stats not found" });
      }
      
      return res.json({ success: true, stats: updatedStats });
    } catch (error) {
      console.error("Error updating user stats:", error);
      return res.status(500).json({ error: "Failed to update user stats" });
    }
  });
  
  // Update user visibility setting
  app.patch("/api/user/:userId/visibility", standardLimiter, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ error: "isPublic must be a boolean value" });
      }
      
      // For now, just return success since we need to add the isPublic column to database
      // TODO: Add database migration for isPublic column
      return res.json({ success: true, isPublic });
    } catch (error) {
      console.error("Error updating user visibility:", error);
      return res.status(500).json({ error: "Failed to update visibility setting" });
    }
  });

  // --- User Profile & Verification API ---
  
  // Send email verification code
  app.post("/api/user/verify/email", emailLimiter, async (req, res) => {
    if (!emailConfig.enabled) {
      return res.status(404).json({ error: "Email verification is disabled" });
    }
    console.log("🔥🔥🔥 EMAIL VERIFICATION ENDPOINT HIT!!!");
    try {
      const { userId, email } = req.body;
      console.log(`🚨 EMAIL VERIFICATION REQUEST: userId=${userId}, email=${email}`);
      console.log(`DEBUG: About to start soulbound check for ${email}`);
      
      if (!userId || !email) {
        return res.status(400).json({ error: "Missing userId or email" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // SOULBOUND SECURITY CHECK: Block ANY email that's already associated with an FSN identity
      console.log(`🔍 SOULBOUND CHECK: Looking for existing user with email ${email}`);
      const existingUser = await storage.getUserByEmail(email);
      console.log(`🔍 SOULBOUND CHECK RESULT: existingUser =`, existingUser ? `User ID ${existingUser.id}` : 'NOT FOUND');
      
      if (existingUser) {
        console.log(`📧 Email ${email} found associated with user ${existingUser.id}, checking FSN domains...`);
        
        // Check if this email is associated with any FSN domain
        const existingFsnDomains = await storage.getFsnDomainsByOwner(existingUser.id);
        console.log(`🔍 User ${existingUser.id} owns ${existingFsnDomains.length} FSN domains`);
        
        if (existingFsnDomains.length > 0) {
          // MASTER TESTING BYPASS: Check if this user has used master code recently
          const masterBypass = await storage.checkMasterCodeUsage(existingUser.id);
          
          if (masterBypass) {
            console.log(`🔓 MASTER BYPASS: Allowing email re-verification for testing user ${existingUser.id}`);
            // Continue with verification instead of blocking
          } else {
            const existingFsnName = existingFsnDomains[0].name;
            console.log(`🚫 SOULBOUND VIOLATION: Email ${email} is already bound to FSN identity ${existingFsnName}.fsn (user ${existingUser.id})`);
            console.log(`🚫 BLOCKING all verification attempts for this email - SOULBOUND ENFORCED`);
            return res.status(409).json({ 
              error: "This email address is already bound to an FSN identity",
              message: `This email is permanently bound to ${existingFsnName}.fsn. Each email can only be used for one FSN identity (soulbound). Please use a different email address.`,
              boundToFsn: `${existingFsnName}.fsn`,
              requiresDifferentEmail: true,
              soulboundViolation: true
            });
          }
        }
        
        // If email exists but has no FSN (legacy user), allow verification only by same user
        if (existingUser.id !== parseInt(userId)) {
          console.log(`🚫 EMAIL ALREADY IN USE: ${email} is owned by user ${existingUser.id}, rejecting verification request from user ${userId}`);
          return res.status(409).json({ 
            error: "This email address is already in use by another account",
            message: "Each email address can only be used for one FSN identity. Please use a different email address.",
            requiresDifferentEmail: true
          });
        }
      }
      
      console.log(`✅ EMAIL SCREENING PASSED: Email ${email} is available for FSN identity creation`);

      console.log(`✅ EMAIL SCREENING PASSED: Email ${email} is available for user ${userId}`);
      
      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code (expires in 10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await storage.createVerificationCode({
        userId,
        code,
        type: 'email',
        contact: email,
        expiresAt
      });
      
      // Send verification email (with demo fallback)
      try {
        const emailSent = await sendVerificationEmail(email, code);
        return res.json({ success: true, message: "Verification code sent to email" });
      } catch (error) {
        // Demo mode: log the code and return success
        console.log('='.repeat(60));
        console.log('🔐 DEMO MODE - EMAIL VERIFICATION CODE:');
        console.log(`📧 To: ${email}`);
        console.log(`🔢 Code: ${code}`);
        console.log('='.repeat(60));
        return res.json({ success: true, message: "Verification code sent to email (demo mode)" });
      }
    } catch (error) {
      console.error("Error sending email verification:", error);
      return res.status(500).json({ error: "Failed to send verification code" });
    }
  });
  
  // Verify email code and update user profile
  app.post("/api/user/verify/email/confirm", async (req, res) => {
    if (!emailConfig.enabled) {
      return res.status(404).json({ error: "Email verification is disabled" });
    }
    console.log("🔥🔥🔥 EMAIL CONFIRMATION ENDPOINT HIT!!!");
    try {
      const { userId, email, code } = req.body;
      
      if (!userId || !email || !code) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Master verification code for testing - bypass all checks
      console.log(`🔍 Code received: "${code}" (type: ${typeof code})`);
      if (code === '000000') {
        console.log('🔓 MASTER CODE USED: Bypassing all verification checks for testing purposes');
        // Skip verification code lookup and validation
      } else {
        // Find and validate verification code
        const verification = await storage.getVerificationCode(userId, code, 'email', email);
        
        if (!verification) {
          return res.status(400).json({ error: "Invalid or expired verification code" });
        }
        
        if (verification.isUsed) {
          return res.status(400).json({ error: "Verification code already used" });
        }
        
        if (new Date() > new Date(verification.expiresAt)) {
          return res.status(400).json({ error: "Verification code expired" });
        }
        
        // Mark code as used
        await storage.useVerificationCode(verification.id);
      }
      
      // Update user profile with verified email
      await storage.updateUserProfile(userId, {
        email,
        isEmailVerified: true
      });
      
      // Award XP for email verification using the XP Engine
      const { XPEngine } = await import('./xpEngine');
      const xpResult = await XPEngine.awardXP(userId, 'verify_email', {
        email,
        verificationMethod: 'email_code'
      });
      
      const xpReward = xpResult.xpAwarded;
      const newXP = xpResult.newTotal;
      
      return res.json({ 
        success: true, 
        message: "Email verified successfully",
        xpAwarded: xpReward,
        newXP
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({ error: "Failed to verify email" });
    }
  });
  
  // Update user profile with social links
  app.post("/api/user/profile", async (req, res) => {
    try {
      const { userId, ...profileData } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // IMMUTABILITY PROTECTION: Block FSN name edits in profile updates
      if ('fsnName' in profileData) {
        console.log('🚫 BLOCKED - Attempt to modify FSN name via profile update');
        return res.status(403).json({ 
          error: 'FSN names are immutable and cannot be changed',
          message: 'FSN names are permanent digital identities. They cannot be modified through profile updates.',
          blockedField: 'fsnName',
          permanent: true
        });
      }
      
      // Award XP for profile completion using XP Engine
      const currentUser = await storage.getUser(userId);
      let totalXPAwarded = 0;
      
      if (currentUser) {
        const { XPEngine } = await import('./xpEngine');
        const fieldsToCheck = ['twitter', 'discord', 'telegram', 'linkedin', 'github', 'website', 'bio'];
        
        for (const field of fieldsToCheck) {
          if (profileData[field] && !currentUser[field]) {
            const xpResult = await XPEngine.awardXP(userId, 'complete_profile', {
              field,
              value: profileData[field]
            });
            if (xpResult.success) {
              totalXPAwarded += xpResult.xpAwarded;
            }
          }
        }
      }
      
      // Update profile
      await storage.updateUserProfile(userId, profileData);
      
      return res.json({ 
        success: true, 
        message: "Profile updated successfully",
        xpAwarded: totalXPAwarded
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Get user profile including FSN name
  app.get("/api/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return user profile including FSN name (immutable once set)
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fsnName: user.fsnName, // This is the permanent FSN identity
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        bio: user.bio,
        twitter: user.twitter,
        discord: user.discord,
        telegram: user.telegram,
        linkedin: user.linkedin,
        github: user.github,
        website: user.website,
        xp: user.xp,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Get user verification status
  app.get("/api/user/:userId/verification-status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`🔍 Email verification check for user ${userId}: ${user.isEmailVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
      
      // MASTER TESTING BYPASS: Check if this user has used the master code recently
      const masterBypass = await storage.checkMasterCodeUsage(userId);
      
      // Check for actual verified codes in the database
      let emailVerified = masterBypass || await storage.isEmailVerified(userId);
      const phoneVerified = await storage.isPhoneVerified(userId);
      
      if (masterBypass) {
        console.log(`🔓 MASTER BYPASS: User ${userId} verified via master code - OVERRIDING SOULBOUND for testing`);
      } else {
        // SOULBOUND CHECK: If user's email is bound to an FSN identity, mark as unverified for new claims
        // BUT ONLY if not using master bypass
        if (emailVerified && user.email) {
          const existingFsnDomains = await storage.getFsnDomainsByOwner(userId);
          if (existingFsnDomains.length > 0) {
            console.log(`🚫 SOULBOUND DETECTED: User ${userId} email ${user.email} is bound to ${existingFsnDomains.length} FSN(s) - returning unverified for new claims`);
            emailVerified = false; // Block verification status for FSN-bound emails
          }
        }
      }
      
      return res.json({
        emailVerified,
        phoneVerified,
        email: user.email,
        phone: user.phone,
        hasCompleteProfile: !!(user.email && (user.twitter || user.discord || user.telegram))
      });
    } catch (error) {
      console.error("Error getting verification status:", error);
      return res.status(500).json({ error: "Failed to get verification status" });
    }
  });
  
  // --- FSN Vault API endpoints ---
  
  // Get all vault items for authenticated user
  app.get("/api/vault/items", async (req, res) => {
    try {
      // Check authentication
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get user's vault items from storage
      const vaultItems = await storage.getVaultItemsByUser(userId);
      
      // Format items for frontend
      const formattedItems = vaultItems.map(item => ({
        id: item.id,
        filename: item.itemId, // Using itemId as filename for now
        size: item.data?.length || 0,
        type: item.itemType,
        uploadDate: item.createdAt,
        userId: item.userId,
        fsnName: item.fsnName
      }));
      
      return res.json(formattedItems);
    } catch (error) {
      console.error("Error fetching vault items:", error);
      return res.status(500).json({ error: "Failed to fetch vault items" });
    }
  });
  
  // Create a vault item with enhanced security
  app.post("/api/vault/items", standardLimiter, async (req, res) => {
    try {
      const { userId, fsnName, itemType, data, password, fileName } = req.body;
      
      if (!userId || !fsnName || !itemType || !data || !password) {
        return res.status(400).json({ 
          error: "Missing required fields (userId, fsnName, itemType, data, password)" 
        });
      }
      
      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Validate FSN name belongs to user
      const domains = await storage.getAllFsnDomains(1000, 0);
      const userDomain = domains.find(d => d.ownerId === userId && d.name === fsnName);
      if (!userDomain) {
        return res.status(403).json({ error: "FSN name does not belong to this user" });
      }
      
      // Check if itemType is valid
      if (!Object.values(VaultItemType).includes(itemType as VaultItemType)) {
        return res.status(400).json({ error: "Invalid item type" });
      }
      
      // For file uploads, perform security checks
      if (itemType === 'file' && typeof data === 'string' && data.startsWith('data:')) {
        try {
          // Extract file content from base64
          const { buffer, mimeType } = extractFileFromBase64(data);
          
          // Validate file size
          if (!validateFileSize(buffer.length)) {
            return res.status(400).json({ 
              error: "File exceeds maximum size limit of 10MB" 
            });
          }
          
          // Validate file type
          if (!fileName || !validateFileType(fileName, mimeType)) {
            return res.status(400).json({ 
              error: "Invalid or unsupported file type" 
            });
          }
          
          // Scan file for malicious content
          const scanResult = await scanFileContent(buffer);
          if (!scanResult.clean) {
            return res.status(400).json({ 
              error: `File rejected: ${scanResult.threat || 'Security scan failed'}` 
            });
          }
          
          // Generate secure filename
          const secureFileName = generateSecureFilename(fileName);
          
          // Add filename to the data object
          const fileData = {
            originalName: fileName,
            secureName: secureFileName,
            mimeType: mimeType,
            content: data
          };
          
          // Use the fileData object instead of raw data
          const secureData = fileData;
          
          // Generate unique item ID
          const itemId = generateItemId();
          
          // Encrypt the secure data with the password
          const encryptedData = encrypt(JSON.stringify(secureData), password);
          
          // Check for duplicate uploads to prevent XP farming
          const existingItems = await storage.getVaultItemsByUser(userId);
          let isDuplicate = false;
          
          if (existingItems && existingItems.length > 0) {
            // Check if this file content already exists
            for (const existingItem of existingItems) {
              try {
                const standardPassword = "fsn-vault-access";
                const existingDecrypted = decrypt(existingItem.data, standardPassword);
                const existingData = JSON.parse(existingDecrypted);
                if (existingData.content === data) {
                  isDuplicate = true;
                  break;
                }
              } catch (error) {
                // Skip items that can't be decrypted
                continue;
              }
            }
          }

          // Create vault item with the secure data
          const vaultItem = await storage.createVaultItem({
            userId,
            fsnName,
            itemId,
            itemType,
            data: encryptedData,
          });

          // Award XP for file upload (first time only, no duplicates)
          if (!isDuplicate) {
            const currentStats = await storage.getUserStats(userId);
            const newXP = (currentStats?.xpPoints || 0) + 50;
            await storage.updateUserStats(userId, {
              xpPoints: newXP
            });
          }
          
          return res.status(201).json({
            id: vaultItem.id,
            itemId: vaultItem.itemId,
            itemType: vaultItem.itemType,
            createdAt: vaultItem.createdAt,
            secureName: secureData.secureName,
            originalName: secureData.originalName,
            xpAwarded: !isDuplicate,
            isDuplicate: isDuplicate
          });
        } catch (error) {
          console.error("File processing error:", error);
          return res.status(400).json({ 
            error: "Failed to process file upload" 
          });
        }
      }
      
      // For non-file data
      // Generate unique item ID
      const itemId = generateItemId();
      
      // Encrypt the regular data with the password
      const encryptedData = encrypt(JSON.stringify(data), password);
      
      // Create vault item
      const vaultItem = await storage.createVaultItem({
        userId,
        fsnName,
        itemId,
        itemType,
        data: encryptedData,
      });
      
      return res.status(201).json({
        id: vaultItem.id,
        itemId: vaultItem.itemId,
        itemType: vaultItem.itemType,
        createdAt: vaultItem.createdAt,
      });
    } catch (error) {
      console.error("Error creating vault item:", error);
      return res.status(500).json({ error: "Failed to create vault item" });
    }
  });

  // Complete pulse task API endpoint
  app.post("/api/pulse/complete", async (req, res) => {
    try {
      console.log('Pulse task completion request:', req.body);
      console.log('Session data:', {
        hasSession: !!req.session,
        userId: req.session?.userId,
        isLoggedIn: req.session?.isLoggedIn,
        username: req.session?.username
      });
      
      const { taskId, hzReward } = req.body;
      
      if (!taskId || !hzReward) {
        console.log('Missing required fields:', { taskId, hzReward });
        return res.status(400).json({ error: "Task ID and Hz reward are required" });
      }

      // Get current user ID from session
      const userId = req.session?.userId;
      if (!userId) {
        console.log('No userId in session - authentication failed');
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get current user stats
      const currentStats = await storage.getUserStats(userId);
      if (!currentStats) {
        return res.status(404).json({ error: "User stats not found" });
      }

      // Parse current quest data
      let questData = {};
      try {
        questData = currentStats.questData ? JSON.parse(currentStats.questData) : {};
      } catch (error) {
        console.error("Error parsing quest data:", error);
        questData = {};
      }

      // Initialize pulse tasks if not exists
      if (!questData.pulseTasks) {
        questData.pulseTasks = [];
      }

      // Check if task is already completed today (prevent farming)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!questData.dailyTasks) {
        questData.dailyTasks = {};
      }
      if (!questData.dailyTasks[today]) {
        questData.dailyTasks[today] = [];
      }
      
      // Check if task was already completed today
      if (questData.dailyTasks[today].includes(taskId)) {
        return res.status(400).json({ error: "Task already completed today" });
      }
      
      // Legacy check for old system
      if (questData.pulseTasks && questData.pulseTasks.includes(taskId)) {
        // Migrate to daily system
        questData.dailyTasks[today].push(taskId);
      }

      // Add task to today's completed list
      questData.dailyTasks[today].push(taskId);
      
      // Also add to legacy list for backwards compatibility
      if (!questData.pulseTasks) {
        questData.pulseTasks = [];
      }
      if (!questData.pulseTasks.includes(taskId)) {
        questData.pulseTasks.push(taskId);
      }

      // Calculate new pulse score (current + hz reward)
      const currentPulse = currentStats.pulseHz || 30;
      const newPulse = Math.min(currentPulse + hzReward, 100); // Cap at 100

      // Award XP for completing the task
      const xpReward = hzReward * 10; // 10 XP per Hz
      const newXP = (currentStats.xpPoints || 0) + xpReward;

      // Update user stats
      await storage.updateUserStats(userId, {
        xpPoints: newXP,
        pulseHz: newPulse,
        questData: JSON.stringify(questData)
      });

      console.log('Task completed successfully:', { taskId, newPulse, newXP });
      
      return res.json({ 
        success: true, 
        taskId, 
        hzReward, 
        xpReward,
        newPulse,
        newXP,
        message: `Task completed! +${hzReward}Hz, +${xpReward}XP` 
      });
    } catch (error) {
      console.error("Error completing pulse task:", error);
      return res.status(500).json({ 
        error: "Failed to complete pulse task", 
        details: error.message 
      });
    }
  });
  
  // Get user's vault items
  app.get("/api/vault/users/:userId/items", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const itemType = req.query.type as VaultItemType | undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get vault items
      const items = await storage.getVaultItemsByUser(userId, itemType);
      
      // Return metadata including file information
      const itemsMetadata = items.map(item => {
        let data = {};
        try {
          // Decrypt and parse the data field to get filename info
          if (item.data) {
            const decryptedData = decrypt(item.data, 'fsn-vault-access');
            data = JSON.parse(decryptedData);
          }
        } catch (error) {
          // If decryption fails, use empty object
          console.error('Error decrypting item data:', error);
        }
        
        return {
          id: item.id,
          itemId: item.itemId,
          itemType: item.itemType,
          fsnName: item.fsnName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          data: data, // Include decrypted metadata
        };
      });
      
      return res.json(itemsMetadata);
    } catch (error) {
      console.error("Error fetching vault items:", error);
      return res.status(500).json({ error: "Failed to fetch vault items" });
    }
  });
  
  // Get FSN name's vault items
  app.get("/api/vault/fsn/:fsnName/items", async (req, res) => {
    try {
      const fsnName = req.params.fsnName;
      const itemType = req.query.type as VaultItemType | undefined;
      
      if (!fsnName) {
        return res.status(400).json({ error: "FSN name is required" });
      }
      
      // Get vault items for FSN name
      const items = await storage.getVaultItemsByFsnName(fsnName, itemType);
      
      // Return only metadata (not the encrypted data)
      const itemsMetadata = items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemType: item.itemType,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      
      return res.json(itemsMetadata);
    } catch (error) {
      console.error("Error fetching vault items:", error);
      return res.status(500).json({ error: "Failed to fetch vault items" });
    }
  });
  
  // Get a specific vault item
  app.post("/api/vault/items/:itemId/decrypt", async (req, res) => {
    try {
      const itemId = req.params.itemId;
      
      // Get the vault item
      const item = await storage.getVaultItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Vault item not found" });
      }
      
      // For the first version, since old files might have used different passwords,
      // let's just return the file directly to simplify things
      if (item.id === 1) {
        // For the first item, we can't decrypt it properly, so just return dummy data
        return res.json({
          id: item.id,
          itemId: item.itemId,
          itemType: item.itemType,
          fsnName: item.fsnName,
          data: {
            filename: "example.txt",
            content: "This is a placeholder for your file content. Upload a new file to use the storage system."
          },
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
      
      try {
        // Always use the same password for simplicity - matching the client-side
        const standardPassword = "fsn-vault-access";
        
        // Decrypt the data
        const decryptedData = decrypt(item.data, standardPassword);
        const parsedData = JSON.parse(decryptedData);
        
        return res.json({
          id: item.id,
          itemId: item.itemId,
          itemType: item.itemType,
          fsnName: item.fsnName,
          data: parsedData,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      } catch (error) {
        console.error("Decryption error:", error);
        // Still return something useful even if decryption fails
        return res.json({
          id: item.id,
          itemId: item.itemId,
          itemType: item.itemType,
          fsnName: item.fsnName,
          data: {
            filename: "recovery.txt",
            content: "The file data could not be decrypted. Please upload a new file."
          },
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    } catch (error) {
      console.error("Error accessing vault item:", error);
      return res.status(500).json({ error: "Failed to access vault item" });
    }
  });
  
  // Update a vault item
  app.put("/api/vault/items/:itemId", async (req, res) => {
    try {
      const { data, password, userId } = req.body;
      const itemId = req.params.itemId;
      
      if (!data || !password || !userId) {
        return res.status(400).json({ error: "Missing required fields (data, password, userId)" });
      }
      
      // Get the vault item
      const item = await storage.getVaultItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Vault item not found" });
      }
      
      // Check ownership
      if (item.userId !== parseInt(userId)) {
        return res.status(403).json({ error: "You do not own this vault item" });
      }
      
      try {
        // Verify password by attempting to decrypt
        decrypt(item.data, password);
        
        // Encrypt the new data
        const encryptedData = encrypt(JSON.stringify(data), password);
        
        // Update the vault item
        const updatedItem = await storage.updateVaultItem(itemId, encryptedData);
        if (!updatedItem) {
          return res.status(500).json({ error: "Failed to update vault item" });
        }
        
        return res.json({
          id: updatedItem.id,
          itemId: updatedItem.itemId,
          itemType: updatedItem.itemType,
          fsnName: updatedItem.fsnName,
          updatedAt: updatedItem.updatedAt,
        });
      } catch (error) {
        return res.status(403).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error updating vault item:", error);
      return res.status(500).json({ error: "Failed to update vault item" });
    }
  });
  
  // STORAGE BACKEND MODULE - File renaming endpoint
  app.patch("/api/vault/items/:itemId/rename", async (req, res) => {
    try {
      const { userId, newFilename } = req.body;
      const itemId = req.params.itemId;
      
      if (!userId || !newFilename?.trim()) {
        return res.status(400).json({ error: "Missing required fields (userId, newFilename)" });
      }
      
      // Get the vault item
      const item = await storage.getVaultItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Vault item not found" });
      }
      
      // Check ownership
      if (item.userId !== parseInt(userId)) {
        return res.status(403).json({ error: "You do not own this vault item" });
      }
      
      try {
        // Use standard password for decryption
        const standardPassword = "fsn-vault-access";
        
        // Decrypt, update filename, and re-encrypt
        const decryptedData = decrypt(item.data, standardPassword);
        const parsedData = JSON.parse(decryptedData);
        parsedData.filename = newFilename.trim();
        
        const encryptedData = encrypt(JSON.stringify(parsedData), standardPassword);
        
        // Update the vault item
        const updatedItem = await storage.updateVaultItem(itemId, encryptedData);
        if (!updatedItem) {
          return res.status(500).json({ error: "Failed to rename file" });
        }
        
        return res.json({
          id: updatedItem.id,
          itemId: updatedItem.itemId,
          itemType: updatedItem.itemType,
          fsnName: updatedItem.fsnName,
          updatedAt: updatedItem.updatedAt,
        });
      } catch (error) {
        console.error("Error processing file rename:", error);
        return res.status(500).json({ error: "Failed to process file rename" });
      }
    } catch (error) {
      console.error("Error renaming vault item:", error);
      return res.status(500).json({ error: "Failed to rename vault item" });
    }
  });

  // Delete a vault item
  app.delete("/api/vault/items/:itemId", async (req, res) => {
    try {
      const { userId } = req.body;
      const itemId = req.params.itemId;
      
      if (!userId) {
        return res.status(400).json({ error: "Missing required field (userId)" });
      }
      
      // Get the vault item
      const item = await storage.getVaultItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Vault item not found" });
      }
      
      // Check ownership
      if (item.userId !== parseInt(userId)) {
        return res.status(403).json({ error: "You do not own this vault item" });
      }
      
      // Delete the vault item
      const success = await storage.deleteVaultItem(itemId);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete vault item" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vault item:", error);
      return res.status(500).json({ error: "Failed to delete vault item" });
    }
  });
  
  // Get domain details
  app.get("/api/fsn/domain/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const domain = await storage.getFsnDomain(name);
      
      if (!domain) {
        return res.status(404).json({ error: "Domain not found" });
      }
      
      return res.json(domain);
    } catch (error) {
      console.error("Error fetching domain:", error);
      return res.status(500).json({ error: "Failed to fetch domain" });
    }
  });
  
  // Get global FSN domain stats (total registered, etc.)
  app.get("/api/fsn/stats", async (req, res) => {
    try {
      const stats = await storage.getDomainStats();
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching domain stats:", error);
      return res.status(500).json({ error: "Failed to fetch domain stats" });
    }
  });
  
  // Get registered domains with owner email (public endpoint for admin dashboard)
  app.get("/api/fsn/domains/registered", async (req, res) => {
    try {
      const domains = await storage.getRegisteredDomains(100, 0);
      
      // Enhance domains with owner email for password reset assistance
      const enhancedDomains = await Promise.all(
        domains.map(async (domain) => {
          if (domain.owner_id) {
            // Fetch the owner's information to get email
            const owner = await storage.getUser(domain.owner_id);
            return {
              ...domain,
              ownerEmail: owner?.email || null
            };
          }
          return domain;
        })
      );
      
      return res.json(enhancedDomains);
    } catch (error) {
      console.error("Error fetching registered domains:", error);
      return res.status(500).json({ error: "Failed to fetch registered domains" });
    }
  });
  
  // --- Admin routes ---
  
  // Middleware to check if user is admin
  const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = parseInt(req.headers['admin-id'] as string);
      if (isNaN(adminId)) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
      
      const user = await storage.getUser(adminId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      // Set admin info for logging
      req.body.adminId = adminId;
      next();
    } catch (error) {
      console.error("Admin authentication error:", error);
      return res.status(500).json({ error: "Authentication error" });
    }
  };
  
  // Create a new reserved name
  app.post("/api/admin/reserved", adminOnly, async (req, res) => {
    try {
      const { name, reason, adminId } = req.body;
      
      if (!name || !reason) {
        return res.status(400).json({ error: "Name and reason are required" });
      }
      
      // Check if name already exists
      const domain = await storage.getFsnDomain(name);
      if (domain && domain.status === 'registered') {
        return res.status(409).json({ 
          error: "Cannot reserve a registered domain" 
        });
      }
      
      // Reserve the name
      const reservedName = await storage.reserveFsnName(name, reason, adminId);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: "RESERVE_NAME",
        targetTable: "reserved_names",
        targetId: reservedName.id,
        details: `Reserved name ${name}: ${reason}`
      });
      
      return res.status(201).json(reservedName);
    } catch (error) {
      console.error("Error reserving name:", error);
      return res.status(500).json({ error: "Failed to reserve name" });
    }
  });
  
  // Get all reserved names
  app.get("/api/admin/reserved", adminOnly, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const reservedNames = await storage.getAllReservedNames(limit, offset);
      return res.json(reservedNames);
    } catch (error) {
      console.error("Error fetching reserved names:", error);
      return res.status(500).json({ error: "Failed to fetch reserved names" });
    }
  });
  
  // Update a reserved name
  app.patch("/api/admin/reserved/:id", adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason, isActive, adminId } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const updatedName = await storage.updateReservedName(id, { reason, isActive });
      if (!updatedName) {
        return res.status(404).json({ error: "Reserved name not found" });
      }
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: "UPDATE_RESERVED_NAME",
        targetTable: "reserved_names",
        targetId: id,
        details: `Updated reserved name ${updatedName.name}`
      });
      
      return res.json(updatedName);
    } catch (error) {
      console.error("Error updating reserved name:", error);
      return res.status(500).json({ error: "Failed to update reserved name" });
    }
  });
  
  // Delete a reserved name
  app.delete("/api/admin/reserved/:id", adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminId } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const reservedNames = await storage.getAllReservedNames();
      const reserved = reservedNames.find(r => r.id === id);
      if (!reserved) {
        return res.status(404).json({ error: "Reserved name not found" });
      }
      
      const success = await storage.deleteReservedName(id);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete reserved name" });
      }
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: "DELETE_RESERVED_NAME",
        targetTable: "reserved_names",
        targetId: id,
        details: `Deleted reserved name ${reserved.name}`
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting reserved name:", error);
      return res.status(500).json({ error: "Failed to delete reserved name" });
    }
  });
  
  // Get all FSN domains with advanced filtering options
  app.get("/api/admin/domains", adminOnly, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const search = req.query.search as string;
      
      let domains: FsnDomain[] = [];
      
      if (search) {
        domains = await storage.searchFsnDomains(search, limit, offset);
      } else if (status === 'registered') {
        domains = await storage.getRegisteredDomains(limit, offset);
      } else if (status === 'reserved') {
        domains = await storage.getReservedDomains(limit, offset);
      } else {
        domains = await storage.getAllFsnDomains(limit, offset);
      }
      
      return res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      return res.status(500).json({ error: "Failed to fetch domains" });
    }
  });
  
  // Get admin logs
  app.get("/api/admin/logs", adminOnly, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const adminId = parseInt(req.query.adminId as string) || 0;
      
      let logs: AdminLog[] = [];
      
      if (adminId > 0) {
        logs = await storage.getAdminLogsByAdmin(adminId, limit, offset);
      } else {
        logs = await storage.getAdminLogs(limit, offset);
      }
      
      return res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      return res.status(500).json({ error: "Failed to fetch admin logs" });
    }
  });
  
  // Make a user an admin
  app.post("/api/admin/promote/:userId", adminOnly, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { adminId } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Make user an admin
      const success = await storage.makeUserAdmin(userId);
      if (!success) {
        return res.status(500).json({ error: "Failed to promote user" });
      }
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: "PROMOTE_ADMIN",
        targetTable: "users",
        targetId: userId,
        details: `Promoted user ${user.username} to admin`
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error promoting user:", error);
      return res.status(500).json({ error: "Failed to promote user" });
    }
  });
  
  // Seed initial admin user if none exists
  app.post("/api/admin/initialize", async (req, res) => {
    try {
      const { password } = req.body;
      
      // Check if password matches admin seed password
      // In a real app, this would be an environment variable
      if (password !== "admin-seed-password-123") {
        return res.status(403).json({ error: "Invalid admin seed password" });
      }
      
      // Check if any admin user already exists
      const existingUsers = await storage.getAllFsnDomains(1000, 0);
      const adminExists = existingUsers.length > 0;
      
      if (adminExists) {
        return res.status(409).json({ error: "Admin user already exists" });
      }
      
      // Create admin user
      const admin = await storage.createUser({
        username: "admin",
        password: "hashed-password-would-go-here",
        email: "admin@fsndomains.com",
        isAdmin: true
      });
      
      return res.status(201).json({ 
        message: "Admin initialized successfully",
        adminId: admin.id
      });
    } catch (error) {
      console.error("Error initializing admin:", error);
      return res.status(500).json({ error: "Failed to initialize admin" });
    }
  });

  // Create HTTP server
  // Email-to-FSN vault API endpoint (SendGrid Parse Webhook)
  // Mount FSN messaging routes - commented out temporarily to allow server to start
  // app.use('/api/fsn/messages', fsnMessagesRouter);
  
  // Mount FSN contacts routes
  // app.use(fsnContactsRouter);
  
  // Admin API - get all registered FSN usernames
  app.get("/api/admin/registered-usernames", adminOnly, async (req, res) => {
    try {
      const domains = await storage.getRegisteredDomains(100, 0);
      return res.json(domains);
    } catch (error) {
      console.error("Error fetching registered usernames:", error);
      return res.status(500).json({ error: "Failed to fetch registered usernames" });
    }
  });
  
  // Email-to-FSN vault API endpoint (SendGrid Parse Webhook)
  app.post("/api/email/receive", async (req, res) => {
    try {
      // Extract data from the SendGrid inbound parse webhook
      const { to, from, subject, attachments } = req.body;
      
      // Log the incoming email data
      console.log("Received email:", { to, from, subject, attachmentCount: attachments?.length || 0 });
      
      // Extract FSN name from the recipient email
      // Format could be username.fsn@domain.com or username@fsn.domain.com
      let fsnName = '';
      
      if (to && typeof to === 'string') {
        const toEmail = to.toLowerCase();
        
        // Try to extract FSN name from different email formats
        if (toEmail.includes('.fsn@')) {
          // Format: username.fsn@domain.com
          fsnName = toEmail.split('.fsn@')[0];
        } else if (toEmail.includes('@fsn.')) {
          // Format: username@fsn.domain.com
          fsnName = toEmail.split('@fsn.')[0];
        } else if (toEmail.includes('+')) {
          // Format: mailbox+fsnname@domain.com (for testing)
          fsnName = toEmail.split('+')[1].split('@')[0];
        }
      }
      
      if (!fsnName) {
        return res.status(400).json({ 
          success: false, 
          message: "Could not determine FSN name from recipient email" 
        });
      }
      
      // Process attachments if present
      let processedAttachments: { filename: string, content: string, contentType: string }[] = [];
      
      if (attachments && Array.isArray(attachments)) {
        processedAttachments = attachments.map(attachment => {
          return {
            filename: attachment.filename || 'unnamed-file',
            content: attachment.content || attachment.data,
            contentType: attachment.contentType || attachment.type || 'application/octet-stream'
          };
        });
      }
      
      // Process the incoming email and store attachments in user's vault
      const result = await processIncomingEmail(
        fsnName,
        from,
        subject,
        processedAttachments
      );
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error("Error processing incoming email:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to process incoming email: " + (error as Error).message 
      });
    }
  });
  
  // Add DISC game routes
  app.use("/api", discRoutes);

  // Serve DISC game static files
  app.use("/games", express.static("public/games"));

  // Quest interaction endpoints
  app.post("/api/quest/complete", async (req, res) => {
    try {
      const { questId, userId } = req.body;
      
      if (!questId || !userId) {
        return res.status(400).json({ error: "Quest ID and User ID are required" });
      }
      
      // Define quest rewards and actions
      const questActions = {
        'dashboard_visit': { xp: 15, action: 'Visit Dashboard', description: 'Explore the cockpit interface' },
        'signal_tuning': { xp: 25, action: 'Tune Signal', description: 'Adjust your signal frequency' },
        'pulse_activity': { xp: 10, action: 'Pulse Activity', description: 'Maintain steady pulse' },
        'daily_login': { xp: 30, action: 'Daily Login', description: 'Start your daily session' },
        'beacon_activation': { xp: 50, action: 'Beacon Ready', description: 'Activate beacon system' },
        'vault_access': { xp: 20, action: 'Vault Access', description: 'Check your secure storage' },
        'message_send': { xp: 15, action: 'Send Message', description: 'Connect with other users' },
        'profile_update': { xp: 25, action: 'Update Profile', description: 'Personalize your identity' }
      };
      
      const quest = questActions[questId];
      if (!quest) {
        return res.status(404).json({ error: "Quest not found" });
      }
      
      // Update user XP
      await storage.updateUserStats(userId, { 
        xpPoints: quest.xp
      });
      
      // Add to activity log
      const logEntry = `+${quest.xp} XP – ${quest.action}`;
      const userStats = await storage.getUserStats(userId);
      const currentLogs = userStats?.recentLogs ? JSON.parse(userStats.recentLogs) : [];
      const updatedLogs = [logEntry, ...currentLogs.slice(0, 4)]; // Keep last 5 entries
      
      await storage.updateUserStats(userId, {
        recentLogs: JSON.stringify(updatedLogs)
      });
      
      return res.json({ 
        success: true, 
        xpGained: quest.xp, 
        questCompleted: quest.action,
        description: quest.description
      });
      
    } catch (error) {
      console.error("Error completing quest:", error);
      return res.status(500).json({ error: "Failed to complete quest" });
    }
  });
  
  // Available quests endpoint
  app.get("/api/quests/available/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Return available quests based on user progress
      const availableQuests = [
        {
          id: 'dashboard_visit',
          title: 'Dashboard Visit',
          description: 'Explore the cockpit interface and familiarize yourself with the controls',
          xpReward: 15,
          icon: '📊',
          type: 'daily',
          cooldown: 300000, // 5 minutes
          available: true
        },
        {
          id: 'signal_tuning',
          title: 'Signal Tuning',
          description: 'Adjust your signal frequency to optimal levels',
          xpReward: 25,
          icon: '📡',
          type: 'repeatable',
          cooldown: 600000, // 10 minutes
          available: true
        },
        {
          id: 'pulse_activity',
          title: 'Pulse Activity',
          description: 'Maintain steady pulse readings',
          xpReward: 10,
          icon: '🔄',
          type: 'continuous',
          cooldown: 120000, // 2 minutes
          available: true
        },
        {
          id: 'daily_login',
          title: 'Daily Login',
          description: 'Start your daily session',
          xpReward: 30,
          icon: '🔑',
          type: 'daily',
          cooldown: 86400000, // 24 hours
          available: true
        }
      ];
      
      return res.json({ quests: availableQuests });
      
    } catch (error) {
      console.error("Error fetching available quests:", error);
      return res.status(500).json({ error: "Failed to fetch available quests" });
    }
  });

  // FSN Phase 0 API endpoints
  
  // FSN name claiming with validation and security
  app.post('/api/claim-name', fsnNameLimiter, async (req: Request, res: Response) => {
    try {
      const { fsnName, email, userId } = req.body;
      
      if (!fsnName || !userId) {
        return res.status(400).json({ error: 'FSN name and user ID are required' });
      }

      // BULLETPROOF VERIFICATION SAFEGUARD: TRIPLE-CHECK EMAIL VERIFICATION
      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('🔒 CRITICAL SECURITY VERIFICATION CHECKPOINT 1/3:', { userId, isEmailVerified: user.isEmailVerified });

      // CHECKPOINT 1: Check user object email verification
      if (user.isEmailVerified !== true) {
        console.log('🚫 CHECKPOINT 1 FAILED - EMAIL NOT VERIFIED');
        return res.status(403).json({ 
          error: 'Email verification is REQUIRED before claiming FSN names',
          requiresVerification: true,
          message: 'You must complete email verification before claiming any FSN name'
        });
      }

      // CHECKPOINT 2: Double-check via storage method to prevent bypass
      const isVerifiedViaStorage = await storage.isEmailVerified(Number(userId));
      console.log('🔒 CRITICAL SECURITY VERIFICATION CHECKPOINT 2/3:', { userId, isVerifiedViaStorage });
      
      if (!isVerifiedViaStorage) {
        console.log('🚫 CHECKPOINT 2 FAILED - STORAGE VERIFICATION MISMATCH');
        return res.status(403).json({ 
          error: 'Email verification status inconsistent - verification required',
          requiresVerification: true,
          message: 'Security check failed: Email verification required'
        });
      }

      // CHECKPOINT 3: Direct database verification as final security measure
      try {
        const dbVerificationResult = await storage.getUser(Number(userId));
        console.log('🔒 CRITICAL SECURITY VERIFICATION CHECKPOINT 3/3:', { 
          userId, 
          directDbCheck: dbVerificationResult?.isEmailVerified 
        });
        
        if (dbVerificationResult?.isEmailVerified !== true) {
          console.log('🚫 CHECKPOINT 3 FAILED - DIRECT DATABASE CHECK FAILED');
          return res.status(403).json({ 
            error: 'Final security check failed - email verification required',
            requiresVerification: true,
            message: 'All verification checkpoints must pass before claiming FSN names'
          });
        }
      } catch (dbError) {
        console.error('🚫 DATABASE VERIFICATION CHECK FAILED:', dbError);
        return res.status(500).json({ 
          error: 'Security verification system error',
          requiresVerification: true,
          message: 'Unable to verify email status - claiming blocked for security'
        });
      }

      console.log('✅ ALL 3 VERIFICATION CHECKPOINTS PASSED - User authorized to claim FSN name');

      // IMMUTABILITY RULE 1: Convert to lowercase for storage consistency
      const fsnNameLowercase = fsnName.toLowerCase().trim();
      const fullFsnName = `${fsnNameLowercase}.fsn`;

      // IMMUTABILITY RULE 2: Check if user already has an FSN name (one per user limit)
      if (user.fsnName) {
        console.log('🚫 FSN CLAIM BLOCKED - User already has FSN name:', user.fsnName);
        return res.status(409).json({ 
          error: 'You have already claimed an FSN name',
          message: `You already own: ${user.fsnName}. FSN names are permanent and cannot be changed.`,
          currentFsn: user.fsnName
        });
      }

      // IMMUTABILITY RULE 3: Validate FSN name rules
      const nameValidation = validateFsnName(fsnNameLowercase);
      if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.reason });
      }

      // IMMUTABILITY RULE 4: Check global uniqueness - no duplicates allowed
      const existingFsn = await storage.getFsnDomainByName(fullFsnName);
      if (existingFsn) {
        console.log('🚫 FSN CLAIM BLOCKED - Name already exists:', fullFsnName);
        return res.status(409).json({ 
          error: 'That FSN name is already claimed',
          message: 'FSN names are unique and permanent. Please choose a different name.',
          suggestedAlternatives: [
            `${fsnNameLowercase}1.fsn`,
            `${fsnNameLowercase}2.fsn`,
            `${fsnNameLowercase}x.fsn`
          ]
        });
      }

      // Additional availability check using existing method
      const availability = await storage.checkFsnNameAvailability(fsnNameLowercase);
      if (!availability.available) {
        return res.status(409).json({ error: availability.reason || 'Name not available' });
      }

      // IMMUTABILITY RULE 5: Register the FSN name (PERMANENT - cannot be changed)
      const domain = await storage.registerFsnName(fullFsnName, userId);
      if (!domain) {
        return res.status(500).json({ error: 'Failed to register FSN name' });
      }

      // Update user record with FSN name (PERMANENT LINK - cannot be changed)
      await storage.updateUser(userId, { fsnName: fullFsnName });

      // Award XP for claiming using the XP Engine
      const { XPEngine } = await import('./xpEngine');
      const xpResult = await XPEngine.awardXP(userId, 'claim_fsn', {
        fsnName: fullFsnName,
        deviceFingerprint: req.body.deviceFingerprint || null,
        registrationIP: req.ip || null
      });
      
      const newXP = xpResult.newTotal;

      // Send congratulations email to user
      try {
        const emailSent = await sendCongratulationsEmail({
          email: user.email,
          fsnName: fullFsnName,
          userXP: newXP
        });
        
        if (emailSent) {
          console.log(`🎉 Congratulations email sent to ${user.email} for claiming ${fullFsnName}`);
        } else {
          console.log(`⚠️  Failed to send congratulations email to ${user.email}, but FSN claim was successful`);
        }
      } catch (emailError) {
        console.error('Error sending congratulations email:', emailError);
        // Don't fail the entire request if email fails
      }

      res.json({ success: true, fsnName: fullFsnName, domain });
    } catch (error) {
      console.error('Error claiming FSN name:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Check FSN name availability  
  app.get('/api/check-name/:fsnName', async (req: Request, res: Response) => {
    try {
      const { fsnName } = req.params;
      
      // IMMUTABILITY RULE: Always convert to lowercase for consistency
      const fsnNameLowercase = fsnName.toLowerCase().trim();
      const fullFsnName = `${fsnNameLowercase}.fsn`;
      
      // Validate FSN name format
      const nameValidation = validateFsnName(fsnNameLowercase);
      if (!nameValidation.valid) {
        return res.json({ available: false, reason: nameValidation.reason });
      }

      // Check global uniqueness
      const existingFsn = await storage.getFsnDomainByName(fullFsnName);
      if (existingFsn) {
        return res.json({ 
          available: false, 
          reason: 'That FSN name is already claimed. FSN names are unique and permanent.',
          currentOwner: existingFsn.ownerId
        });
      }

      const availability = await storage.checkFsnNameAvailability(fsnNameLowercase);
      res.json(availability);
    } catch (error) {
      console.error('Error checking FSN name:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login endpoint with streak tracking
  app.post('/api/login', authLimiter, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Update login streak
      const streakResult = await storage.updateLoginStreak(userId);
      
      res.json({ 
        success: true, 
        streakDays: streakResult.streakDays,
        lastLogin: streakResult.lastLogin 
      });
    } catch (error) {
      console.error('Error updating login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Upload endpoint for vault files and NFTs
  app.post('/api/upload', standardLimiter, async (req: Request, res: Response) => {
    try {
      const { userId, uploadType, ipfsHash, filename } = req.body;
      
      if (!userId || !uploadType || !ipfsHash || !filename) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (!['file', 'nft'].includes(uploadType)) {
        return res.status(400).json({ error: 'Invalid upload type' });
      }

      const upload = await storage.createVaultUpload({
        userId,
        uploadType,
        ipfsHash,
        filename
      });

      res.json({ success: true, upload });
    } catch (error) {
      console.error('Error creating upload:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User profile endpoint
  app.get('/api/profile/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const uploadCount = await storage.getVaultUploadCount(userId);
      
      res.json({
        id: user.id,
        username: user.username,
        fsnName: user.fsnName,
        xp: user.xp || 0,
        streakDays: user.streakDays || 0,
        badges: user.badges || [],
        uploadCount
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Referral endpoint
  app.post('/api/referral', standardLimiter, async (req: Request, res: Response) => {
    try {
      const { referrerId, referredUserId } = req.body;
      
      if (!referrerId || !referredUserId) {
        return res.status(400).json({ error: 'Both referrer and referred user IDs are required' });
      }

      const referral = await storage.createReferral({
        referrerId,
        referredUserId,
        rewarded: false
      });

      res.json({ success: true, referral });
    } catch (error) {
      console.error('Error creating referral:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // XP Leaderboard endpoint
  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getXpLeaderboard(Math.min(limit, 100));
      
      res.json({ leaderboard });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ===== XP SYSTEM API ENDPOINTS =====
  
  // AI Chat Routes - Task 11: OpenAI Integration
  app.post('/api/chat/openai', async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      console.log('🤖 Chat Request:', { messageCount: messages.length });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('No response from OpenAI');
      }

      console.log('✅ Chat Response Generated:', { length: assistantMessage.length });

      res.json({ 
        success: true, 
        message: assistantMessage,
        usage: completion.usage 
      });
    } catch (error) {
      console.error('❌ OpenAI Chat Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate chat response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all available XP actions with their point values
  app.get('/api/xp/actions', async (req, res) => {
    try {
      const { XP_ACTIONS } = await import('../shared/xpActions');
      return res.json({
        success: true,
        actions: XP_ACTIONS,
        totalActions: Object.keys(XP_ACTIONS).length
      });
    } catch (error) {
      console.error('Error fetching XP actions:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch XP actions' 
      });
    }
  });

  // Award XP to a user for a specific action
  app.post('/api/xp/award', async (req, res) => {
    try {
      // Get user ID from session instead of request body
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }
      
      const { action, metadata } = req.body;
      
      if (!action) {
        return res.status(400).json({
          success: false,
          error: 'Action is required'
        });
      }

      const { XPEngine } = await import('./xpEngine');
      const result = await XPEngine.awardXP(parseInt(userId), action, metadata);
      
      if (result.success) {
        return res.json({
          success: true,
          ...result
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to award XP'
        });
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // Get user's total XP
  app.get('/api/xp/user/:userId/total', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      const { XPEngine } = await import('./xpEngine');
      const totalXP = await XPEngine.getUserTotalXP(userId);
      
      return res.json({
        success: true,
        userId,
        totalXP
      });
    } catch (error) {
      console.error('Error fetching user XP:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user XP' 
      });
    }
  });

  // Get XP value for a specific action
  app.get('/api/xp/action/:actionKey/value', async (req, res) => {
    try {
      const { actionKey } = req.params;
      const { getXPAction } = await import('../shared/xpActions');
      const action = getXPAction(actionKey);
      
      if (!action) {
        return res.status(404).json({
          success: false,
          error: 'Action not found'
        });
      }

      return res.json({
        success: true,
        action: actionKey,
        points: action.points,
        description: action.description,
        category: action.category,
        oneTime: action.oneTime || false
      });
    } catch (error) {
      console.error('Error fetching action value:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch action value' 
      });
    }
  });

  // ===== LOGIN STREAK API ENDPOINTS - TASK 7 =====
  
  // Manually trigger login streak (for testing or admin use)
  app.post('/api/streak/process', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const { LoginStreakManager } = await import('./loginStreak');
      const result = await LoginStreakManager.handleLoginStreak(parseInt(userId));
      
      return res.json({
        success: true,
        message: 'Login streak processed',
        ...result
      });
    } catch (error) {
      console.error('Error processing login streak:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // Get user's streak statistics
  app.get('/api/streak/user/:userId/stats', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      const { LoginStreakManager } = await import('./loginStreak');
      const stats = await LoginStreakManager.getStreakStats(userId);
      
      return res.json({
        success: true,
        userId,
        ...stats
      });
    } catch (error) {
      console.error('Error fetching streak stats:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch streak stats' 
      });
    }
  });

  // ===== VAULT API ENDPOINTS - TASK 8 DASHBOARD VAULT PREVIEW =====
  
  // Get recent vault files for a user
  app.get('/api/vault/user/:userId/recent', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      // Get recent vault items for user
      const vaultItems = await storage.getVaultItemsByUser(userId);
      
      // Sort by upload date (most recent first) and limit results
      const recentFiles = vaultItems
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map(item => ({
          id: item.itemId,
          originalName: item.itemId.split('/').pop() || 'Unknown File',
          size: item.data?.length || 0,
          uploadedAt: item.createdAt,
          itemType: item.itemType,
          mimeType: item.itemType === 'file' ? 'application/octet-stream' : 'text/plain'
        }));
      
      return res.json({
        success: true,
        userId,
        files: recentFiles,
        count: recentFiles.length
      });
    } catch (error) {
      console.error('Error fetching recent vault files:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch vault files' 
      });
    }
  });

  // Get vault statistics for dashboard
  app.get('/api/vault/user/:userId/stats', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      const vaultItems = await storage.getVaultItemsByUser(userId);
      
      const stats = {
        totalFiles: vaultItems.length,
        totalSize: vaultItems.reduce((sum, item) => sum + (item.data?.length || 0), 0),
        fileTypes: vaultItems.reduce((types: Record<string, number>, item) => {
          types[item.itemType] = (types[item.itemType] || 0) + 1;
          return types;
        }, {}),
        lastUpload: vaultItems.length > 0 ? 
          Math.max(...vaultItems.map(item => new Date(item.createdAt).getTime())) : null
      };
      
      return res.json({
        success: true,
        userId,
        ...stats
      });
    } catch (error) {
      console.error('Error fetching vault stats:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch vault statistics' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
