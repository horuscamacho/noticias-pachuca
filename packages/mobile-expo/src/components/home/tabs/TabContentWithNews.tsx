import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { NewsList } from './NewsList';

interface TabContentWithNewsProps {
  category: string;
  headerHeight: number;
  scrollHandler: any; // Reanimated scroll handler type
}

export const TabContentWithNews: React.FC<TabContentWithNewsProps> = ({
  category,
  headerHeight,
  scrollHandler,
}) => {
  return (
    <Animated.ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={true}
    >
      {/* Dead space at top for header */}
      <View style={{ height: headerHeight }} />

      {/* Actual content */}
      <NewsList category={category} />
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
