/**
 * TypeScript type definitions for Brutalist Tab Navigation System
 * @module BrutalistTabs.types
 * @version 1.0.0
 */

/**
 * News category definition
 */
export interface NewsCategory {
  /** Unique identifier for the category */
  id: string;
  /** Display label (uppercase) */
  label: string;
  /** URL-safe slug */
  slug: string;
  /** Voice control label for accessibility */
  voiceLabel: string;
  /** Optional icon (future use) */
  icon?: string;
}

/**
 * Tab measurement data
 */
export interface TabMeasurement {
  /** Width of the tab */
  width: number;
  /** X position of the tab (cumulative) */
  x: number;
}

/**
 * Props for the main BrutalistTabBar component
 */
export interface BrutalistTabBarProps {
  /** Array of news categories */
  categories: readonly NewsCategory[];
  /** Currently active category index */
  activeIndex: number;
  /** Callback when tab is pressed */
  onTabPress: (index: number) => void;
  /** Optional container test ID for testing */
  testID?: string;
}

/**
 * Props for individual tab item
 */
export interface BrutalistTabItemProps {
  /** Category data */
  category: NewsCategory;
  /** Whether this tab is active */
  isActive: boolean;
  /** Tab press handler */
  onPress: () => void;
  /** Index of the tab */
  index: number;
  /** Callback when tab layout is measured */
  onLayout: (index: number, width: number) => void;
}

/**
 * Props for the animated indicator
 */
export interface BrutalistTabIndicatorProps {
  /** Currently active tab index */
  activeIndex: number;
  /** Array of tab measurements */
  tabMeasurements: TabMeasurement[];
  /** Padding from edges */
  horizontalPadding: number;
}

/**
 * Props for swipeable content area
 */
export interface BrutalistTabContentProps {
  /** Array of categories for content */
  categories: readonly NewsCategory[];
  /** Currently active index */
  activeIndex: number;
  /** Callback when user swipes */
  onIndexChange: (index: number) => void;
  /** Optional custom content renderer */
  renderContent?: (category: NewsCategory, index: number) => React.ReactNode;
  /** Height of the collapsible header (for dead space) */
  headerHeight: number;
  /** Reanimated scroll handler from parent hook */
  scrollHandler: ReturnType<typeof import('react-native-reanimated').useAnimatedScrollHandler>;
  /** Ref to tab scroll positions for interpolation during swipe */
  tabScrollPositions?: React.MutableRefObject<Record<number, number>>;
  /** Reanimated scrollY shared value */
  scrollY?: ReturnType<typeof import('react-native-reanimated').useSharedValue<number>>;
}

/**
 * Tab animation state
 */
export interface TabAnimationState {
  /** Indicator X position */
  indicatorX: number;
  /** Scale transform for press feedback */
  scale: number;
  /** Background opacity for press */
  backgroundOpacity: number;
}

/**
 * Scroll handler event data
 */
export interface ScrollEventData {
  /** Current scroll X position */
  x: number;
  /** Content width */
  contentWidth: number;
  /** Viewport width */
  viewportWidth: number;
}
