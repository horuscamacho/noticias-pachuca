# Expo Router v6 Custom Tab Bar Implementation Guide

## Research Summary

**Date:** 2025-10-24
**Expo Router Version:** 6.0.13 (expo-router ~6.0.13)
**Target SDK:** Expo 54
**React Navigation:** @react-navigation/bottom-tabs ^7.4.0

---

## Table of Contents

1. [Overview](#overview)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Implementation Approaches](#implementation-approaches)
4. [Production-Ready Examples](#production-ready-examples)
5. [Icon Integration with Ionicons](#icon-integration-with-ionicons)
6. [State Management](#state-management)
7. [Accessibility Best Practices](#accessibility-best-practices)
8. [Performance Optimization](#performance-optimization)
9. [Best Practices for 2025/2026](#best-practices-for-20252026)

---

## Overview

Expo Router v6 offers **three approaches** for tab navigation:

### 1. JavaScript Tabs (Standard)
- Uses React Navigation's bottom tabs
- Familiar API if you've used React Navigation
- Customizable via `tabBar` prop
- **Recommended for most use cases**

### 2. Native Tabs
- Platform-native tab bars (UITabBar on iOS, BottomNavigationView on Android)
- React-first API using components
- Best native appearance and performance

### 3. Custom Tabs (Headless)
- Fully unstyled components from `expo-router/ui`
- Maximum flexibility for complex UI patterns
- More complex implementation

**Citation:**
[1] Expo Team. "JavaScript tabs - Expo Documentation." Expo, 2025. https://docs.expo.dev/router/advanced/tabs/

[2] Expo Team. "Custom tab layouts - Expo Documentation." Expo, 2025. https://docs.expo.dev/router/advanced/custom-tabs/

---

## TypeScript Interfaces

### BottomTabBarProps Interface

For custom tab bars using the `tabBar` prop:

```typescript
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabNavigationState, ParamListBase } from '@react-navigation/native';
import { EdgeInsets } from 'react-native-safe-area-context';

// Official type definition
export type BottomTabBarProps = {
  state: TabNavigationState<ParamListBase>;
  descriptors: BottomTabDescriptorMap;
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
  insets: EdgeInsets;
};
```

**Key Properties:**
- **`state`**: Contains navigation state including routes array and current index
- **`descriptors`**: Map of screen descriptors with options for each screen
- **`navigation`**: Navigation helpers for controlling navigation
- **`insets`**: Safe area insets from react-native-safe-area-context

**Citation:**
[3] React Navigation. "Bottom Tabs Navigator | React Navigation." React Navigation, 2025. https://reactnavigation.org/docs/bottom-tab-navigator/

[4] React Navigation. "react-navigation/packages/bottom-tabs/src/types.tsx." GitHub, 2025. https://github.com/react-navigation/react-navigation/blob/main/packages/bottom-tabs/src/types.tsx

### TabTriggerSlotProps Interface

For custom tabs using `expo-router/ui`:

```typescript
import { TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps, Ref } from 'react';
import { View, Pressable } from 'react-native';

// Usage example
export type TabButtonProps = TabTriggerSlotProps & {
  icon?: string;
  ref?: Ref<View>;
};

// The TabTriggerSlotProps includes:
// - isFocused: boolean
// - ...PressableProps (standard React Native Pressable props)
```

**Citation:**
[5] Expo Team. "Router UI - Expo Documentation." Expo SDK, 2025. https://docs.expo.dev/versions/latest/sdk/router-ui/

### Tab Navigation Event Map

```typescript
type TabNavigationEventMap = {
  tabPress: {
    data: { isAlreadyFocused: boolean };
    canPreventDefault: true;
  };
  tabLongPress: {
    data: { isAlreadyFocused: boolean };
  };
};
```

---

## Implementation Approaches

### Approach 1: Custom tabBar Prop (Recommended for Most Cases)

This approach uses React Navigation's standard bottom tabs with a custom component.

#### Step 1: Create Custom Tab Bar Component

```typescript
// components/CustomTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

export function CustomTabBar({
  state,
  descriptors,
  navigation
}: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // Get label
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        // Handle press
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Handle long press
        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {options.tabBarIcon &&
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? '#007AFF' : '#8E8E93',
                size: 24,
              })
            }
            <Text style={[
              styles.label,
              { color: isFocused ? '#007AFF' : '#8E8E93' }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});
```

#### Step 2: Use in Layout

```typescript
// app/(invited)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { CustomTabBar } from '@/components/CustomTabBar';
import { Ionicons } from '@expo/vector-icons';

export default function InvitedLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Citation:**
[6] Medium. "Bottom tab navigation in Expo Router with authentication | by Fredrik Burmester." Medium, 2024. https://medium.com/@fredrik.burmester/bottom-tabs-in-expo-router-with-authentication-acf7f7edee6d

### Approach 2: expo-router/ui Custom Tabs (Advanced)

For maximum flexibility and custom UI patterns.

#### Step 1: Create Custom Tab Button Component

```typescript
// components/TabButton.tsx
import React from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: IconName;
  iconFocused?: IconName;
};

export const TabButton = React.forwardRef<View, TabButtonProps>(
  ({ icon, iconFocused, children, isFocused, ...props }, ref) => {
    const activeColor = '#007AFF';
    const inactiveColor = '#8E8E93';

    return (
      <Pressable
        ref={ref}
        {...props}
        style={[
          styles.container,
          isFocused && styles.containerFocused,
        ]}
      >
        {icon && (
          <Ionicons
            name={isFocused && iconFocused ? iconFocused : icon}
            size={24}
            color={isFocused ? activeColor : inactiveColor}
          />
        )}
        <Text
          style={[
            styles.label,
            { color: isFocused ? activeColor : inactiveColor },
          ]}
        >
          {children}
        </Text>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  containerFocused: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
```

#### Step 2: Create Layout with Custom Tabs

```typescript
// app/(invited)/_layout.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, TabSlot, TabList, TabTrigger } from 'expo-router/ui';
import { TabButton } from '@/components/TabButton';

export default function InvitedLayout() {
  return (
    <Tabs>
      <TabSlot />
      <View style={styles.tabBar}>
        <TabList style={styles.tabList}>
          <TabTrigger
            name="home"
            href="/home"
            asChild
          >
            <TabButton icon="home-outline" iconFocused="home">
              Home
            </TabButton>
          </TabTrigger>

          <TabTrigger
            name="search"
            href="/search"
            asChild
          >
            <TabButton icon="search-outline" iconFocused="search">
              Search
            </TabButton>
          </TabTrigger>

          <TabTrigger
            name="profile"
            href="/profile"
            asChild
          >
            <TabButton icon="person-outline" iconFocused="person">
              Profile
            </TabButton>
          </TabTrigger>
        </TabList>
      </View>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
  },
  tabList: {
    flexDirection: 'row',
  },
});
```

**Citation:**
[7] Expo Team. "Custom tab layouts - Expo Documentation." Expo Router, 2025. https://docs.expo.dev/router/advanced/custom-tabs/

[8] CodingEasyPeasy. "Expo Router: Create Custom Tab Bar Layouts for a Unique App Experience." CodingEasyPeasy, 2024. https://www.codingeasypeasy.com/blog/expo-router-create-custom-tab-bar-layouts-for-a-unique-app-experience

---

## Production-Ready Examples

### Example 1: Memoized Tab Bar with Performance Optimization

```typescript
// components/OptimizedTabBar.tsx
import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Individual Tab Button Component (memoized)
const TabButton = React.memo<{
  route: any;
  index: number;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
}>(({ route, isFocused, options, onPress, onLongPress }) => {
  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
      ? options.title
      : route.name;

  const activeColor = '#007AFF';
  const inactiveColor = '#8E8E93';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      {options.tabBarIcon &&
        options.tabBarIcon({
          focused: isFocused,
          color: isFocused ? activeColor : inactiveColor,
          size: 24,
        })}
      <Text
        style={[
          styles.label,
          { color: isFocused ? activeColor : inactiveColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

TabButton.displayName = 'TabButton';

// Main Tab Bar Component
export const OptimizedTabBar = React.memo<BottomTabBarProps>(
  ({ state, descriptors, navigation }) => {
    // Memoize handlers to prevent unnecessary re-renders
    const createOnPress = useCallback(
      (routeName: string, routeKey: string, isFocused: boolean) => () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: routeKey,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(routeName);
        }
      },
      [navigation]
    );

    const createOnLongPress = useCallback(
      (routeKey: string) => () => {
        navigation.emit({
          type: 'tabLongPress',
          target: routeKey,
        });
      },
      [navigation]
    );

    // Memoize tab buttons
    const tabs = useMemo(
      () =>
        state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          return (
            <TabButton
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              options={options}
              onPress={createOnPress(route.name, route.key, isFocused)}
              onLongPress={createOnLongPress(route.key)}
            />
          );
        }),
      [state.routes, state.index, descriptors, createOnPress, createOnLongPress]
    );

    return <View style={styles.container}>{tabs}</View>;
  }
);

OptimizedTabBar.displayName = 'OptimizedTabBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
```

**Citation:**
[9] DigitalOcean. "How To Avoid Performance Pitfalls in React with memo, useMemo, and useCallback." DigitalOcean, 2022. https://www.digitalocean.com/community/tutorials/how-to-avoid-performance-pitfalls-in-react-with-memo-usememo-and-usecallback

### Example 2: Safe Area Aware Tab Bar

```typescript
// components/SafeAreaTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SafeAreaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            {options.tabBarIcon &&
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? '#007AFF' : '#8E8E93',
                size: 24,
              })}
            <Text
              style={[
                styles.label,
                { color: isFocused ? '#007AFF' : '#8E8E93' },
              ]}
            >
              {options.title || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});
```

### Example 3: Tab Bar with Badge Support

```typescript
// components/TabBarWithBadge.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

interface TabIconProps {
  icon: React.ReactNode;
  badge?: number | string;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, badge }) => (
  <View>
    {icon}
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </Text>
      </View>
    )}
  </View>
);

export function TabBarWithBadge({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = options.tabBarIcon
          ? options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? '#007AFF' : '#8E8E93',
              size: 24,
            })
          : null;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <TabIcon icon={icon} badge={options.tabBarBadge} />
            <Text
              style={[
                styles.label,
                { color: isFocused ? '#007AFF' : '#8E8E93' },
              ]}
            >
              {options.title || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
```

---

## Icon Integration with Ionicons

### Best Practices for Icons

```typescript
import { Ionicons } from '@expo/vector-icons';

// Use focused and unfocused variants
const iconMapping = {
  home: {
    focused: 'home' as const,
    unfocused: 'home-outline' as const,
  },
  search: {
    focused: 'search' as const,
    unfocused: 'search-outline' as const,
  },
  notifications: {
    focused: 'notifications' as const,
    unfocused: 'notifications-outline' as const,
  },
  person: {
    focused: 'person' as const,
    unfocused: 'person-outline' as const,
  },
  settings: {
    focused: 'settings' as const,
    unfocused: 'settings-outline' as const,
  },
} as const;

// Usage in Tabs.Screen
<Tabs.Screen
  name="home/index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? iconMapping.home.focused : iconMapping.home.unfocused}
        size={24}
        color={color}
      />
    ),
  }}
