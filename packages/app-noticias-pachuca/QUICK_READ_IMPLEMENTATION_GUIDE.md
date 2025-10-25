# Quick Read Implementation Guide

**For Developers**
**Version:** 1.0.0
**Estimated Time:** 6-7 days

---

## OVERVIEW

This guide provides step-by-step instructions for implementing the Quick Read swipeable article cards feature. Follow the phases in order for best results.

**Architecture:**
- Cross-fade swipe animation using Reanimated v4
- Absolute positioned card stack with zIndex layering
- Pan gesture detection with velocity/distance thresholds
- Optimized image loading (preload adjacent cards)

**Prerequisites:**
- React Native with Expo
- react-native-reanimated v4.1.1 (installed)
- react-native-gesture-handler v2.28.0 (installed)
- expo-image v3.0.10 (installed)
- expo-haptics v15.0.7 (installed)

---

## PHASE 1: STATIC LAYOUT (Days 1-2)

### Step 1.1: Create QuickReadCard Component

**File:** `/components/quick/QuickReadCard.tsx`

```typescript
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { PaginationDots } from '@/components/PaginationDots';
import { QuickReadCardProps } from '@/types/quickRead.types';
import {
  QUICK_READ_COLORS,
  QUICK_READ_DIMENSIONS,
} from './QuickRead.tokens';

export const QuickReadCard: React.FC<QuickReadCardProps> = ({
  article,
  index,
  total,
  isActive,
  opacity,
  zIndex,
  onImagePress,
  onTitlePress,
}) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity, // Will be Reanimated SharedValue
          zIndex,
        },
      ]}
    >
      {/* Hero Image */}
      <Pressable
        onPress={onImagePress}
        style={({ pressed }) => [
          styles.heroContainer,
          pressed && styles.heroPressed,
        ]}
      >
        <Image
          source={{ uri: article.heroImage.url }}
          style={styles.heroImage}
          contentFit="cover"
          placeholder={article.heroImage.blurhash}
          transition={200}
        />

        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: article.category.color },
          ]}
        >
          <ThemedText variant="breakingNewsBadge">
            {article.category.label}
          </ThemedText>
        </View>
      </Pressable>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Pressable
          onPress={onTitlePress}
          style={({ pressed }) => [
            styles.titleContainer,
            pressed && styles.titlePressed,
          ]}
        >
          <ThemedText
            variant="h3"
            numberOfLines={3}
            style={styles.title}
          >
            {article.title}
          </ThemedText>
        </Pressable>

        {/* Author */}
        <ThemedText variant="caption" style={styles.author}>
          POR {article.author.name.toUpperCase()}
        </ThemedText>

        {/* Summary */}
        <ThemedText
          variant="body"
          numberOfLines={5}
          style={styles.summary}
        >
          {article.summary}
        </ThemedText>

        {/* Pagination Dots */}
        <View style={styles.indicatorsContainer}>
          <PaginationDots total={total} activeIndex={index} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },

  // Hero Image
  heroContainer: {
    height: QUICK_READ_DIMENSIONS.heroHeight,
    borderBottomWidth: QUICK_READ_DIMENSIONS.borderWidth,
    borderBottomColor: QUICK_READ_COLORS.borderColor,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
  heroPressed: {
    opacity: 0.8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Category Badge
  categoryBadge: {
    position: 'absolute',
    bottom: QUICK_READ_DIMENSIONS.badgeBottom,
    left: QUICK_READ_DIMENSIONS.badgeLeft,
    paddingVertical: QUICK_READ_DIMENSIONS.badgePadding,
    paddingHorizontal: QUICK_READ_DIMENSIONS.badgePaddingHorizontal,
    borderWidth: QUICK_READ_DIMENSIONS.badgeBorderWidth,
    borderColor: QUICK_READ_COLORS.borderColor,
  },

  // Content Container
  contentContainer: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.cardBackground,
    borderLeftWidth: QUICK_READ_DIMENSIONS.borderWidth,
    borderRightWidth: QUICK_READ_DIMENSIONS.borderWidth,
    borderBottomWidth: QUICK_READ_DIMENSIONS.borderWidth,
    borderColor: QUICK_READ_COLORS.borderColor,
    paddingHorizontal: QUICK_READ_DIMENSIONS.contentPadding,
    paddingTop: QUICK_READ_DIMENSIONS.contentPaddingTop,
    paddingBottom: QUICK_READ_DIMENSIONS.contentPaddingBottom,
  },

  // Title
  titleContainer: {
    marginBottom: QUICK_READ_DIMENSIONS.titleToAuthor,
  },
  titlePressed: {
    backgroundColor: QUICK_READ_COLORS.titlePressBackground,
  },
  title: {
    // ThemedText h3 handles styling
  },

  // Author
  author: {
    marginBottom: QUICK_READ_DIMENSIONS.authorToSummary,
  },

  // Summary
  summary: {
    height: QUICK_READ_DIMENSIONS.summaryFixedHeight,
    overflow: 'hidden',
  },

  // Indicators
  indicatorsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
```

