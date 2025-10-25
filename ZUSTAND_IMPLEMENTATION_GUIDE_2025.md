# Zustand Implementation Guide for React Native Expo - 2025

## Executive Summary

**Zustand v5.0.8** is the recommended state management solution for your React Native Expo app with tab navigation. This guide provides complete, production-ready implementations based on the latest 2025 best practices.

## Quick Start

### Installation

```bash
cd /Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo

# Install Zustand v5
npm install zustand@5.0.8

# Install optional dependencies
npm install immer
npm install --save-dev @redux-devtools/extension

# AsyncStorage (for persistence)
npx expo install @react-native-async-storage/async-storage
```

### Project Structure

```
mobile-expo/
└── src/
    └── stores/
        ├── useTabStore.ts           # Main tab store
        ├── useAuthStore.ts          # Auth store (example)
        └── slices/                  # Optional: if using slice pattern
            ├── createTabSlice.ts
            └── createFilterSlice.ts
```

---

## Complete Tab Store Implementation

### File: `src/stores/useTabStore.ts`

This is a **production-ready** store for managing multiple independent tabs with scroll positions, filters, and data.

```typescript
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export interface TabScrollPosition {
  offset: number;
  contentHeight: number;
}

export interface TabFilters {
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  agentType?: string;
  editorialLean?: string;
  keywords?: string[];
}

export interface TabContent {
  id: string;
  data: any[];
  scrollPosition: TabScrollPosition;
  filters: TabFilters;
  isRefreshing: boolean;
  lastUpdated: number | null;
}

export interface TabStore {
  // ========================================
  // STATE
  // ========================================
  activeTabId: string;
  tabs: Record<string, TabContent>;

  // ========================================
  // TAB MANAGEMENT
  // ========================================
  setActiveTab: (tabId: string) => void;
  initializeTab: (tabId: string, defaultFilters?: TabFilters) => void;
  getTab: (tabId: string) => TabContent | undefined;

  // ========================================
  // SCROLL POSITION
  // ========================================
  updateScrollPosition: (tabId: string, offset: number, contentHeight: number) => void;
  getScrollPosition: (tabId: string) => TabScrollPosition;
  resetScrollPosition: (tabId: string) => void;

  // ========================================
  // TAB CONTENT
  // ========================================
  setTabData: (tabId: string, data: any[]) => void;
  appendTabData: (tabId: string, data: any[]) => void;
  clearTabData: (tabId: string) => void;
  getTabData: (tabId: string) => any[];

  // ========================================
  // FILTERS
  // ========================================
  setTabFilters: (tabId: string, filters: TabFilters) => void;
  getTabFilters: (tabId: string) => TabFilters;
  clearTabFilters: (tabId: string) => void;

  // ========================================
  // REFRESH STATE
  // ========================================
  setTabRefreshing: (tabId: string, isRefreshing: boolean) => void;
  isTabRefreshing: (tabId: string) => boolean;

  // ========================================
  // UTILITIES
  // ========================================
  resetTab: (tabId: string) => void;
  resetAllTabs: () => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_TAB_STATE: Omit<TabContent, 'id'> = {
  data: [],
  scrollPosition: { offset: 0, contentHeight: 0 },
  filters: { limit: 20, sortBy: 'generatedAt', sortOrder: 'desc' },
  isRefreshing: false,
  lastUpdated: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useTabStore = create<TabStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ========================================
        // INITIAL STATE
        // ========================================
        activeTabId: 'generated',
        tabs: {},

        // ========================================
        // TAB MANAGEMENT
        // ========================================
        setActiveTab: (tabId) =>
          set(
            (state) => {
              state.activeTabId = tabId;

              // Auto-initialize if doesn't exist
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }
            },
            false,
            'tab/setActive'
          ),

        initializeTab: (tabId, defaultFilters) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = {
                  ...DEFAULT_TAB_STATE,
                  id: tabId,
                  filters: { ...DEFAULT_TAB_STATE.filters, ...defaultFilters },
                };
              }
            },
            false,
            'tab/initialize'
          ),

        getTab: (tabId) => {
          return get().tabs[tabId];
        },

        // ========================================
        // SCROLL POSITION MANAGEMENT
        // ========================================
        updateScrollPosition: (tabId, offset, contentHeight) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }

              state.tabs[tabId].scrollPosition = { offset, contentHeight };
            },
            false,
            'tab/updateScroll'
          ),

        getScrollPosition: (tabId) => {
          const tab = get().tabs[tabId];
          return tab?.scrollPosition || { offset: 0, contentHeight: 0 };
        },

        resetScrollPosition: (tabId) =>
          set(
            (state) => {
              if (state.tabs[tabId]) {
                state.tabs[tabId].scrollPosition = { offset: 0, contentHeight: 0 };
              }
            },
            false,
            'tab/resetScroll'
          ),

        // ========================================
        // TAB CONTENT MANAGEMENT
        // ========================================
        setTabData: (tabId, data) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }

              state.tabs[tabId].data = data;
              state.tabs[tabId].lastUpdated = Date.now();
            },
            false,
            'tab/setData'
          ),

        appendTabData: (tabId, data) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }

              state.tabs[tabId].data.push(...data);
              state.tabs[tabId].lastUpdated = Date.now();
            },
            false,
            'tab/appendData'
          ),

        clearTabData: (tabId) =>
          set(
            (state) => {
              if (state.tabs[tabId]) {
                state.tabs[tabId].data = [];
              }
            },
            false,
            'tab/clearData'
          ),

        getTabData: (tabId) => {
          const tab = get().tabs[tabId];
          return tab?.data || [];
        },

        // ========================================
        // FILTERS MANAGEMENT
        // ========================================
        setTabFilters: (tabId, filters) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }

              state.tabs[tabId].filters = { ...state.tabs[tabId].filters, ...filters };
            },
            false,
            'tab/setFilters'
          ),

        getTabFilters: (tabId) => {
          const tab = get().tabs[tabId];
          return tab?.filters || DEFAULT_TAB_STATE.filters;
        },

        clearTabFilters: (tabId) =>
          set(
            (state) => {
              if (state.tabs[tabId]) {
                state.tabs[tabId].filters = { ...DEFAULT_TAB_STATE.filters };
              }
            },
            false,
            'tab/clearFilters'
          ),

        // ========================================
        // REFRESH STATE
        // ========================================
        setTabRefreshing: (tabId, isRefreshing) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }

              state.tabs[tabId].isRefreshing = isRefreshing;
            },
            false,
            'tab/setRefreshing'
          ),

        isTabRefreshing: (tabId) => {
          const tab = get().tabs[tabId];
          return tab?.isRefreshing || false;
        },

        // ========================================
        // UTILITIES
        // ========================================
        resetTab: (tabId) =>
          set(
            (state) => {
              state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
            },
            false,
            'tab/reset'
          ),

        resetAllTabs: () =>
          set(
            (state) => {
              state.tabs = {};
              state.activeTabId = 'generated';
            },
            false,
            'tab/resetAll'
          ),
      })),
      {
        name: 'tab-storage',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist what's necessary
        partialize: (state) => ({
          activeTabId: state.activeTabId,
          tabs: Object.fromEntries(
            Object.entries(state.tabs).map(([id, tab]) => [
              id,
              {
                id: tab.id,
                scrollPosition: tab.scrollPosition,
                filters: tab.filters,
                // DON'T persist data, isRefreshing, lastUpdated
                data: [],
                isRefreshing: false,
                lastUpdated: null,
              },
            ])
          ),
        }),
      }
    ),
    { name: 'TabStore' }
  )
);
```

