# Reanimated v4 Tab Navigation Architecture Diagrams

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      TabNavigation                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ State Management                                       │ │
│  │  • selectedIndex = useSharedValue(0)                  │ │
│  │  • scrollX = useSharedValue(0)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      TabBar                            │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │   Animated.ScrollView (horizontal)               │ │ │
│  │  │   ┌────────┬────────┬────────┬────────┐         │ │ │
│  │  │   │TabItem │TabItem │TabItem │TabItem │         │ │ │
│  │  │   │  (0)   │  (1)   │  (2)   │  (3)   │         │ │ │
│  │  │   └────────┴────────┴────────┴────────┘         │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │          TabIndicator (Animated.View)            │ │ │
│  │  │          ═══════════                             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    TabContent                          │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │   Animated.ScrollView (horizontal, paging)       │ │ │
│  │  │   ┌──────┬──────┬──────┬──────┐                 │ │ │
│  │  │   │Page 0│Page 1│Page 2│Page 3│                 │ │ │
│  │  │   │      │      │      │      │                 │ │ │
│  │  │   └──────┴──────┴──────┴──────┘                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow & Animation Sync

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└─────────────────────────────────────────────────────────────┘
                    │                  │
                    │                  │
          ┌─────────▼────────┐   ┌────▼──────────┐
          │   TAP TAB        │   │  SWIPE CONTENT│
          │   (TabItem)      │   │  (TabContent) │
          └─────────┬────────┘   └────┬──────────┘
                    │                  │
                    │                  │
┌───────────────────▼──────────────────▼───────────────────────┐
│               SHARED VALUES (UI Thread)                      │
│                                                               │
│  selectedIndex.value = index   scrollX.value = offset/width  │
│         (0, 1, 2, 3)                  (0.0, 1.0, 2.0)       │
└───────────────────┬──────────────────┬───────────────────────┘
                    │                  │
                    │                  │
          ┌─────────▼────────┐   ┌────▼──────────┐
          │  TabIndicator    │   │   TabItem     │
          │  translateX =    │   │   color =     │
          │  withSpring(     │   │   interpolate │
          │    index * width)│   │   Color()     │
          └──────────────────┘   └───────────────┘
                    │
                    │
          ┌─────────▼────────┐
          │  VISUAL UPDATE   │
          │  (60 FPS)        │
          └──────────────────┘
```

---

## Thread Communication

```
┌─────────────────────────────────────────────────────────────┐
│                      JS THREAD                               │
├─────────────────────────────────────────────────────────────┤
│  • React Component Rendering                                │
│  • useState, useEffect                                       │
│  • Event Handlers (onPress)                                 │
│  • runOnJS() calls                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │  Shared Values Bridge
                          │  (Bidirectional)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      UI THREAD                               │
├─────────────────────────────────────────────────────────────┤
│  • useSharedValue                                            │
│  • useAnimatedStyle                                          │
│  • useAnimatedScrollHandler                                  │
│  • Worklet Functions ('worklet')                             │
│  • Gesture Handler Callbacks                                │
│  • Animation Functions (withSpring, withTiming)              │
│  • 60 FPS Updates                                            │
└─────────────────────────────────────────────────────────────┘

KEY PRINCIPLE: Keep animations on UI thread for 60fps
              Use runOnJS() sparingly
```

---

## Animation Flow: Tab Indicator

```
USER TAPS TAB 2
│
▼
selectedIndex.value = 2  ◄─── Shared Value Update (UI Thread)
│
▼
useAnimatedStyle() triggered  ◄─── Reactive Hook
│
▼
┌──────────────────────────────────────┐
│ return {                             │
│   transform: [{                      │
│     translateX: withSpring(          │
│       selectedIndex.value * tabWidth │  ◄─── 2 * 100 = 200
│     )                                │
│   }]                                 │
│ }                                    │
└──────────────────────────────────────┘
│
▼
withSpring Animation Starts
│
├─► Frame 1: translateX = 50  (current + velocity)
├─► Frame 2: translateX = 85  (spring physics)
├─► Frame 3: translateX = 120
├─► Frame 4: translateX = 155
├─► ...
└─► Frame N: translateX = 200 (settled)
    │
    ▼
    Indicator visually at Tab 2 position
