# Reanimated v4.1.1 Quick Reference Guide

## Essential Imports

```typescript
// Core Reanimated
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';

// Gesture Handler
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// Types
import type { SharedValue } from 'react-native-reanimated';
```

---

## v4 Breaking Changes Checklist

- [ ] Install `react-native-worklets` peer dependency
- [ ] Update babel.config.js: `'react-native-worklets/plugin'`
- [ ] Replace `useScrollViewOffset` → `useScrollOffset`
- [ ] Replace `useWorkletCallback` → `useCallback` + `'worklet'`
- [ ] Replace `useAnimatedGestureHandler` → `Gesture` API
- [ ] Update `withSpring` (remove old threshold params)
- [ ] Ensure New Architecture is enabled

---

## Core Patterns

### 1. Shared Values

```typescript
// ✅ CORRECT
const count = useSharedValue(0);
const position = useSharedValue({ x: 0, y: 0 });

// Access in worklet
const style = useAnimatedStyle(() => ({
  width: count.value
}));

// Update
count.value = 100;
count.value = withSpring(100);

// With React Compiler - use .get() and .set()
const value = count.get();
count.set(50);
count.set((prev) => prev + 1);

// ❌ WRONG
const { value } = count; // Don't destructure
console.log(count.value); // Don't read during render
position.value.x = 50; // Don't mutate - reassign instead
```

### 2. Animated Styles

```typescript
// ✅ CORRECT - Only dynamic values
const staticStyles = StyleSheet.create({
  container: { width: 100, height: 100 }
});

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value
}));

<Animated.View style={[staticStyles.container, animatedStyle]} />

// ❌ WRONG - Everything in animated
const badStyle = useAnimatedStyle(() => ({
  width: 100,  // Static - should be in StyleSheet
  opacity: opacity.value
}));
```

### 3. Scroll Handler

```typescript
const scrollX = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollX.value = event.contentOffset.x;
  },
  onMomentumEnd: (event) => {
    const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
    runOnJS(onIndexChange)(index);
  }
});

<Animated.ScrollView
  onScroll={scrollHandler}
  scrollEventThrottle={16}
/>
```

### 4. Gesture Handler

```typescript
const translateX = useSharedValue(0);
const contextX = useSharedValue(0);

const pan = Gesture.Pan()
  .onStart(() => {
    contextX.value = translateX.value;
  })
  .onChange((event) => {
    translateX.value = contextX.value + event.translationX;
  })
  .onEnd((event) => {
    // Snap with velocity
    if (event.velocityX < -500) {
      translateX.value = withSpring(-tabWidth);
    } else {
      translateX.value = withSpring(0);
    }
  });

<GestureDetector gesture={pan}>
  <Animated.View />
</GestureDetector>
```

---

## Animation Functions

### withSpring (Natural Movement)

```typescript
// v4 syntax
withSpring(100, {
  damping: 20,      // Higher = less bounce (default: 10)
  stiffness: 90,    // Higher = faster (default: 100)
  mass: 0.5,        // Higher = slower (default: 1)
  energyThreshold: 0.001  // NEW in v4
});

// Legacy v3 config (if needed)
import { Reanimated3DefaultSpringConfig } from 'react-native-reanimated';
withSpring(100, Reanimated3DefaultSpringConfig);
```

### withTiming (Linear/Eased)

```typescript
import { Easing } from 'react-native-reanimated';

withTiming(100, {
  duration: 300,
  easing: Easing.inOut(Easing.ease)
});

// Common easings
Easing.linear
Easing.ease
Easing.bezier(0.25, 0.1, 0.25, 1)
Easing.inOut(Easing.ease)
```

### withDecay (Momentum)

```typescript
const pan = Gesture.Pan()
  .onFinalize((event) => {
    offset.value = withDecay({
      velocity: event.velocityX,
      deceleration: 0.998,
      rubberBandEffect: true,
      rubberBandFactor: 0.6,
      clamp: [0, maxWidth]
    });
  });
```

---

## Interpolation

### Position

```typescript
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{
    translateX: interpolate(
      scrollX.value,
      [0, width, 2 * width],        // Input range
      [0, width, 2 * width],        // Output range
      Extrapolation.CLAMP           // Clamp outside range
    )
  }]
}));
```

### Scale

```typescript
const scale = interpolate(
  scrollX.value,
  [(index - 1) * width, index * width, (index + 1) * width],
  [0.8, 1, 0.8],
  Extrapolation.CLAMP
);
```

### Color

```typescript
const backgroundColor = interpolateColor(
  scrollX.value,
  [0, width],
  ['#000000', '#ffffff']
);
```

### Opacity

```typescript
const opacity = interpolate(
  scrollX.value,
  [0, 50, 100],
  [0, 1, 0],
  Extrapolation.CLAMP
);
```

---

## TypeScript Patterns

### Shared Value Types

