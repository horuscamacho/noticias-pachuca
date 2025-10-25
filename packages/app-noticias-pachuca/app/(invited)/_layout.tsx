import { Tabs } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { BrutalistTabBar } from '@/components/tabs';

/**
 * InvitedLayoutScreen - Main app layout with brutalist custom tabs
 *
 * Features:
 * - Custom brutalist tab bar with thick borders and bold design
 * - 5 tabs: Home, Quick, Search, Citizen, Account
 * - Ionicons with filled/outline variants
 * - Active state with brown color and yellow accent
 * - Fully typed and accessible
 *
 * Tab Structure:
 * - Home: Main news feed
 * - Quick: Breaking/quick news
 * - Search: Search functionality
 * - Citizen: Citizen journalism submissions
 * - Account: User profile and settings
 */
export default function InvitedLayoutScreen() {
  return (
    <>
      <StatusBar hidden={true} />
      <Tabs
        tabBar={(props) => <BrutalistTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Inicio - Noticias principales',
        }}
      />
      <Tabs.Screen
        name="quick/index"
        options={{
          title: 'Quick',
          tabBarAccessibilityLabel: 'Noticias rápidas de última hora',
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          tabBarAccessibilityLabel: 'Buscar noticias',
        }}
      />
      <Tabs.Screen
        name="citizen/index"
        options={{
          title: 'Citizen',
          tabBarAccessibilityLabel: 'Periodismo ciudadano - Enviar noticias',
        }}
      />
      <Tabs.Screen
        name="account/index"
        options={{
          title: 'Account',
          tabBarAccessibilityLabel: 'Perfil y configuración de cuenta',
        }}
      />
    </Tabs>
    </>
  );
}
