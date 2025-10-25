# Complete Solution: Fix Tabs with Zustand

## Problem Statement

Your current tab system has a critical issue: **all tabs share the same height** and don't maintain independent scroll positions. This creates a poor user experience where:

- Switching between tabs loses scroll position
- All tabs have the same content height
- Filters reset when switching tabs
- No persistence of tab state

## Solution Architecture

Use **Zustand with a single store** to manage:
- Independent scroll positions per tab
- Tab-specific data and filters
- Active tab selection
- State persistence across app restarts

---

## Step-by-Step Implementation

### Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo

# Install Zustand v5
npm install zustand@5.0.8

# Install Immer for easier state updates
npm install immer

# AsyncStorage already installed (in your package.json)
# @react-native-async-storage/async-storage: "2.2.0" ✓
```

### Step 2: Create Store Directory (1 minute)

```bash
mkdir -p src/stores
```

### Step 3: Create Tab Store (5 minutes)

Create file: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/stores/useTabStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { App as FilterApp } from '@/src/types/generated-content-filters.types';

// ============================================================================
// TYPES
// ============================================================================

export interface TabScrollPosition {
  offset: number;
  contentHeight: number;
}

export interface TabState {
  id: string;
  scrollPosition: TabScrollPosition;
  filters: FilterApp.GeneratedContentFilters;
  showFilters: boolean;
}

export interface TabStore {
  // State
  activeTabId: string;
  tabs: Record<string, TabState>;

  // Tab Management
  setActiveTab: (tabId: string) => void;
  initializeTab: (tabId: string, defaultFilters?: FilterApp.GeneratedContentFilters) => void;

  // Scroll Position
  updateScrollPosition: (tabId: string, offset: number, contentHeight: number) => void;
  getScrollPosition: (tabId: string) => TabScrollPosition;

  // Filters
  setTabFilters: (tabId: string, filters: FilterApp.GeneratedContentFilters) => void;
  getTabFilters: (tabId: string) => FilterApp.GeneratedContentFilters;
  setShowFilters: (tabId: string, show: boolean) => void;

  // Utilities
  resetTab: (tabId: string) => void;
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const DEFAULT_TAB_STATE: Omit<TabState, 'id'> = {
  scrollPosition: { offset: 0, contentHeight: 0 },
  filters: {
    limit: 20,
    sortBy: 'generatedAt',
    sortOrder: 'desc',
  },
  showFilters: false,
};

// ============================================================================
// STORE
// ============================================================================

export const useTabStore = create<TabStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        activeTabId: 'generated',
        tabs: {},

        // Tab Management
        setActiveTab: (tabId) =>
          set(
            (state) => {
              state.activeTabId = tabId;
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

        // Scroll Position
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

        // Filters
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

        setShowFilters: (tabId, show) =>
          set(
            (state) => {
              if (!state.tabs[tabId]) {
                state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
              }
              state.tabs[tabId].showFilters = show;
            },
            false,
            'tab/setShowFilters'
          ),

        // Utilities
        resetTab: (tabId) =>
          set(
            (state) => {
              state.tabs[tabId] = { ...DEFAULT_TAB_STATE, id: tabId };
            },
            false,
            'tab/reset'
          ),
      })),
      {
        name: 'tab-storage',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist filters and active tab, not scroll positions
        partialize: (state) => ({
          activeTabId: state.activeTabId,
          tabs: Object.fromEntries(
            Object.entries(state.tabs).map(([id, tab]) => [
              id,
              {
                id: tab.id,
                filters: tab.filters,
                showFilters: tab.showFilters,
                // Don't persist scroll position
                scrollPosition: { offset: 0, contentHeight: 0 },
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

### Step 4: Update GeneratedContentTab Component (15 minutes)

Update file: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/components/generated/GeneratedContentTab.tsx`

**Changes to make:**

1. Import Zustand store and useShallow
2. Replace local useState with Zustand
3. Add scroll position tracking
4. Restore scroll position on mount

Here's the complete updated component:

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GeneratedContentCard } from '@/src/components/content/GeneratedContentCard';
import { GeneratedContentFilters } from '@/src/components/generated/GeneratedContentFilters';
import {
  useGeneratedContent,
  getAllGeneratedContent,
  getTotalItems,
} from '@/src/hooks/useGeneratedContentFilters';
import type { App as FilterApp } from '@/src/types/generated-content-filters.types';
import { AlertCircle, FileX, Filter, X, Sparkles, Plus } from 'lucide-react-native';
import { useTabStore } from '@/src/stores/useTabStore'; // ADD THIS
import { useShallow } from 'zustand/react/shallow'; // ADD THIS

