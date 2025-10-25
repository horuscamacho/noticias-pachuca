# Rotating Dot Indicator - Advanced Patterns & Edge Cases

## Advanced Interaction Patterns

### 1. Momentum-Based Rotation

Create a more natural feel with physics-based momentum:

```typescript
import { useSharedValue, withDecay } from 'react-native-reanimated';

function MomentumDotIndicator() {
  const velocity = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeEnd = (gestureVelocity: number) => {
    // Calculate number of articles to skip based on velocity
    const swipeForce = Math.abs(gestureVelocity);
    const articlesToSkip = Math.min(
      Math.floor(swipeForce / 1000), // 1000 = threshold
      3 // Max 3 articles at once
    );

    // Animate through multiple articles
    let skipped = 0;
    const interval = setInterval(() => {
      if (skipped < articlesToSkip) {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
        skipped++;
      } else {
        clearInterval(interval);
      }
    }, 200); // 200ms between each article
  };

  return (
    <GestureDetector
      gesture={panGesture.onEnd((e) => handleSwipeEnd(e.velocityX))}
    >
      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection="left"
      />
    </GestureDetector>
  );
}
```

**Visual Effect:**
```
User swipes with high velocity:

Article 5 → Dots rotate → [○ ○ ● ○ ○]  200ms
Article 6 → Dots rotate → [○ ○ ● ○ ○]  200ms
Article 7 → Dots rotate → [○ ○ ● ○ ○]  200ms
Final state              [○ ○ ● ○ ○]  Settled

Creates feeling of "flinging" through content
```

---

### 2. Haptic Feedback Integration

Enhance the tactile experience with progressive haptics:

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

function HapticDotIndicator() {
  const handleSwipeStart = () => {
    // Light tap when swipe begins
    ReactNativeHapticFeedback.trigger('impactLight', HAPTIC_OPTIONS);
  };

  const handleSwipeProgress = (progress: number) => {
    // Subtle tick when passing threshold
    if (progress > 0.5) {
      ReactNativeHapticFeedback.trigger('selection', HAPTIC_OPTIONS);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    // Medium impact when article changes
    ReactNativeHapticFeedback.trigger('impactMedium', HAPTIC_OPTIONS);
  };

  const handleDotAnimation = (dotPosition: number) => {
    // Soft tick as each dot slides into center
    if (dotPosition === 2) {
      // Center position
      ReactNativeHapticFeedback.trigger('soft', HAPTIC_OPTIONS);
    }
  };

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
      onAnimationComplete={handleSwipeComplete}
    />
  );
}
```

**Haptic Timeline:**
```
0ms: User touches screen
     └─ impactLight (gentle acknowledgment)

200ms: Swipe crosses threshold (>50px)
       └─ selection (subtle confirmation)

400ms: Article changes, dots start rotating
       └─ impactMedium (satisfying completion)

600ms: New dot reaches center position
       └─ soft (polish detail)
```

---

### 3. Predictive Pre-loading

Anticipate user behavior for smoother experience:

```typescript
function PredictiveDotIndicator() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preloadIndices, setPreloadIndices] = useState<number[]>([]);

  // Preload adjacent articles when dots appear
  useEffect(() => {
    const visible = getVisibleDotIndices(currentIndex);
    setPreloadIndices(visible);

    // Trigger preload
    visible.forEach((index) => {
      preloadArticle(articles[index]);
    });
  }, [currentIndex]);

  const getVisibleDotIndices = (center: number) => {
    return [
      (center - 2 + articles.length) % articles.length,
      (center - 1 + articles.length) % articles.length,
      center,
      (center + 1) % articles.length,
      (center + 2) % articles.length,
    ];
  };

  return (
    <>
      {/* Preload invisible articles */}
      {preloadIndices.map((index) => (
        <ArticlePreloader key={index} article={articles[index]} />
      ))}

      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection={swipeDirection}
      />
    </>
  );
}
```

**Preloading Strategy:**
```
Current article: 5

Visible dots represent articles:
[3, 4, 5, 6, 7]

Preload state:
✓ Article 3 (2 behind) - Loaded
✓ Article 4 (1 behind) - Loaded
● Article 5 (current)  - Active
✓ Article 6 (1 ahead)  - Loaded
✓ Article 7 (2 ahead)  - Loaded
○ Article 8 (3 ahead)  - Not loaded yet
○ Article 2 (3 behind) - Evicted from memory

