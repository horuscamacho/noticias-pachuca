import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';

/**
 * Rotating Dot Indicator for Quick Read Feature
 *
 * Displays a 5-dot sliding window indicator that creates an infinite
 * rotating wheel effect. The center dot is always active, and swiping
 * in any direction advances to the next article while the dots rotate
 * to keep the new article centered.
 */

interface RotatingDotIndicatorProps {
  /** Current article index (0-based) */
  currentIndex: number;
  /** Total number of articles */
  totalArticles: number;
  /** Direction of last swipe */
  swipeDirection?: 'left' | 'right' | null;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Custom styling for container */
  containerStyle?: any;
  /** Reduced motion mode (for accessibility) */
  reducedMotion?: boolean;
}

interface DotState {
  /** Array of 5 virtual indices representing visible dots */
  visibleDots: number[];
  /** Animation in progress flag */
  isAnimating: boolean;
}

export const RotatingDotIndicator: React.FC<RotatingDotIndicatorProps> = ({
  currentIndex,
  totalArticles,
  swipeDirection,
  onAnimationComplete,
  containerStyle,
  reducedMotion: reducedMotionProp,
}) => {
  // Check system reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(reducedMotionProp || false);

  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        setReducedMotion(enabled || reducedMotionProp || false);
      });
    }
  }, [reducedMotionProp]);

  // State: visible dots window
  const [dotState, setDotState] = useState<DotState>(() => ({
    visibleDots: getInitialVisibleDots(currentIndex),
    isAnimating: false,
  }));

  // Animation values for each dot
  const dotAnimations = useRef(
    Array(7) // 5 visible + 2 ghost dots for smooth entry/exit
      .fill(null)
      .map(() => ({
        translateX: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      }))
  ).current;

  // Previous index to detect changes
  const prevIndex = useRef(currentIndex);

  // Trigger animation when index changes
  useEffect(() => {
    if (prevIndex.current !== currentIndex && swipeDirection) {
      if (reducedMotion) {
        // Instant transition for reduced motion
        updateDotsInstant(swipeDirection);
      } else {
        // Animated transition
        animateDotRotation(swipeDirection);
      }
      prevIndex.current = currentIndex;
    }
  }, [currentIndex, swipeDirection, reducedMotion]);

  /**
   * Get initial visible dots window
   * Creates array of 5 indices centered on current article
   */
  function getInitialVisibleDots(index: number): number[] {
    return [index - 2, index - 1, index, index + 1, index + 2];
  }

  /**
   * Rotate visible dots window
   */
  function rotateVisibleDots(direction: 'left' | 'right'): number[] {
    const current = dotState.visibleDots;
    if (direction === 'left') {
      // Shift left: remove first, add to end
      return [...current.slice(1), current[4] + 1];
    } else {
      // Shift right: remove last, add to beginning
      return [current[0] - 1, ...current.slice(0, 4)];
    }
  }

  /**
   * Instant dot update (reduced motion mode)
   */
  function updateDotsInstant(direction: 'left' | 'right') {
    setDotState({
      visibleDots: rotateVisibleDots(direction),
      isAnimating: false,
    });
    onAnimationComplete?.();
  }

  /**
   * Animated dot rotation
   * Creates smooth sliding wheel effect
   */
  function animateDotRotation(direction: 'left' | 'right') {
    if (dotState.isAnimating) return;

    setDotState((prev) => ({ ...prev, isAnimating: true }));

    const distance = direction === 'left' ? -24 : 24;
    const fadeOutIndex = direction === 'left' ? 0 : 4;
    const fadeInIndex = direction === 'left' ? 5 : 6;

    // Animation sequence
    const animations = [];

    // 1. Slide all visible dots
    dotAnimations.slice(0, 5).forEach((anim) => {
      animations.push(
        Animated.timing(anim.translateX, {
          toValue: distance,
          duration: 400,
          useNativeDriver: true,
        })
      );
    });

    // 2. Fade out exiting dot (edge dot)
    animations.push(
      Animated.timing(dotAnimations[fadeOutIndex].opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    );

    // 3. Fade in entering dot (ghost dot)
    animations.push(
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(dotAnimations[fadeInIndex].opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    // 4. CENTER DOT TRANSITION (position 2 - currently active)
    // Fades out then back in with new inactive styles after reset
    animations.push(
      Animated.sequence([
        Animated.timing(dotAnimations[2].opacity, {
          toValue: 0,
          duration: 200, // First half of translation
          useNativeDriver: true,
        }),
        Animated.timing(dotAnimations[2].opacity, {
          toValue: 1,
          duration: 200, // Second half of translation
          useNativeDriver: true,
        }),
      ])
    );

    // 5. ENTERING CENTER DOT TRANSITION
    // The dot that will become active after reset
    // Swipe left: position 3 becomes center | Swipe right: position 1 becomes center
    const enteringCenterIndex = direction === 'left' ? 3 : 1;
    animations.push(
      Animated.sequence([
        Animated.timing(dotAnimations[enteringCenterIndex].opacity, {
          toValue: 0,
          duration: 200, // First half of translation
          useNativeDriver: true,
        }),
        Animated.timing(dotAnimations[enteringCenterIndex].opacity, {
          toValue: 1,
          duration: 200, // Second half of translation
          useNativeDriver: true,
        }),
      ])
    );

    // 6. Scale transitions for smooth size changes
    const scaleSequences = getScaleAnimations(direction);
    animations.push(...scaleSequences);

    // Run all animations in parallel
    Animated.parallel(animations).start(() => {
      // Reset animation values
      dotAnimations.forEach((anim) => {
        anim.translateX.setValue(0);
        anim.scale.setValue(1);
        anim.opacity.setValue(1);
      });

      // Update visible dots
      setDotState({
        visibleDots: rotateVisibleDots(direction),
        isAnimating: false,
      });

      onAnimationComplete?.();
    });
  }

  /**
   * Generate scale animations for smooth size transitions
   */
  function getScaleAnimations(direction: 'left' | 'right'): Animated.CompositeAnimation[] {
    const animations = [];

    // Scale pattern for each position
    const scaleMap = {
      left: [
        { from: 0.67, to: 0.67 }, // pos 0 → disappears
        { from: 0.67, to: 0.83 }, // pos 1 → pos 0
        { from: 0.83, to: 1.0 }, // pos 2 → pos 1 (approaching center)
        { from: 1.0, to: 0.83 }, // pos 3 → pos 2 (leaving center)
        { from: 0.83, to: 0.67 }, // pos 4 → pos 3
      ],
      right: [
        { from: 0.67, to: 0.83 }, // pos 0 → pos 1
        { from: 0.83, to: 1.0 }, // pos 1 → pos 2 (approaching center)
        { from: 1.0, to: 0.83 }, // pos 2 → pos 3 (leaving center)
        { from: 0.83, to: 0.67 }, // pos 3 → pos 4
        { from: 0.67, to: 0.67 }, // pos 4 → disappears
      ],
    };

    const scales = scaleMap[direction];

    dotAnimations.slice(0, 5).forEach((anim, index) => {
      animations.push(
        Animated.timing(anim.scale, {
          toValue: scales[index].to,
          duration: 400,
          useNativeDriver: true,
        })
      );
    });

    return animations;
  }

  /**
   * Get dot styling based on position
   */
  function getDotStyle(position: number) {
    const isCenter = position === 2;

    if (isCenter) {
      return {
        size: 12,
        color: '#854836', // Brown - active
        opacity: 1.0,
        scale: 1.0,
        hasBorder: true,
      };
    }

    // Adjacent to center (positions 1 and 3)
    if (position === 1 || position === 3) {
      return {
        size: 10,
        color: '#D1D5DB', // Gray
        opacity: 0.8,
        scale: 0.83,
        hasBorder: false,
      };
    }

    // Edge positions (0 and 4)
    return {
      size: 8,
      color: '#D1D5DB', // Gray
      opacity: 0.6,
      scale: 0.67,
      hasBorder: false,
    };
  }

  /**
   * Render individual dot
   */
  function renderDot(virtualIndex: number, position: number) {
    const style = getDotStyle(position);
    const anim = dotAnimations[position];

    // Map virtual index to real article (with wrapping)
    const realIndex = ((virtualIndex % totalArticles) + totalArticles) % totalArticles;

    return (
      <Animated.View
        key={`dot-${virtualIndex}`}
        accessibilityElementsHidden={true}
        style={[
          styles.dot,
          {
            width: style.size,
            height: style.size,
            backgroundColor: style.color,
            opacity: reducedMotion ? style.opacity : anim.opacity,
            transform: [
              { translateX: reducedMotion ? 0 : anim.translateX },
              { scale: reducedMotion ? style.scale : anim.scale },
            ],
            borderWidth: style.hasBorder ? 2 : 0,
            borderColor: style.hasBorder ? '#FFFFFF' : 'transparent',
          },
          style.hasBorder && styles.activeDotShadow,
        ]}
      />
    );
  }

  return (
    <View
      style={[styles.container, containerStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel="Article progress"
      accessibilityValue={{
        min: 1,
        max: totalArticles,
        now: currentIndex + 1,
        text: `Article ${currentIndex + 1} of ${totalArticles}`,
      }}
    >
      <View style={styles.dotsWrapper}>
        {dotState.visibleDots.map((virtualIndex, position) =>
          renderDot(virtualIndex, position)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -60 }], // Half of container width
    width: 120,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    // iOS specific blur effect
    ...(Platform.OS === 'ios' && {
      overflow: 'hidden',
    }),
  },

  dotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },

  dot: {
    borderRadius: 50,
    // Performance optimization
    ...(Platform.OS === 'android' && {
      elevation: 0,
    }),
  },

  activeDotShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#854836',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default RotatingDotIndicator;
