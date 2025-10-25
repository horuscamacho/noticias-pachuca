import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CollapsibleHeader } from '@/components/home/CollapsibleHeader';
import { CompactHeader } from '@/components/home/CompactHeader';
import BrutalistTabBar from '@/components/home/tabs/BrutalistTabBar';
import BrutalistTabContent from '@/components/home/tabs/BrutalistTabContent';
import { NEWS_CATEGORIES } from '@/components/home/tabs/BrutalistTabs.tokens';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';

// Constants for positioning
const TAB_BAR_HEIGHT = 56; // From BrutalistTabs.tokens DIMENSIONS.containerHeight
const COMPACT_HEADER_HEIGHT = 100; // CompactHeader height (60 + 40 banner)

/**
 * InvitedHomeScreen - Main home screen with FAKE SCROLL collapsible header
 *
 * Architecture:
 * - CompactHeader: absolutely positioned at top (z-index: 1000)
 * - CollapsibleHeader: absolutely positioned at top (z-index: 999)
 * - TabBar: absolutely positioned below headers (z-index: 998)
 * - TabContent: each tab has ScrollView with dead space
 * - Dead space height = CollapsibleHeader height + TabBar height
 * - As user scrolls, dead space scrolls away creating illusion
 * - Headers and TabBar stay fixed, only opacity changes
 *
 * Features:
 * - Fake scroll effect - all UI stays fixed, opacity changes
 * - Each tab has independent scroll position
 * - Smooth 60fps animations using Reanimated v4
 * - TabBar always visible below active header
 */
export default function InvitedHomeScreen() {
  const router = useRouter();
  const [headerHeight, setHeaderHeightState] = useState(0);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Store scroll position for each tab (7 tabs total)
  const tabScrollPositions = useRef<Record<number, number>>({
    0: 0, // TODAS
    1: 0, // DEPORTES
    2: 0, // POLÍTICA
    3: 0, // ECONOMÍA
    4: 0, // SALUD
    5: 0, // SEGURIDAD
    6: 0, // ESTADO
  });

  // Collapsible header hook - manages fake scroll animations
  // Initialize with current tab's scroll position
  const {
    scrollHandler,
    mainHeaderStyle,
    compactHeaderStyle,
    tabBarStyle,
    scrollY,
    setHeaderHeight: setHeaderHeightShared,
  } = useCollapsibleHeader(tabScrollPositions.current[activeTabIndex]);

  /**
   * Handle edition dropdown press
   */
  const handleEditionPress = useCallback(() => {
    console.log('📰 Edition picker pressed');
    // TODO: Show edition picker modal
  }, []);

  /**
   * Handle banner CTA press (Registrarse)
   */
  const handleBannerCtaPress = useCallback(() => {
    console.log('✅ Register CTA pressed');
    // Navigate to registration screen
    router.push('/(auth)/register');
  }, [router]);

  /**
   * Handle header layout - measure height for dead space
   */
  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeightState(height);
    setHeaderHeightShared(height);
  }, [setHeaderHeightShared]);

  /**
   * Handle tab change - save current scroll position and restore new tab's position
   */
  const handleTabChange = useCallback((newIndex: number) => {
    if (newIndex === activeTabIndex) return; // Same tab, do nothing

    // Save current tab's scroll position
    tabScrollPositions.current[activeTabIndex] = scrollY.value;

    // Update active tab
    setActiveTabIndex(newIndex);

    // Restore new tab's scroll position immediately (no animation)
    scrollY.value = tabScrollPositions.current[newIndex];
  }, [activeTabIndex, scrollY]);

  /**
   * Update scrollY when activeTabIndex changes (from swipe)
   * This ensures header animations react to the new tab's scroll position
   */
  useEffect(() => {
    // Set scrollY to the saved position of the current tab
    scrollY.value = tabScrollPositions.current[activeTabIndex];
  }, [activeTabIndex, scrollY]);

  return (
    <View style={styles.container}>
      {/* Compact Header (Absolute positioned at top, fades in on scroll) */}
      <Animated.View style={[styles.compactHeaderContainer, compactHeaderStyle]}>
        <CompactHeader />
      </Animated.View>

      {/* Main Collapsible Header (Absolute positioned at top, fades out on scroll) */}
      <Animated.View style={[styles.mainHeaderContainer, mainHeaderStyle]}>
        <CollapsibleHeader
          onEditionPress={handleEditionPress}
          onBannerCtaPress={handleBannerCtaPress}
          currentEdition="EDICIÓN"
          onLogoLayout={handleHeaderLayout}
        />
      </Animated.View>

      {/* Tab Bar (Absolute positioned below headers, fades out with main header) */}
      {headerHeight > 0 && (
        <Animated.View
          style={[
            styles.tabBarContainer,
            tabBarStyle, // Fades out with CollapsibleHeader
            {
              top: headerHeight, // Position below CollapsibleHeader
            },
          ]}
        >
          <BrutalistTabBar
            categories={NEWS_CATEGORIES}
            activeIndex={activeTabIndex}
            onTabPress={handleTabChange}
          />
        </Animated.View>
      )}

      {/* Tab Content (each tab has ScrollView with dead space) */}
      {headerHeight > 0 && (
        <BrutalistTabContent
          categories={NEWS_CATEGORIES}
          activeIndex={activeTabIndex}
          onIndexChange={handleTabChange}
          headerHeight={headerHeight + TAB_BAR_HEIGHT} // Dead space = header + tabBar
          scrollHandler={scrollHandler}
          tabScrollPositions={tabScrollPositions}
          scrollY={scrollY}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  compactHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  mainHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 998,
    // top is set dynamically based on headerHeight
  },
});