When user swipes to article 6:
- Article 8 begins loading
- Article 3 is evicted
- Smooth transition guaranteed
```

---

### 4. Smart Auto-Advance

Auto-play with user engagement detection:

```typescript
function AutoAdvanceDotIndicator() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const autoPlayInterval = useRef<NodeJS.Timeout>();

  // Auto-advance every 5 seconds if no interaction
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayInterval.current = setInterval(() => {
        const timeSinceInteraction = Date.now() - lastInteraction;

        if (timeSinceInteraction > 3000) {
          // 3s idle
          setCurrentIndex((prev) => (prev + 1) % articles.length);
        }
      }, 5000);
    }

    return () => clearInterval(autoPlayInterval.current);
  }, [isAutoPlaying, lastInteraction]);

  const handleUserSwipe = (direction: 'left' | 'right') => {
    setLastInteraction(Date.now());
    setCurrentIndex((prev) => (prev + 1) % articles.length);
    // User took control, pause auto-play temporarily
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume after 10s
  };

  return (
    <View>
      <ArticleSwipeView onSwipe={handleUserSwipe} />

      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection="left" // Auto-advance always goes left
      />

      {/* Visual indicator of auto-play */}
      {isAutoPlaying && <AutoPlayProgressRing duration={5000} />}
    </View>
  );
}
```

**Auto-play Visual:**
```
┌─────────────────────────────┐
│                             │
│   Article 5                 │
│                             │
│   ┌───────────────┐         │
│   │ ⌛ Auto: 3s   │  ← Progress
│   └───────────────┘         │
│                             │
│     ○  ○  ●  ○  ○           │
│                             │
└─────────────────────────────┘

User swipes → Auto-play pauses 10s
```

---

### 5. Article Quality Indicators

Vary dot appearance based on article metadata:

```typescript
interface Article {
  id: string;
  title: string;
  popularity: number; // 0-100
  isBookmarked: boolean;
  isRead: boolean;
}

function QualityIndicatorDots() {
  const getDotColor = (article: Article, isActive: boolean) => {
    if (isActive) return '#854836'; // Brown

    if (article.isBookmarked) return '#3B82F6'; // Blue - bookmarked
    if (article.isRead) return '#9CA3AF'; // Dim gray - already read
    if (article.popularity > 80) return '#10B981'; // Green - popular

    return '#D1D5DB'; // Default gray
  };

  const getDotSize = (article: Article, baseSize: number) => {
    // Popular articles slightly larger
    const popularityBonus = article.popularity > 80 ? 1.1 : 1.0;
    return baseSize * popularityBonus;
  };

  return (
    <CustomRotatingDotIndicator
      currentIndex={currentIndex}
      articles={articles}
      dotStyler={(article, isActive, baseStyle) => ({
        ...baseStyle,
        backgroundColor: getDotColor(article, isActive),
        width: getDotSize(article, baseStyle.width),
        height: getDotSize(article, baseStyle.height),
      })}
    />
  );
}
```

**Visual Result:**
```
[○] [○] [●] [○] [○]
 ↑   ↑   ↑   ↑   ↑
 |   |   |   |   |
 |   |   |   |   Popular (green, slightly larger)
 |   |   |   Already read (dim gray)
 |   |   Active (brown)
 |   Bookmarked (blue)
 Default (gray)

Creates visual hierarchy and context
```

---

## Edge Case Handling

### Edge Case 1: Single Article

```typescript
function SingleArticleDots() {
  const totalArticles = 1;

  if (totalArticles === 1) {
    return (
      <View style={styles.container}>
        {/* Show only center dot, no rotation */}
        <View style={[styles.dot, styles.activeDot]} />
      </View>
    );
  }

  return <RotatingDotIndicator {...props} />;
}
```

**Visual:**
```
Only 1 article:
┌──────────────┐
│      ●       │  ← Single centered dot, no animation
└──────────────┘

Swipe does nothing (or shows "End of content" message)
```

---

### Edge Case 2: Two Articles

```typescript
function TwoArticleDots() {
  const totalArticles = 2;

  if (totalArticles === 2) {
    // Show 3 dots: prev (virtual), current, next
    return (
      <View style={styles.container}>
        <Dot opacity={0.6} size={8} /> {/* Virtual */}
        <Dot opacity={1.0} size={12} isActive /> {/* Current */}
        <Dot opacity={0.8} size={10} /> {/* Next */}
      </View>
    );
  }

  return <RotatingDotIndicator {...props} />;
}
```

**Visual:**
```
Articles: [A, B]

At article A:
┌──────────────────┐
│  ○    ●    ○     │
│ (virt) A    B    │
└──────────────────┘

