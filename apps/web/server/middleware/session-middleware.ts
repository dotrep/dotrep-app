import session from 'express-session';
import MemoryStore from 'memorystore';

const MemStore = MemoryStore(session);

// Create session middleware with automatic logout on browser close
export const sessionMiddleware = session({
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'fsn-vault-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allow HTTP in development
    httpOnly: false, // Allow client access for debugging
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (instead of undefined)
    sameSite: 'lax' // Less restrictive for development
  },
  name: 'fsn.session' // Custom session name
});

// Extend Express session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    fsnName?: string;
    isLoggedIn?: boolean;
    loginTime?: number;
  }
}