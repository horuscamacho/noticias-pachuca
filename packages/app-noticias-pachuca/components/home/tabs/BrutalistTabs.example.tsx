/**
 * Usage examples for Brutalist Tab Navigation System
 * @module BrutalistTabs.example
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BrutalistTabs from './BrutalistTabs';
import { NEWS_CATEGORIES } from './BrutalistTabs.tokens';
import type { NewsCategory } from './BrutalistTabs.types';

/**
 * Example 1: Basic usage with default content
 * Shows colored backgrounds for each category
 */
export const BasicExample: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <BrutalistTabs />
    </SafeAreaView>
  );
};

/**
 * Example 2: With custom content renderer
 * Shows how to integrate with real news feed
 */
export const CustomContentExample: React.FC = () => {
  const renderCustomContent = (category: NewsCategory, index: number) => (
    <View style={styles.customContent}>
      <Text style={styles.customTitle}>{category.label} News</Text>
      <Text style={styles.customSubtitle}>Category: {category.slug}</Text>
      <Text style={styles.customDescription}>
        This is where your news feed component would go.
        You can fetch and display articles for "{category.label}".
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <BrutalistTabs renderContent={renderCustomContent} />
    </SafeAreaView>
  );
};

/**
 * Example 3: With change handler and analytics
 */
export const WithChangeHandlerExample: React.FC = () => {
  const handleCategoryChange = (category: NewsCategory, index: number) => {
    console.log('Category changed:', {
      label: category.label,
      slug: category.slug,
      index,
    });

    // Example: Track analytics
    // analytics.track('category_viewed', { category: category.slug });

    // Example: Update URL
    // navigation.setParams({ category: category.slug });
  };

  return (
    <SafeAreaView style={styles.container}>
      <BrutalistTabs onCategoryChange={handleCategoryChange} />
    </SafeAreaView>
  );
};

/**
 * Example 4: Integration with Home screen
 * Shows complete layout with header
 */
export const HomeScreenIntegration: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Noticias Pachuca</Text>
      </View>

      {/* Tab navigation */}
      <BrutalistTabs
        onCategoryChange={(category, index) => {
          console.log('Active category:', category.label);
        }}
      />
    </SafeAreaView>
  );
};

/**
 * Example 5: Starting at specific category
 */
export const InitialCategoryExample: React.FC = () => {
  // Start at "DEPORTES" (index 1)
  return (
    <SafeAreaView style={styles.container}>
      <BrutalistTabs initialIndex={1} />
    </SafeAreaView>
  );
};

/**
 * Example 6: Dynamic tab widths (automatic)
 * Tabs now automatically adjust to text content width
 */
export const DynamicTabWidthExample: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <BrutalistTabs />
    </SafeAreaView>
  );
};

/**
 * Example 7: Standalone tab bar (no content)
 * Useful if you want to control content separately
 */
import { BrutalistTabBar } from './index';

export const StandaloneTabBarExample: React.FC = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <BrutalistTabBar
        categories={NEWS_CATEGORIES}
        activeIndex={activeIndex}
        onTabPress={setActiveIndex}
      />

      {/* Your own content implementation */}
      <View style={styles.customContent}>
        <Text style={styles.customTitle}>
          Active: {NEWS_CATEGORIES[activeIndex].label}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#854836',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  customContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  customSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#854836',
    marginBottom: 16,
  },
  customDescription: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});

// Export all examples
export default {
  BasicExample,
  CustomContentExample,
  WithChangeHandlerExample,
  HomeScreenIntegration,
  InitialCategoryExample,
  DynamicTabWidthExample,
  StandaloneTabBarExample,
};