Swipe left → Go to B:
┌──────────────────┐
│  ○    ●    ○     │
│   A    B  (virt) │
└──────────────────┘

Next swipe → Loop to A
```

---

### Edge Case 3: Network Error During Preload

```typescript
function RobustDotIndicator() {
  const [loadingStates, setLoadingStates] = useState<
    Record<number, 'loading' | 'loaded' | 'error'>
  >({});

  const handleSwipe = async (direction: 'left' | 'right') => {
    const nextIndex = (currentIndex + 1) % articles.length;
    const nextArticle = articles[nextIndex];

    // Check if next article is loaded
    if (loadingStates[nextIndex] === 'error') {
      // Show error state in dot
      showErrorDot(nextIndex);
      // Retry load
      await retryLoadArticle(nextIndex);
    }

    if (loadingStates[nextIndex] === 'loaded') {
      // Safe to advance
      setCurrentIndex(nextIndex);
    } else {
      // Still loading, show spinner
      showLoadingDot(nextIndex);
    }
  };

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
      dotOverlay={(index) => {
        if (loadingStates[index] === 'loading') {
          return <Spinner size="small" />;
        }
        if (loadingStates[index] === 'error') {
          return <ErrorIcon size={8} />;
        }
        return null;
      }}
    />
  );
}
```

**Visual States:**
```
Normal:     [○ ○ ● ○ ○]

Loading:    [○ ○ ● ⌛ ○]
                     ↑ Spinner overlay

Error:      [○ ○ ● ⚠ ○]
                     ↑ Error icon
                       User can retry swipe
```

---

### Edge Case 4: Rapid Swipe Interruption

```typescript
function QueuedDotIndicator() {
  const [animationQueue, setAnimationQueue] = useState<
    Array<'left' | 'right'>
  >([]);
  const isAnimating = useRef(false);

  const processQueue = useCallback(() => {
    if (animationQueue.length === 0 || isAnimating.current) return;

    const nextDirection = animationQueue[0];
    isAnimating.current = true;

    // Start animation
    setSwipeDirection(nextDirection);
    setCurrentIndex((prev) => (prev + 1) % articles.length);

    // Remove from queue after animation completes
    setTimeout(() => {
      setAnimationQueue((queue) => queue.slice(1));
      isAnimating.current = false;
      processQueue(); // Process next in queue
    }, 400);
  }, [animationQueue]);

  const handleSwipe = (direction: 'left' | 'right') => {
    setAnimationQueue((queue) => [...queue, direction]);
    processQueue();
  };

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
    />
  );
}
```

**Queue Behavior:**
```
t=0ms:   User swipes LEFT
         Queue: [LEFT]
         Animation starts

t=100ms: User swipes RIGHT (during animation)
         Queue: [LEFT, RIGHT]
         Wait for LEFT to complete

t=400ms: LEFT animation completes
         Queue: [RIGHT]
         Start RIGHT animation

t=800ms: RIGHT animation completes
         Queue: []
         Ready for next swipe

Prevents janky interruptions
```

---

### Edge Case 5: Memory Management (Large Article Lists)

```typescript
function VirtualizedDotIndicator() {
  const totalArticles = 1000; // Large list
  const [virtualWindow, setVirtualWindow] = useState({
    start: 0,
    end: 10,
  });

  useEffect(() => {
    // Adjust virtual window as user progresses
    if (currentIndex > virtualWindow.end - 5) {
      setVirtualWindow({
        start: currentIndex - 5,
        end: currentIndex + 10,
      });
    }
  }, [currentIndex]);

  // Only keep 15 articles in memory
  const visibleArticles = articles.slice(
    virtualWindow.start,
    virtualWindow.end
  );

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={totalArticles} // Shows total count
      swipeDirection={swipeDirection}
    />
  );
}
```

**Memory Strategy:**
```
Total: 1000 articles
Memory: 15 articles at a time

Current article: 500

In memory:
├─ Articles 495-509 (15 total)
├─ Visible dots: [498, 499, 500, 501, 502]
└─ Preloaded: 495-509

User swipes to 501:
├─ Evict articles 495-496
├─ Load articles 510-511
└─ New window: 497-511

Smooth experience with constant memory usage
```

---

### Edge Case 6: Orientation Change

```typescript
import { useOrientation } from '@/hooks/useOrientation';

