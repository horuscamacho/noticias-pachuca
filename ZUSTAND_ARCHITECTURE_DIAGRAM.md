# Zustand Tab Architecture - Visual Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE EXPO APPLICATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Generated Tab   │  │  Published Tab   │  │   Drafts Tab     │    │
│  │   Component      │  │   Component      │  │   Component      │    │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘    │
│           │                     │                      │               │
│           └──────────────┬──────┴──────────────────────┘               │
│                          │                                             │
│                          │ useTabStore() + useShallow()                │
│                          │                                             │
│           ┌──────────────▼──────────────────────────┐                 │
│           │                                         │                 │
│           │        ZUSTAND TAB STORE                │                 │
│           │     (Single Source of Truth)            │                 │
│           │                                         │                 │
│           │  ┌───────────────────────────────────┐ │                 │
│           │  │  State                            │ │                 │
│           │  │  • activeTabId: string            │ │                 │
│           │  │  • tabs: Record<string, TabState> │ │                 │
│           │  └───────────────────────────────────┘ │                 │
│           │                                         │                 │
│           │  ┌───────────────────────────────────┐ │                 │
│           │  │  Actions                          │ │                 │
│           │  │  • setActiveTab()                 │ │                 │
│           │  │  • updateScrollPosition()         │ │                 │
│           │  │  • setTabFilters()                │ │                 │
│           │  │  • initializeTab()                │ │                 │
│           │  └───────────────────────────────────┘ │                 │
│           │                                         │                 │
│           └──────────┬──────────────────────────────┘                 │
│                      │                                                 │
│         ┌────────────┼────────────────┐                               │
│         │            │                │                               │
│         ▼            ▼                ▼                               │
│   ┌─────────┐  ┌─────────┐    ┌──────────┐                          │
│   │ DevTools│  │ Persist │    │  Immer   │                          │
│   │ Middle- │  │ Middle- │    │ Middle-  │                          │
│   │  ware   │  │  ware   │    │  ware    │                          │
│   └────┬────┘  └────┬────┘    └─────┬────┘                          │
│        │            │                │                               │
│        │            ▼                │                               │
│        │    ┌──────────────┐         │                               │
│        │    │ AsyncStorage │         │                               │
│        │    │  (Persist)   │         │                               │
│        │    └──────────────┘         │                               │
│        │                             │                               │
│        ▼                             ▼                               │
│  ┌──────────┐                 ┌──────────┐                          │
│  │  Redux   │                 │ Mutable  │                          │
│  │ DevTools │                 │ Updates  │                          │
│  └──────────┘                 └──────────┘                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Tab State Structure

```
TabStore
│
├─ activeTabId: "generated"
│
└─ tabs: {
    │
    ├─ "generated": {
    │   ├─ id: "generated"
    │   ├─ scrollPosition: {
    │   │   ├─ offset: 450
    │   │   └─ contentHeight: 2400
    │   │   }
    │   ├─ filters: {
    │   │   ├─ limit: 20
    │   │   ├─ sortBy: "generatedAt"
    │   │   ├─ sortOrder: "desc"
    │   │   ├─ agentType?: "primary"
    │   │   └─ keywords?: ["urgent"]
    │   │   }
    │   └─ showFilters: false
    │   }
    │
    ├─ "published": {
    │   ├─ id: "published"
    │   ├─ scrollPosition: { offset: 0, contentHeight: 0 }
    │   ├─ filters: { ... }
    │   └─ showFilters: false
    │   }
    │
    └─ "drafts": {
        ├─ id: "drafts"
        ├─ scrollPosition: { offset: 120, contentHeight: 800 }
        ├─ filters: { ... }
        └─ showFilters: false
        }
    }
```

---

## Data Flow Diagram

