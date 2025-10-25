# Brutalist Tab Navigation System

A complete horizontal tab navigation system for the Noticias Pachuca news app, built with React Native Reanimated v4.

## Overview

This tab system features:

- **7 news categories**: TODAS, DEPORTES, POLÍTICA, ECONOMÍA, SALUD, SEGURIDAD, ESTADO
- **Smooth animations**: Reanimated v4 with 60fps performance
- **Bidirectional sync**: Tab press and swipe gestures
- **Haptic feedback**: Native iOS/Android tactile response
- **Accessibility**: Full VoiceOver/TalkBack support
- **Brutalist design**: Clean, bold, functional aesthetics

## Installation

All dependencies are already installed in the project:

```json
{
  "react-native-reanimated": "~4.1.1",
  "react-native-gesture-handler": "~2.28.0",
  "expo-haptics": "~15.0.7"
}
```

## Quick Start

### Basic Usage

```tsx
import { BrutalistTabs } from '@/components/home/tabs';

export default function HomeScreen() {
  return <BrutalistTabs />;
}
```

### With Custom Content

```tsx
import { BrutalistTabs } from '@/components/home/tabs';
import { NewsFeed } from '@/components/news';

export default function HomeScreen() {
  return (
    <BrutalistTabs
      renderContent={(category) => (
        <NewsFeed category={category.slug} />
      )}
    />
  );
}
```

### With Change Handler

```tsx
import { BrutalistTabs } from '@/components/home/tabs';

export default function HomeScreen() {
  return (
    <BrutalistTabs
      onCategoryChange={(category, index) => {
        console.log('Category:', category.label);
        // Track analytics, update URL, etc.
      }}
    />
  );
}
```

## Components

### `BrutalistTabs` (Main Component)

Complete tab system with bar and content.

**Props:**

```tsx
interface BrutalistTabsProps {
  categories?: readonly NewsCategory[];      // Default: NEWS_CATEGORIES
  initialIndex?: number;                      // Default: 0
  renderContent?: (category, index) => React.ReactNode;
  onCategoryChange?: (category, index) => void;
  tabWidth?: number;                          // Default: 110
}
```

### `BrutalistTabBar`

Horizontal scrollable tab bar only (no content).

**Props:**

```tsx
interface BrutalistTabBarProps {
  categories: readonly NewsCategory[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  tabWidth?: number;
  testID?: string;
}
```

### `BrutalistTabContent`

Swipeable content area only (no tab bar).

**Props:**

```tsx
interface BrutalistTabContentProps {
  categories: readonly NewsCategory[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  renderContent?: (category, index) => React.ReactNode;
}
```

## Design Tokens

All design values are exported from `BrutalistTabs.tokens.ts`:

```tsx
import { COLORS, DIMENSIONS, TYPOGRAPHY, ANIMATION } from '@/components/home/tabs';

// Colors
COLORS.textActive          // #854836 (brown)
COLORS.textInactive        // #000000 (black)
COLORS.indicatorActive     // #FFB22C (yellow)
COLORS.borderColor         // #000000 (black)

// Dimensions
DIMENSIONS.containerHeight      // 56px
DIMENSIONS.tabMinWidth          // 110px
DIMENSIONS.tabHeight            // 50px
DIMENSIONS.indicatorHeight      // 4px
DIMENSIONS.borderTopWidth       // 3px

// Typography
TYPOGRAPHY.fontSize             // 13
TYPOGRAPHY.fontWeight           // '700' (bold)
TYPOGRAPHY.letterSpacing        // 0.8

// Animation
ANIMATION.indicatorDuration     // 250ms
ANIMATION.pressScale            // 0.96
```

## Categories

Default categories are defined in `NEWS_CATEGORIES`:

```tsx
const NEWS_CATEGORIES = [
  { id: 'todas', label: 'TODAS', slug: 'all', voiceLabel: 'All News' },
  { id: 'deportes', label: 'DEPORTES', slug: 'sports', voiceLabel: 'Sports' },
  { id: 'politica', label: 'POLÍTICA', slug: 'politics', voiceLabel: 'Politics' },
  { id: 'economia', label: 'ECONOMÍA', slug: 'economy', voiceLabel: 'Economy' },
  { id: 'salud', label: 'SALUD', slug: 'health', voiceLabel: 'Health' },
  { id: 'seguridad', label: 'SEGURIDAD', slug: 'security', voiceLabel: 'Security' },
  { id: 'estado', label: 'ESTADO', slug: 'state', voiceLabel: 'State' },
];
```

## TypeScript Support

All components are fully typed with zero `any` types:

```tsx
import type { NewsCategory, BrutalistTabsProps } from '@/components/home/tabs';

const MyComponent: React.FC<BrutalistTabsProps> = (props) => {
  // Fully type-safe
};
```

