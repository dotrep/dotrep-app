import React from 'react';

interface SignalProgressTrackerProps {
  totalXP: number;
  pulseActive: boolean;
}

/**
 * Pulse-to-Signal Progress Tracker
 * Shows 3-step progression: XP → Pulse → Signal
 */
const SignalProgressTracker: React.FC<SignalProgressTrackerProps> = ({ totalXP, pulseActive }) => {
  const steps = [
    {
      id: 'xp',
      label: 'XP Earned',
      completed: totalXP > 0,
      icon: '⚡'
    },
    {
      id: 'pulse',
      label: 'Pulse Active',
      completed: pulseActive,
      icon: '🔮'
    },
    {
      id: 'signal',
      label: 'Signal Locked',
      completed: false,
      icon: '📡',
      tooltip: 'Signal unlocks in Phase 1'
    }
  ];

  return (
    <div className="signal-progress-tracker">
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div key={step.id} className="progress-step-container">
            <div 
              className={`progress-step ${step.completed ? 'completed' : 'pending'} ${step.id === 'signal' ? 'locked' : ''}`}
              title={step.tooltip || `${step.label}: ${step.completed ? 'Complete' : 'Pending'}`}
            >
              <div className="step-icon">{step.icon}</div>
              <div className="step-label">{step.label}</div>
              {step.completed && <div className="step-checkmark">✅</div>}
            </div>
            
            {index < steps.length - 1 && (
              <div className={`progress-connector ${steps[index + 1].completed ? 'completed' : 'pending'}`}>
                <div className="connector-line"></div>
                <div className="connector-arrow">→</div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="progress-info">
        <p className="progress-hint">
          Your progress through FSN Phase 0. Signal unlocks in the next phase.
        </p>
      </div>
    </div>
  );
};

export default SignalProgressTracker;