### Scenario: User Scrolls in Generated Tab

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                   │
│    User scrolls in FlatList                                      │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. EVENT HANDLER                                                 │
│    onScroll={(event) => handleScroll(event)}                     │
│    scrollEventThrottle={100} // Throttled to 100ms              │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. EXTRACT SCROLL DATA                                           │
│    const offset = event.nativeEvent.contentOffset.y             │
│    const contentHeight = event.nativeEvent.contentSize.height   │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. UPDATE ZUSTAND STORE                                          │
│    updateScroll(offset, contentHeight)                           │
│    → state.updateScrollPosition('generated', offset, height)     │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. IMMER MIDDLEWARE                                              │
│    Converts mutable update to immutable                          │
│    state.tabs['generated'].scrollPosition = { offset, height }  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. DEVTOOLS MIDDLEWARE                                           │
│    Logs action: 'tab/updateScroll'                              │
│    Shows in Redux DevTools                                       │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. STATE UPDATED                                                 │
│    Store now has new scroll position                             │
│    Components subscribed to this state will re-render            │
└──────────────────────────────────────────────────────────────────┘

NOTE: Persist middleware does NOT run here (scroll pos not persisted)
```

---

## Component Re-render Flow

### Using useShallow (Optimized)

```
Component uses:
const { filters, setFilters } = useTabStore(
  useShallow((state) => ({
    filters: state.getTabFilters('generated'),
    setFilters: (f) => state.setTabFilters('generated', f)
  }))
)

┌────────────────────────────────────────────────┐
│ Store State Changes                            │
├────────────────────────────────────────────────┤
│                                                │
│ Change: activeTabId = "published"             │
│ Result: Component DOES NOT re-render ✓        │
│ Why: filters unchanged (shallow equal)         │
│                                                │
│ Change: tabs.drafts.scrollPosition = {...}    │
│ Result: Component DOES NOT re-render ✓        │
│ Why: filters unchanged                         │
│                                                │
│ Change: tabs.generated.filters = {...}        │
│ Result: Component DOES re-render ✓            │
│ Why: filters changed (needed!)                 │
│                                                │
└────────────────────────────────────────────────┘
```

### Without useShallow (NOT Optimized)

```
Component uses:
const data = useTabStore((state) => ({
  filters: state.getTabFilters('generated'),
  setFilters: (f) => state.setTabFilters('generated', f)
}))

┌────────────────────────────────────────────────┐
│ Store State Changes                            │
├────────────────────────────────────────────────┤
│                                                │
│ Change: activeTabId = "published"             │
│ Result: Component RE-RENDERS ✗                │
│ Why: New object created (ref changed)          │
│                                                │
│ Change: tabs.drafts.scrollPosition = {...}    │
│ Result: Component RE-RENDERS ✗                │
│ Why: New object created (ref changed)          │
│                                                │
│ Change: tabs.generated.filters = {...}        │
│ Result: Component RE-RENDERS ✓                │
│ Why: filters changed (needed!)                 │
│                                                │
└────────────────────────────────────────────────┘

❌ Problem: 3 re-renders instead of 1!
```

---

## Persistence Flow

### What Gets Persisted

```
When store updates:

1. State changes in memory ✓

2. Persist middleware checks partialize config:

   partialize: (state) => ({
     activeTabId: state.activeTabId,        ← PERSISTED ✓
     tabs: {
       generated: {
         id: state.tabs.generated.id,       ← PERSISTED ✓
         filters: state.tabs.generated.filters, ← PERSISTED ✓
         showFilters: state.tabs.generated.showFilters, ← PERSISTED ✓
         scrollPosition: { offset: 0, contentHeight: 0 }, ← NOT PERSISTED ✗
       },
       // ... other tabs
     }
   })

3. Serialized to JSON

4. Written to AsyncStorage:
   Key: "tab-storage"
   Value: { state: { ... }, version: 0 }
```

### What Gets Restored on App Restart

```
1. App starts

2. Persist middleware reads from AsyncStorage

3. Rehydrates state:
   ✓ activeTabId restored
   ✓ filters restored
   ✓ showFilters restored
   ✗ scrollPosition = default (0)
   ✗ data = not persisted (fetched fresh)

4. Components mount

5. Scroll positions restored from in-memory state
   (if tabs were already visited in current session)
```

---

## Tab Switching Flow

```
USER CLICKS "PUBLISHED" TAB

1. Tab Navigator detects click
   │
   ▼