**Testing:**
```bash
# In your simulator/device
# Navigate to Quick tab - you should see static card
```

---

### Step 1.2: Create Quick Screen with Single Card

**File:** `/app/(invited)/quick/index.tsx`

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { QuickReadCard } from '@/components/quick/QuickReadCard';
import { QuickReadArticle } from '@/types/quickRead.types';
import { QUICK_READ_COLORS } from '@/components/quick/QuickRead.tokens';

// Mock data (temporary)
const MOCK_ARTICLES: QuickReadArticle[] = [
  {
    id: '1',
    slug: 'gobernador-plan-economico',
    heroImage: {
      url: 'https://picsum.photos/800/600?random=1',
      alt: 'Gobernador en conferencia',
      width: 800,
      height: 600,
    },
    category: {
      id: 'politica',
      label: 'POLÍTICA',
      color: '#FFB22C',
    },
    title: 'GOBERNADOR PRESENTA NUEVO PLAN ECONÓMICO',
    author: {
      name: 'María González',
      id: 'maria-gonzalez',
    },
    summary: 'El gobernador de Pachuca presentó hoy un nuevo plan económico que busca impulsar el desarrollo de la región. El plan incluye inversiones en infraestructura, educación y apoyo a pequeñas empresas.',
    publishedAt: '2025-10-25T10:30:00Z',
  },
  // Add 4 more articles...
];

export default function QuickReadScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleImagePress = () => {
    const article = MOCK_ARTICLES[currentIndex];
    router.push(`/article/${article.slug}`);
  };

  const handleTitlePress = () => {
    const article = MOCK_ARTICLES[currentIndex];
    router.push(`/article/${article.slug}`);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: top,
          paddingBottom: bottom,
        },
      ]}
    >
      <QuickReadCard
        article={MOCK_ARTICLES[0]}
        index={0}
        total={MOCK_ARTICLES.length}
        isActive={true}
        opacity={1} // Static for now
        zIndex={100}
        onImagePress={handleImagePress}
        onTitlePress={handleTitlePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
});
```

**Testing Checklist (Static Card):**
- [ ] Card renders with hero image
- [ ] Category badge appears overlaid on image (bottom-left)
- [ ] Title shows max 3 lines with ellipsis
- [ ] Author shows with "POR" prefix
- [ ] Summary shows max 5 lines
- [ ] Pagination dots show (first dot active)
- [ ] All borders are 4px black
- [ ] Tapping image/title logs action (for now)

---

## PHASE 2: SWIPE GESTURE (Days 3-4)

### Step 2.1: Add Gesture Handler Hook

**File:** `/hooks/useQuickReadGesture.ts`

```typescript
import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  QUICK_READ_ANIMATION,
  QUICK_READ_ZINDEX,
} from '@/components/quick/QuickRead.tokens';

interface UseQuickReadGestureProps {
  currentIndex: number;
  totalArticles: number;
  onIndexChange: (newIndex: number) => void;
}

