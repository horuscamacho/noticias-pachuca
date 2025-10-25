# Rotating Dot Indicator - Usage Guide

## Quick Start

### Basic Implementation

```tsx
import { RotatingDotIndicator } from '@/components/RotatingDotIndicator';

function QuickReadScreen() {
  const [currentArticle, setCurrentArticle] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const articles = [...]; // Your articles array

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    setCurrentArticle((prev) => (prev + 1) % articles.length);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Article content with swipe gesture */}
      <ArticleSwipeView
        article={articles[currentArticle]}
        onSwipe={handleSwipe}
      />

      {/* Rotating dot indicator */}
      <RotatingDotIndicator
        currentIndex={currentArticle}
        totalArticles={articles.length}
        swipeDirection={swipeDirection}
        onAnimationComplete={() => setSwipeDirection(null)}
      />
    </View>
  );
}
```

---

## Integration with React Native Gesture Handler

### Full Swipe Implementation

```tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { RotatingDotIndicator } from '@/components/RotatingDotIndicator';

function QuickReadWithGestures() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const translateX = useSharedValue(0);

  const articles = [...]; // Your articles

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // Loop back to start
      return next >= articles.length ? 0 : next;
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = 50;
      const velocity = event.velocityX;

      if (Math.abs(event.translationX) > threshold || Math.abs(velocity) > 500) {
        // Determine swipe direction
        const direction = event.translationX < 0 ? 'left' : 'right';

        // Animate out
        translateX.value = withSpring(
          direction === 'left' ? -400 : 400,
          { damping: 20, stiffness: 90 },
          () => {
            // Trigger article change
            runOnJS(handleSwipeComplete)(direction);
            // Reset position
            translateX.value = 0;
          }
        );
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ArticleContent article={articles[currentIndex]} />
        </Animated.View>
      </GestureDetector>

      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection={swipeDirection}
        onAnimationComplete={() => setSwipeDirection(null)}
      />
    </View>
  );
}
```

---

## Advanced: Queue Multiple Swipes

For power users who swipe rapidly:

```tsx
function QuickReadWithQueue() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const swipeQueue = useRef<Array<'left' | 'right'>>([]);

  const processSwipeQueue = useCallback(() => {
    if (swipeQueue.current.length > 0 && !isAnimating) {
      const nextDirection = swipeQueue.current.shift();
      setSwipeDirection(nextDirection || null);
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }
  }, [isAnimating, articles.length]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating) {
      // Queue the swipe
      swipeQueue.current.push(direction);
    } else {
      // Process immediately
      setSwipeDirection(direction);
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setSwipeDirection(null);
    // Process next in queue
    setTimeout(processSwipeQueue, 50);
  };

  return (
    <View style={{ flex: 1 }}>
      <ArticleSwipeView onSwipe={handleSwipe} />

      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection={swipeDirection}
        onAnimationComplete={handleAnimationComplete}
      />
    </View>
  );
}
```

---

## Custom Styling

### Themed Container

```tsx
import { useTheme } from '@/hooks/useTheme';

function ThemedDots() {
  const theme = useTheme();

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={totalArticles}
      swipeDirection={swipeDirection}
      containerStyle={{
        backgroundColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.4)',
        bottom: theme.safeAreaInsets.bottom + 20,
      }}
    />
  );
}
```

### Position Variations

```tsx
// Bottom center (default)
<RotatingDotIndicator {...props} />

// Bottom with safe area
<RotatingDotIndicator
  {...props}
  containerStyle={{
    bottom: Math.max(40, env.safeAreaInsets.bottom + 20),
  }}
/>

// Top right (for landscape)
<RotatingDotIndicator
  {...props}
  containerStyle={{
    top: 40,
    right: 20,
    left: 'auto',
    transform: [{ translateX: 0 }],
  }}
/>

// Side indicator (landscape mode)
<RotatingDotIndicator
  {...props}
  containerStyle={{
    flexDirection: 'column',
    width: 40,
    height: 120,
    right: 20,
    top: '50%',
    left: 'auto',
    transform: [{ translateY: -60 }],
  }}
/>
```

---

## Accessibility Enhancements

### Full A11y Integration

```tsx
import { AccessibilityInfo } from 'react-native';

function AccessibleQuickRead() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => subscription.remove();
  }, []);

  const handleArticleChange = (newIndex: number) => {
    setCurrentIndex(newIndex);

    // Announce to screen reader
    AccessibilityInfo.announceForAccessibility(
      `Article ${newIndex + 1} of ${articles.length}`
    );
  };

  return (
    <View>
      <ArticleSwipeView
        onSwipe={(direction) => {
          handleArticleChange((currentIndex + 1) % articles.length);
        }}
      />

      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection={swipeDirection}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}
```

---

## Performance Optimization

### Memoization for Large Lists

```tsx
import React, { memo, useMemo } from 'react';

const MemoizedDotIndicator = memo(
  RotatingDotIndicator,
  (prevProps, nextProps) => {
    // Only re-render when these values change
    return (
      prevProps.currentIndex === nextProps.currentIndex &&
      prevProps.swipeDirection === nextProps.swipeDirection &&
      prevProps.totalArticles === nextProps.totalArticles
    );
  }
);

function OptimizedQuickRead() {
  const dotProps = useMemo(
    () => ({
      currentIndex,
      totalArticles: articles.length,
      swipeDirection,
      onAnimationComplete: handleComplete,
    }),
    [currentIndex, articles.length, swipeDirection]
  );

  return (
    <View style={{ flex: 1 }}>
      <ArticleContent article={articles[currentIndex]} />
      <MemoizedDotIndicator {...dotProps} />
    </View>
  );
}
```