---

## Component Integration Examples

### Example 1: Basic Tab Component

```typescript
// File: src/components/generated/GeneratedContentTab.tsx
import React, { useEffect, useRef } from 'react';
import { FlatList, View, ActivityIndicator } from 'react-native';
import { useTabStore } from '@/src/stores/useTabStore';
import { useShallow } from 'zustand/react/shallow';

export function GeneratedContentTab() {
  const flatListRef = useRef<FlatList>(null);
  const TAB_ID = 'generated';

  // ============================================
  // ZUSTAND SELECTORS (with useShallow)
  // ============================================
  const { scrollPosition, updateScroll, initTab } = useTabStore(
    useShallow((state) => ({
      scrollPosition: state.getScrollPosition(TAB_ID),
      updateScroll: (offset: number, height: number) =>
        state.updateScrollPosition(TAB_ID, offset, height),
      initTab: () => state.initializeTab(TAB_ID, { limit: 20 }),
    }))
  );

  // Get data from your existing hook (React Query)
  const { data, isLoading, refetch } = useGeneratedContent(filters);

  // ============================================
  // LIFECYCLE
  // ============================================
  useEffect(() => {
    initTab();
  }, []);

  // Restore scroll position when component mounts or tab becomes active
  useEffect(() => {
    if (scrollPosition.offset > 0 && flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: scrollPosition.offset,
        animated: false,
      });
    }
  }, [scrollPosition.offset]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    updateScroll(offset, contentHeight);
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={data?.items || []}
      renderItem={({ item }) => <ContentCard content={item} />}
      keyExtractor={(item) => item.id}
      onScroll={handleScroll}
      scrollEventThrottle={100} // Update every 100ms max (performance)
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
    />
  );
}
```

