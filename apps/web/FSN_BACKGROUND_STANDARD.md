# FSN Universal Background Standard

## Overview
This document defines the standardized background appearance for ALL pages in the FreeSpace Network project. This ensures visual consistency across the entire application.

## Background Template Specifications

### Gradient Colors
- **Primary Radial Gradient**: `radial-gradient(circle at top center, #081220 0%, #050a12 40%, #030509 100%)`
- **Secondary Linear Gradient**: `linear-gradient(45deg, rgba(8, 24, 40, 0.3) 0%, rgba(4, 12, 20, 0.3) 100%)`

### Particle Animation Settings
- **Particle Opacity**: 0.8 base opacity with 0.2 pulse variation
- **Connection Line Opacity**: 0.6 base with 1.2x and 1.8x brightness multipliers
- **Glow Layers**: 0.4 and 0.2 opacity for outer glow effects
- **Network Background Opacity**: 0.15 with screen blend mode

### Color Variables
```css
:root {
  --fsn-primary: #00f0ff;
  --fsn-secondary: #4dd0e1;
  --fsn-accent: #26c6da;
  --fsn-background-primary: #081220;
  --fsn-background-secondary: #050a12;
  --fsn-background-tertiary: #030509;
}
```

## Implementation Guidelines

### For New Pages
1. Import the universal background CSS: `import "./styles/universal-background.css"`
2. Use the SharedNetworkAnimation component with standard opacity
3. Apply the `.fsn-universal-background` class to page containers
4. Ensure content has `z-index: 10` or higher

### For Existing Pages
All existing pages have been updated to use this standard:
- Homepage (LockInHomepage)
- Dashboard (all variants)
- Registration page
- Login pages
- Admin pages
- Forge page

### Background Components
1. **Base Gradient**: Deep space radial and linear gradients
2. **Particle Animation**: SharedNetworkAnimation with 0.15 opacity
3. **Color Overlays**: Cyan glow at top, purple accent at bottom right
4. **Noise Texture**: Subtle fractal noise overlay at 0.12 opacity

## File Locations
- **Universal CSS**: `client/src/styles/universal-background.css`
- **Particle Component**: `client/src/components/SharedNetworkAnimation.tsx`
- **Main Import**: `client/src/App.tsx`

## Consistency Rules
- Never override the universal background with different colors
- Always use the standard particle opacity (0.15)
- Maintain the same gradient colors across all pages
- Ensure content z-index is always above background elements (z-index: 10+)

## Quality Assurance
This background template has been tested and confirmed to match perfectly between:
- Homepage and Dashboard
- All page transitions
- Different screen sizes and devices
- Various browser environments

Any deviation from this standard should be documented and approved before implementation.