/>
```

### Icon Helper Component

```typescript
// components/TabBarIcon.tsx
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabBarIconProps {
  focusedIcon: IoniconsName;
  unfocusedIcon: IoniconsName;
  color: string;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  focusedIcon,
  unfocusedIcon,
  color,
  focused,
  size = 24,
}) => {
  return (
    <Ionicons
      name={focused ? focusedIcon : unfocusedIcon}
      size={size}
      color={color}
    />
  );
};

// Usage
<Tabs.Screen
  name="home/index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, focused }) => (
      <TabBarIcon
        focusedIcon="home"
        unfocusedIcon="home-outline"
        color={color}
        focused={focused}
      />
    ),
  }}
/>
```

**Citation:**
[10] Expo Team. "Add navigation - Expo Documentation." Expo Tutorial, 2025. https://docs.expo.dev/tutorial/add-navigation/

---

## State Management

### Tab Navigation State

```typescript
// Access current tab index
const currentTabIndex = state.index;

// Access all routes
const routes = state.routes;

// Check if specific tab is focused
const isHomeFocused = state.routes[state.index].name === 'home';

// Navigate programmatically
navigation.navigate('home');

// Navigate with params
navigation.navigate('search', { query: 'test' });
```

### Reset Tab Navigation State

Using `expo-router/ui`:

```typescript
<TabTrigger
  name="home"
  href="/home"
  reset="always" // Options: 'always' | 'onLongPress' | 'never'