export const useQuickReadGesture = ({
  currentIndex,
  totalArticles,
  onIndexChange,
}: UseQuickReadGestureProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const translationX = useSharedValue(0);

  // Calculate thresholds
  const distanceThreshold = screenWidth * QUICK_READ_ANIMATION.thresholds.distance;
  const velocityThreshold = QUICK_READ_ANIMATION.thresholds.velocity;

  // Haptic feedback wrapper
  const triggerHaptic = useCallback(() => {
    if (QUICK_READ_ANIMATION.haptics.enabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      // Prevent overscroll at edges
      const isFirstCard = currentIndex === 0;
      const isLastCard = currentIndex === totalArticles - 1;

      if (isFirstCard && event.translationX > 0) {
        // Elastic resistance when trying to swipe right on first card
        translationX.value = event.translationX * 0.2;
      } else if (isLastCard && event.translationX < 0) {
        // Elastic resistance when trying to swipe left on last card
        translationX.value = event.translationX * 0.2;
      } else {
        translationX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const isSwipeLeft = event.translationX < -distanceThreshold ||
                          event.velocityX < -velocityThreshold;
      const isSwipeRight = event.translationX > distanceThreshold ||
                           event.velocityX > velocityThreshold;

      const isFirstCard = currentIndex === 0;
      const isLastCard = currentIndex === totalArticles - 1;

      if (isSwipeLeft && !isLastCard) {
        // Swipe left → Next card
        runOnJS(triggerHaptic)();
        runOnJS(onIndexChange)(currentIndex + 1);
      } else if (isSwipeRight && !isFirstCard) {
        // Swipe right → Previous card
        runOnJS(triggerHaptic)();
        runOnJS(onIndexChange)(currentIndex - 1);
      }

      // Reset translation
      translationX.value = withTiming(0, {
        duration: QUICK_READ_ANIMATION.swipe.duration,
      });
    });

  // Animated style for current card (fading out)
  const currentCardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translationX.value,
      [-screenWidth, 0, screenWidth],
      [0, 1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  // Animated style for next card (fading in when swiping left)
  const nextCardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translationX.value,
      [-screenWidth, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  // Animated style for previous card (fading in when swiping right)
  const previousCardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translationX.value,
      [0, screenWidth],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  return {
    panGesture,
    currentCardStyle,
    nextCardStyle,
    previousCardStyle,
    zIndex: {
      current: QUICK_READ_ZINDEX.currentCard,
      adjacent: QUICK_READ_ZINDEX.adjacentCard,
      inactive: QUICK_READ_ZINDEX.inactiveCard,
    },
  };
};
```

---

### Step 2.2: Update Quick Screen with Gesture

**File:** `/app/(invited)/quick/index.tsx` (Updated)

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { QuickReadCard } from '@/components/quick/QuickReadCard';
import { QuickReadArticle } from '@/types/quickRead.types';
import { QUICK_READ_COLORS } from '@/components/quick/QuickRead.tokens';
import { useQuickReadGesture } from '@/hooks/useQuickReadGesture';

// Import your mock data

export default function QuickReadScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    panGesture,
    currentCardStyle,
    nextCardStyle,
    previousCardStyle,
    zIndex,
  } = useQuickReadGesture({
    currentIndex,
    totalArticles: MOCK_ARTICLES.length,
    onIndexChange: setCurrentIndex,
  });

  const handleArticlePress = (index: number) => {
    const article = MOCK_ARTICLES[index];
    router.push(`/article/${article.slug}`);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          {
            paddingTop: top,
            paddingBottom: bottom,
          },
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.cardStack}>
            {/* Previous Card (if exists) */}
            {currentIndex > 0 && (
              <QuickReadCard
                article={MOCK_ARTICLES[currentIndex - 1]}
                index={currentIndex - 1}
                total={MOCK_ARTICLES.length}
                isActive={false}
                opacity={previousCardStyle}
                zIndex={zIndex.adjacent}
                onImagePress={() => handleArticlePress(currentIndex - 1)}
                onTitlePress={() => handleArticlePress(currentIndex - 1)}
              />
            )}

            {/* Current Card */}
            <QuickReadCard
              article={MOCK_ARTICLES[currentIndex]}
              index={currentIndex}
              total={MOCK_ARTICLES.length}
              isActive={true}
              opacity={currentCardStyle}
              zIndex={zIndex.current}
              onImagePress={() => handleArticlePress(currentIndex)}
              onTitlePress={() => handleArticlePress(currentIndex)}
            />

            {/* Next Card (if exists) */}
            {currentIndex < MOCK_ARTICLES.length - 1 && (
              <QuickReadCard
                article={MOCK_ARTICLES[currentIndex + 1]}
                index={currentIndex + 1}
                total={MOCK_ARTICLES.length}
                isActive={false}
                opacity={nextCardStyle}
                zIndex={zIndex.adjacent}
                onImagePress={() => handleArticlePress(currentIndex + 1)}
                onTitlePress={() => handleArticlePress(currentIndex + 1)}
              />
            )}
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
  cardStack: {
    flex: 1,
    position: 'relative',
  },
});
```

**Testing Checklist (Swipe):**
- [ ] Swipe left shows next article (cross-fade)
- [ ] Swipe right shows previous article (cross-fade)
- [ ] Can't swipe right on first article (elastic bounce)
- [ ] Can't swipe left on last article (elastic bounce)
- [ ] Haptic feedback fires on swipe completion
- [ ] Pagination dots update correctly
- [ ] Animation is smooth (60fps)

---

## PHASE 3: IMAGE OPTIMIZATION (Day 5)

### Step 3.1: Add Image Preloading

**File:** `/hooks/useImagePreloading.ts`

```typescript
import { useEffect } from 'react';
import { Image } from 'expo-image';
import { QuickReadArticle } from '@/types/quickRead.types';

export const useImagePreloading = (
  articles: QuickReadArticle[],
  currentIndex: number
) => {
  useEffect(() => {
    // Preload images for current + adjacent cards
    const indicesToPreload = [
      currentIndex - 1,
      currentIndex,
      currentIndex + 1,
    ].filter((i) => i >= 0 && i < articles.length);

    indicesToPreload.forEach((index) => {
      const imageUrl = articles[index].heroImage.url;
      Image.prefetch(imageUrl);
    });

    // Optionally: clear cache for distant images
    const indicesToUnload = articles
      .map((_, i) => i)
      .filter((i) => Math.abs(i - currentIndex) > 2);

    indicesToUnload.forEach((index) => {
      const imageUrl = articles[index].heroImage.url;
      Image.clearDiskCache();
    });
  }, [currentIndex, articles]);
};
```

**Usage in QuickReadScreen:**
```typescript
// Add to QuickReadScreen
useImagePreloading(MOCK_ARTICLES, currentIndex);
```

---

## PHASE 4: ACCESSIBILITY (Day 6)

### Step 4.1: Add Accessibility Props to QuickReadCard

**Update:** `/components/quick/QuickReadCard.tsx`

```typescript
// Add to hero image Pressable
<Pressable
  onPress={onImagePress}
  accessible={true}
  accessibilityRole="imagebutton"
  accessibilityLabel={`Ver artículo completo: ${article.title}`}
  accessibilityHint="Toca para abrir artículo"
  // ... rest of props
>

// Add to title Pressable
<Pressable
  onPress={onTitlePress}
  accessible={true}
  accessibilityRole="header"
  accessibilityLabel={`Leer artículo: ${article.title}`}
  accessibilityHint="Toca para abrir artículo"
  // ... rest of props
>

// Add to main container
<Animated.View
  style={[...]}
  accessible={true}
  accessibilityRole="article"
  accessibilityLabel={`Artículo ${index + 1} de ${total}`}
  accessibilityHint="Desliza izquierda para siguiente, derecha para anterior"
>
```

**Testing Checklist (Accessibility):**
- [ ] VoiceOver announces article info correctly
- [ ] Image button is focusable
- [ ] Title button is focusable
- [ ] Swipe gestures work with VoiceOver
- [ ] Pagination dots read position

---

## PHASE 5: POLISH & TESTING (Day 7)

### Step 5.1: Add Error States

**Create:** `/components/quick/QuickReadErrorState.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { BrutalistButton } from '@/components/BrutalistButton';

interface Props {
  message: string;
  onRetry: () => void;
}

export const QuickReadErrorState: React.FC<Props> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <ThemedText variant="h3" style={styles.title}>
        ERROR
      </ThemedText>
      <ThemedText variant="body" style={styles.message}>
        {message}
      </ThemedText>
      <BrutalistButton
        variant="primary"
        onPress={onRetry}
      >
        Reintentar
      </BrutalistButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
  },
});
```

---

### Step 5.2: Add Loading State

**Create:** `/components/quick/QuickReadLoadingState.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { QUICK_READ_COLORS } from './QuickRead.tokens';

export const QuickReadLoadingState: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={QUICK_READ_COLORS.borderColor} />
      <ThemedText variant="body" style={styles.text}>
        Cargando artículos...
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
  text: {
    marginTop: 16,
  },
});
```

---

### Step 5.3: Performance Testing

**Add Profiling:**
```typescript
// In QuickReadScreen
import { useEffect } from 'react';

useEffect(() => {
  const start = performance.now();
  // Render logic
  const end = performance.now();
  console.log(`QuickRead render time: ${end - start}ms`);
}, [currentIndex]);
```

**FPS Monitoring:**
```bash
# React DevTools Profiler
# Record interaction → Analyze flame graph
# Look for >16ms render times (below 60fps)
```

---

## TESTING MATRIX

### Device Testing:
- [ ] iPhone SE (small screen, 375x667)
- [ ] iPhone 14 Pro (notch, 393x852)
- [ ] iPhone 14 Pro Max (large, 430x932)
- [ ] iPad (tablet layout, 768x1024)
- [ ] Android (Pixel 7, various DPI)

### Scenario Testing:
- [ ] Swipe through all 5 articles
- [ ] Tap image on each article → navigates
- [ ] Tap title on each article → navigates
- [ ] Try to swipe past edges (elastic bounce)
- [ ] Kill app and reopen (state persistence)
- [ ] Airplane mode (cached images work)
- [ ] Low memory (no crashes)

### Performance Testing:
- [ ] 60fps during swipe animation
- [ ] No memory leaks after 50+ swipes
- [ ] Images load within 500ms
- [ ] App doesn't freeze on slow network

### Accessibility Testing:
- [ ] VoiceOver navigation (iOS)
- [ ] TalkBack navigation (Android)
- [ ] Large text mode (3x scaling)
- [ ] Reduced motion (disable animations)
- [ ] High contrast mode

---

## COMMON ISSUES & SOLUTIONS

### Issue 1: Choppy Animation
**Solution:**
- Ensure `useNativeDriver: true` for opacity
- Check for console warnings about layout
- Use `shouldRasterizeIOS` on card container

### Issue 2: Images Not Loading
**Solution:**
- Check network requests in debugger
- Verify image URLs are HTTPS
- Add fallback placeholder

### Issue 3: Swipe Not Detected
**Solution:**
- Verify `GestureHandlerRootView` wraps screen
- Check `activeOffsetX` isn't too strict
- Test on device (not just simulator)

### Issue 4: Wrong Card Shows
**Solution:**
- Check zIndex values in render
- Verify currentIndex state updates
- Console log index changes

---

## DEPLOYMENT CHECKLIST

### Pre-Deploy:
- [ ] Remove console.log statements
- [ ] Remove debug flags from tokens
- [ ] Test on production API (not mock data)
- [ ] Verify analytics tracking works
- [ ] Check error reporting (Sentry/Crashlytics)

### Post-Deploy:
- [ ] Monitor crash reports
- [ ] Check analytics for completion rate
- [ ] Gather user feedback
- [ ] Plan iteration based on data

---

## ANALYTICS TRACKING

### Events to Track:
```typescript
// Article Viewed
analytics.track('quick_read_article_viewed', {
  articleId: article.id,
  index: currentIndex,
  category: article.category.id,
  timestamp: Date.now(),
});

// Article Swiped
analytics.track('quick_read_article_swiped', {
  articleId: article.id,
  direction: 'left' | 'right',
  velocity: event.velocityX,
  timestamp: Date.now(),
});

// Article Opened
analytics.track('quick_read_article_opened', {
  articleId: article.id,
  index: currentIndex,
  source: 'image' | 'title',
  timestamp: Date.now(),
});
```

---

## NEXT STEPS (Post-MVP)

1. **Infinite Scroll:**
   - Load more articles when reaching end
   - Use pagination API

2. **Share Button:**
   - Add floating share icon
   - Generate article preview

3. **Bookmarks:**
   - Heart icon to save article
   - Sync to user account

4. **Video Support:**
   - Replace hero image with video player
   - Auto-play on focus

5. **Personalization:**
   - ML-based article recommendations
   - "Not interested" swipe down

---

## RESOURCES

### Documentation:
- [Reanimated v4 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler v2 Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Expo Image Docs](https://docs.expo.dev/versions/latest/sdk/image/)

### Design Files:
- `QUICK_READ_DESIGN_SPEC.md` - Full specifications
- `QUICK_READ_WIREFRAMES.md` - Visual wireframes
- `QuickRead.tokens.ts` - Design tokens
- `quickRead.types.ts` - TypeScript types

### Example Apps:
- Instagram Stories (swipe interaction)
- Tinder (card stack)
- Apple News (article cards)

---

## CONCLUSION

Follow this guide phase by phase. Don't skip ahead - each phase builds on the previous one. Test thoroughly at each step before moving forward.

The Quick Read feature will be a standout component of your app - make it polished, performant, and delightful!

Good luck, coyotito! 🚀