```

---

## Scroll Synchronization Flow

```
USER SWIPES CONTENT RIGHT
│
▼
┌────────────────────────────────────────────────────┐
│ useAnimatedScrollHandler                           │
│ onScroll: (event) => {                             │
│   scrollX.value = event.contentOffset.x / width    │
│ }                                                   │
└────────────────┬───────────────────────────────────┘
                 │
                 │ Continuous Updates (60fps)
                 ▼
         scrollX.value = 0.0 → 0.5 → 1.0 → 1.5 → 2.0
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
TabIndicator  TabItem     TabContent
translateX    color       pages scroll
interpolate   interpolate in sync
position      between
              active/
              inactive
```

---

## Interpolation Breakdown

```
INPUT: scrollX.value = 1.5  (halfway between tab 1 and 2)

┌─────────────────────────────────────────────────────────┐
│ TabIndicator Position                                   │
├─────────────────────────────────────────────────────────┤
│ Input Range:  [0,    1,    2,    3]                    │
│ Output Range: [0,   100,  200,  300]  (tabWidth = 100) │
│                                                          │
│ interpolate(1.5, ...) = 150  ◄─── Between tab 1 and 2  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TabItem Color (Tab Index 1)                             │
├─────────────────────────────────────────────────────────┤
│ Input Range:  [0.5,  1,    1.5]                        │
│ Output Range: [#666, #000, #666]                       │
│                                                          │
│ interpolateColor(1.5, ...) = #666  ◄─── Fading out     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TabItem Color (Tab Index 2)                             │
├─────────────────────────────────────────────────────────┤
│ Input Range:  [1.5,  2,    2.5]                        │
│ Output Range: [#666, #000, #666]                       │
│                                                          │
│ interpolateColor(1.5, ...) = #666  ◄─── Fading in      │
└─────────────────────────────────────────────────────────┘

RESULT: Smooth transition as user swipes
```

---

## Gesture Handler Integration

```
┌─────────────────────────────────────────────────────────┐
│            GestureHandlerRootView (App Root)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │         GestureDetector (TabContent)              │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │        Pan Gesture                          │  │  │
│  │  │                                             │  │  │
│  │  │  .onStart(() => {                          │  │  │
│  │  │    contextX.value = translateX.value       │  │  │
│  │  │  })                                         │  │  │
│  │  │                                             │  │  │
│  │  │  .onChange((event) => {                    │  │  │
│  │  │    translateX.value =                      │  │  │
│  │  │      contextX.value + event.translationX   │  │  │
│  │  │  })                                         │  │  │
│  │  │                                             │  │  │
│  │  │  .onEnd((event) => {                       │  │  │
│  │  │    // Snap to nearest tab                  │  │  │
│  │  │    const snap = Math.round(...)            │  │  │
│  │  │    translateX.value = withSpring(snap)     │  │  │
│  │  │  })                                         │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │         Animated.ScrollView                       │  │
│  │         (Content Pages)                           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

All callbacks run as WORKLETS (UI Thread) automatically!
```

---

## Performance Optimization Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    STATIC CONTENT                          │
│  StyleSheet.create({ container: { width: 100 } })         │
│  Computed once, reused                                     │
└────────────────────────────────────────────────────────────┘
                          │
                          │ Merge with
                          ▼
┌────────────────────────────────────────────────────────────┐
│                  DYNAMIC CONTENT                           │
│  useAnimatedStyle(() => ({ opacity: sv.value }))           │
│  Runs on UI thread at 60fps                                │
└────────────────────────────────────────────────────────────┘
                          │
                          │ Apply to
                          ▼
┌────────────────────────────────────────────────────────────┐
│             <Animated.View style={[                        │
│               styles.static,      ◄─── StyleSheet          │
│               animatedStyle       ◄─── useAnimatedStyle    │
│             ]} />                                           │
└────────────────────────────────────────────────────────────┘

OPTIMIZATION PRINCIPLES:
1. Minimize useAnimatedStyle content (only dynamic values)
2. Use useMemo for expensive calculations
3. Use React.memo for static tab items
4. scrollEventThrottle={16} for 60fps
5. getItemLayout for FlatList (avoid measurement)
```

---

## Memory & Re-render Flow

```
REACT STATE (useState)
│
├─► Change triggers FULL component re-render
├─► All children re-render (unless memoized)
├─► Runs on JS Thread
└─► 🐌 Can cause frame drops if heavy

VS

SHARED VALUE (useSharedValue)
│
├─► Change ONLY triggers useAnimatedStyle
├─► No component re-render
├─► Runs on UI Thread
└─► ⚡ 60fps animations guaranteed

EXAMPLE:

❌ BAD (React State):
const [scrollX, setScrollX] = useState(0);

const onScroll = (e) => {
  setScrollX(e.contentOffset.x);  ◄─── Re-renders entire component!
}

✅ GOOD (Shared Value):
const scrollX = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (e) => {
    scrollX.value = e.contentOffset.x;  ◄─── No re-render!
  }
});
```

---

## TypeScript Type Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Type Definitions                        │
├────────────────────────────────────────────────────────────┤
│  interface Tab {                                           │
│    key: string;                                            │
│    label: string;                                          │
│  }                                                          │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  const tabs: Tab[] = [                                     │
│    { key: 'home', label: 'Home' }                          │
│  ]                                                          │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  interface TabBarProps {                                   │
│    tabs: Tab[];                                            │
│    selectedIndex: SharedValue<number>;  ◄─── Generic type │
│  }                                                          │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│  function TabBar({ tabs, selectedIndex }: TabBarProps) {   │
│    const animatedStyle = useAnimatedStyle<ViewStyle>(() => │
│      ({ opacity: selectedIndex.value })                    │
│    );                                                       │
│  }                                                          │
└────────────────────────────────────────────────────────────┘

TYPE SAFETY BENEFITS:
• IntelliSense autocomplete
• Compile-time error detection
• Refactoring confidence
• Self-documenting code
```

---

## File Structure Best Practices

```
src/
├── components/
│   └── TabNavigation/
│       ├── index.ts                    ◄─── Exports
│       ├── types.ts                    ◄─── TypeScript types
│       ├── TabNavigation.tsx           ◄─── Main component
│       ├── TabBar.tsx                  ◄─── Tab bar container
│       ├── TabItem.tsx                 ◄─── Individual tab
│       ├── TabIndicator.tsx            ◄─── Animated indicator
│       ├── TabContent.tsx              ◄─── Swipeable content
│       └── __tests__/
│           ├── TabBar.test.tsx
│           └── TabIndicator.test.tsx
│
└── hooks/
    └── useTabNavigation.ts             ◄─── Custom hook (optional)

IMPORT USAGE:
import { TabNavigation, TabBar, TabItem } from '@/components/TabNavigation';
import type { Tab, TabBarProps } from '@/components/TabNavigation/types';
```

---

## Common Pitfalls & Solutions

```
❌ PITFALL 1: Reading Shared Values During Render
┌────────────────────────────────────────────────┐
│ function BadComponent() {                     │
│   const sv = useSharedValue(0);               │
│   console.log(sv.value);  ◄─── WRONG!        │
│   return <View />;                            │
│ }                                              │
└────────────────────────────────────────────────┘

✅ SOLUTION:
┌────────────────────────────────────────────────┐
│ function GoodComponent() {                    │
│   const sv = useSharedValue(0);               │
│   const style = useAnimatedStyle(() => {      │
│     console.log(sv.value);  ◄─── CORRECT!    │
│     return { width: sv.value };               │
│   });                                          │
│   return <Animated.View style={style} />;     │
│ }                                              │
└────────────────────────────────────────────────┘

─────────────────────────────────────────────────

❌ PITFALL 2: Mutating Objects
┌────────────────────────────────────────────────┐
│ const pos = useSharedValue({ x: 0, y: 0 });   │
│ pos.value.x = 50;  ◄─── Loses reactivity!    │
└────────────────────────────────────────────────┘

✅ SOLUTION:
┌────────────────────────────────────────────────┐
│ pos.value = { x: 50, y: 0 };  ◄─── Reassign! │
│ // OR                                         │
│ pos.modify((value) => {                       │
│   value.x = 50;                               │
│   return value;                               │
│ });                                            │
└────────────────────────────────────────────────┘

─────────────────────────────────────────────────

❌ PITFALL 3: Missing GestureHandlerRootView
┌────────────────────────────────────────────────┐
│ export default function App() {               │
│   return <TabNavigation />;  ◄─── Gestures   │
│ }                                   won't work!│
└────────────────────────────────────────────────┘

✅ SOLUTION:
┌────────────────────────────────────────────────┐
│ import { GestureHandlerRootView } from        │
│   'react-native-gesture-handler';             │
│                                                │
│ export default function App() {               │
│   return (                                     │
│     <GestureHandlerRootView style={{ flex: 1 }}>│
│       <TabNavigation />                        │
│     </GestureHandlerRootView>                  │
│   );                                           │
│ }                                              │
└────────────────────────────────────────────────┘
```

---

## Decision Tree: When to Use What

```
                    START
                      │
                      ▼
          ┌─────────────────────┐
          │ How many tabs?      │
          └─────┬───────────┬───┘
                │           │
         ≤5 tabs│           │6+ tabs
                │           │
                ▼           ▼
        ┌──────────┐   ┌─────────────┐
        │ScrollView│   │  FlatList   │
        │ Simple   │   │ Performance │
        └──────────┘   └─────────────┘
                │           │
                └─────┬─────┘
                      │
                      ▼
          ┌─────────────────────┐
          │ Need gestures?      │
          └─────┬───────────┬───┘
                │           │
            No  │           │Yes
                │           │
                ▼           ▼
        ┌──────────┐   ┌─────────────┐
        │ Basic    │   │Gesture.Pan()│
        │withSpring│   │ + withDecay │
        └──────────┘   └─────────────┘
                │           │
                └─────┬─────┘
                      │
                      ▼
          ┌─────────────────────┐
          │ Custom or library?  │
          └─────┬───────────┬───┘
                │           │
          Custom│           │Library
                │           │
                ▼           ▼
        ┌──────────┐   ┌─────────────────┐
        │Implement │   │react-native-    │
        │from      │   │animated-tabbar  │
        │scratch   │   │OR               │
        │~200 LOC  │   │reanimated-      │
        │          │   │tab-view         │
        └──────────┘   └─────────────────┘
```

---

## Summary Checklist

### Setup ✅
- [ ] Install react-native-reanimated ~4.1.1
- [ ] Install react-native-gesture-handler ~2.28.0
- [ ] Install react-native-worklets 0.5.1
- [ ] Update babel.config.js with 'react-native-worklets/plugin'
- [ ] Wrap app with GestureHandlerRootView

### Implementation ✅
- [ ] Create shared values for selectedIndex and scrollX
- [ ] Implement TabBar with horizontal ScrollView
- [ ] Create TabIndicator with interpolate
- [ ] Build TabContent with paging ScrollView
- [ ] Add useAnimatedScrollHandler with scrollEventThrottle={16}

### Optimization ✅
- [ ] Separate static and animated styles
- [ ] Memoize tab width calculations
- [ ] Use React.memo for TabItem
- [ ] Add getItemLayout if using FlatList
- [ ] Extract complex worklet functions

### Type Safety ✅
- [ ] Define Tab interface
- [ ] Type all component props
- [ ] Use SharedValue<T> generic types
- [ ] Type useAnimatedStyle return values

### Testing ✅
- [ ] Clear Metro cache: npx expo start -c
- [ ] Test tap navigation
- [ ] Test swipe gestures
- [ ] Verify 60fps animations
- [ ] Check memory usage

---

**Created:** 2025-10-24
**For:** Coyotito (by Jarvis)
**Purpose:** Visual reference for Reanimated v4 tab navigation architecture