## Performance Optimizations

- ✅ All components use `React.memo`
- ✅ Callbacks wrapped in `useCallback`
- ✅ Styles memoized with `StyleSheet.create`
- ✅ `scrollEventThrottle={16}` for 60fps
- ✅ Reanimated worklets run on UI thread
- ✅ Proper shared value typing

## Accessibility Checklist

- ✅ VoiceOver labels on all tabs
- ✅ `accessibilityRole="tab"` and `"tablist"`
- ✅ `accessibilityState={{ selected: true/false }}`
- ✅ `accessibilityHint` for guidance
- ✅ Haptic feedback on interactions
- ✅ Color contrast ratios (WCAG AA+)
- ✅ Minimum touch target 44x44 (iOS HIG)

## File Structure

```
components/home/tabs/
├── BrutalistTabs.tsx              # Main component
├── BrutalistTabBar.tsx            # Horizontal tab bar
├── BrutalistTabContent.tsx        # Swipeable content
├── BrutalistTabItem.tsx           # Individual tab button
├── BrutalistTabIndicator.tsx      # Animated yellow indicator
├── BrutalistTabs.types.ts         # TypeScript types
├── BrutalistTabs.tokens.ts        # Design tokens
├── BrutalistTabs.example.tsx      # Usage examples
├── index.ts                       # Main exports
└── README.md                      # This file
```

## Animation Behavior

### Indicator Animation

- **Duration**: 250ms
- **Easing**: Ease-out (cubic)
- **Trigger**: Tab press or swipe
- **FPS**: 60 (runs on UI thread)

### Press Feedback

- **Scale**: 0.96 (subtle shrink)
- **Duration**: 100ms
- **Background**: Yellow flash (30% opacity)
- **Haptic**: Light impact

### Scroll Behavior

- **Auto-center**: Active tab scrolls to center
- **Deceleration**: Fast (snappy feel)
- **Throttle**: 16ms (60fps)

## Advanced Examples

### Starting at Specific Category

```tsx
<BrutalistTabs initialIndex={1} /> {/* Start at DEPORTES */}
```

### Custom Tab Width

```tsx
<BrutalistTabs tabWidth={120} /> {/* Wider tabs */}
```

### Standalone Components

```tsx
import { BrutalistTabBar, BrutalistTabContent } from '@/components/home/tabs';

function MyScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <BrutalistTabBar
        categories={NEWS_CATEGORIES}
        activeIndex={activeIndex}
        onTabPress={setActiveIndex}
      />

      {/* Your custom content here */}
      <MyCustomContent category={NEWS_CATEGORIES[activeIndex]} />
    </>
  );
}
```

### Integration with React Navigation

```tsx
import { BrutalistTabs } from '@/components/home/tabs';
import { useNavigation } from '@react-navigation/native';

function HomeScreen() {
  const navigation = useNavigation();

  return (
    <BrutalistTabs
      onCategoryChange={(category) => {
        navigation.setParams({ category: category.slug });
      }}
    />
  );
}
```

## Testing

The components include test IDs for E2E testing:

```tsx
// Find tab bar
await element(by.id('brutalist-tab-bar')).tap();

// Find specific tab
await element(by.id('tab-deportes')).tap();
```

## Browser DevTools (Web)

When running on web (`expo start --web`), you can inspect:

- Reanimated shared values in React DevTools
- Animation performance in Chrome Performance tab
- Accessibility tree in Chrome Accessibility Inspector

## Troubleshooting

### Tabs not scrolling

Ensure your container has proper flex:

```tsx
<View style={{ flex: 1 }}>
  <BrutalistTabs />
</View>
```

### Indicator not animating

Check that Reanimated is properly configured in `babel.config.js`:

```js
plugins: ['react-native-reanimated/plugin']
```

### TypeScript errors

Ensure you're importing types correctly:

```tsx
import type { NewsCategory } from '@/components/home/tabs';
```

## Contributing

When modifying components:

1. Update TypeScript types in `BrutalistTabs.types.ts`
2. Update design tokens in `BrutalistTabs.tokens.ts`
3. Keep JSDoc comments current
4. Test accessibility with VoiceOver
5. Verify 60fps animations
6. Update this README

## Design Reference

Based on `BRUTALIST_TAB_SELECTOR_DESIGN.md` specification:

- Fixed 110px tab width
- 3px black borders (top/bottom)
- 4px yellow indicator (#FFB22C)
- 13px bold uppercase text
- 250ms slide animation
- 60% opacity for inactive tabs

## License

Internal use only - Noticias Pachuca project

---

**Version**: 1.0.0
**Last Updated**: 2025-10-24
**Reanimated**: v4.1.1
**React Native**: 0.81.5
