# ArticleCollapsibleHeader - Quick Start Guide

## Installation

Component is already in your project at:
```
/components/article/ArticleCollapsibleHeader.tsx
```

## Import

```tsx
import { ArticleCollapsibleHeader, ARTICLE_COLLAPSIBLE_HEADER_HEIGHT } from '@/components/article';
```

## Basic Usage

### 1. Add Reanimated Imports

```tsx
import { useSharedValue, useDerivedValue, withTiming, useAnimatedScrollHandler } from 'react-native-reanimated';
```

### 2. Setup Scroll Tracking

```tsx
// Track scroll position
const scrollY = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
  },
});
```

### 3. Create Opacity Animation

```tsx
// Show header when scrolled past 100px
const headerOpacity = useDerivedValue(() => {
  return scrollY.value > 100
    ? withTiming(1, { duration: 200 })
    : withTiming(0, { duration: 200 });
});
```

### 4. Render Component

```tsx
<View style={{ flex: 1 }}>
  {/* Header - Position Absolute */}
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 }}>
    <ArticleCollapsibleHeader
      onBackPress={() => router.back()}
      animatedOpacity={headerOpacity}
    />
  </View>

  {/* Scrollable Content */}
  <Animated.ScrollView
    onScroll={scrollHandler}
    scrollEventThrottle={16}
  >
    {/* Your article content */}
  </Animated.ScrollView>
</View>
```

## Complete Example

```tsx
import React from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ArticleCollapsibleHeader } from '@/components/article';

export default function ArticleScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerOpacity = useDerivedValue(() => {
    return scrollY.value > 100 ? withTiming(1) : withTiming(0);
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 }}>
        <ArticleCollapsibleHeader
          onBackPress={() => router.back()}
          animatedOpacity={headerOpacity}
        />
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Article content here */}
      </Animated.ScrollView>
    </View>
  );
}
```

## Customization Options

### Change Scroll Threshold

```tsx
// Header appears at 200px instead of 100px
const headerOpacity = useDerivedValue(() => {
  const threshold = 200;
  return scrollY.value > threshold ? withTiming(1) : withTiming(0);
});
```

### Change Animation Speed

```tsx
// Faster animation (100ms)
withTiming(1, { duration: 100 })

// Slower animation (500ms)
withTiming(1, { duration: 500 })
```

### Reverse Animation (Fade Out on Scroll)

```tsx
// Header visible at top, fades out when scrolling down
const headerOpacity = useDerivedValue(() => {
  return scrollY.value < 100 ? withTiming(1) : withTiming(0);
});
```

## Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onBackPress` | `() => void` | Yes | Callback when back button pressed |
| `animatedOpacity` | `SharedValue<number>` | Yes | Opacity value (0-1) |
| `testID` | `string` | No | Test identifier (default: 'article-collapsible-header') |

## Layout Structure

```
┌─────────────────────────────────────────┐
│ Safe Area Top (device specific)         │
├─────────────────────────────────────────┤
│ ┌────────────┐      ┌──────────────┐   │
│ │   LOGO     │      │  VIE, 24...  │   │
│ │  NOTICIAS  │      │  🌥️ 23°C...  │   │
│ └────────────┘      └──────────────┘   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │    ← VOLVER AL INICIO (Button)      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
  4px Black Border Bottom
```

## Design Tokens

- Background: `#F7F7F7` (Light gray)
- Border: `4px solid #000000` (Black)
- Button: Primary variant (Brown `#854836`)
- Date: Overline variant, `11px`, Black
- Weather: Small variant, `12px`, Gray `#4B5563`
- Icon: Cloud outline, `14px`, Gray
- Padding: `16px` horizontal, `16px` bottom

## Troubleshooting

**Header not appearing?**
- Check that `animatedOpacity` is being updated
- Verify scroll threshold is appropriate for your content
- Ensure z-index is high enough (999 recommended)

**Animation feels choppy?**
- Make sure you're using `Animated.ScrollView` not regular `ScrollView`
- Set `scrollEventThrottle={16}` for 60fps updates
- Verify Reanimated is properly configured in your project

**Button not working?**
- Check that `onBackPress` callback is defined
- Verify header is not behind other content (z-index issue)
- Ensure `pointerEvents` is working (component handles this automatically)

## Performance Tips

✅ Component is already optimized with:
- `React.memo` for preventing re-renders
- `useMemo` for computed values
- Native-thread animations via Reanimated
- Automatic pointer event management

❌ Avoid:
- Creating new functions in render (use `useCallback`)
- Inline styles (use StyleSheet.create)
- Reading animated values in JavaScript thread

## Need Help?

See full documentation in `README.md` or the example in `ArticleCollapsibleHeader.example.tsx`