### Example 2: Tab with Filters

```typescript
// File: src/components/generated/GeneratedContentTabWithFilters.tsx
import React, { useEffect } from 'react';
import { useTabStore } from '@/src/stores/useTabStore';
import { useShallow } from 'zustand/react/shallow';

export function GeneratedContentTabWithFilters() {
  const TAB_ID = 'generated';

  // Multiple independent selectors
  const filters = useTabStore((state) => state.getTabFilters(TAB_ID));
  const setFilters = useTabStore((state) => state.setTabFilters);
  const clearFilters = useTabStore((state) => state.clearTabFilters);

  // Use filters in your React Query hook
  const { data } = useGeneratedContent(filters);

  const handleApplyFilters = (newFilters: TabFilters) => {
    setFilters(TAB_ID, newFilters);
  };

  const handleClearFilters = () => {
    clearFilters(TAB_ID);
  };

  return (
    <View>
      <FilterPanel
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
      <ContentList data={data} />
    </View>
  );
}
```

### Example 3: Multiple Tabs with Tab Bar

```typescript
// File: src/components/TabNavigator.tsx
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useTabStore } from '@/src/stores/useTabStore';
import { useShallow } from 'zustand/react/shallow';

const TABS = [
  { id: 'generated', label: 'Generados' },
  { id: 'published', label: 'Publicados' },
  { id: 'drafts', label: 'Borradores' },
];

export function TabNavigator() {
  // Select only what we need
  const { activeTabId, setActiveTab } = useTabStore(
    useShallow((state) => ({
      activeTabId: state.activeTabId,
      setActiveTab: state.setActiveTab,
    }))
  );

  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.id}
          onPress={() => setActiveTab(tab.id)}
          style={{
            flex: 1,
            padding: 16,
            borderBottomWidth: 2,
            borderBottomColor: activeTabId === tab.id ? '#f1ef47' : 'transparent',
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: activeTabId === tab.id ? 'bold' : 'normal',
            }}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

---

## Selector Patterns (Important for Performance!)

### Pattern 1: Select Single Value (BEST for primitives)

```typescript
// ✅ BEST - Direct primitive selection
const activeTabId = useTabStore((state) => state.activeTabId);
const setActiveTab = useTabStore((state) => state.setActiveTab);
```

### Pattern 2: Multiple Independent Selectors

```typescript
// ✅ GOOD - Each selector is independent
const activeTab = useTabStore((state) => state.activeTabId);
const tabs = useTabStore((state) => state.tabs);
const setActiveTab = useTabStore((state) => state.setActiveTab);
```

### Pattern 3: Select Object with useShallow

```typescript
import { useShallow } from 'zustand/react/shallow';

