import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackXPGain, trackDailyTaskCompletion } from '../utils/taskTriggers';
import { getUserLevel, getVaultTier } from '../utils/xpGating';

const XPContext = createContext();

// Trust tier calculation based on XP and casts
const calculateTrustTier = (xp, totalCasts) => {
  if (xp >= 5000 && totalCasts >= 50) return 3; // Tier III
  if (xp >= 2500 && totalCasts >= 25) return 2; // Tier II
  if (xp >= 1000 && totalCasts >= 10) return 1; // Tier I
  return 0; // No tier
};

// Level calculation based on XP with exponential progression
const calculateLevel = (xp) => {
  if (xp < 1000) return 1;
  if (xp < 2000) return 2;
  if (xp < 3500) return 3;
  if (xp < 5500) return 4;
  if (xp < 8000) return 5;
  if (xp < 11000) return 6;
  if (xp < 15000) return 7;
  if (xp < 20000) return 8;
  if (xp < 26000) return 9;
  if (xp < 33000) return 10;
  // Continue scaling for higher levels
  return Math.floor(10 + (xp - 33000) / 8000);
};

// Get XP required for next level
const getXPForNextLevel = (currentXP) => {
  const thresholds = [0, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000, 26000, 33000];
  const currentLevel = calculateLevel(currentXP);
  
  if (currentLevel <= 10) {
    return thresholds[currentLevel];
  }
  // For levels above 10, calculate dynamically
  return 33000 + (currentLevel - 10) * 8000;
};

// Get XP progress within current level
const getLevelProgress = (currentXP) => {
  const currentLevel = calculateLevel(currentXP);
  const currentLevelMin = currentLevel === 1 ? 0 : getXPForNextLevel(currentXP - 1);
  const nextLevelXP = getXPForNextLevel(currentXP);
  
  const progressInLevel = currentXP - currentLevelMin;
  const totalNeededForLevel = nextLevelXP - currentLevelMin;
  
  return {
    progress: progressInLevel,
    total: totalNeededForLevel,
    percentage: (progressInLevel / totalNeededForLevel) * 100
  };
};