2. Calls: setActiveTab('published')
   │
   ▼
3. Zustand updates:
   └─ activeTabId: "generated" → "published"
   └─ Initializes 'published' tab if not exists
   │
   ▼
4. Components subscribed to activeTabId re-render
   │
   ├─ Tab Bar highlights "Published" ✓
   │
   └─ Screen switches to PublishedTab component ✓
   │
   ▼
5. PublishedTab component mounts
   │
   ├─ Reads: scrollPosition = getScrollPosition('published')
   │
   ├─ Reads: filters = getTabFilters('published')
   │
   └─ useEffect restores scroll position
   │
   ▼
6. FlatList scrolls to saved position (if any)
   │
   ▼
7. User sees exactly where they left off ✓
```

---

## Middleware Stack Execution Order

```
When you call: setTabFilters('generated', { limit: 30 })

EXECUTION FLOW (outside-in):

1. devtools middleware (outermost)
   ├─ Logs action name: 'tab/setFilters'
   ├─ Captures state before
   └─ Passes to next middleware
   │
   ▼
2. persist middleware (middle)
   ├─ Waits for state update
   └─ Passes to next middleware
   │
   ▼
3. immer middleware (innermost)
   ├─ Allows mutable syntax:
   │  state.tabs.generated.filters = {...}
   ├─ Converts to immutable update
   └─ Updates actual state
   │
   ▼
4. State updated ✓
   │
   ▼
5. persist middleware (on way back out)
   ├─ Runs partialize function
   ├─ Serializes to JSON
   └─ Writes to AsyncStorage
   │
   ▼
6. devtools middleware (on way back out)
   ├─ Captures state after
   ├─ Sends to Redux DevTools
   └─ Shows in timeline
   │
   ▼
7. Subscribed components re-render

ORDER MATTERS!
✓ Correct: devtools(persist(immer(...)))
✗ Wrong:   immer(persist(devtools(...)))
✗ Wrong:   persist(devtools(immer(...)))
```

---

## Performance Comparison

### Before Zustand (Current State)

```
Tab Switching:
├─ Scroll position lost ✗
├─ Filters reset ✗
├─ Re-fetch all data ✗
└─ Poor UX ✗

State Management:
├─ Prop drilling through 3+ levels ✗
├─ useState in each component ✗
├─ No persistence ✗
└─ Hard to debug ✗

Re-renders:
├─ Parent re-renders all children ✗
├─ Unnecessary re-renders on filter change ✗
└─ Lag when scrolling ✗
```

### After Zustand (Target State)

```
Tab Switching:
├─ Scroll position preserved ✓
├─ Filters maintained ✓
├─ Data cached by React Query ✓
└─ Smooth UX ✓

State Management:
├─ No prop drilling ✓
├─ Centralized store ✓
├─ AsyncStorage persistence ✓
└─ Redux DevTools debugging ✓

Re-renders:
├─ Only affected components re-render ✓
├─ useShallow prevents object re-renders ✓
└─ Smooth 60fps scrolling ✓
```

---

## File Structure

```
mobile-expo/
├─ src/
│  ├─ stores/
│  │  └─ useTabStore.ts              ← NEW (250 lines)
│  │     ├─ Types
│  │     ├─ Store implementation
│  │     └─ Middleware config
│  │
│  └─ components/
│     └─ generated/
│        └─ GeneratedContentTab.tsx  ← UPDATED (30 line changes)
│           ├─ Import useTabStore
│           ├─ Replace useState
│           ├─ Add scroll tracking
│           └─ Add useEffect for restore
│
└─ package.json                      ← NO CHANGE (zustand already there)
```

---

## Selector Pattern Comparison

### Pattern 1: Direct Primitive (Best)

```typescript
const activeTab = useTabStore((state) => state.activeTabId)

Re-renders: Only when activeTabId changes ✓
Performance: Excellent ✓
Complexity: Simple ✓
```

### Pattern 2: Multiple Selectors (Good)

```typescript
const activeTab = useTabStore((state) => state.activeTabId)
const setTab = useTabStore((state) => state.setActiveTab)

