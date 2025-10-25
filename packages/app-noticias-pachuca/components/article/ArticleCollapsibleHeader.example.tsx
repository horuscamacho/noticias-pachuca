/**
 * ArticleCollapsibleHeader Usage Example
 *
 * This file demonstrates how to integrate the ArticleCollapsibleHeader
 * into an article screen with scroll-based animation.
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  ArticleCollapsibleHeader,
  ARTICLE_COLLAPSIBLE_HEADER_HEIGHT,
} from './ArticleCollapsibleHeader';
import { ThemedText } from '@/components/ThemedText';

/**
 * Example Article Screen with Collapsible Header
 *
 * The header appears when scrolling down past a threshold (e.g., 100px)
 * and disappears when scrolling back up.
 */
export default function ArticleScreenExample() {
  const router = useRouter();

  // Track scroll position
  const scrollY = useSharedValue(0);

  // Scroll handler to update shared value
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Derive opacity from scroll position
  // Header appears when scrolled past 100px
  const headerOpacity = useDerivedValue(() => {
    const threshold = 100;
    if (scrollY.value > threshold) {
      return withTiming(1, { duration: 200 });
    } else {
      return withTiming(0, { duration: 200 });
    }
  });

  // Handle back navigation
  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Collapsible Header - Positioned Absolute */}
      <View style={styles.headerContainer}>
        <ArticleCollapsibleHeader
          onBackPress={handleBackPress}
          animatedOpacity={headerOpacity}
          testID="article-header"
        />
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Article Content */}
        <View style={styles.articleContent}>
          <ThemedText variant="h1" style={styles.title}>
            EXAMPLE ARTICLE TITLE
          </ThemedText>

          <ThemedText variant="body" style={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </ThemedText>

          {/* Add more content to enable scrolling */}
          {Array.from({ length: 20 }).map((_, index) => (
            <ThemedText
              key={index}
              variant="body"
              style={styles.paragraph}
            >
              Paragraph {index + 1}: Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat.
            </ThemedText>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // Position header absolutely at top with high z-index
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },

  // ScrollView content
  scrollContent: {
    paddingTop: 0, // No padding needed, header is absolute
  },

  // Article content
  articleContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  title: {
    marginBottom: 16,
  },

  paragraph: {
    marginBottom: 12,
  },
});

/**
 * Usage Notes:
 *
 * 1. **Scroll Threshold**: Adjust the threshold value (currently 100px) to control
 *    when the header appears. Higher values = later appearance.
 *
 * 2. **Animation Duration**: Change the duration in withTiming() to make the
 *    fade in/out faster or slower.
 *
 * 3. **Z-Index**: The header uses z-index: 999 to ensure it stays above content.
 *    Adjust if needed for your specific layout.
 *
 * 4. **Safe Area**: The component automatically handles safe area insets, so no
 *    additional SafeAreaView is needed for the header.
 *
 * 5. **Pointer Events**: The component automatically disables pointer events when
 *    invisible (opacity < 0.5) to prevent touch interception.
 *
 * 6. **Performance**: Using Reanimated shared values ensures animations run on
 *    the native thread at 60fps without blocking JavaScript thread.
 *
 * 7. **Alternative Animation**: For fade out on scroll down (instead of fade in),
 *    reverse the logic:
 *    ```tsx
 *    const headerOpacity = useDerivedValue(() => {
 *      return scrollY.value < 100 ? withTiming(1) : withTiming(0);
 *    });
 *    ```
 */
