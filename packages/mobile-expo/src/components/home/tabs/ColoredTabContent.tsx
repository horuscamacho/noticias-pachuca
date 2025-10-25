import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { TabDefinition } from './BrutalistTabs';

interface ColoredTabContentProps {
  tab: TabDefinition;
  headerHeight: number;
  scrollHandler: any; // Reanimated scroll handler type
}

// Color mapping for different tabs
const TAB_COLORS: Record<string, string> = {
  default: '#F3F4F6',
  // Add custom colors per tab as needed
};

export const ColoredTabContent: React.FC<ColoredTabContentProps> = ({
  tab,
  headerHeight,
  scrollHandler,
}) => {
  const backgroundColor = TAB_COLORS[tab.id] || TAB_COLORS.default;

  return (
    <Animated.ScrollView
      style={[styles.scrollView, { backgroundColor }]}
      contentContainerStyle={styles.scrollContent}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={true}
    >
      {/* Dead space at top for header */}
      <View style={{ height: headerHeight }} />

      {/* Placeholder content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {tab.label}
        </Text>
        <Text style={styles.subtitle}>
          Próximamente contenido para esta sección
        </Text>
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
