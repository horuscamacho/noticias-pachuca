import React, { useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TabDefinition } from './BrutalistTabs';

interface BrutalistTabSelectorProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const BrutalistTabSelector: React.FC<BrutalistTabSelectorProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorOffset = useSharedValue(0);
  const indicatorWidth = useSharedValue(110);
  const tabLayouts = useRef<Map<string, { x: number; width: number }>>(new Map());

  const handleTabLayout = (tabId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current.set(tabId, { x, width });

    // If this is the active tab, update indicator position
    if (tabId === activeTab) {
      indicatorOffset.value = x;
      indicatorWidth.value = width;
    }
  };

  const handleTabPress = (tabId: string, index: number) => {
    onTabChange(tabId);

    const layout = tabLayouts.current.get(tabId);
    if (layout) {
      // Animate indicator to new position
      indicatorOffset.value = withTiming(layout.x, {
        duration: 250,
      });
      indicatorWidth.value = withTiming(layout.width, {
        duration: 250,
      });
    }
  };

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorOffset.value }],
      width: indicatorWidth.value,
    };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <Pressable
              key={tab.id}
              style={styles.tab}
              onPress={() => handleTabPress(tab.id, index)}
              onLayout={(event) => handleTabLayout(tab.id, event)}
              accessibilityRole="tab"
              accessibilityLabel={tab.voiceLabel || tab.label}
              accessibilityHint="Double tap to view articles"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Animated Indicator */}
      <Animated.View style={[styles.indicator, indicatorAnimatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    minWidth: 110,
    height: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#000000',
    opacity: 0.6,
  },
  tabTextActive: {
    color: '#854836',
    opacity: 1.0,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    backgroundColor: '#FFB22C',
  },
});
