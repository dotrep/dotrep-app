import React, { useState, useEffect } from 'react';
import day1Image from '@assets/generated_images/FSN_constellation_cliff_day_1_6ce62ebb.png';
import day2Image from '@assets/generated_images/FSN_constellation_cliff_day_2_91d736ca.png';
import day3Image from '@assets/generated_images/FSN_constellation_cliff_day_3_0f08ea9d.png';
import day4Image from '@assets/generated_images/FSN_constellation_cliff_day_4_362a2bdd.png';
import day5Image from '@assets/generated_images/FSN_constellation_cliff_day_5_4d00b81c.png';
import day6Image from '@assets/generated_images/FSN_constellation_cliff_day_6_8dd27f32.png';
import day7Image from '@assets/generated_images/FSN_constellation_cliff_day_7_99edffa7.png';

interface ChallengeDay {
  day: number;
  name: string;
  task: string;
  xpReward: number;
  starColor: string;
  constellationImage: string;
  completed: boolean;
  unlockedAt?: string;
}

const SevenDayChallenge: React.FC = () => {
  const [challengeDays, setChallengeDays] = useState<ChallengeDay[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [showConstellationView, setShowConstellationView] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Initialize challenge data
  useEffect(() => {
    const savedProgress = localStorage.getItem('sevenDayChallenge');
    const initialProgress = savedProgress ? JSON.parse(savedProgress) : {};

    const days: ChallengeDay[] = [
      {
        day: 1,
        name: 'Cyan Nebula',
        task: 'Complete daily login',
        xpReward: 50,
        starColor: '#00bcd4',
        constellationImage: day1Image,
        completed: initialProgress[1] || false,
        unlockedAt: initialProgress[1] ? initialProgress[`1_date`] : undefined
      },
      {
        day: 2,
        name: 'Violet Cosmos',
        task: 'Visit all dashboard sections',
        xpReward: 75,
        starColor: '#9c27b0',
        constellationImage: day2Image,
        completed: initialProgress[2] || false,
        unlockedAt: initialProgress[2] ? initialProgress[`2_date`] : undefined
      },
      {
        day: 3,
        name: 'Golden Bridge',
        task: 'Interact with 3 features',
        xpReward: 100,
        starColor: '#ff9800',
        constellationImage: day3Image,
        completed: initialProgress[3] || false,
        unlockedAt: initialProgress[3] ? initialProgress[`3_date`] : undefined
      },
      {
        day: 4,
        name: 'Emerald Gateway',
        task: 'Upload a vault file',
        xpReward: 125,
        starColor: '#4caf50',
        constellationImage: day4Image,
        completed: initialProgress[4] || false,
        unlockedAt: initialProgress[4] ? initialProgress[`4_date`] : undefined
      },
      {
        day: 5,
        name: 'Ruby Beacon',
        task: 'Connect with FSN network',
        xpReward: 150,
        starColor: '#f44336',
        constellationImage: day5Image,
        completed: initialProgress[5] || false,
        unlockedAt: initialProgress[5] ? initialProgress[`5_date`] : undefined
      },
      {
        day: 6,
        name: 'Crystal Apex',
        task: 'Play a mini-game',
        xpReward: 175,
        starColor: '#e0e0e0',
        constellationImage: day6Image,
        completed: initialProgress[6] || false,
        unlockedAt: initialProgress[6] ? initialProgress[`6_date`] : undefined
      },
      {
        day: 7,
        name: 'Rainbow Constellation',
        task: 'Complete the FSN journey',
        xpReward: 200,
        starColor: '#ff6ec7',
        constellationImage: day7Image,
        completed: initialProgress[7] || false,
        unlockedAt: initialProgress[7] ? initialProgress[`7_date`] : undefined
      }
    ];

    setChallengeDays(days);

    // Find current day (first incomplete day)
    const firstIncomplete = days.find(day => !day.completed);
    setCurrentDay(firstIncomplete ? firstIncomplete.day : 7);
  }, []);

  // Save progress to localStorage
  const saveProgress = (updatedDays: ChallengeDay[]) => {
    const progress: any = {};
    updatedDays.forEach(day => {
      progress[day.day] = day.completed;
      if (day.unlockedAt) {
        progress[`${day.day}_date`] = day.unlockedAt;
      }
    });
    localStorage.setItem('sevenDayChallenge', JSON.stringify(progress));
  };

  // Complete a day's challenge
  const completeDay = (dayNumber: number) => {
    const updatedDays = challengeDays.map(day => {
      if (day.day === dayNumber && !day.completed) {
        return {
          ...day,
          completed: true,
          unlockedAt: new Date().toLocaleDateString()
        };
      }
      return day;
    });

    setChallengeDays(updatedDays);
    saveProgress(updatedDays);

    // Update current day
    const nextIncomplete = updatedDays.find(day => !day.completed);
    setCurrentDay(nextIncomplete ? nextIncomplete.day : 7);

    // Show completion feedback
    const completedDay = updatedDays.find(d => d.day === dayNumber);
    if (completedDay) {
      // You could add toast notification here
      console.log(`🌟 ${completedDay.name} unlocked! +${completedDay.xpReward} XP`);
    }
  };

  const completedCount = challengeDays.filter(day => day.completed).length;
  const totalDays = challengeDays.length;

  if (showConstellationView && selectedDay) {
    const day = challengeDays.find(d => d.day === selectedDay);
    if (!day) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={() => setShowConstellationView(false)}
      >
        <div style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
        >
          <img
            src={day.constellationImage}
            alt={day.name}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: '12px',
              filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.6))',
              animation: 'constellationGlow 3s ease-in-out infinite alternate'
            }}
          />
          <div style={{
            marginTop: '20px',
            color: '#fff',
            fontFamily: 'Orbitron, sans-serif'
          }}>
            <h2 style={{
              color: day.starColor,
              fontSize: '28px',
              marginBottom: '8px',
              textShadow: `0 0 20px ${day.starColor}`
            }}>
              {day.name}
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '8px'
            }}>
              Unlocked on {day.unlockedAt}
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '8px 16px',
              borderRadius: '20px',
              border: `1px solid ${day.starColor}`,
              display: 'inline-block'
            }}>
              Day {day.day} • +{day.xpReward} XP
            </div>
          </div>
          <button
            onClick={() => setShowConstellationView(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0, 20, 40, 0.6)',
      border: '1px solid rgba(0, 240, 255, 0.3)',
      borderRadius: '12px',
      padding: '12px',
      marginBottom: '5px',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h3 style={{
          color: '#00f0ff',
          fontSize: '16px',
          fontFamily: 'Orbitron, sans-serif',
          textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
          margin: 0
        }}>
          🌌 SEVEN DAY CONSTELLATION QUEST
        </h3>
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid #00f0ff',
          borderRadius: '15px',
          padding: '4px 12px',
          fontSize: '12px',
          color: '#00f0ff',
          fontFamily: 'Orbitron, sans-serif'
        }}>
          {completedCount}/{totalDays}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        height: '6px',
        borderRadius: '3px',
        marginBottom: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #00bcd4, #9c27b0, #ff9800, #4caf50, #f44336, #e0e0e0, #ff6ec7)',
          height: '100%',
          width: `${(completedCount / totalDays) * 100}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.6)'
        }} />
      </div>

      {/* Stars Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '8px',
        flexWrap: 'wrap'
      }}>
        {challengeDays.map((day, index) => (
          <div
            key={day.day}
            style={{
              position: 'relative',
              cursor: day.completed ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (day.completed) {
                setSelectedDay(day.day);
                setShowConstellationView(true);
              }
            }}
          >
            {/* Star */}
            <div style={{
              width: '24px',
              height: '24px',
              position: 'relative',
              opacity: day.completed ? 1 : 0.3,
              transition: 'all 0.3s ease',
              transform: day.completed ? 'scale(1)' : 'scale(0.8)'
            }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                style={{
                  filter: day.completed 
                    ? `drop-shadow(0 0 8px ${day.starColor}) drop-shadow(0 0 15px ${day.starColor})`
                    : 'none'
                }}
              >
                <path
                  d="M16 2 L20 12 L30 12 L22 18 L26 28 L16 22 L6 28 L10 18 L2 12 L12 12 Z"
                  fill={day.completed ? day.starColor : 'rgba(255,255,255,0.2)'}
                  stroke={day.starColor}
                  strokeWidth="1"
                />
              </svg>
            </div>
            
            {/* Day number */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '8px',
              color: day.completed ? day.starColor : 'rgba(255,255,255,0.5)',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold'
            }}>
              {day.day}
            </div>
          </div>
        ))}
      </div>

      {/* Current Task */}
      {currentDay <= 7 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#00f0ff',
            fontSize: '12px',
            fontFamily: 'Orbitron, sans-serif',
            marginBottom: '5px'
          }}>
            DAY {currentDay} CHALLENGE
          </div>
          <div style={{
            color: '#fff',
            fontSize: '14px',
            marginBottom: '5px'
          }}>
            {challengeDays.find(d => d.day === currentDay)?.task}
          </div>
          <button
            onClick={() => completeDay(currentDay)}
            style={{
              background: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              padding: '6px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            COMPLETE DAY {currentDay}
          </button>
        </div>
      )}

      {/* Completion Message */}
      {completedCount === totalDays && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.6)',
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center',
          animation: 'completionGlow 2s ease-in-out infinite alternate'
        }}>
          <div style={{
            color: '#ffd700',
            fontSize: '16px',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 'bold'
          }}>
            🎉 CONSTELLATION QUEST COMPLETE! 🎉
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            marginTop: '5px'
          }}>
            You've unlocked all seven FSN constellation cliffs!
          </div>
        </div>
      )}

      {/* Background Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes constellationGlow {
            0% { 
              filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.6));
            }
            100% { 
              filter: drop-shadow(0 0 50px rgba(0, 240, 255, 0.9)) drop-shadow(0 0 70px rgba(0, 240, 255, 0.4));
            }
          }
          
          @keyframes completionGlow {
            0% { 
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
            }
            100% { 
              box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.1);
            }
          }
        `
      }} />
    </div>
  );
};

export default SevenDayChallenge;