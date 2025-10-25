import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrutalistTabSelector } from './BrutalistTabSelector';
import { BrutalistTabContent } from './BrutalistTabContent';

export interface TabDefinition {
  id: string;
  label: string;
  slug: string;
  voiceLabel?: string;
}

interface BrutalistTabsProps {
  tabs: TabDefinition[];
  headerHeight: number;
  scrollHandler: any; // Reanimated scroll handler type
}

export const BrutalistTabs: React.FC<BrutalistTabsProps> = ({
  tabs,
  headerHeight,
  scrollHandler,
}) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || '');

  return (
    <View style={styles.container}>
      <BrutalistTabSelector
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <BrutalistTabContent
        activeTab={activeTab}
        tabs={tabs}
        headerHeight={headerHeight}
        scrollHandler={scrollHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