function ResponsiveDotIndicator() {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const containerStyle = isLandscape
    ? {
        // Right side, vertical
        flexDirection: 'column' as const,
        width: 40,
        height: 120,
        right: 20,
        top: '50%',
        transform: [{ translateY: -60 }],
        left: undefined,
      }
    : {
        // Bottom center, horizontal
        flexDirection: 'row' as const,
        width: 120,
        height: 40,
        bottom: 40,
        left: '50%',
        transform: [{ translateX: -60 }],
        top: undefined,
      };

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
      containerStyle={containerStyle}
    />
  );
}
```

**Visual Transformation:**
```
PORTRAIT:
┌──────────┐
│          │
│ Article  │
│          │
│  ○○●○○   │ ← Horizontal dots at bottom
└──────────┘

        ↓ Rotate device ↓

LANDSCAPE:
┌─────────────────────┐
│                 ○   │
│                 ○   │
│    Article      ●   │ ← Vertical dots on right
│                 ○   │
│                 ○   │
└─────────────────────┘

Animated transition between layouts
```

---

### Edge Case 7: Low-End Device Performance

```typescript
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

function PerformantDotIndicator() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const checkDevice = async () => {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const isOldOS =
        Platform.OS === 'android' && Platform.Version < 28;

      // Low-end if < 2GB RAM or old Android
      setIsLowEnd(totalMemory < 2 * 1024 * 1024 * 1024 || isOldOS);
    };

    checkDevice();
  }, []);

  if (isLowEnd) {
    return (
      <RotatingDotIndicator
        currentIndex={currentIndex}
        totalArticles={articles.length}
        swipeDirection={swipeDirection}
        reducedMotion={true} // Force simple animations
        containerStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)', // No blur
        }}
      />
    );
  }

  return <RotatingDotIndicator {...props} />;
}
```

**Performance Tiers:**
```
HIGH-END DEVICE:
✓ 400ms smooth animations
✓ Backdrop blur effect
✓ Shadow on active dot
✓ Scale with bounce easing
✓ Parallel animations

LOW-END DEVICE:
✓ 300ms simple animations
✗ No backdrop blur (solid background)
✗ No shadow effects
✓ Linear easing only
✓ Sequential animations

Maintains functionality, adjusts fidelity
```

---

### Edge Case 8: Accessibility - Voice Control

```typescript
import { AccessibilityInfo } from 'react-native';

function VoiceControlDots() {
  useEffect(() => {
    // Handle voice commands
    const handleAccessibilityAction = (event: any) => {
      switch (event.nativeEvent.actionName) {
        case 'increment':
          // "Next article"
          handleSwipe('left');
          AccessibilityInfo.announceForAccessibility(
            `Advanced to article ${currentIndex + 2} of ${articles.length}`
          );
          break;

        case 'decrement':
          // "Previous article" - still goes forward in our model
          handleSwipe('right');
          AccessibilityInfo.announceForAccessibility(
            `Advanced to article ${currentIndex + 2} of ${articles.length}`
          );
          break;

        case 'activate':
          // "Open article"
          openArticleDetail(articles[currentIndex]);
          break;
      }
    };

    // Register custom actions
    return AccessibilityInfo.addEventListener(
      'accessibilityActionPerformed',
      handleAccessibilityAction
    );
  }, [currentIndex]);

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
      accessibilityActions={[
        { name: 'increment', label: 'Next article' },
        { name: 'decrement', label: 'Previous article' },
        { name: 'activate', label: 'Open full article' },
      ]}
    />
  );
}
```

---

## Performance Optimization Techniques

### 1. Debounced Swipe Detection

```typescript
import { useDebouncedCallback } from 'use-debounce';

function DebouncedDots() {
  const debouncedSwipe = useDebouncedCallback(
    (direction: 'left' | 'right') => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
      setSwipeDirection(direction);
    },
    50, // 50ms debounce
    { leading: true, trailing: false }
  );

  return (
    <GestureDetector
      gesture={panGesture.onEnd((e) => {
        if (Math.abs(e.translationX) > 50) {
          debouncedSwipe(e.translationX < 0 ? 'left' : 'right');
        }
      })}
    >
      <RotatingDotIndicator {...props} />
    </GestureDetector>
  );
}
```

---

### 2. Memoized Dot Calculations

```typescript
import { useMemo } from 'react';