>
  <TabButton>Home</TabButton>
</TabTrigger>
```

**Reset Options:**
- `"always"`: Returns to index route every time tab is pressed
- `"onLongPress"`: Resets only on long press
- `"never"`: Never resets navigation state

### Custom Tab State Hook

```typescript
// hooks/useTabState.ts
import { useCallback, useState } from 'react';

interface TabState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isTabActive: (tab: string) => boolean;
}

export function useTabState(initialTab: string): TabState {
  const [activeTab, setActiveTab] = useState(initialTab);

  const isTabActive = useCallback(
    (tab: string) => activeTab === tab,
    [activeTab]
  );

  return {
    activeTab,
    setActiveTab,
    isTabActive,
  };
}
```

**Citation:**
[11] Expo Team. "Router UI - Expo Documentation." Expo Router UI API Reference, 2025. https://docs.expo.dev/versions/latest/sdk/router-ui/

---

## Accessibility Best Practices

### Essential Accessibility Props

```typescript
<TouchableOpacity
  // Announces role to screen readers
  accessibilityRole="button"

  // Indicates selected state
  accessibilityState={isFocused ? { selected: true } : {}}

  // Custom label for screen readers
  accessibilityLabel={options.tabBarAccessibilityLabel || `Navigate to ${label}`}

  // Hint for screen reader users
  accessibilityHint={`Navigates to ${label} screen`}

  // Test automation ID
  testID={options.tabBarButtonTestID || `tab-${route.name}`}

  // Handle press events
  onPress={onPress}
  onLongPress={onLongPress}