```typescript
const count = useSharedValue<number>(0);
const position = useSharedValue<{ x: number; y: number }>({ x: 0, y: 0 });
const isVisible = useSharedValue<boolean>(false);

// Component props
interface Props {
  animatedValue: SharedValue<number>;
  position: SharedValue<{ x: number; y: number }>;
}
```

### Style Types

```typescript
import type { ViewStyle, TextStyle } from 'react-native';

const viewStyle = useAnimatedStyle<ViewStyle>(() => ({
  opacity: opacity.value
}));

const textStyle = useAnimatedStyle<TextStyle>(() => ({
  fontSize: fontSize.value
}));
```

---

## Common Tab Patterns

### Basic Tab Indicator

```typescript
const selectedIndex = useSharedValue(0);
const tabWidth = SCREEN_WIDTH / tabs.length;

const indicatorStyle = useAnimatedStyle(() => ({
  transform: [{
    translateX: withSpring(selectedIndex.value * tabWidth)
  }]
}));

<Animated.View style={[styles.indicator, indicatorStyle]} />
```

### Synced Tab & Content

```typescript
const selectedIndex = useSharedValue(0);
const scrollX = useSharedValue(0);

// Tab bar uses selectedIndex for tap animation
<TabBar selectedIndex={selectedIndex} scrollX={scrollX} />

// Content updates scrollX during scroll
<TabContent
  scrollX={scrollX}
  onIndexChange={(index) => {
    selectedIndex.value = index;
  }}
/>
```

### Tab Item with Color Interpolation

```typescript
const textStyle = useAnimatedStyle(() => ({
  color: interpolateColor(
    selectedIndex.value,
    [index - 0.5, index, index + 0.5],
    ['#666666', '#000000', '#666666']
  ),
  fontWeight: selectedIndex.value === index ? '600' : '400'
}));
```

---

## Performance Best Practices

### DO ✅

- Use `scrollEventThrottle={16}` (60fps)
- Keep static styles in `StyleSheet`
- Memoize calculations with `useMemo`
- Use `getItemLayout` for FlatList
- Extract complex worklets
- Use shared values instead of state
- Add `'worklet'` directive to callbacks

### DON'T ❌

- Read shared values during render
- Mutate shared value objects
- Put static styles in `useAnimatedStyle`
- Use `runOnJS` unnecessarily
- Destructure shared values
- Forget `GestureHandlerRootView`
- Miss `react-native-worklets/plugin` in babel

---

## Debugging Tips

### Check Worklet Thread

```typescript
const animatedStyle = useAnimatedStyle(() => {
  if (global._WORKLET) {
    console.log('Running on UI thread');
  } else {
    console.log('Running on JS thread');
  }
  return { opacity: 1 };
});
```

### Log Shared Values

```typescript
// In worklet
console.log(scrollX.value);

// From JS thread
runOnJS((value) => {
  console.log('ScrollX:', value);
})(scrollX.value);
```

### Common Errors

**Error:** "Reading from shared value during render"
- **Fix:** Move read to `useAnimatedStyle` or `useEffect`

**Error:** "runOnJS expects a worklet"
- **Fix:** Add `'worklet'` directive or use Gesture API

**Error:** "Animated node already attached"
- **Fix:** Don't use same shared value in multiple `useAnimatedStyle` with mutations

---

## Minimal Working Example

```typescript
import React from 'react';
import { View, Pressable, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TABS = ['Home', 'Search', 'Profile'];
const TAB_WIDTH = width / TABS.length;

export default function MinimalTabs() {
  const selectedIndex = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(selectedIndex.value * TAB_WIDTH) }]
  }));

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            style={styles.tab}
            onPress={() => { selectedIndex.value = index; }}
          >
            <Text>{tab}</Text>
          </Pressable>
        ))}
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', height: 50, borderBottomWidth: 1 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: TAB_WIDTH,
    height: 3,
    backgroundColor: '#007AFF'
  }
});
```

---

## Installation Checklist

### 1. Dependencies

```json
{
  "react-native-reanimated": "~4.1.1",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-worklets": "0.5.1"
}
```

### 2. Babel Config

```javascript
// babel.config.js
module.exports = {
  plugins: [
    'react-native-worklets/plugin'  // Must be LAST
  ]
};
```

### 3. App Root

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app */}
    </GestureHandlerRootView>
  );
}
```

### 4. Clear Cache

```bash
npx expo start -c
```

---

## When to Use What

| Use Case | Solution |
|----------|----------|
| Simple 3-5 tabs | Custom implementation |
| 6+ scrollable tabs | FlatList + interpolation |
| Bottom navigation | react-native-animated-tabbar |
| Collapsible header | react-native-collapsible-tab-view |
| Complex gestures | reanimated-tab-view |

---

## Resources

- Official Docs: https://docs.swmansion.com/react-native-reanimated/
- Migration Guide: https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/
- Gesture Handler: https://docs.swmansion.com/react-native-gesture-handler/
- Full Implementation: See `REANIMATED_V4_IMPLEMENTATION_COMPLETE.tsx`
- Complete Research: See `REANIMATED_V4_TAB_NAVIGATION_RESEARCH.md`