---

## Testing

### Unit Test Example

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { RotatingDotIndicator } from '@/components/RotatingDotIndicator';

describe('RotatingDotIndicator', () => {
  it('renders 5 dots', () => {
    const { UNSAFE_getAllByType } = render(
      <RotatingDotIndicator
        currentIndex={0}
        totalArticles={10}
        swipeDirection={null}
      />
    );

    const dots = UNSAFE_getAllByType('Animated.View');
    expect(dots.length).toBe(5);
  });

  it('calls onAnimationComplete after swipe', async () => {
    const mockCallback = jest.fn();

    const { rerender } = render(
      <RotatingDotIndicator
        currentIndex={0}
        totalArticles={10}
        swipeDirection={null}
        onAnimationComplete={mockCallback}
      />
    );

    // Trigger swipe
    rerender(
      <RotatingDotIndicator
        currentIndex={1}
        totalArticles={10}
        swipeDirection="left"
        onAnimationComplete={mockCallback}
      />
    );

    await waitFor(
      () => {
        expect(mockCallback).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('respects reduced motion preference', () => {
    const { getByA11yRole } = render(
      <RotatingDotIndicator
        currentIndex={0}
        totalArticles={10}
        swipeDirection={null}
        reducedMotion={true}
      />
    );

    const container = getByA11yRole('progressbar');
    expect(container).toBeDefined();
  });
});
```

---

## Common Patterns

### 1. First-Time User Tutorial

```tsx
function QuickReadTutorial() {
  const [showHint, setShowHint] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    if (swipeCount >= 1) {
      setShowHint(false);
    }
  }, [swipeCount]);

  return (
    <View>
      <ArticleSwipeView
        onSwipe={() => setSwipeCount((c) => c + 1)}
      />

      <RotatingDotIndicator {...props} />

      {showHint && (
        <Animated.View style={styles.hint}>
          <Text>Swipe left or right for next article</Text>
        </Animated.View>
      )}
    </View>
  );
}
```

### 2. Infinite Loop Handling

```tsx
function InfiniteQuickRead() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalArticles = articles.length;

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // Seamless loop
      return next >= totalArticles ? 0 : next;
    });
  };

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={totalArticles}
      swipeDirection={swipeDirection}
    />
  );
}
```

### 3. Analytics Integration

```tsx
import { analytics } from '@/utils/analytics';

function TrackedQuickRead() {
  const handleSwipe = (direction: 'left' | 'right') => {
    // Track swipe
    analytics.track('quick_read_swipe', {
      direction,
      article_index: currentIndex,
      article_id: articles[currentIndex].id,
    });

    setSwipeDirection(direction);
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  const handleAnimationComplete = () => {
    // Track article view
    analytics.track('quick_read_view', {
      article_index: currentIndex,
      article_id: articles[currentIndex].id,
    });

    setSwipeDirection(null);
  };

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
      onAnimationComplete={handleAnimationComplete}
    />
  );
}
```

---

## Troubleshooting

### Issue: Dots not animating

**Solution**: Ensure `swipeDirection` is set and then reset to `null`:

```tsx
const handleSwipe = (direction: 'left' | 'right') => {
  setSwipeDirection(direction); // Trigger animation
};

const handleAnimationComplete = () => {
  setSwipeDirection(null); // Reset for next swipe
};
```

### Issue: Animation stuttering

**Solution**: Use `useNativeDriver: true` and avoid layout changes during animation:

```tsx
// Good - transform animations
<Animated.View style={{ transform: [{ translateX }] }} />

// Bad - layout animations during swipe
<Animated.View style={{ marginLeft: translateX }} />
```

### Issue: Dots out of sync with articles

**Solution**: Ensure `currentIndex` updates before swipe completes:

```tsx
const handleSwipe = (direction: 'left' | 'right') => {
  // Update index first
  const newIndex = (currentIndex + 1) % articles.length;
  setCurrentIndex(newIndex);

  // Then trigger animation
  setSwipeDirection(direction);
};
```

---

## Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentIndex` | `number` | Yes | - | Current article index (0-based) |
| `totalArticles` | `number` | Yes | - | Total number of articles |
| `swipeDirection` | `'left' \| 'right' \| null` | No | `null` | Direction of swipe to animate |
| `onAnimationComplete` | `() => void` | No | - | Callback when animation finishes |
| `containerStyle` | `ViewStyle` | No | - | Custom container styling |
| `reducedMotion` | `boolean` | No | `false` | Force reduced motion mode |

---

## Best Practices

1. **Always reset `swipeDirection` to `null`** after animation completes
2. **Use `onAnimationComplete`** to chain actions or update state
3. **Handle edge cases** like rapid swipes with a queue system
4. **Respect accessibility** by checking reduced motion preferences
5. **Optimize re-renders** with memoization for large article lists
6. **Test on real devices** to ensure smooth 60fps animations
7. **Provide haptic feedback** on swipe for better UX
8. **Track analytics** to understand user engagement patterns

---

## File Locations

- Component: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RotatingDotIndicator.tsx`
- Design Spec: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/QUICK_READ_DOT_INDICATOR_DESIGN.md`
- Usage Guide: This file

---

**Last Updated**: 2025-10-25
**Version**: 1.0.0