>
  {/* Tab content */}
</TouchableOpacity>
```

### Complete Accessible Tab Bar

```typescript
// components/AccessibleTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function AccessibleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View
      style={styles.container}
      accessible={false} // Don't group as single element
      accessibilityLabel="Tab navigation bar"
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{
              selected: isFocused,
              disabled: false,
            }}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ||
              `${label} tab${isFocused ? ', selected' : ''}`
            }
            accessibilityHint={`Navigate to ${label} screen`}
            testID={options.tabBarButtonTestID || `tab-button-${route.name}`}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tab,
              isFocused && styles.tabFocused,
            ]}
            // Important for Android TalkBack
            importantForAccessibility="yes"
          >
            {options.tabBarIcon &&
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? '#007AFF' : '#8E8E93',
                size: 24,
              })}
            <Text
              style={[
                styles.label,
                { color: isFocused ? '#007AFF' : '#8E8E93' },
              ]}
              // Prevent double-reading on some screen readers
              accessible={false}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 50, // Ensure minimum touch target size
  },
  tabFocused: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});
```

### Web Accessibility (ARIA)

For web platforms:

```typescript
import { Platform } from 'react-native';

const tabProps = {
  accessibilityRole: 'tab' as const,
  ...(Platform.OS === 'web' && {
    'aria-selected': isFocused,
    'aria-label': label,
    role: 'tab',
  }),
};
```

**Citation:**
[12] React Native. "Accessibility · React Native." React Native Documentation, 2025. https://reactnative.dev/docs/accessibility

[13] React Native for Web. "Accessibility // React Native for Web." React Native for Web Docs, 2025. https://necolas.github.io/react-native-web/docs/accessibility/

---

## Performance Optimization

### 1. Use React.memo for Tab Components

```typescript
const TabButton = React.memo<TabButtonProps>(({ /* props */ }) => {
  // Component implementation
});

TabButton.displayName = 'TabButton';
```

### 2. Use useCallback for Event Handlers

```typescript
const createOnPress = useCallback(
  (routeName: string, routeKey: string, isFocused: boolean) => () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  },
  [navigation] // Only recreate if navigation changes
);
```

### 3. Use useMemo for Computed Values

```typescript
const tabs = useMemo(
  () =>
    state.routes.map((route, index) => {
      const { options } = descriptors[route.key];
      const isFocused = state.index === index;
      // ... render tab
    }),
  [state.routes, state.index, descriptors] // Only recompute when these change
);
```

### 4. Optimize Inline Styles

```typescript
// Bad - creates new object on every render
<View style={{ flexDirection: 'row', backgroundColor: '#FFF' }} />

