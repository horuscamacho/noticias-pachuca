/**
 * Individual tab button component with press feedback and dynamic width measurement
 * @module BrutalistTabItem
 * @version 2.0.0
 */

import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, DIMENSIONS, TYPOGRAPHY, ANIMATION, OPACITY } from './BrutalistTabs.tokens';
import type { BrutalistTabItemProps } from './BrutalistTabs.types';

/**
 * Individual tab button with brutalist styling and press feedback
 *
 * Features:
 * - Dynamic width based on text content
 * - Animated press feedback (scale + yellow flash)
 * - Haptic feedback on press
 * - Layout measurement callback
 * - Accessibility labels
 * - Memoized for performance
 *
 * @example
 * ```tsx
 * <BrutalistTabItem
 *   category={{ id: 'deportes', label: 'DEPORTES', slug: 'sports', voiceLabel: 'Sports' }}
 *   isActive={true}
 *   onPress={() => handleTabPress(0)}
 *   index={0}
 *   onLayout={(index, width) => handleTabLayout(index, width)}
 * />
 * ```
 */
const BrutalistTabItem: React.FC<BrutalistTabItemProps> = React.memo(({
  category,
  isActive,
  onPress,
  index,
  onLayout,
}) => {
  // Shared value for press animation
  const scale = useSharedValue(1);

  /**
   * Handle press in - trigger haptic and scale animation
   */
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(ANIMATION.pressScale, {
      duration: ANIMATION.pressScaleDuration,
    });
  }, [scale]);

  /**
   * Handle press out - reset scale
   */
  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: ANIMATION.pressScaleDuration,
    });
  }, [scale]);

  /**
   * Handle press - trigger haptic and callback
   */
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  /**
   * Handle layout measurement - report width to parent
   */
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    onLayout(index, width);
  }, [index, onLayout]);

  /**
   * Animated style for press feedback
   */
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={category.voiceLabel}
      accessibilityHint="Double tap to view articles"
      accessibilityState={{ selected: isActive }}
      testID={`tab-${category.id}`}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.tabContainer,
            (pressed || isActive) && styles.pressed,
            animatedStyle,
          ]}
          onLayout={handleLayout}
        >
          <Text
            style={[
              styles.tabText,
              isActive ? styles.activeText : styles.inactiveText,
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {category.label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
});

BrutalistTabItem.displayName = 'BrutalistTabItem';

const styles = StyleSheet.create({
  tabContainer: {
    height: DIMENSIONS.tabHeight,
    paddingHorizontal: DIMENSIONS.tabPaddingHorizontal,
    paddingVertical: DIMENSIONS.tabPaddingVertical,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.tabInactiveBackground,
  },
  pressed: {
    backgroundColor: COLORS.pressedOverlay,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize,
    fontWeight: TYPOGRAPHY.fontWeight,
    letterSpacing: TYPOGRAPHY.letterSpacing,
    lineHeight: TYPOGRAPHY.lineHeight,
    textTransform: 'uppercase',
  },
  activeText: {
    color: COLORS.textActive,
    opacity: OPACITY.active,
  },
  inactiveText: {
    color: COLORS.textInactive,
    opacity: OPACITY.inactive,
  },
});

export default BrutalistTabItem;