// ✅ GOOD - Shallow comparison prevents re-renders
const { activeTabId, setActiveTab, tabs } = useTabStore(
  useShallow((state) => ({
    activeTabId: state.activeTabId,
    setActiveTab: state.setActiveTab,
    tabs: state.tabs,
  }))
);
```

### Pattern 4: Computed/Derived Values

```typescript
// ✅ GOOD - Compute derived values in selector
const hasActiveFilters = useTabStore((state) => {
  const filters = state.getTabFilters('generated');
  return !!(filters.agentType || filters.editorialLean || filters.keywords?.length);
});
```

### AVOID: Creating New Objects

```typescript
// ❌ BAD - Creates new object every render!
const data = useTabStore((state) => ({
  activeTab: state.activeTabId,
  tabs: state.tabs,
}));
// This will cause re-renders even when values haven't changed!
```

---

## Performance Optimization Strategies

### 1. Throttle Scroll Updates

```typescript
<FlatList
  onScroll={handleScroll}
  scrollEventThrottle={100} // Only update every 100ms
/>
```

### 2. Partial Persistence

```typescript
// Only persist what's necessary
partialize: (state) => ({
  activeTabId: state.activeTabId,
  tabs: Object.fromEntries(
    Object.entries(state.tabs).map(([id, tab]) => [
      id,
      {
        id: tab.id,
        filters: tab.filters, // Persist filters
        scrollPosition: tab.scrollPosition, // Persist scroll
        // DON'T persist data, isRefreshing
        data: [],
        isRefreshing: false,
      },
    ])
  ),
});
```

### 3. Memoize Computed Values

```typescript
import { useMemo } from 'react';

function MyComponent() {
  const tabData = useTabStore((state) => state.getTabData('generated'));

  // Memoize expensive computations
  const filteredData = useMemo(() => {
    return tabData.filter((item) => item.status === 'active');
  }, [tabData]);

  return <List data={filteredData} />;
}
```

### 4. Use Transient Updates (No Re-renders)

```typescript
// For high-frequency updates that don't need to trigger re-renders
useEffect(() => {
  const unsubscribe = useTabStore.subscribe(
    (state) => state.tabs['generated']?.scrollPosition.offset,
    (offset) => {
      // Handle scroll without re-rendering component
      updateNativeScrollIndicator(offset);
    }
  );

  return unsubscribe;
}, []);
```

---

## Testing Your Store

### Unit Test Example

```typescript
// File: src/stores/__tests__/useTabStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useTabStore } from '../useTabStore';

describe('useTabStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useTabStore);
    act(() => {
      result.current.resetAllTabs();
    });
  });

  it('should initialize a tab', () => {
    const { result } = renderHook(() => useTabStore);

    act(() => {
      result.current.initializeTab('test-tab');
    });

    const tab = result.current.getTab('test-tab');
    expect(tab).toBeDefined();
    expect(tab?.id).toBe('test-tab');
    expect(tab?.data).toEqual([]);
  });

  it('should update scroll position', () => {
    const { result } = renderHook(() => useTabStore);

    act(() => {
      result.current.initializeTab('test-tab');
      result.current.updateScrollPosition('test-tab', 100, 500);
    });

    const scrollPos = result.current.getScrollPosition('test-tab');
    expect(scrollPos.offset).toBe(100);
    expect(scrollPos.contentHeight).toBe(500);
  });

  it('should set and retrieve tab data', () => {
    const { result } = renderHook(() => useTabStore);
    const testData = [{ id: '1', title: 'Test' }];

    act(() => {
      result.current.initializeTab('test-tab');
      result.current.setTabData('test-tab', testData);
    });

    const data = result.current.getTabData('test-tab');
    expect(data).toEqual(testData);
  });
});
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Object Creation in Selectors

```typescript
// ❌ WRONG
const data = useTabStore((state) => ({
  active: state.activeTabId,
  tabs: state.tabs,
}));
// Creates new object every render → unnecessary re-renders

// ✅ CORRECT
import { useShallow } from 'zustand/react/shallow';

const data = useTabStore(
  useShallow((state) => ({
    active: state.activeTabId,
    tabs: state.tabs,
  }))
);
```

### Pitfall 2: Not Initializing Tabs

```typescript
// ❌ WRONG - May cause undefined errors
const scrollPos = useTabStore((state) => state.tabs['myTab'].scrollPosition);

// ✅ CORRECT - Initialize or use getter with default
useEffect(() => {
  useTabStore.getState().initializeTab('myTab');
}, []);

const scrollPos = useTabStore((state) => state.getScrollPosition('myTab'));
```

