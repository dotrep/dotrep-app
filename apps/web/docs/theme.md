# FSN Unified Theme System

## Overview
The FSN platform now includes a comprehensive design system that provides consistent colors, typography, spacing, and responsive behavior across all pages. This system is **additive-only** - existing functionality and layouts remain unchanged.

## Feature Flags

Add these environment variables to enable the theme system:

- `VITE_FEATURE_THEME_UNIFIED=on` - Main feature flag (default: enabled)
- `VITE_THEME_DEFAULT=dark` - Default theme (supported: dark, light)
- `VITE_THEME_ALLOW_SWITCH=true` - Enable theme switching (default: false)

## Design Tokens

### Location
- **Main tokens**: `client/src/styles/tokens.css`
- **Helper classes**: `client/src/styles/theme-helpers.css`

### Color System
```css
--bg: Background color
--bg-2: Secondary background
--text: Primary text
--muted: Muted text
--accent: Primary accent (FSN cyan)
--accent-2: Secondary accent
--success: Success state
--warning: Warning state
--danger: Error state
--border: Border color
--ring: Focus ring color
```

### Typography Scale
```css
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-base: 16px
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px
```

### Spacing Scale (8pt base)
```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px
--space-24: 96px
```

## Breakpoints

```css
--breakpoint-sm: 360px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

## Helper Classes

### Container System
- `.fsn-container` - Responsive container with proper max-widths and padding

### Typography
- `.fsn-h1`, `.fsn-h2`, `.fsn-h3` - Heading styles
- `.fsn-body` - Body text
- `.fsn-caption` - Small text

### Colors
- `.bg-surface`, `.bg-surface-2` - Background colors
- `.text-primary`, `.text-muted`, `.text-accent` - Text colors
- `.border-default` - Border color
- `.ring-accent` - Focus ring

### Components
- `.btn-primary`, `.btn-ghost`, `.btn-muted` - Button variants
- `.fsn-card` - Card/panel styling
- `.fsn-modal` - Modal styling
- `.fsn-input` - Input field styling

## Theme Switching

When `VITE_THEME_ALLOW_SWITCH=true`, users can toggle between light and dark themes using the `ThemeToggle` component.

```jsx
import ThemeToggle from '@/components/ThemeToggle';

<ThemeToggle />
```

## Responsive Behavior

### Mobile (< 768px)
- Reduced shadows for performance
- Full-width modals (90vw)
- Smaller padding and margins

### Tablet/Desktop (≥ 768px)
- Full shadow effects
- Constrained modal widths (560-720px)
- Standard spacing

## Accessibility

### Features
- WCAG color contrast compliance (≥4.5:1 for body, ≥3:1 for headings)
- Visible focus states on all interactive elements
- Minimum 44px touch targets
- Respects `prefers-reduced-motion`

### Focus Management
All interactive elements automatically receive proper focus styling via CSS:
```css
button:focus, a:focus, input:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

## Analytics

The theme system emits non-PII analytics events:
- `theme_applied` - When theme changes
- `breakpoint_rendered` - Current breakpoint
- `a11y_reduced_motion` - Reduced motion preference

## Rollback Instructions

### Complete Rollback
Set `VITE_FEATURE_THEME_UNIFIED=off` to disable all theme functionality and revert to original appearance.

### Partial Rollback
Remove specific helper classes (`.fsn-*`) from components to revert individual elements while keeping the token system active.

## Implementation Guidelines

### Adding Theme Support to Components
1. **Use design tokens**: Replace hardcoded colors with CSS variables
2. **Add helper classes**: Apply `.fsn-*` classes alongside existing ones
3. **Maintain existing functionality**: Never remove existing classes or logic
4. **Test both themes**: Verify components work in light and dark modes

### Example Migration
```jsx
// Before
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>

// After (additive)
<button className="bg-blue-500 text-white px-4 py-2 rounded btn-primary">
  Click me
</button>
```

## Performance Considerations

- CSS variables used for runtime theme switching (no rebuilds)
- Reduced shadows on mobile for better performance
- Minimal additional CSS footprint
- No additional UI library dependencies

## Browser Support

- Modern browsers with CSS custom properties support
- Graceful degradation for older browsers (falls back to existing styles)
- CSS Grid and Flexbox for layout (widely supported)