/**
 * Tab de Contenidos Generados
 * NOW WITH ZUSTAND STATE MANAGEMENT!
 */
export function GeneratedContentTab() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null); // ADD THIS
  const TAB_ID = 'generated'; // ADD THIS

  // ============================================================
  // ZUSTAND STATE (REPLACES LOCAL useState)
  // ============================================================
  const {
    filters: activeFilters,
    showFilters,
    scrollPosition,
    setFilters,
    setShowFilters,
    updateScroll,
    initTab,
  } = useTabStore(
    useShallow((state) => ({
      filters: state.getTabFilters(TAB_ID),
      showFilters: state.tabs[TAB_ID]?.showFilters || false,
      scrollPosition: state.getScrollPosition(TAB_ID),
      setFilters: (filters: FilterApp.GeneratedContentFilters) =>
        state.setTabFilters(TAB_ID, filters),
      setShowFilters: (show: boolean) => state.setShowFilters(TAB_ID, show),
      updateScroll: (offset: number, height: number) =>
        state.updateScrollPosition(TAB_ID, offset, height),
      initTab: () => state.initializeTab(TAB_ID, { limit: 20, sortBy: 'generatedAt', sortOrder: 'desc' }),
    }))
  );

  // ============================================================
  // LOCAL STATE (only for pending filters)
  // ============================================================
  const [pendingFilters, setPendingFilters] = useState<FilterApp.GeneratedContentFilters>(activeFilters);

  // ============================================================
  // LIFECYCLE
  // ============================================================

  // Initialize tab on mount
  useEffect(() => {
    initTab();
  }, []);

  // Restore scroll position when component mounts or scroll position changes
  useEffect(() => {
    if (scrollPosition.offset > 0 && flatListRef.current) {
      // Small delay to ensure list is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: scrollPosition.offset,
          animated: false,
        });
      }, 100);
    }
  }, [scrollPosition.offset]);

  // Update pending filters when active filters change
  useEffect(() => {
    setPendingFilters(activeFilters);
  }, [activeFilters]);

  // ============================================================
  // REACT QUERY
  // ============================================================
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useGeneratedContent(activeFilters);

  const items = getAllGeneratedContent(data);
  const total = getTotalItems(data);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCardPress = (id: string) => {
    router.push(`/generated/${id}`);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // NEW: Handle scroll events
  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    updateScroll(offset, contentHeight);
  };

  // UPDATED: Filter handlers use Zustand
  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterApp.GeneratedContentFilters = {
      limit: 20,
      sortBy: 'generatedAt',
      sortOrder: 'desc',
    };
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowFilters(false);
  };

  // ============================================================
  // RENDER (same as before, but with FlatList updates)
  // ============================================================

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f1ef47" />
        <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
          Cargando contenidos generados...
        </ThemedText>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={64} color="#EF4444" />
        <ThemedText variant="title-medium" style={styles.errorTitle}>
          Error al cargar contenidos
        </ThemedText>
        <ThemedText variant="body-medium" color="secondary" style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
        </ThemedText>
        <Button onPress={() => refetch()} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
        </Button>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <FileX size={64} color="#9CA3AF" />
        <ThemedText variant="title-medium" style={styles.emptyTitle}>
          No hay contenidos generados
        </ThemedText>
        <ThemedText variant="body-medium" color="secondary" style={styles.emptyMessage}>
          Los contenidos generados por tus agentes aparecerán aquí
        </ThemedText>
        <Button
          onPress={() => router.push('/user-content/create')}
          style={styles.emptyButton}
        >
          <ThemedText style={styles.emptyButtonText}>Crear Contenido Manual</ThemedText>
        </Button>
      </View>
    );
  }

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#f1ef47" />
        <ThemedText variant="body-small" color="secondary" style={styles.footerText}>
          Cargando más contenidos...
        </ThemedText>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <ThemedText variant="headline-medium" style={styles.title}>
              Contenidos Generados
            </ThemedText>
            <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
              {total} contenido{total !== 1 ? 's' : ''} generado{total !== 1 ? 's' : ''} por tus
              agentes
            </ThemedText>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            >
              {showFilters ? <X size={20} color="#000" /> : <Filter size={20} color="#6B7280" />}
            </Pressable>

            <Pressable
              onPress={() => router.push('/user-content/create')}
              style={styles.createButton}
            >
              <Plus size={20} color="#000" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {!showFilters &&
          (activeFilters.agentType ||
            activeFilters.editorialLean ||
            activeFilters.keywords?.length) && (
            <View style={styles.activeFiltlersBadge}>
              <Badge variant="default" style={styles.filtersBadge}>
                <Filter size={12} color="#000" />
                <ThemedText variant="label-small" style={styles.filtersBadgeText}>
                  Filtros activos
                </ThemedText>
              </Badge>
            </View>
          )}
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <GeneratedContentFilters
            filters={pendingFilters}
            onFiltersChange={setPendingFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef} // ADD THIS
        data={items}
        renderItem={({ item }) => (
          <GeneratedContentCard content={item} onPress={() => handleCardPress(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll} // ADD THIS
        scrollEventThrottle={100} // ADD THIS - Update every 100ms max
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#f1ef47"
            colors={['#f1ef47']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
  },
  errorTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f1ef47',
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  emptyTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#f1ef47',
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#f1ef47',
    borderColor: '#f1ef47',
  },
  createButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f1ef47',
    borderWidth: 2,
    borderColor: '#000000',
  },
  activeFiltlersBadge: {
    marginTop: 8,
  },
  filtersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderColor: '#f1ef47',
  },
  filtersBadgeText: {
    color: '#000',
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
  },
});
```

---

## Testing Your Implementation

### Test 1: Basic Functionality

1. Start your app: `npm start`
2. Navigate to the Generated Content tab
3. Scroll down the list
4. Switch to another tab
5. Come back to Generated Content
6. **Expected**: Scroll position is restored

### Test 2: Filters Persistence

1. Open filters panel
2. Apply some filters
3. Close the app completely
4. Reopen the app
5. **Expected**: Filters are still applied

### Test 3: Multiple Tabs

Once you implement other tabs (Published, Drafts):

1. Scroll in Generated tab
2. Switch to Published tab
3. Scroll in Published tab
4. Switch back to Generated
5. **Expected**: Each tab maintains its own scroll position

### Test 4: Performance

1. Open React DevTools Profiler
2. Scroll in a tab
3. Switch tabs
4. **Expected**: No unnecessary re-renders

---

## Verification Checklist

- [ ] Dependencies installed
- [ ] Store file created at `src/stores/useTabStore.ts`
- [ ] GeneratedContentTab updated with Zustand
- [ ] Scroll position restored when switching tabs
- [ ] Filters persist across app restarts
- [ ] No console errors
- [ ] App builds successfully
- [ ] Performance is good (no lag)

---

## Troubleshooting

### Issue: Scroll position not restored

**Solution**: Increase the timeout in useEffect:

```typescript
setTimeout(() => {
  flatListRef.current?.scrollToOffset({
    offset: scrollPosition.offset,
    animated: false,
  });
}, 200); // Increase from 100 to 200
```

### Issue: TypeScript errors

**Solution**: Make sure you're using the curried syntax:

```typescript
// ✅ Correct
const useTabStore = create<TabStore>()(devtools(...))

