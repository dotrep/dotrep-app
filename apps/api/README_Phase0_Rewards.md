# Rewards Feedback Layer (Phase 0)

## Overview
This layer provides immediate, satisfying feedback for XP gains and streaks using toasts, progress animations, milestone celebrations, and a perks panel. It is additive UI that does not modify XP business logic.

## Feature Flags
Add these environment variables to enable the rewards feedback system:

- `VITE_FEATURE_REWARDS_FEEDBACK=on` - Main feature flag
- `VITE_XP_LEVELS_JSON=[0,100,250,500,1000,2000,5000,10000]` - Level thresholds
- `VITE_STREAK_MILESTONES_JSON=[3,7,14,30,60,100]` - Streak milestone celebrations
- `VITE_XP_TOAST_DURATION_MS=1800` - Toast display duration
- `VITE_CELEBRATION_MODAL_DURATION_MS=2200` - Celebration modal duration

## Event System
The rewards system listens to the following events without modifying existing endpoints:

### Event Names and Payloads
- `xp/award/success` - Generic XP award { amount, newTotal, source }
- `beacon/recast/success` - Beacon recast success { xp_awarded, streak_days, broadcasts_total }
- `vault/upload/success` - Vault upload success { xp_awarded }
- `fsn/claim/success` - FSN claim success { xp_awarded }
- `profile/update/success` - Profile update success { xp_awarded }

### Adding New Event Mappings
To add support for new XP-awarding actions:

1. Import the rewards emitter: `import { rewardsEmitter } from '@/hooks/useRewardsListener'`
2. Emit the event after successful action: `rewardsEmitter.emit('event/name', payload)`
3. Add event handler in `useRewardsListener.js` if needed

## Components

### XPProgressBar
Shows current level progress with animated bar fills and level badges.

### XPToast
Displays "+X XP" notifications with action names. Multiple toasts queue vertically.

### LevelUpBanner
Appears when crossing level thresholds with sparkle animations and perk notifications.

### StreakCelebration
Full-screen celebration modal for streak milestones with confetti effects.

### PerksPanel
Right-side panel showing current level, next level requirements, and available perks.

## Level Configuration
Edit `VITE_XP_LEVELS_JSON` to modify level thresholds:
```json
[0,100,250,500,1000,2000,5000,10000]
```

## Streak Milestones
Edit `VITE_STREAK_MILESTONES_JSON` to modify celebration triggers:
```json
[3,7,14,30,60,100]
```

## Accessibility
- All modals and toasts are keyboard-dismissible via Esc
- Respects `prefers-reduced-motion` for animations
- Proper ARIA labels and live regions for screen readers

## Analytics
Client-side analytics events (non-PII):
- `xp_toast_shown` - Toast displayed
- `level_up_banner_shown` - Level up notification
- `streak_milestone_shown` - Streak celebration
- `perks_panel_opened` - Perks panel accessed

## Disable Feature
Set `VITE_FEATURE_REWARDS_FEEDBACK=off` to completely hide all rewards UI elements and revert to original behavior.

## Implementation Notes
- This layer is purely additive - no existing XP logic is modified
- All animations prefer CSS over JavaScript for performance
- Events are emitted after successful API responses
- Components gracefully degrade when feature is disabled