Re-renders: Only when selected values change ✓
Performance: Excellent ✓
Complexity: Simple ✓
```

### Pattern 3: Object with useShallow (Good)

```typescript
const { activeTab, setTab } = useTabStore(
  useShallow((state) => ({
    activeTab: state.activeTabId,
    setTab: state.setActiveTab
  }))
)

Re-renders: Only when values change (shallow equal) ✓
Performance: Good ✓
Complexity: Medium ✓
```

### Pattern 4: Object without useShallow (BAD)

```typescript
const data = useTabStore((state) => ({
  activeTab: state.activeTabId,
  setTab: state.setActiveTab
}))

Re-renders: EVERY store update ✗
Performance: Poor ✗
Complexity: Simple but wrong ✗
```

---

## Memory & Performance Metrics

```
Bundle Size Impact:
├─ Zustand: ~3KB
├─ Immer: ~12KB
└─ Total: ~15KB (minimal!)

AsyncStorage:
├─ Persisted data: ~2-5KB per tab
├─ Total storage: ~10-20KB
└─ Write frequency: On filter change only

Memory Usage:
├─ Store in memory: <1MB
├─ Scroll positions: 8 bytes × 3 tabs = 24 bytes
├─ Filters: ~500 bytes × 3 tabs = ~1.5KB
└─ Total overhead: Negligible

Performance:
├─ State updates: <1ms
├─ AsyncStorage read: ~5-10ms (async)
├─ AsyncStorage write: ~10-20ms (async)
└─ Re-render time: <16ms (60fps)
```

---

## Testing Checklist Visual

```
┌─────────────────────────────────────────────────────┐
│ TEST SCENARIO                    │ STATUS │ RESULT  │
├──────────────────────────────────┼────────┼─────────┤
│ Install dependencies             │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Create store file                │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Update component                 │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ App builds without errors        │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Scroll in tab                    │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Switch to another tab            │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Return to first tab              │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Scroll position restored?        │   ☐    │   ✓/✗   │
├──────────────────────────────────┼────────┼─────────┤
│ Apply filters                    │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Close app completely             │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Reopen app                       │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ Filters persisted?               │   ☐    │   ✓/✗   │
├──────────────────────────────────┼────────┼─────────┤
│ Check React DevTools Profiler   │   ☐    │         │
├──────────────────────────────────┼────────┼─────────┤
│ No unnecessary re-renders?       │   ☐    │   ✓/✗   │
├──────────────────────────────────┼────────┼─────────┤
│ Redux DevTools shows actions?   │   ☐    │   ✓/✗   │
└──────────────────────────────────┴────────┴─────────┘
```

---

## Quick Decision Tree

```
Need to store state?
│
├─ Is it used in single component only?
│  │
│  ├─ YES → Use useState ✓
│  │
│  └─ NO → Continue ↓
│
└─ Is it shared across components?
   │
   ├─ YES → Continue ↓
   │
   └─ NO → Use useState ✓
   │
   └─ Does it need persistence?
      │
      ├─ YES → Use Zustand with persist ✓
      │
      └─ NO → Use Zustand without persist ✓
      │
      └─ Is state complex (nested)?
         │
         ├─ YES → Add Immer middleware ✓
         │
         └─ NO → Basic Zustand is fine ✓
         │
         └─ Need debugging?
            │
            ├─ YES → Add DevTools middleware ✓
            │
            └─ NO → You're done! ✓
```

---

## Summary

This visual guide shows:

1. **Architecture** - How components connect to Zustand store
2. **State Structure** - How tab data is organized
3. **Data Flow** - Step-by-step update process
4. **Re-render Optimization** - useShallow vs regular selectors
5. **Persistence** - What gets saved and restored
6. **Tab Switching** - Complete flow diagram
7. **Middleware Order** - Execution stack
8. **Performance** - Before/after comparison
9. **File Structure** - What files change
10. **Testing Checklist** - Visual verification

Use this diagram alongside the implementation guide for complete understanding!

---

**Created**: October 25, 2025
**For**: Tab State Management with Zustand
**Next**: Read ZUSTAND_TAB_FIX_COMPLETE_SOLUTION.md