function OptimizedDots() {
  const visibleDotIndices = useMemo(() => {
    return [
      (currentIndex - 2 + totalArticles) % totalArticles,
      (currentIndex - 1 + totalArticles) % totalArticles,
      currentIndex,
      (currentIndex + 1) % totalArticles,
      (currentIndex + 2) % totalArticles,
    ];
  }, [currentIndex, totalArticles]);

  const dotStyles = useMemo(() => {
    return visibleDotIndices.map((index, position) => ({
      size: getDotSize(position),
      color: getDotColor(position),
      opacity: getDotOpacity(position),
    }));
  }, [visibleDotIndices]);

  // Render with pre-calculated styles
  return <RotatingDotIndicator {...props} />;
}
```

---

### 3. Native Driver Optimization

```typescript
function NativeAnimatedDots() {
  const animations = {
    // ✓ Supported by native driver
    transform: [{ translateX }, { scale }],
    opacity,

    // ✗ NOT supported by native driver
    // width, height, backgroundColor

    // Solution: Use transform: scale instead of width/height
    // Use overlays for color changes
  };

  return (
    <Animated.View
      style={{
        transform: [
          { translateX: slideAnim },
          { scale: scaleAnim }, // Instead of width/height
        ],
        opacity: opacityAnim,
      }}
    />
  );
}
```

---

## Analytics & Metrics

### Track User Engagement

```typescript
import analytics from '@react-native-firebase/analytics';

function AnalyticsDots() {
  const trackSwipeMetrics = useCallback(
    (direction: 'left' | 'right') => {
      analytics().logEvent('quick_read_swipe', {
        direction,
        article_index: currentIndex,
        article_id: articles[currentIndex].id,
        swipe_count: swipeCount,
        session_duration: Date.now() - sessionStart,
      });
    },
    [currentIndex, swipeCount, sessionStart]
  );

  const trackDotInteraction = useCallback(() => {
    analytics().logEvent('dot_indicator_viewed', {
      total_articles: articles.length,
      current_position: currentIndex,
      completion_percentage: (currentIndex / articles.length) * 100,
    });
  }, [currentIndex, articles.length]);

  return (
    <RotatingDotIndicator
      currentIndex={currentIndex}
      totalArticles={articles.length}
      swipeDirection={swipeDirection}
      onAnimationComplete={trackDotInteraction}
    />
  );
}
```

**Metrics to Track:**
- Swipe direction preference
- Average time per article
- Drop-off points (which article index)
- Completion rate (% who reach end)
- Swipe velocity (fast vs slow swipers)
- Rapid swipe frequency (power users)

---

## Testing Strategy

### Unit Tests

```typescript
describe('RotatingDotIndicator - Edge Cases', () => {
  it('handles single article gracefully', () => {
    const { queryAllByTestId } = render(
      <RotatingDotIndicator
        currentIndex={0}
        totalArticles={1}
        swipeDirection={null}
      />
    );

    const dots = queryAllByTestId('dot');
    expect(dots.length).toBe(1);
  });

  it('queues rapid swipes', async () => {
    const { rerender } = render(
      <RotatingDotIndicator
        currentIndex={0}
        totalArticles={10}
        swipeDirection={null}
      />
    );

    // Rapid swipes
    rerender(
      <RotatingDotIndicator
        currentIndex={1}
        totalArticles={10}
        swipeDirection="left"
      />
    );

    rerender(
      <RotatingDotIndicator
        currentIndex={2}
        totalArticles={10}
        swipeDirection="left"
      />
    );

    await waitFor(() => {
      // Should complete both animations
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  it('handles memory cleanup on unmount', () => {
    const { unmount } = render(
      <RotatingDotIndicator {...props} />
    );

    unmount();

    // Check for memory leaks
    expect(animationTimers).toEqual([]);
  });
});
```

---

## Implementation Checklist

### Advanced Features

- [ ] Momentum-based multi-article skip
- [ ] Haptic feedback on swipe events
- [ ] Predictive article preloading
- [ ] Auto-advance with idle detection
- [ ] Article quality visual indicators
- [ ] Single article edge case handled
- [ ] Two article edge case handled
- [ ] Network error retry mechanism
- [ ] Rapid swipe queue system
- [ ] Memory-efficient virtualization
- [ ] Orientation change transitions
- [ ] Low-end device optimizations
- [ ] Voice control accessibility
- [ ] Analytics event tracking
- [ ] Performance monitoring
- [ ] Edge case unit tests

---

## File Reference

**Related Documentation:**
- Main Design: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/QUICK_READ_DOT_INDICATOR_DESIGN.md`
- Visual Specs: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/ROTATING_DOTS_VISUAL_SPEC.md`
- Usage Guide: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/ROTATING_DOTS_USAGE.md`
- Component: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RotatingDotIndicator.tsx`

**Version:** 1.0.0
**Last Updated:** 2025-10-25
