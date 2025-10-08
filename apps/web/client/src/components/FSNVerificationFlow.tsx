/**
 * FSN Verification Flow Component
 * Handles email verification and profile completion before FSN claiming
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Mail, User, Globe, MessageSquare, Github, Linkedin, Twitter, Phone, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FSNVerificationFlowProps {
  userId: number;
  onVerificationComplete: () => void;
}

interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  email: string | null;
  phone: string | null;
  hasCompleteProfile: boolean;
}

const FSNVerificationFlow: React.FC<FSNVerificationFlowProps> = ({ 
  userId, 
  onVerificationComplete 
}) => {
  const [currentStep, setCurrentStep] = useState<'email' | 'verify-code' | 'password' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profile, setProfile] = useState({
    twitter: '',
    discord: '',
    telegram: '',
    linkedin: '',
    github: '',
    website: '',
    bio: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user verification status
  const { data: verificationStatus, isLoading } = useQuery<VerificationStatus>({
    queryKey: [`/api/user/${userId}/verification-status`],
    enabled: !!userId
  });

  // Don't pre-fill email - let user enter their own email
  // useEffect(() => {
  //   if (verificationStatus?.email && !email) {
  //     setEmail(verificationStatus.email);
  //   }
  // }, [verificationStatus, email]);

  // Send email verification
  const sendEmailMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      return await apiRequest(`/api/user/verify/email`, {
        method: 'POST',
        body: JSON.stringify({ userId, email: emailAddress })
      });
    },
    onSuccess: () => {
      setCodeSent(true);
      setCurrentStep('verify-code');
      toast({
        title: "✅ Code Sent Successfully!",
        description: `Check your email (${emailAddress}) for the 6-digit verification code`,
        duration: 6000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  // Verify email code
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest(`/api/user/verify/email/confirm`, {
        method: 'POST',
        body: JSON.stringify({ userId, email, code })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Email Verified! 🎉", 
        description: `+${data.xpAwarded} XP earned for email verification`,
      });
      setCurrentStep('password');
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/verification-status`] });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Code",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    }
  });

  // Set password
  const setPasswordMutation = useMutation({
    mutationFn: async (passwordData: { password: string }) => {
      return await apiRequest(`/api/user/set-password`, {
        method: 'POST',
        body: JSON.stringify({ userId, password: passwordData.password })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Password Set Successfully! 🎉",
        description: `Your account is now secure with a password`,
      });
      setCurrentStep('profile');
    },
    onError: (error: any) => {
      toast({
        title: "Password Setup Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest(`/api/user/profile`, {
        method: 'POST',
        body: JSON.stringify({ userId, ...profileData })
      });
    },
    onSuccess: (data) => {
      if (data.xpAwarded > 0) {
        toast({
          title: "Profile Updated! 🎉",
          description: `+${data.xpAwarded} XP earned for completing your profile`,
        });
      }
      onVerificationComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  // Auto-populate email if already verified
  useEffect(() => {
    if (verificationStatus?.emailVerified && verificationStatus.email) {
      setEmail(verificationStatus.email);
      setCurrentStep('profile');
    } else if (verificationStatus?.email) {
      setEmail(verificationStatus.email);
    }
  }, [verificationStatus]);

  const handleSendCode = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(email);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }
    verifyCodeMutation.mutate(verificationCode);
  };

  const handleSetPassword = () => {
    // Reset error
    setPasswordError('');
    
    // Validate password strength
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordMutation.mutate({ password });
  };

  const handleUpdateProfile = () => {
    // Check if at least one social link is provided
    const hasMinimumProfile = profile.twitter || profile.discord || profile.telegram || profile.linkedin || profile.github;
    
    if (!hasMinimumProfile) {
      toast({
        title: "Profile Required",
        description: "Please provide at least one social media profile to continue",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(profile);
  };

  const handleSkipProfile = () => {
    onVerificationComplete();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading verification status...</span>
        </div>
      </div>
    );
  }

  console.log('FSNVerificationFlow rendering - currentStep:', currentStep, 'email:', email);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      backgroundColor: '#0f172a',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#1e293b',
        border: '2px solid #00f0ff',
        borderRadius: '12px',
        padding: '30px',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#00f0ff',
            marginBottom: '10px'
          }}>
            FSN Identity Verification
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '16px' }}>
            Complete verification to claim your FSN name
          </p>
        </div>
          {/* Progress Steps */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '30px',
            fontSize: '14px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: currentStep === 'email' || !verificationStatus?.emailVerified ? '#00f0ff' : '#10b981'
            }}>
              <Mail style={{ width: '16px', height: '16px' }} />
              <span>Email</span>
            </div>
            
            <div style={{ 
              flex: 1, 
              height: '1px', 
              backgroundColor: '#475569', 
              margin: '0 15px' 
            }} />
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: currentStep === 'password' ? '#00f0ff' : '#64748b'
            }}>
              <User style={{ width: '16px', height: '16px' }} />
              <span>Password</span>
            </div>
            
            <div style={{ 
              flex: 1, 
              height: '1px', 
              backgroundColor: '#475569', 
              margin: '0 15px' 
            }} />
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: currentStep === 'profile' ? '#00f0ff' : '#64748b'
            }}>
              <Globe style={{ width: '16px', height: '16px' }} />
              <span>Profile</span>
            </div>
          </div>

          {/* Email Verification Step */}
          {currentStep === 'email' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={sendEmailMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <button 
                onClick={handleSendCode}
                disabled={sendEmailMutation.isPending || !email}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: sendEmailMutation.isPending || !email ? '#475569' : '#0891b2',
                  color: 'white',
                  border: '2px solid #00f0ff',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: sendEmailMutation.isPending || !email ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px' }} />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Send style={{ width: '16px', height: '16px' }} />
                    Send Verification Code
                  </>
                )}
              </button>
              
              {/* Status Message */}
              {codeSent && (
                <div style={{
                  fontSize: '14px',
                  color: '#10b981',
                  backgroundColor: '#064e3b',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #10b981',
                  marginTop: '15px',
                  textAlign: 'center'
                }}>
                  <strong>✅ Code Sent!</strong> Check your email for the verification code.
                </div>
              )}
              
              {!codeSent && (
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  backgroundColor: '#334155',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  marginTop: '15px'
                }}>
                  <strong>Demo Note:</strong> The verification code will be logged to the server console. Check logs after sending.
                </div>
              )}
            </div>
          )}

          {/* Code Verification Step */}
          {currentStep === 'verify-code' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={verifyCodeMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '24px',
                    textAlign: 'center',
                    letterSpacing: '8px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                  Check your email for the 6-digit code
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending || verificationCode.length !== 6}
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: verifyCodeMutation.isPending || verificationCode.length !== 6 ? '#475569' : '#0891b2',
                    color: 'white',
                    border: '2px solid #00f0ff',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: verifyCodeMutation.isPending || verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {verifyCodeMutation.isPending ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px' }} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '16px', height: '16px' }} />
                      Verify Email
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setCurrentStep('email')}
                  disabled={verifyCodeMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: verifyCodeMutation.isPending ? 'not-allowed' : 'pointer'
                  }}
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

          {/* Password Setup Step */}
          {currentStep === 'password' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-500/30">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Email Verified
                </Badge>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Create Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  disabled={setPasswordMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={setPasswordMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              {passwordError && (
                <div style={{
                  fontSize: '14px',
                  color: '#ef4444',
                  backgroundColor: '#7f1d1d',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  marginBottom: '20px'
                }}>
                  {passwordError}
                </div>
              )}
              
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                backgroundColor: '#334155',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #475569',
                marginBottom: '20px'
              }}>
                <strong>Password Requirements:</strong>
                <ul style={{ margin: '8px 0 0 16px' }}>
                  <li>At least 8 characters long</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                </ul>
              </div>
              
              <button 
                onClick={handleSetPassword}
                disabled={setPasswordMutation.isPending || !password || !confirmPassword}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: setPasswordMutation.isPending || !password || !confirmPassword ? '#475569' : '#0891b2',
                  color: 'white',
                  border: '2px solid #00f0ff',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: setPasswordMutation.isPending || !password || !confirmPassword ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {setPasswordMutation.isPending ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px' }} />
                    Setting Password...
                  </>
                ) : (
                  <>
                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                    Set Password
                  </>
                )}
              </button>
            </div>
          )}

          {/* Profile Completion Step */}
          {currentStep === 'profile' && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-500/30">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Email Verified
                </Badge>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-slate-300 text-sm font-medium">
                  Social Profiles <span className="text-cyan-400">(at least one required)</span>
                </Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <Input
                      placeholder="@username"
                      value={profile.twitter}
                      onChange={(e) => setProfile({...profile, twitter: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <Input
                      placeholder="discord#0000"
                      value={profile.discord}
                      onChange={(e) => setProfile({...profile, discord: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4 text-blue-300 flex-shrink-0" />
                    <Input
                      placeholder="@telegram"
                      value={profile.telegram}
                      onChange={(e) => setProfile({...profile, telegram: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Github className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <Input
                      placeholder="github.com/username"
                      value={profile.github}
                      onChange={(e) => setProfile({...profile, github: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Linkedin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <Input
                      placeholder="linkedin.com/in/username"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <Input
                      placeholder="yourwebsite.com"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio" className="text-slate-300 text-sm">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white text-sm"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Profile
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleSkipProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full text-slate-400 hover:text-white text-sm"
                >
                  Skip for Now (No XP Bonus)
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default FSNVerificationFlow;