# FSN Rewards UI System

## Overview
The FSN Rewards UI system provides immediate visual feedback when users earn XP through various actions. This system is completely additive and can be disabled without affecting existing functionality.

## Feature Flag
Add this environment variable to enable the rewards UI:

```
VITE_REWARDS_UI_ENABLED=true
```

When set to `false` or omitted, no rewards UI components will render.

## Components

### RewardsUIProvider
Main provider that wraps the application and manages:
- Toast notifications for new XP rewards
- Recent rewards panel
- Polling for new reward events from the server

### RewardsToast
Displays immediate notifications when XP is earned:
- Format: `+{amount} XP • {friendlyReason}`
- Auto-dismisses after 3 seconds
- Respects reduced motion preferences
- Uses theme tokens for consistent styling

### RecentRewardsPanel
Side panel showing the 5 most recent reward events:
- Triggered by "Recent Rewards" button in navigation
- Real-time updates every 30 seconds
- Shows timestamp using `date-fns` formatting
- Can be closed via X button, Escape key, or clicking outside

## Server Components

### Reward Events Table
New database table `reward_events`:
- `id` - Primary key
- `userId` - Foreign key to users table
- `amount` - XP amount earned
- `reasonKey` - Canonical reason identifier
- `txnId` - Unique transaction ID (prevents duplicates)
- `createdAt` - Timestamp

### Rewards API Routes
- `GET /api/rewards/recent?limit=10` - Recent rewards for authenticated user
- `GET /api/rewards/since?cursor=<iso>` - Rewards since specific timestamp

### Reward Logger Utility
`logRewardEvent()` function to record XP events:
- Only logs when `REWARDS_UI_ENABLED=true`
- Generates unique transaction IDs
- Handles duplicate prevention
- Maps reason keys to friendly text

## Reason Keys
Canonical list of XP earning reasons:

```javascript
{
  'onboarding.step_complete': 'Onboarding step completed',
  'onboarding.complete': 'Onboarding completed', 
  'vault.upload': 'File stored in FreeSpace',
  'wallet.connect': 'Wallet connected',
  'beacon.recast': 'Beacon recast',
  'fsn.claim': 'FSN name claimed',
  'email.verify': 'Email verified',
  'login.daily': 'Daily login',
  'profile.update': 'Profile updated',
  'social.message': 'Message sent',
  'game.complete': 'Game completed'
}
```

## Integration Points

### Dashboard Navigation
- "Recent Rewards" button in top navigation
- Opens the recent rewards panel
- Only visible when rewards UI is enabled

### Existing XP Actions
To integrate with existing XP-earning actions, add reward logging:

```javascript
import { logRewardEvent } from '../utils/rewardLogger';

// After awarding XP
await logRewardEvent(userId, xpAmount, 'beacon.recast');
```

## Client-Side Polling
The system polls for new rewards every 30 seconds:
- Uses cursor-based pagination with timestamps
- Triggers toast notifications for new rewards
- Staggers multiple toasts by 500ms

## Theme Integration
All components use the unified theme system:
- CSS variables for colors and spacing
- Respects dark/light theme switching
- Uses theme helper classes (`.btn-ghost`, `.fsn-card`, etc.)
- Consistent with existing FSN design language

## Accessibility
- Keyboard navigation support (Escape to close panels)
- Screen reader friendly with proper ARIA labels
- Respects `prefers-reduced-motion`
- Minimum 44px touch targets
- WCAG color contrast compliance

## Performance
- Lightweight polling (only when authenticated)
- Minimal database queries with proper indexing
- CSS-based animations for smooth performance
- Optional functionality doesn't impact core app

## Rollback Instructions
To completely disable the rewards UI:
1. Set `VITE_REWARDS_UI_ENABLED=false` in environment
2. All UI components will be hidden
3. Server APIs will return 404 when disabled
4. No database operations will occur
5. Existing XP system continues unchanged

## Development Guidelines
- Never modify existing XP calculation logic
- Reward logging is additive only
- Use canonical reason keys consistently
- Test with feature flag both enabled and disabled
- Ensure server APIs check authentication
- Follow theme system patterns for new UI components