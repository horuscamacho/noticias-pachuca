import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, LayoutChangeEvent } from 'react-native';
import { CollapsibleHeader } from '@/src/components/home/CollapsibleHeader';
import { BrutalistTabs, TabDefinition } from '@/src/components/home/tabs/BrutalistTabs';
import { useCollapsibleHeader } from '@/src/hooks/useCollapsibleHeader';

const TABS: TabDefinition[] = [
  {
    id: 'todas',
    label: 'TODAS',
    slug: 'all',
    voiceLabel: 'All News',
  },
  {
    id: 'deportes',
    label: 'DEPORTES',
    slug: 'sports',
    voiceLabel: 'Sports',
  },
  {
    id: 'politica',
    label: 'POLÍTICA',
    slug: 'politics',
    voiceLabel: 'Politics',
  },
  {
    id: 'economia',
    label: 'ECONOMÍA',
    slug: 'economy',
    voiceLabel: 'Economy',
  },
  {
    id: 'salud',
    label: 'SALUD',
    slug: 'health',
    voiceLabel: 'Health',
  },
  {
    id: 'seguridad',
    label: 'SEGURIDAD',
    slug: 'security',
    voiceLabel: 'Security',
  },
  {
    id: 'estado',
    label: 'ESTADO',
    slug: 'state',
    voiceLabel: 'State',
  },
];

const LOGO_HEIGHT = 80;

export default function HomeScreen() {
  const [headerHeight, setHeaderHeight] = useState(0);

  const { scrollHandler, logoAnimatedStyle, bannerAnimatedStyle } = useCollapsibleHeader({
    headerHeight,
    logoHeight: LOGO_HEIGHT,
  });

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  const handleRegisterPress = () => {
    // TODO: Navigate to registration screen
    console.log('Register pressed');
  };

  const handleEditionPress = () => {
    // TODO: Show edition selector modal
    console.log('Edition pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Absolutely positioned headers */}
        <View style={styles.headerContainer}>
          <CollapsibleHeader
            logoAnimatedStyle={logoAnimatedStyle}
            bannerAnimatedStyle={bannerAnimatedStyle}
            onLayout={handleHeaderLayout}
            onRegisterPress={handleRegisterPress}
            onEditionPress={handleEditionPress}
          />
        </View>

        {/* Tabs with content */}
        {headerHeight > 0 && (
          <BrutalistTabs
            tabs={TABS}
            headerHeight={headerHeight}
            scrollHandler={scrollHandler}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