// Good - use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
  },
});

<View style={styles.container} />
```

### 5. Lazy Load Inactive Tabs

```typescript
<Tabs
  screenOptions={{
    lazy: true, // Only render tab content when first accessed
    freezeOnBlur: true, // Freeze inactive screens to save resources
  }}
>
  {/* ... */}
</Tabs>
```

### 6. Avoid Inline Functions in Options

```typescript
// Bad - creates new function on every render
<Tabs.Screen
  name="home"
  options={{
    tabBarIcon: ({ color }) => <Ionicons name="home" color={color} />,
  }}
/>

// Good - use separate component or constant
const HomeIcon = ({ color }: { color: string }) => (
  <Ionicons name="home" color={color} />
);

<Tabs.Screen
  name="home"
  options={{
    tabBarIcon: HomeIcon,
  }}
/>
```

### 7. Detach Inactive Screens

For `expo-router/ui`:

```typescript
<TabSlot
  detachInactiveScreens={true} // Remove inactive screens from DOM
/>
```

### Complete Optimized Example

```typescript
// components/PerformanceOptimizedTabBar.tsx
import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Styles defined once outside component
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});

// Colors defined once
const COLORS = {
  active: '#007AFF',
  inactive: '#8E8E93',
} as const;

// Memoized tab button component
const TabButton = React.memo<{
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
}>(({ route, isFocused, options, onPress, onLongPress }) => {
  const label = options.title || route.name;
  const color = isFocused ? COLORS.active : COLORS.inactive;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      {options.tabBarIcon &&
        options.tabBarIcon({
          focused: isFocused,
          color,
          size: 24,
        })}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
});

TabButton.displayName = 'TabButton';

// Main component
export const PerformanceOptimizedTabBar = React.memo<BottomTabBarProps>(
  ({ state, descriptors, navigation }) => {
    // Memoized handlers
    const handlePress = useCallback(
      (routeName: string, routeKey: string, isFocused: boolean) => () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: routeKey,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(routeName);
        }
      },
      [navigation]
    );

    const handleLongPress = useCallback(
      (routeKey: string) => () => {
        navigation.emit({
          type: 'tabLongPress',
          target: routeKey,
        });
      },
      [navigation]
    );

    // Memoized tabs
    const tabs = useMemo(
      () =>
        state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              onPress={handlePress(route.name, route.key, isFocused)}
              onLongPress={handleLongPress(route.key)}
            />
          );
        }),
      [state.routes, state.index, descriptors, handlePress, handleLongPress]
    );

    return <View style={styles.container}>{tabs}</View>;
  }
);

PerformanceOptimizedTabBar.displayName = 'PerformanceOptimizedTabBar';
```

**Citation:**
[14] Shopify. "Bottom Tabs | React Native Performance." Shopify React Native Performance, 2024. https://shopify.github.io/react-native-performance/docs/guides/react-native-performance-navigation/react-native-performance-navigation-bottom-tabs/

[15] DEV Community. "Optimizing Performance in React Native Apps (Expo)." DEV Community, 2024. https://dev.to/vrinch/optimizing-performance-in-react-native-apps-expo-354k

---

## Best Practices for 2025/2026

### 1. Choose the Right Approach

**Use Standard JavaScript Tabs (with custom tabBar) when:**
- You need a custom design but standard tab behavior
- You want React Navigation compatibility
- You need quick implementation

**Use expo-router/ui Custom Tabs when:**
- You need completely custom UI patterns
- You want maximum flexibility
- You're building complex tab interactions

**Use Native Tabs when:**
- Native look and feel is priority
- Performance is critical
- Platform consistency matters

### 2. TypeScript Best Practices

```typescript
// Define strict types for tab configuration
interface TabConfig {
  name: string;
  title: string;
  icon: {
    focused: string;
    unfocused: string;
  };
  badge?: number;
  hidden?: boolean;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  home: {
    name: 'home',
    title: 'Home',
    icon: {
      focused: 'home',
      unfocused: 'home-outline',
    },
  },
  search: {
    name: 'search',
    title: 'Search',
    icon: {
      focused: 'search',
      unfocused: 'search-outline',
    },
  },
};
```

### 3. Separation of Concerns

```
project/
├── app/
│   └── (tabs)/
│       ├── _layout.tsx          # Tab configuration
│       ├── home.tsx
│       └── search.tsx
├── components/
│   ├── navigation/
│   │   ├── CustomTabBar.tsx     # Tab bar component
│   │   ├── TabButton.tsx        # Individual tab button
│   │   └── TabBarIcon.tsx       # Icon component
│   └── shared/
└── hooks/
    ├── useTabState.ts           # Tab state management
    └── useTabNavigation.ts      # Navigation helpers