export const XPProvider = ({ children }) => {
  const [xp, setXPState] = useState(0);
  const [totalCasts, setTotalCasts] = useState(() => {
    return parseInt(localStorage.getItem("totalCasts")) || 0;
  });
  const [trustTier, setTrustTier] = useState(() => {
    return parseInt(localStorage.getItem("trustTier")) || 0;
  });
  
  // Trust verification state
  const [trustVerified, setTrustVerified] = useState(() => {
    const progress = JSON.parse(localStorage.getItem('userProgress') || '{}');
    return progress.trust?.verified === true;
  });
  const [xpLog, setXpLog] = useState([]);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [showLevelUpToast, setShowLevelUpToast] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, tierName: 'Explorer' });
  const [toastTrigger, setToastTrigger] = useState(null);
  
  // Mission tracking state
  const [missionTasks, setMissionTasks] = useState(() => {
    const saved = localStorage.getItem("missionTasks");
    return saved ? JSON.parse(saved) : {
      uploadFile: false,
      emitSignal: false,
      chooseFSN: false,
      completeQuest: false,
      equipBadge: false
    };
  });
  
  const [missionXPEarned, setMissionXPEarned] = useState(() => {
    return parseInt(localStorage.getItem("missionXPEarned")) || 0;
  });
  
  // Signal state management
  const [signalMode, setSignalMode] = useState(() => {
    return localStorage.getItem("signalMode") || "OFF";
  });
  const [currentFreq, setCurrentFreq] = useState(() => {
    const saved = localStorage.getItem("currentFreq");
    return saved ? parseFloat(saved) : 9.5;
  });
  const [pulseHz, setPulseHz] = useState(75); // Hz value for beacon bar scaling
  
  // Multi-mode state
  const [selectedFrequencies, setSelectedFrequencies] = useState([]);
  const [foundFreq, setFoundFreq] = useState(false);
  const targetFreq = 13.37; // Hidden frequency for LISTEN mode

  // Persist signal state to localStorage
  useEffect(() => {
    localStorage.setItem("signalMode", signalMode);
  }, [signalMode]);

  useEffect(() => {
    localStorage.setItem("currentFreq", currentFreq.toString());
  }, [currentFreq]);
  
  useEffect(() => {
    localStorage.setItem("totalCasts", totalCasts.toString());
  }, [totalCasts]);
  
  useEffect(() => {
    localStorage.setItem("trustTier", trustTier.toString());
  }, [trustTier]);
  
  // Persist mission state
  useEffect(() => {
    localStorage.setItem("missionTasks", JSON.stringify(missionTasks));
  }, [missionTasks]);
  
  useEffect(() => {
    localStorage.setItem("missionXPEarned", missionXPEarned.toString());
  }, [missionXPEarned]);
  
  // Check for trust tier progression
  useEffect(() => {
    if (xp >= 1000 && totalCasts >= 10 && trustTier === 0) {
      setTrustTier(1);
      logXP('🔰 Trust Tier I Unlocked!');
    } else if (xp >= 2500 && totalCasts >= 25 && trustTier === 1) {
      setTrustTier(2);
      logXP('🔰 Trust Tier II Unlocked!');
    }
  }, [xp, totalCasts, trustTier]);

  // Enhanced XP reward functions for Batch 5
  const showXPToast = (message, type = 'xp', amount = 0) => {
    setToastTrigger({
      message,
      type,
      amount,
      timestamp: Date.now()
    });
  };

  const addXP = (amount, source = 'general') => {
    // CLIENT-SIDE XP MANIPULATION DISABLED FOR SECURITY
    // All XP must be awarded through server validation via /api/xp/award
    console.warn('Client-side XP manipulation blocked. Use server /api/xp/award endpoint.');
    
    // Only show visual feedback, don't actually add XP
    showXPToast(`XP blocked: Server validation required`, 'error');
    
    return; // Exit early without modifying XP
  };

  // Specific reward functions for different sources
  const rewardUpload = (filename = '') => {
    const xpAmount = 50;
    addXP(xpAmount, 'upload');
    logXP(`📁 File Upload: ${filename} (+${xpAmount} XP)`);
  };

  const rewardSignal = (frequency = '', action = 'broadcast') => {
    const xpAmount = action === 'listen' ? 10 : 30;
    addXP(xpAmount, 'signal');
    logXP(`📡 Signal ${action}: ${frequency} MHz (+${xpAmount} XP)`);
  };

  const rewardQuest = (questName = '', xpAmount = 25, customMessage = '') => {
    if (xpAmount > 0) {
      addXP(xpAmount, 'quest');
    }
    const message = customMessage || `⚡ Quest Complete: ${questName} (+${xpAmount} XP)`;
    logXP(message);
  };

  const rewardBadge = (badgeName = '') => {
    showXPToast(`🏅 Badge Unlocked: ${badgeName}`, 'badge');
    logXP(`🏅 Badge Unlocked: ${badgeName}`);
    
    // Store badge unlock status in localStorage
    if (badgeName.toLowerCase().includes('trust')) {
      localStorage.setItem('trustBadgeUnlocked', 'true');
    }
    if (badgeName.toLowerCase().includes('core signal')) {
      localStorage.setItem('coreSignalBadgeUnlocked', 'true');
    }
    if (badgeName.toLowerCase().includes('onboard')) {
      localStorage.setItem('onboardingBadgeUnlocked', 'true');
    }
  };

  const setXP = (amount) => {
    setXPState(amount);
  };
  
  const logXP = (message) => {
    const logEntry = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setXpLog(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };
  
  const incrementCasts = () => {
    setTotalCasts(prev => prev + 1);
  };
  
  const checkFrequency = (freq) => {
    if (Math.abs(parseFloat(freq) - targetFreq) < 0.01) {
      setFoundFreq(true);
      addXP(15);
      logXP('+15 XP — Frequency Lock Achievement');
      setTimeout(() => setFoundFreq(false), 3000);
      return true;
    }
    return false;
  };
  
  // Mission tracking functions
  const completeMissionTask = (taskId) => {
    if (missionTasks[taskId]) return; // Already completed
    
    const taskXP = {
      uploadFile: 50,
      emitSignal: 30,
      chooseFSN: 10,
      completeQuest: 25,
      equipBadge: 10
    };
    
    setMissionTasks(prev => ({ ...prev, [taskId]: true }));
    const xpReward = taskXP[taskId] || 0;
    addXP(xpReward);
    setMissionXPEarned(prev => prev + xpReward);
    logXP(`🎯 Mission Complete: +${xpReward} XP`);
  };
  
  const checkMissionProgress = async () => {
    try {
      // Check file upload task
      const response = await fetch('/api/vault/items');
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0 && !missionTasks.uploadFile) {
          completeMissionTask('uploadFile');
        }
      }
      
      // Check signal broadcast task
      if (totalCasts > 0 && !missionTasks.emitSignal) {
        completeMissionTask('emitSignal');
      }
      
      // Check FSN name task
      const userResponse = await fetch('/api/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.fsnName && !missionTasks.chooseFSN) {
          completeMissionTask('chooseFSN');
        }
      }
      
      // Check badge equip task (simplified check)
      if (localStorage.getItem('equippedBadge') && !missionTasks.equipBadge) {
        completeMissionTask('equipBadge');
      }
    } catch (error) {
      console.error('Error checking mission progress:', error);
    }
  };

  // Computed level values
  const currentLevel = calculateLevel(xp);
  const nextLevelXP = getXPForNextLevel(xp);
  const levelProgress = getLevelProgress(xp);

  const value = {
    xp,
    xpPoints: xp, // Add xpPoints alias for compatibility
    addXP,
    setXP,
    currentLevel,
    nextLevelXP,
    levelProgress,
    levelUpAnimation,
    showLevelUpToast,
    setShowLevelUpToast,
    levelUpData,
    signalMode,
    setSignalMode,
    currentFreq,
    setCurrentFreq,
    pulseHz,
    setPulseHz,
    totalCasts,
    incrementCasts,
    trustTier,
    trustVerified,
    setTrustVerified,
    xpLog,
    logXP,
    selectedFrequencies,
    setSelectedFrequencies,
    foundFreq,
    setFoundFreq,
    targetFreq,
    checkFrequency,
    missionTasks,
    missionXPEarned,
    completeMissionTask,
    checkMissionProgress,
    // Batch 5: Enhanced reward functions
    rewardUpload,
    rewardSignal,
    rewardQuest,
    rewardBadge,
    showXPToast,
    toastTrigger
  };

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
};