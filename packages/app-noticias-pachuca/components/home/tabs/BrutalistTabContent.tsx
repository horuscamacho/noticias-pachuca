/**
 * Swipeable content area that syncs with tab selection
 * @module BrutalistTabContent
 * @version 3.0.0 - Fake Scroll Architecture
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { TEST_CONTENT_COLORS } from './BrutalistTabs.tokens';
import { TabContentWithNews } from './TabContentWithNews';
import type { BrutalistTabContentProps, NewsCategory } from './BrutalistTabs.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Swipeable content area with horizontal paging
 * Each page contains a ScrollView with dead space for fake scroll effect
 */
const BrutalistTabContent: React.FC<BrutalistTabContentProps> = React.memo(({
  categories,
  activeIndex,
  onIndexChange,
  renderContent,
  headerHeight,
  scrollHandler,
  tabScrollPositions,
  scrollY,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  /**
   * Default content renderer - shows news cards for TODAS, colored background for others
   */
  const defaultRenderContent = useCallback((category: NewsCategory, index: number): React.ReactNode => {
    // Show news cards for TODAS with fake scroll
    if (category.slug === 'todas') {
      return (
        <TabContentWithNews
          categorySlug={category.slug}
          headerHeight={headerHeight}
          scrollHandler={scrollHandler}
        />
      );
    }

    // Show colored background for other categories with fake scroll
    const backgroundColor = TEST_CONTENT_COLORS[category.label as keyof typeof TEST_CONTENT_COLORS] || '#FFFFFF';

    return (
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Dead space for fake scroll effect */}
        <View style={{ height: headerHeight }} />

        {/* Actual content */}
        <View
          style={[
            styles.contentPage,
            { backgroundColor },
          ]}
        >
          <Text style={styles.contentText}>{category.label}</Text>
          <Text style={styles.contentSubtext}>Swipe to navigate categories</Text>
        </View>
      </Animated.ScrollView>
    );
  }, [headerHeight, scrollHandler]);

  /**
   * Scroll to active page when activeIndex changes from tab press
   */
  useEffect(() => {
    if (!isUserScrolling.current) {
      scrollViewRef.current?.scrollTo({
        x: activeIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [activeIndex]);

  /**
   * Track when user starts scrolling
   */
  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  /**
   * Handle horizontal scroll - interpolate header scrollY during swipe transition
   */
  const handleHorizontalScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!tabScrollPositions || !scrollY) return;

    const x = event.nativeEvent.contentOffset.x;
    const currentPageIndex = Math.floor(x / SCREEN_WIDTH);
    const nextPageIndex = Math.ceil(x / SCREEN_WIDTH);

    // Calculate progress between current and next page (0 to 1)
    const progress = (x % SCREEN_WIDTH) / SCREEN_WIDTH;

    // Get scroll positions for current and next tab
    const currentTabScroll = tabScrollPositions.current[currentPageIndex] || 0;
    const nextTabScroll = tabScrollPositions.current[nextPageIndex] || 0;

    // Interpolate scrollY between the two tabs based on swipe progress
    const interpolatedScrollY = currentTabScroll + (nextTabScroll - currentTabScroll) * progress;

    // Update scrollY for smooth header transition
    scrollY.value = interpolatedScrollY;
  }, [tabScrollPositions, scrollY]);

  /**
   * Handle scroll end - update active index when user swipes
   */
  const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / SCREEN_WIDTH);
    const clampedIndex = Math.max(0, Math.min(newIndex, categories.length - 1));

    if (clampedIndex !== activeIndex) {
      onIndexChange(clampedIndex);
    }
    isUserScrolling.current = false;
  }, [activeIndex, categories.length, onIndexChange]);

  const contentRenderer = renderContent || defaultRenderContent;

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      bounces={false}
      onScroll={handleHorizontalScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      decelerationRate="fast"
      contentContainerStyle={styles.scrollContent}
    >
      {categories.map((category, index) => (
        <View
          key={category.id}
          style={styles.pageContainer}
        >
          {contentRenderer(category, index)}
        </View>
      ))}
    </ScrollView>
  );
});

BrutalistTabContent.displayName = 'BrutalistTabContent';

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  contentPage: {
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  contentSubtext: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.6,
  },
});

export default BrutalistTabContent;
