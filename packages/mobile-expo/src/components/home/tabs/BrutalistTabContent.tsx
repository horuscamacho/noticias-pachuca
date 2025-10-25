import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TabDefinition } from './BrutalistTabs';
import { TabContentWithNews } from './TabContentWithNews';
import { ColoredTabContent } from './ColoredTabContent';

interface BrutalistTabContentProps {
  activeTab: string;
  tabs: TabDefinition[];
  headerHeight: number;
  scrollHandler: any; // Reanimated scroll handler type
}

export const BrutalistTabContent: React.FC<BrutalistTabContentProps> = ({
  activeTab,
  tabs,
  headerHeight,
  scrollHandler,
}) => {
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  if (!activeTabData) {
    return null;
  }

  // Determine which content component to render based on tab
  // For now, "todas" and other main tabs show news, others show colored content
  const isNewsTab = ['todas', 'deportes', 'politica', 'economia', 'salud', 'seguridad', 'estado'].includes(activeTab);

  return (
    <View style={styles.container}>
      {isNewsTab ? (
        <TabContentWithNews
          category={activeTabData.slug}
          headerHeight={headerHeight}
          scrollHandler={scrollHandler}
        />
      ) : (
        <ColoredTabContent
          tab={activeTabData}
          headerHeight={headerHeight}
          scrollHandler={scrollHandler}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