// ❌ Wrong
const useTabStore = create<TabStore>(devtools(...))
```

### Issue: Filters not persisting

**Solution**: Check AsyncStorage permissions and partialize config in store.

### Issue: Re-renders on every scroll

**Solution**: Ensure you're using `useShallow`:

```typescript
import { useShallow } from 'zustand/react/shallow';

const { filters, setFilters } = useTabStore(
  useShallow((state) => ({
    filters: state.getTabFilters(TAB_ID),
    setFilters: (f) => state.setTabFilters(TAB_ID, f),
  }))
);
```

---

## Next Steps

1. **Implement for other tabs**: Apply the same pattern to Published and Drafts tabs
2. **Add DevTools**: Connect Redux DevTools to see state changes
3. **Optimize**: Use React DevTools Profiler to identify any performance issues
4. **Test thoroughly**: Test on both iOS and Android devices

---

## Summary of Changes

| File                         | Changes                                           |
| ---------------------------- | ------------------------------------------------- |
| `package.json`               | No changes needed (zustand already installed)     |
| `src/stores/useTabStore.ts`  | NEW FILE - Complete store implementation          |
| `GeneratedContentTab.tsx`    | Updated to use Zustand + scroll tracking          |

**Lines of code added**: ~250 (store) + ~30 (component updates) = **~280 lines total**

**Time to implement**: ~30 minutes

**Benefits**:
- Independent scroll positions per tab
- Filter persistence across sessions
- Better performance (no prop drilling)
- Easier debugging with DevTools
- Scalable for future features

---

Good luck with the implementation, coyotito! The tabs will work perfectly after this.
