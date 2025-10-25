/**
 * SwipeableCard Component
 * Wrapper that adds swipe functionality to QuickReadCard
 *
 * Features:
 * - Pan gesture detection with Gesture Handler v2
 * - Cross-fade animations with Reanimated v4
 * - Absolute positioning with zIndex layering
 * - UNIDIRECTIONAL: Both swipe directions advance to next article
 * - Only renders current + next card (max 2 in DOM)
 * - Infinite loop via circular queue in parent
 * - 60fps animations on UI thread
 *
 * Architecture:
 * - Separates gesture logic (useSwipeGesture) from animation (useSwipeFadeAnimation)
 * - Uses GestureDetector for modern gesture handling
 * - Animated.View for each card layer with proper zIndex
 * - Callbacks for index changes and article navigation
 *
 * Technical Details:
 * - Current card: zIndex 2, fades out on swipe
 * - Next card: zIndex 1, fades in on swipe
 * - Absolute positioning for card stacking
 * - Memory efficient: only 2 cards in DOM
 *
 * @module components/quick/SwipeableCard
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { QuickReadCard, QuickReadArticleData } from './QuickReadCard';
import { useSwipeGesture, SwipeDirection } from '@/hooks/useSwipeGesture';
import { useSwipeFadeAnimation } from '@/hooks/useSwipeFadeAnimation';

/**
 * Props for SwipeableCard component
 */
export interface SwipeableCardProps {
  /**
   * Array of articles to swipe through
   */
  articles: QuickReadArticleData[];

  /**
   * Current article index
   */
  currentIndex: number;

  /**
   * Callback when swipe completes (always advances to next)
   * Direction parameter indicates swipe direction for dot indicator animation
   */
  onSwipeComplete: (direction: SwipeDirection) => void;

  /**
   * Callback when article is pressed (image or title)
   */
  onArticlePress: (slug: string) => void;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * SwipeableCard - Swipeable card stack with cross-fade animations
 *
 * Wraps QuickReadCard with gesture detection and animations. Manages
 * a stack of 2 cards (current, next) with proper zIndex layering and
 * cross-fade effects.
 *
 * Gesture Behavior:
 * - UNIDIRECTIONAL: Swipe left OR right → ALWAYS advances to next article
 * - Direction passed to callback for dot indicator animation
 * - Threshold: 40% screen width OR 800px/s velocity
 * - Cancel: Spring back if threshold not met
 * - No bounds checking: parent handles circular queue
 *
 * Animation:
 * - Current card fades out (1 → 0) with parallax
 * - Next card fades in (0 → 1)
 * - Duration: 300ms with cubic easing
 * - All on UI thread for 60fps performance
 *
 * Memory Optimization:
 * - Only renders 2 cards maximum (current + next)
 * - Parent component handles circular queue for infinite loop
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SwipeableCard
 *   articles={articles}
 *   currentIndex={0}
 *   onSwipeComplete={(direction) => {
 *     advanceToNext();
 *     animateDots(direction);
 *   }}
 *   onArticlePress={(slug) => router.push(`/news/${slug}`)}
 * />
 *
 * // With test ID
 * <SwipeableCard
 *   articles={articles}
 *   currentIndex={currentIndex}
 *   onSwipeComplete={handleSwipeComplete}
 *   onArticlePress={handlePress}
 *   testID="quick-read-swipeable"
 * />
 * ```
 */
export const SwipeableCard = React.memo<SwipeableCardProps>(
  ({
    articles,
    currentIndex,
    onSwipeComplete,
    onArticlePress,
    testID = 'swipeable-card',
  }) => {
    // Get screen width for gesture calculations
    const { width } = useWindowDimensions();

    // Local index state for immediate UI updates
    // (synced with prop via callbacks)
    const [localIndex, setLocalIndex] = useState(currentIndex);

    // Keep local index in sync with prop
    React.useEffect(() => {
      setLocalIndex(currentIndex);
    }, [currentIndex]);

    /**
     * Handle swipe completion (unidirectional - always advances)
     * Direction is passed for dot indicator animation
     *
     * NOTE: We don't increment localIndex here because parent handles
     * circular queue rotation. localIndex stays at currentIndex prop (always 0).
     */
    const handleSwipeComplete = useCallback((direction: SwipeDirection) => {
      // Call parent callback with direction for dot animation
      // Parent will handle rotating the array (circular queue)
      onSwipeComplete(direction);
    }, [onSwipeComplete]);

    /**
     * Configure swipe gesture
     * Provides gesture handler, translateX, and isActive shared values
     */
    const { gesture, translateX, isActive } = useSwipeGesture({
      onSwipeComplete: handleSwipeComplete,
      screenWidth: width,
      enabled: true,
    });


    /**
     * Configure cross-fade animations
     * Converts translateX to opacity values for each card
     * Uses isActive to conditionally apply transforms only during gestures
     * Direction 'unidirectional' means nextCard fades in from EITHER swipe direction
     */
    const { currentCardStyle, nextCardStyle } =
      useSwipeFadeAnimation({
        translateX,
        isActive,
        screenWidth: width,
        direction: 'unidirectional', // nextCard fades in for both left AND right swipes
      });

    /**
     * Handle card press (image or title)
     * Invokes callback with article slug
     */
    const handleCardPress = useCallback(
      (article: QuickReadArticleData) => {
        onArticlePress(article.slug);
      },
      [onArticlePress]
    );

    // Get current and next articles (no previous - unidirectional)
    const currentArticle = articles[localIndex];
    const nextArticle =
      localIndex < articles.length - 1 ? articles[localIndex + 1] : null;

    return (
      <GestureDetector gesture={gesture}>
        <View style={styles.container} testID={testID}>
          {/* Current Card (always rendered) */}
          {/* CRITICAL: Use article.id as key, not index! */}
          {/* This forces React to create NEW component when article changes */}
          {/* New component = new SharedValues = no flash */}
          <Animated.View
            key={`card-${currentArticle.id}`}
            style={[
              styles.cardContainer,
              currentCardStyle as AnimatedStyle<ViewStyle>,
              styles.cardFront,
            ]}
            testID={`${testID}-current`}
          >
            <QuickReadCard
              article={currentArticle}
              onPress={() => handleCardPress(currentArticle)}
            />
          </Animated.View>

          {/* Next Card (only render if exists) */}
          {nextArticle && (
            <Animated.View
              key={`card-${nextArticle.id}`}
              style={[
                styles.cardContainer,
                nextCardStyle as AnimatedStyle<ViewStyle>,
                styles.cardBehind,
              ]}
              testID={`${testID}-next`}
            >
              <QuickReadCard
                article={nextArticle}
                onPress={() => handleCardPress(nextArticle)}
              />
            </Animated.View>
          )}
        </View>
      </GestureDetector>
    );
  }
);

// Display name for debugging
SwipeableCard.displayName = 'SwipeableCard';

/**
 * Styles for SwipeableCard
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardFront: {
    zIndex: 2,
  },
  cardBehind: {
    zIndex: 1,
  },
});

/**
 * Export styles for testing
 */
export const SwipeableCardStyles = styles;