### Pitfall 3: Async Hydration Not Handled

```typescript
// ❌ WRONG - Data might not be hydrated yet
function MyComponent() {
  const activeTab = useTabStore((state) => state.activeTabId);
  // activeTab might be initial value, not persisted value
}

// ✅ CORRECT - Wait for hydration
function MyComponent() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useTabStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    return unsubscribe;
  }, []);

  if (!isHydrated) return <LoadingSpinner />;

  // Now safe to use persisted data
  const activeTab = useTabStore((state) => state.activeTabId);
}
```

### Pitfall 4: Storing Functions in Persist

```typescript
// ❌ WRONG - Functions won't persist
interface BadStore {
  callback: () => void; // Won't persist
  date: Date; // Won't persist correctly
}

// ✅ CORRECT - Only primitives, objects, arrays
interface GoodStore {
  callbackName: string; // Store identifier instead
  timestamp: number; // Store as number
}
```

---

## Migration Checklist

### Phase 1: Setup (30 minutes)

- [ ] Install dependencies: `npm install zustand@5.0.8 immer`
- [ ] Install AsyncStorage: `npx expo install @react-native-async-storage/async-storage`
- [ ] Create `src/stores` directory
- [ ] Create `useTabStore.ts` (copy from this guide)

### Phase 2: Integration (1-2 hours)

- [ ] Update GeneratedContentTab.tsx to use Zustand
- [ ] Add scroll position tracking
- [ ] Test tab switching preserves scroll
- [ ] Add filters to store
- [ ] Test filters work correctly

### Phase 3: Additional Tabs (1 hour per tab)

- [ ] Integrate Published tab
- [ ] Integrate Drafts tab
- [ ] Integrate User Content tab
- [ ] Test all tabs independently

### Phase 4: Testing & Optimization (2 hours)

- [ ] Test persistence across app restarts
- [ ] Check performance (React DevTools Profiler)
- [ ] Optimize selectors if needed
- [ ] Add unit tests
- [ ] Test on physical device

---

## Debugging with Redux DevTools

### Setup (Development Only)

```typescript
// In your store
import { devtools } from 'zustand/middleware';

export const useTabStore = create<TabStore>()(
  devtools(
    // ... your store
    { name: 'TabStore' } // Shows in DevTools
  )
);
```

### Using DevTools

1. Install React Native Debugger
2. Open DevTools → Redux tab
3. See all state changes
4. Time-travel debugging
5. Action names appear (e.g., 'tab/setActive')

---

## When to Use Zustand vs Local State

### Use Zustand When:

- State needs to be shared across multiple components
- State needs to persist across app sessions
- Complex state logic that benefits from centralized management
- Need for debugging with DevTools

### Use Local State (useState) When:

- State is only used in one component
- Temporary UI state (modal open, form inputs)
- Simple toggle states
- No need for persistence

### Examples:

```typescript
// ✅ Use Zustand
- User authentication
- App theme/settings
- Tab navigation state
- Global filters
- Shopping cart

// ✅ Use useState
- Modal open/close
- Form input values
- Dropdown open/close
- Checkbox checked state
- Temporary loading states
```

---

## Next Steps

1. **Install Dependencies** - Run the installation commands
2. **Create Store** - Copy the `useTabStore.ts` implementation
3. **Update One Tab** - Start with GeneratedContentTab
4. **Test Thoroughly** - Ensure scroll position works
5. **Migrate Other Tabs** - Apply pattern to other tabs
6. **Optimize** - Use React DevTools Profiler to check performance

---

## Resources

- **Official Docs**: https://zustand.docs.pmnd.rs
- **TypeScript Guide**: https://zustand.docs.pmnd.rs/guides/typescript
- **GitHub**: https://github.com/pmndrs/zustand
- **Discussions**: https://github.com/pmndrs/zustand/discussions

---

## Support

If you encounter issues:

1. Check the "Common Pitfalls" section
2. Review the selector patterns
3. Check React Native logs for errors
4. Use Redux DevTools to inspect state
5. Refer to GitHub discussions for similar issues

Good luck with your implementation, coyotito!