```

### 4. Theme Integration

```typescript
// hooks/useTabBarTheme.ts
import { useColorScheme } from 'react-native';

export function useTabBarTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    backgroundColor: isDark ? '#000000' : '#FFFFFF',
    borderColor: isDark ? '#1C1C1E' : '#E5E5EA',
    activeColor: isDark ? '#0A84FF' : '#007AFF',
    inactiveColor: isDark ? '#8E8E93' : '#8E8E93',
    labelColor: isDark ? '#FFFFFF' : '#000000',
  };
}

// Usage in CustomTabBar
const theme = useTabBarTheme();

<View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
  {/* ... */}
</View>
```

### 5. Platform-Specific Customization

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tab: {
    minHeight: Platform.select({
      ios: 50,
      android: 56,
      web: 48,
    }),
  },
});
```

### 6. Animation Support

```typescript
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTabButton = ({ isFocused, children }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1);
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
```

### 7. Testing Considerations

```typescript
// __tests__/CustomTabBar.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { CustomTabBar } from '../components/CustomTabBar';

describe('CustomTabBar', () => {
  it('should render all tabs', () => {
    const { getByTestId } = render(<CustomTabBar {...mockProps} />);
    expect(getByTestId('tab-button-home')).toBeTruthy();
    expect(getByTestId('tab-button-search')).toBeTruthy();
  });

  it('should handle tab press', () => {
    const mockNavigate = jest.fn();
    const { getByTestId } = render(
      <CustomTabBar {...mockProps} navigation={{ navigate: mockNavigate }} />
    );

    fireEvent.press(getByTestId('tab-button-search'));
    expect(mockNavigate).toHaveBeenCalledWith('search');
  });

  it('should indicate focused state', () => {
    const { getByTestId } = render(<CustomTabBar {...mockProps} />);
    const homeTab = getByTestId('tab-button-home');

    expect(homeTab.props.accessibilityState.selected).toBe(true);
  });
});
```

### 8. Error Boundaries

```typescript
// components/TabBarErrorBoundary.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class TabBarErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TabBar Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tab navigation error</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

// Usage in _layout.tsx
<TabBarErrorBoundary>
  <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
    {/* tabs */}
  </Tabs>
</TabBarErrorBoundary>
```

### 9. Hiding Specific Tabs

```typescript
// Hide tabs that should only be accessible programmatically
<Tabs>
  <Tabs.Screen name="home" />
  <Tabs.Screen name="search" />
  <Tabs.Screen
    name="settings/detail"
    options={{
      href: null, // Hides from tab bar but still accessible
    }}
  />
</Tabs>
```

### 10. Dynamic Tab Configuration

```typescript
// hooks/useTabConfig.ts
import { useMemo } from 'react';

export function useTabConfig(userRole: string) {
  return useMemo(() => {
    const baseTabs = [
      { name: 'home', title: 'Home' },
      { name: 'search', title: 'Search' },
    ];

    if (userRole === 'admin') {
      baseTabs.push({ name: 'admin', title: 'Admin' });
    }

    return baseTabs;
  }, [userRole]);
}

// Usage in _layout.tsx
const tabConfig = useTabConfig(userRole);

<Tabs>
  {tabConfig.map(tab => (
    <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
  ))}
</Tabs>
```

---

## Summary and Recommendations

### Key Takeaways

1. **For Most Use Cases**: Use the standard JavaScript tabs with custom `tabBar` prop
   - Familiar API, good documentation
   - TypeScript support via `BottomTabBarProps`
   - Performance optimizations well-documented

2. **For Maximum Flexibility**: Use `expo-router/ui` custom tabs
   - Completely unstyled components
   - Full control over rendering
   - Best for unique designs

