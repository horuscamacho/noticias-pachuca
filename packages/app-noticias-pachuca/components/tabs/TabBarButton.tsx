import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BRUTALIST_TAB_BAR_TOKENS,
  TAB_BAR_ICONS,
  TabRoute,
} from "./BrutalistTabBar.tokens";

/**
 * Props for TabBarButton component
 */
export interface TabBarButtonProps {
  /**
   * Route name for this tab
   */
  route: string;

  /**
   * Whether this tab is currently active
   */
  isFocused: boolean;

  /**
   * Callback when tab is pressed
   */
  onPress: () => void;

  /**
   * Callback when tab is long pressed
   */
  onLongPress: () => void;

  /**
   * Accessibility label for the tab
   */
  accessibilityLabel?: string;

  /**
   * Whether this is the last tab (no right divider)
   */
  isLast?: boolean;
}

/**
 * TabBarButton - Individual tab button component
 *
 * Renders a single tab button with:
 * - Ionicons icon (filled when active, outline when inactive)
 * - Uppercase label
 * - Active state with brown color, gray background, and yellow top indicator
 * - Inactive state with black color at 60% opacity
 * - Press state with yellow background
 * - Brutalist vertical divider (except for last tab)
 *
 * Separated from TabBar for better reusability and testing.
 */
export const TabBarButton = React.memo<TabBarButtonProps>(
  ({
    route,
    isFocused,
    onPress,
    onLongPress,
    accessibilityLabel,
    isLast = false,
  }) => {
    // Track pressed state for visual feedback
    const [isPressed, setIsPressed] = useState(false);

    const insets = useSafeAreaInsets();

    // Handle press in
    const handlePressIn = () => {
      setIsPressed(true);
    };

    // Handle press out
    const handlePressOut = () => {
      setIsPressed(false);
    };

    // Get icon configuration for this route
    const iconConfig = TAB_BAR_ICONS[route as TabRoute];

    // If no icon config found, don't render (invalid route)
    if (!iconConfig) {
      return null;
    }

    // Determine which icon variant to show
    const iconName = isFocused ? iconConfig.active : iconConfig.inactive;

    // Determine icon color based on state
    const iconColor = isPressed
      ? BRUTALIST_TAB_BAR_TOKENS.press.icon
      : isFocused
      ? BRUTALIST_TAB_BAR_TOKENS.active.icon
      : BRUTALIST_TAB_BAR_TOKENS.inactive.icon;

    // Determine text color based on state
    const textColor = isPressed
      ? BRUTALIST_TAB_BAR_TOKENS.press.text
      : isFocused
      ? BRUTALIST_TAB_BAR_TOKENS.active.text
      : BRUTALIST_TAB_BAR_TOKENS.inactive.text;

    // Determine background color based on state
    const backgroundColor = isPressed
      ? BRUTALIST_TAB_BAR_TOKENS.press.background
      : isFocused
      ? BRUTALIST_TAB_BAR_TOKENS.active.background
      : "transparent";

    // Opacity for inactive state
    const inactiveOpacity = isFocused
      ? 1
      : BRUTALIST_TAB_BAR_TOKENS.inactive.opacity;

    return (
      <PlatformPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.container,
          { backgroundColor, paddingBottom: insets.bottom },
          isLast ? undefined : styles.divider,
        ]}
      >
        {/* Active indicator (yellow top border) */}
        {isFocused && <View style={styles.activeIndicator} />}

        {/* Fixed Icon Container - ensures alignment */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName}
            size={BRUTALIST_TAB_BAR_TOKENS.iconSize}
            color={iconColor}
            style={{ opacity: inactiveOpacity }}
          />
        </View>

        {/* Fixed Label Container - prevents icon displacement */}
        <View style={styles.labelContainer}>
          <ThemedText
            variant="caption"
            numberOfLines={2}
            style={[styles.label, { color: textColor, opacity: inactiveOpacity }]}
          >
            {iconConfig.label}
          </ThemedText>
        </View>
      </PlatformPressable>
    );
  }
);

// Display name for debugging
TabBarButton.displayName = "TabBarButton";

/**
 * Styles for TabBarButton component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: BRUTALIST_TAB_BAR_TOKENS.touchTarget,
    paddingTop: 12,
    paddingHorizontal: BRUTALIST_TAB_BAR_TOKENS.spacing.horizontal,
    position: "relative",
  },
  divider: {
    borderRightWidth: BRUTALIST_TAB_BAR_TOKENS.divider.width,
    borderRightColor: BRUTALIST_TAB_BAR_TOKENS.divider.color,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BRUTALIST_TAB_BAR_TOKENS.activeIndicator.height,
    backgroundColor: BRUTALIST_TAB_BAR_TOKENS.activeIndicator.color,
  },
  iconContainer: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: BRUTALIST_TAB_BAR_TOKENS.spacing.iconToLabel,
  },
  labelContainer: {
    height: 28,
    minHeight: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: BRUTALIST_TAB_BAR_TOKENS.label.fontSize,
    fontWeight: BRUTALIST_TAB_BAR_TOKENS.label.fontWeight,
    letterSpacing: BRUTALIST_TAB_BAR_TOKENS.label.letterSpacing,
    textTransform: BRUTALIST_TAB_BAR_TOKENS.label.textTransform,
    lineHeight: BRUTALIST_TAB_BAR_TOKENS.label.lineHeight,
    textAlign: 'center',
  },
});