3. **Always Optimize**: Use `React.memo`, `useCallback`, and `useMemo`
   - Prevents unnecessary re-renders
   - Improves performance on low-end devices
   - Critical for smooth tab switching

4. **Accessibility First**: Include proper accessibility props
   - Screen reader support
   - Proper ARIA labels for web
   - Test with VoiceOver/TalkBack

5. **TypeScript**: Strongly type all custom components
   - Better IDE support
   - Catch errors at compile time
   - Improved maintainability

### Migration Path for Existing Projects

If you're currently using a basic tab setup:

1. Start with the `tabBar` prop approach
2. Implement memoization for performance
3. Add accessibility props
4. Add animations if needed
5. Consider `expo-router/ui` only if you need complete custom UI

---

## Citations

[1] Expo Team. "JavaScript tabs - Expo Documentation." Expo, 2025. https://docs.expo.dev/router/advanced/tabs/

[2] Expo Team. "Custom tab layouts - Expo Documentation." Expo, 2025. https://docs.expo.dev/router/advanced/custom-tabs/

[3] React Navigation. "Bottom Tabs Navigator | React Navigation." React Navigation, 2025. https://reactnavigation.org/docs/bottom-tab-navigator/

[4] React Navigation. "react-navigation/packages/bottom-tabs/src/types.tsx." GitHub, 2025. https://github.com/react-navigation/react-navigation/blob/main/packages/bottom-tabs/src/types.tsx

[5] Expo Team. "Router UI - Expo Documentation." Expo SDK, 2025. https://docs.expo.dev/versions/latest/sdk/router-ui/

[6] Burmester, Fredrik. "Bottom tab navigation in Expo Router with authentication." Medium, 2024. https://medium.com/@fredrik.burmester/bottom-tabs-in-expo-router-with-authentication-acf7f7edee6d

[7] Expo Team. "Custom tab layouts - Expo Documentation." Expo Router, 2025. https://docs.expo.dev/router/advanced/custom-tabs/

[8] CodingEasyPeasy. "Expo Router: Create Custom Tab Bar Layouts for a Unique App Experience." CodingEasyPeasy, 2024. https://www.codingeasypeasy.com/blog/expo-router-create-custom-tab-bar-layouts-for-a-unique-app-experience

[9] DigitalOcean. "How To Avoid Performance Pitfalls in React with memo, useMemo, and useCallback." DigitalOcean, 2022. https://www.digitalocean.com/community/tutorials/how-to-avoid-performance-pitfalls-in-react-with-memo-usememo-and-usecallback

[10] Expo Team. "Add navigation - Expo Documentation." Expo Tutorial, 2025. https://docs.expo.dev/tutorial/add-navigation/

[11] Expo Team. "Router UI - Expo Documentation." Expo Router UI API Reference, 2025. https://docs.expo.dev/versions/latest/sdk/router-ui/

[12] React Native. "Accessibility · React Native." React Native Documentation, 2025. https://reactnative.dev/docs/accessibility

[13] React Native for Web. "Accessibility // React Native for Web." React Native for Web Docs, 2025. https://necolas.github.io/react-native-web/docs/accessibility/

[14] Shopify. "Bottom Tabs | React Native Performance." Shopify React Native Performance, 2024. https://shopify.github.io/react-native-performance/docs/guides/react-native-performance-navigation/react-native-performance-navigation-bottom-tabs/

[15] DEV Community. "Optimizing Performance in React Native Apps (Expo)." DEV Community, 2024. https://dev.to/vrinch/optimizing-performance-in-react-native-apps-expo-354k

---

## JSON Research Summary

```json
{
  "search_summary": {
    "platforms_searched": [
      "Expo Documentation",
      "React Navigation Documentation",
      "GitHub",
      "Medium",
      "Stack Overflow",
      "DEV Community"
    ],
    "repositories_analyzed": 5,
    "docs_reviewed": 12
  },
  "repositories": [
    {
      "citation": "Expo Team. 'expo/router.' GitHub, Archived Mar 17, 2025. https://github.com/expo/router",
      "platform": "github",
      "stats": {
        "status": "archived",
        "last_updated": "2025-03-17"
      },
      "key_features": [
        "File-based routing",
        "TypeScript support",
        "Custom tab layouts",
        "Native tabs support"
      ],
      "architecture": "File-system based router built on React Navigation",
      "code_quality": {
        "testing": "comprehensive",
        "documentation": "excellent",
        "maintenance": "archived (moved to expo/expo monorepo)"
      },
      "usage_example": "expo-router ~6.0.13 in Expo SDK 54",
      "limitations": [
        "Repository archived (now in expo/expo)",
        "Some features require Expo SDK 52+"
      ],
      "alternatives": [
        "React Navigation standalone",
        "react-native-navigation"
      ]
    },
    {
      "citation": "React Navigation. 'react-navigation/react-navigation.' GitHub, 2025. https://github.com/react-navigation/react-navigation",
      "platform": "github",
      "stats": {
        "stars": "high (23k+)",
        "maintenance": "active"
      },
      "key_features": [
        "Bottom tabs navigator",
        "TypeScript first-class support",
        "Custom tab bar support",
        "Accessibility built-in"
      ],
      "architecture": "Modular navigation library with separate packages",
      "code_quality": {
        "testing": "comprehensive",
        "documentation": "excellent",
        "maintenance": "active"
      },
      "usage_example": "@react-navigation/bottom-tabs ^7.4.0"
    }
  ],
  "technical_insights": {
    "common_patterns": [
      "Using BottomTabBarProps interface for type safety",
      "Memoization with React.memo and useCallback",
      "Separation of tab bar logic into dedicated components",
      "Using Ionicons with focused/unfocused variants",
      "Safe area insets handling for modern devices"
    ],
    "best_practices": [
      "Always include accessibility props (accessibilityRole, accessibilityState)",
      "Use TypeScript for better IDE support and error catching",
      "Optimize performance with React.memo and useMemo",
      "Platform-specific styling for native look and feel",
      "Test with screen readers (VoiceOver/TalkBack)"
    ],
    "pitfalls": [
      "Inline function creation in render causing re-renders",
      "Missing accessibility labels",
      "Not handling safe area insets",
      "Creating new style objects on every render",
      "Not memoizing event handlers"
    ],
    "emerging_trends": [
      "expo-router/ui headless components gaining adoption",
      "Native tabs for better platform consistency",
      "Animated tab transitions with Reanimated 2/3",
      "Dark mode theme integration",
      "TypeScript-first development"
    ]
  },
  "implementation_recommendations": [
    {
      "scenario": "Standard app with custom tab design",
      "recommended_solution": "Use JavaScript tabs with custom tabBar prop and BottomTabBarProps",
      "rationale": "Best balance of flexibility, documentation, and TypeScript support. Well-tested and widely adopted."
    },
    {
      "scenario": "App requiring unique tab UI patterns",
      "recommended_solution": "Use expo-router/ui custom tabs with TabTrigger and TabSlot",
      "rationale": "Maximum flexibility for custom designs. Headless components allow complete control over rendering."
    },
    {
      "scenario": "App prioritizing native look and performance",
      "recommended_solution": "Use Native Tabs with platform-native components",
      "rationale": "Best performance and native platform consistency. Uses UITabBar (iOS) and BottomNavigationView (Android)."
    },
    {
      "scenario": "Large app with many tabs and complex state",
      "recommended_solution": "Custom tabBar with performance optimizations (React.memo, useCallback, lazy loading)",
      "rationale": "Prevents performance issues on navigation. Critical for maintaining smooth UX."
    }
  ],
  "community_insights": {
    "popular_solutions": [
      "BottomTabBarProps with custom component (most common)",
      "Ionicons for tab icons (de facto standard)",
      "React.memo + useCallback pattern for optimization",
      "Safe area context for modern device support"
    ],
    "controversial_topics": [
      "When to use expo-router/ui vs standard tabs",
      "Performance impact of custom animations",
      "Web vs native tab behavior differences"
    ],
    "expert_opinions": [
      "Expo team recommends expo-router/ui for SDK 52+ custom implementations",
      "React Navigation team suggests starting with built-in components before customizing",
      "Performance experts recommend lazy loading and freezeOnBlur for tab optimization"
    ]
  }
}
```

---

**End of Guide**

This comprehensive guide covers all aspects of implementing custom tab bars in Expo Router v6, with production-ready examples, TypeScript interfaces, and best practices for 2025/2026.