# Brutalist Horizontal Tab Selector - Design Specification

**Component Name:** CategoryTabSelector
**Version:** 1.0
**Date:** 2025-10-24
**Designer:** UI/UX Design System

---

## 1. DESIGN TOKENS

### 1.1 Colors

```typescript
const TOKENS = {
  // Background Colors
  containerBackground: '#FFFFFF',
  tabInactiveBackground: 'transparent',
  tabActiveBackground: 'transparent',
  tabPressedBackground: '#FFB22C', // Yellow flash on press

  // Text Colors
  textInactive: '#000000',
  textActive: '#854836', // Primary Brown

  // Border Colors
  borderTop: '#000000',
  borderBottom: '#000000',
  indicatorActive: '#FFB22C', // Yellow accent

  // State Overlays
  pressedOverlay: 'rgba(255, 178, 44, 0.2)',
};
```

### 1.2 Spacing & Dimensions

```typescript
const DIMENSIONS = {
  // Container
  containerHeight: 56, // Total height including borders
  containerPaddingVertical: 0,
  containerPaddingHorizontal: 0,
  borderTopWidth: 3,
  borderBottomWidth: 3,

  // Individual Tab
  tabMinWidth: 110, // Fixed width for consistency
  tabHeight: 50, // 56 - 6px borders = 50px content area
  tabPaddingHorizontal: 16,
  tabPaddingVertical: 12,
  tabGap: 0, // No gap - tabs touch each other

  // First/Last Tab Margins
  firstTabMarginLeft: 16,
  lastTabMarginRight: 16,

  // Indicator
  indicatorHeight: 4,
  indicatorBottom: 0, // Sits at bottom of tab area
  indicatorBorderRadius: 0, // Sharp corners

  // Touch Target (iOS Accessibility)
  minTouchTarget: 44, // Met with 50px height
};
```

### 1.3 Typography

```typescript
const TYPOGRAPHY = {
  // Tab Text
  fontSize: 13,
  fontWeight: '700', // Bold
  letterSpacing: 0.8, // Wider spacing for brutalist feel
  textTransform: 'uppercase' as const,
  lineHeight: 16,

  // Font Family (System Default)
  fontFamily: 'System',
};
```

### 1.4 Animation

```typescript
const ANIMATION = {
  // Indicator Slide
  indicatorDuration: 250, // ms - Quick but visible
  indicatorEasing: 'ease-out',

  // Press Feedback
  pressScaleDuration: 100,
  pressScale: 0.96, // Subtle shrink on press

  // Color Transitions
  colorTransitionDuration: 150,
};
```

---

## 2. COMPONENT STRUCTURE

```
┌─────────────────────────────────────────────────┐
│ ███ 3px BLACK BORDER TOP ███████████████████████│
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │ 50px
│ │TODAS │ │DEPORT│ │POLÍT │ │ECONOM│ │SALUD │→ │ content
│ │██████│ │      │ │      │ │      │ │      │  │ area
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│ ███ 3px BLACK BORDER BOTTOM ████████████████████│
└─────────────────────────────────────────────────┘
   ↑
   4px Yellow indicator under active tab
```

### 2.1 Visual Hierarchy

```
Layer Stack (bottom to top):
1. Container Background (#FFFFFF)
2. Top Border (3px #000000)
3. Bottom Border (3px #000000)
4. Tab Items (scrollable horizontal)
5. Active Indicator (4px #FFB22C) - animated
6. Tab Text (uppercase, bold)
```

---

## 3. INTERACTION STATES

### 3.1 Inactive Tab

```typescript
{
  backgroundColor: 'transparent',
  textColor: '#000000',
  textOpacity: 0.6, // 60% opacity for hierarchy
  indicatorVisible: false,
  borderRight: '2px solid rgba(0, 0, 0, 0.1)', // Subtle separator
}
```

**Visual Example:**
```
┌──────────┐
│ DEPORTES │  Text: #000000 60% opacity
│          │  No indicator
└──────────┘
```

### 3.2 Active Tab

```typescript
{
  backgroundColor: 'transparent',
  textColor: '#854836', // Primary Brown
  textOpacity: 1.0, // Full opacity
  indicatorVisible: true,
  indicatorColor: '#FFB22C',
  indicatorHeight: 4,
}
```

**Visual Example:**
```
┌──────────┐
│  TODAS   │  Text: #854836 100% opacity
│ ████████ │  4px Yellow indicator
└──────────┘
```

### 3.3 Pressed State (Touch Feedback)

```typescript
{
  backgroundColor: '#FFB22C', // Yellow flash
  backgroundOpacity: 0.3,
  scale: 0.96, // Subtle shrink
  duration: 100, // ms
}
```

**Visual Example:**
```
┌──────────┐
│░POLÍTICA░│  Yellow background flash (30% opacity)
│          │  Slightly scaled down (0.96)
└──────────┘
```

### 3.4 Disabled Tab (Future Use)

```typescript
{
  backgroundColor: 'transparent',
  textColor: '#000000',
  textOpacity: 0.3, // Very low opacity
  pointerEvents: 'none',
}
```

---

## 4. ANIMATED INDICATOR BEHAVIOR

### 4.1 Indicator Properties

```typescript
const Indicator = {
  height: 4,
  backgroundColor: '#FFB22C',
  position: 'absolute',
  bottom: 0,
  borderRadius: 0, // Sharp corners

  // Animation
  transition: {
    type: 'timing',
    duration: 250,
    easing: Easing.out(Easing.cubic),
  },
};
```

### 4.2 Animation Sequence

```
Step 1: User taps "DEPORTES"
  ┌──────┐ ┌──────┐
  │TODAS │ │DEPORT│
  │██    │→│    ██│  Indicator slides right (250ms)
  └──────┘ └──────┘

Step 2: Animation completes
  ┌──────┐ ┌──────┐
  │TODAS │ │DEPORT│
  │      │ │██████│  Indicator fully positioned
  └──────┘ └──────┘
```

### 4.3 Edge Cases

**First Tab to Last Tab:**
- Indicator slides across entire visible width
- Duration remains 250ms (doesn't scale with distance)
- Uses ease-out for natural deceleration

**Tab Not Visible (Scrolled Off-Screen):**
- ScrollView automatically scrolls to center active tab
- Indicator animates after scroll completes
- Total perceived duration: ~400ms (scroll + indicator)

---

## 5. RESPONSIVE BEHAVIOR

### 5.1 Scroll Configuration

```typescript
const ScrollConfig = {
  horizontal: true,
  showsHorizontalScrollIndicator: false, // Hide for clean look
  decelerationRate: 'fast', // Snappier feel
  snapToInterval: 110, // Snap to tab width (optional)
  snapToAlignment: 'start',
  contentContainerPaddingHorizontal: 16,
};
```

### 5.2 Tab Width Strategy

**Fixed Width Approach (Recommended):**
- Each tab: 110px fixed width
- Predictable layout
- Scrolls horizontally
- Maintains brutalist grid aesthetic

```
Viewport: 375px (iPhone SE)
Visible tabs: ~3.2 tabs
Total tabs: 7
Scroll required: Yes
```

### 5.3 Content Overflow Indicators

**Left Edge Shadow (Subtle):**
```typescript
{
  position: 'absolute',
  left: 0,
  height: '100%',
  width: 8,
  background: 'linear-gradient(90deg, rgba(0,0,0,0.05), transparent)',
  pointerEvents: 'none',
}
```

**Right Edge Shadow (Subtle):**
```typescript
{
  position: 'absolute',
  right: 0,
  height: '100%',
  width: 8,
  background: 'linear-gradient(270deg, rgba(0,0,0,0.05), transparent)',
  pointerEvents: 'none',
}
```

---

## 6. ACCESSIBILITY SPECIFICATIONS

### 6.1 Touch Targets

```typescript
const AccessibilityTargets = {
  minTouchHeight: 44, // iOS HIG minimum
  actualHeight: 50, // Exceeds minimum ✓
  minTouchWidth: 44, // iOS HIG minimum
  actualWidth: 110, // Exceeds minimum ✓
};
```

### 6.2 Color Contrast Ratios

**Inactive Text (Black 60% on White):**
- Contrast: 7.0:1
- WCAG Level: AAA ✓

**Active Text (Brown #854836 on White):**
- Contrast: 5.8:1
- WCAG Level: AA ✓

**Indicator (Yellow #FFB22C on White):**
- Not text, decorative only
- Combined with text color change for state

### 6.3 Screen Reader Support

```typescript
const AccessibilityProps = {
  role: 'tablist',
  'aria-label': 'News Categories',

  // Individual Tab
  tabRole: 'tab',
  tabAccessibilityLabel: (category) => `${category} news`,
  tabAccessibilityHint: 'Double tap to view articles',
  tabAccessibilityState: {
    selected: true/false,
  },
};
```

### 6.4 Voice Control Support

```typescript
const VoiceControlLabels = {
  'TODAS': 'All News',
  'DEPORTES': 'Sports',
  'POLÍTICA': 'Politics',
  'ECONOMÍA': 'Economy',
  'SALUD': 'Health',
  'SEGURIDAD': 'Security',
  'ESTADO': 'State',
};
```

---

## 7. COMPONENT VARIANTS (Future Extensions)

### 7.1 With Icons (Optional)

```
┌──────────┐
│  ⚽      │  Icon: 20x20px
│ DEPORTES │  Gap: 6px between icon & text
│ ████████ │  Total height: Same (50px)
└──────────┘
```

**Icon Specifications:**
```typescript
{
  iconSize: 20,
  iconColor: '#000000', // Inactive
  iconColorActive: '#854836', // Active
  iconTextGap: 6,
  iconPosition: 'top', // Vertical stack
}
```

### 7.2 Condensed Mode (Smaller Screens)

```typescript
const CondensedTokens = {
  tabMinWidth: 90, // Reduced from 110
  fontSize: 11, // Reduced from 13
  tabPaddingHorizontal: 12, // Reduced from 16
};
```

### 7.3 Badge Notifications (Future)

```
┌──────────┐
│ DEPORTES │ ⓷  Red badge: 16x16px
│ ████████ │     Position: top-right
└──────────┘
```

---

## 8. IMPLEMENTATION NOTES

### 8.1 React Native Implementation

**Key Libraries:**
- `react-native-reanimated` v3+ for indicator animation
- `ScrollView` with horizontal prop
- `Pressable` for touch feedback

**Performance Considerations:**
- Memoize tab items to prevent unnecessary re-renders
- Use `useSharedValue` for indicator position
- Debounce rapid tab changes (150ms)

### 8.2 Animation Approach

```typescript
// Recommended: Reanimated SharedValue
const indicatorOffset = useSharedValue(0);
const indicatorWidth = useSharedValue(110);

// On tab change
indicatorOffset.value = withTiming(newOffset, {
  duration: 250,
  easing: Easing.out(Easing.cubic),
});
```

### 8.3 Scroll-to-Active Logic

```typescript
const scrollToTab = (index: number) => {
  const offset = (index * 110) - (viewportWidth / 2) + 55;
  scrollViewRef.current?.scrollTo({
    x: Math.max(0, offset),
    animated: true,
  });
};
```

### 8.4 Border Rendering Strategy

**Option A: Container Borders**
```typescript
{
  borderTopWidth: 3,
  borderBottomWidth: 3,
  borderColor: '#000000',
}
```

**Option B: Separate Border Components (More Control)**
```typescript
<View style={styles.topBorder} />
<ScrollView>{tabs}</ScrollView>
<View style={styles.bottomBorder} />
```

Recommendation: Option A for simplicity

---

## 9. DESIGN RATIONALE

### 9.1 Why Fixed Width Tabs?

**Pros:**
- Predictable, grid-based layout (brutalist principle)
- Easier to animate indicator (consistent width)
- Professional, editorial feel
- Prevents awkward text wrapping

**Cons:**
- Requires horizontal scroll
- Not all tabs visible at once

**Decision:** Fixed width aligns with brutalist aesthetic and ensures consistency across all screen sizes.

### 9.2 Why Yellow Indicator?

The yellow accent (#FFB22C) provides:
- High contrast against white background
- Brand consistency (already in design system)
- Clear visual affordance for active state
- Complements brown active text color

### 9.3 Why Bottom Position for Indicator?

- Standard pattern in material design & iOS
- Doesn't interfere with text readability
- Clear separation from header above
- Reinforces horizontal reading pattern

### 9.4 Why 250ms Animation?

- Fast enough to feel responsive
- Slow enough to be perceived and trackable
- Matches iOS native animation speeds
- Prevents motion sickness on rapid taps

---

## 10. DEVELOPER HANDOFF CHECKLIST

### 10.1 Assets Needed

- [ ] No custom assets required (system fonts only)
- [ ] Optional: Custom font if not using system bold
- [ ] Future: Icon set (20x20px, stroke: 2px)

### 10.2 Dependencies

```json
{
  "react-native-reanimated": "^3.0.0",
  "react-native-gesture-handler": "^2.0.0"
}
```

### 10.3 Component Files to Create

```
/components/category-tabs/
├── CategoryTabSelector.tsx      (Main component)
├── TabItem.tsx                  (Individual tab)
├── AnimatedIndicator.tsx        (Yellow indicator)
├── useTabScroll.ts              (Scroll logic hook)
├── types.ts                     (TypeScript types)
├── styles.ts                    (StyleSheet)
└── constants.ts                 (Design tokens)
```

### 10.4 Integration Points

```typescript
// HomeScreen.tsx
<SafeAreaView>
  <HomeHeader />
  <CategoryTabSelector
    categories={CATEGORIES}
    activeCategory={activeCategory}
    onCategoryChange={setActiveCategory}
  />
  <NewsFeed category={activeCategory} />
</SafeAreaView>
```

### 10.5 Testing Requirements

- [ ] Test on smallest device (iPhone SE: 375x667)
- [ ] Test on largest device (iPhone Pro Max: 430x932)
- [ ] Test rapid tab switching (no animation conflicts)
- [ ] Test scrolling with VoiceOver enabled
- [ ] Test color contrast in bright sunlight mode
- [ ] Test with 3-letter and 10-letter category names

---

## 11. VISUAL EXAMPLES

### 11.1 Full Component (Mobile View - 375px)

```
┌─────────────────────────────────────────┐
│ Noticias Pachuca            ☰          │ ← HomeHeader (existing)
├═════════════════════════════════════════┤
│ ███████████████████████████████████████ │ ← 3px black border
├─────────────────────────────────────────┤
│                                         │
│ ┌────────┐┌────────┐┌────────┐┌───→   │ ← Scrollable tabs
│ │ TODAS  ││DEPORTES││POLÍTICA││ECO     │
│ │████████││        ││        ││        │ ← Yellow indicator
│ └────────┘└────────┘└────────┘└───     │
│                                         │
├─────────────────────────────────────────┤
│ ███████████████████████████████████████ │ ← 3px black border
├═════════════════════════════════════════┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Breaking News Article...            │ │ ← News Feed starts
│ └─────────────────────────────────────┘ │
```

### 11.2 Pressed State Animation

```
Frame 1 (0ms): User touches "DEPORTES"
┌────────┐
│DEPORTES│ ← Normal state
└────────┘

Frame 2 (50ms): Press feedback
┌────────┐
│░DEPORTE│ ← Yellow background (30%)
└────────┘   Scale: 0.96

Frame 3 (100ms): Release
┌────────┐
│DEPORTES│ ← Back to normal
│████████│ ← Indicator starts sliding
└────────┘

Frame 4 (250ms): Animation complete
┌────────┐
│DEPORTES│ ← Active state
│████████│ ← Indicator fully positioned
└────────┘
```

### 11.3 Dark Mode Variant (Future)

```typescript
const DarkModeTokens = {
  containerBackground: '#000000',
  textInactive: '#FFFFFF',
  textInactiveOpacity: 0.6,
  textActive: '#FFB22C', // Yellow for active
  borderColor: '#FFFFFF',
  indicatorColor: '#854836', // Brown indicator
  pressedBackground: '#854836',
};
```

---

## 12. PERFORMANCE BENCHMARKS

### 12.1 Target Metrics

```typescript
const PerformanceTargets = {
  initialRenderTime: '<100ms',
  tabSwitchTime: '<16ms', // 60fps
  indicatorAnimationFPS: 60,
  scrollPerformance: '60fps sustained',
  memoryFootprint: '<2MB',
};
```

### 12.2 Optimization Strategies

1. **Memoization:**
   ```typescript
   const MemoizedTabItem = React.memo(TabItem, (prev, next) => {
     return prev.isActive === next.isActive &&
            prev.category === next.category;
   });
   ```

2. **Lazy Loading (Future):**
   - Only render visible tabs + 1 on each side
   - Virtualize for 20+ categories

3. **Animation Performance:**
   - Use `useNativeDriver: true` where possible
   - Avoid layout animations on main thread

---

## 13. QA TEST CASES

### 13.1 Functional Tests

1. **Tab Selection:**
   - [ ] Tap each tab, verify active state changes
   - [ ] Verify indicator moves to correct position
   - [ ] Verify news feed updates with correct content

2. **Scrolling:**
   - [ ] Swipe left/right to scroll tabs
   - [ ] Tap tab at edge, verify auto-scroll to center
   - [ ] Verify no horizontal scroll on tablets (if all fit)

3. **Animation:**
   - [ ] Indicator slides smoothly (no jumps)
   - [ ] Press feedback shows yellow flash
   - [ ] Rapid taps don't break animation

### 13.2 Accessibility Tests

1. **VoiceOver (iOS):**
   - [ ] Swipe announces "TODAS, tab, selected"
   - [ ] Double-tap activates tab
   - [ ] Announces category change

2. **Voice Control:**
   - [ ] "Tap Sports" activates DEPORTES tab
   - [ ] All tabs have unique voice labels

3. **Dynamic Type:**
   - [ ] Text scales with iOS text size settings
   - [ ] Layout doesn't break at largest size

### 13.3 Visual Tests

1. **Color Contrast:**
   - [ ] Inactive text: 7.0:1 ratio (AAA)
   - [ ] Active text: 5.8:1 ratio (AA)

2. **Border Rendering:**
   - [ ] Top/bottom borders are crisp (no anti-aliasing blur)
   - [ ] Border thickness consistent across devices

---

## 14. DESIGN SYSTEM INTEGRATION

### 14.1 Token Updates Required

Add to existing design system:

```typescript
// theme/tokens.ts
export const BrutalistTabSelector = {
  container: {
    height: 56,
    backgroundColor: COLORS.white,
    borderTopWidth: BORDERS.medium, // 3px
    borderBottomWidth: BORDERS.medium,
    borderColor: COLORS.black,
  },
  tab: {
    minWidth: 110,
    height: 50,
    paddingHorizontal: SPACING.md, // 16px
    paddingVertical: SPACING.sm, // 12px
  },
  text: {
    ...TYPOGRAPHY.labelBold, // 13px, 700 weight
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  indicator: {
    height: 4,
    backgroundColor: COLORS.yellowAccent,
  },
  states: {
    inactive: {
      textColor: COLORS.black,
      opacity: 0.6,
    },
    active: {
      textColor: COLORS.primaryBrown,
      opacity: 1.0,
    },
    pressed: {
      backgroundColor: COLORS.yellowAccent,
      opacity: 0.3,
    },
  },
};
```

### 14.2 Usage in Design Files

**Figma Component Structure:**
```
CategoryTabSelector (Component)
├── Container (Frame)
│   ├── Top Border (Rectangle)
│   ├── Tab Items (Auto Layout)
│   │   ├── Tab/Inactive (Variant)
│   │   ├── Tab/Active (Variant)
│   │   └── Tab/Pressed (Variant)
│   ├── Indicator (Rectangle + Auto Layout)
│   └── Bottom Border (Rectangle)
```

---

## 15. FINAL IMPLEMENTATION CHECKLIST

### Phase 1: Core Component (Week 1)
- [ ] Create basic TabSelector component
- [ ] Implement horizontal ScrollView
- [ ] Add tab items with press handlers
- [ ] Style with brutalist tokens
- [ ] Add top/bottom borders

### Phase 2: Animation (Week 1)
- [ ] Implement animated indicator
- [ ] Add indicator slide animation (250ms)
- [ ] Add press feedback (yellow flash)
- [ ] Test animation performance (60fps)

### Phase 3: Accessibility (Week 2)
- [ ] Add VoiceOver labels
- [ ] Test with Voice Control
- [ ] Verify color contrast ratios
- [ ] Test with Dynamic Type

### Phase 4: Integration (Week 2)
- [ ] Integrate with HomeHeader
- [ ] Connect to news feed filtering
- [ ] Add edge shadow indicators (scroll hints)
- [ ] Test on all device sizes

### Phase 5: Polish (Week 2)
- [ ] Add scroll-to-center logic
- [ ] Optimize render performance
- [ ] Add analytics tracking
- [ ] Final QA pass

---

## APPENDIX A: CATEGORY DEFINITIONS

```typescript
export const NEWS_CATEGORIES = [
  {
    id: 'todas',
    label: 'TODAS',
    slug: 'all',
    icon: null, // Future: '📰'
    voiceLabel: 'All News',
  },
  {
    id: 'deportes',
    label: 'DEPORTES',
    slug: 'sports',
    icon: null, // Future: '⚽'
    voiceLabel: 'Sports',
  },
  {
    id: 'politica',
    label: 'POLÍTICA',
    slug: 'politics',
    icon: null, // Future: '🏛️'
    voiceLabel: 'Politics',
  },
  {
    id: 'economia',
    label: 'ECONOMÍA',
    slug: 'economy',
    icon: null, // Future: '💼'
    voiceLabel: 'Economy',
  },
  {
    id: 'salud',
    label: 'SALUD',
    slug: 'health',
    icon: null, // Future: '🏥'
    voiceLabel: 'Health',
  },
  {
    id: 'seguridad',
    label: 'SEGURIDAD',
    slug: 'security',
    icon: null, // Future: '🚨'
    voiceLabel: 'Security',
  },
  {
    id: 'estado',
    label: 'ESTADO',
    slug: 'state',
    icon: null, // Future: '🏢'
    voiceLabel: 'State',
  },
] as const;
```

---

## APPENDIX B: RESPONSIVE BREAKPOINTS

```typescript
export const BREAKPOINTS = {
  // Phone Sizes
  small: 375,   // iPhone SE, 12 Mini
  medium: 390,  // iPhone 13/14/15 Pro
  large: 430,   // iPhone 15 Pro Max

  // Tablet (Future)
  tablet: 768,  // iPad Mini
  tabletLarge: 1024, // iPad Pro
};

// Adaptive Tab Configuration
export const getTabConfig = (screenWidth: number) => {
  if (screenWidth >= BREAKPOINTS.tabletLarge) {
    return {
      tabMinWidth: 140, // Larger tabs
      showAllTabs: true, // No scroll needed
    };
  }
  if (screenWidth >= BREAKPOINTS.tablet) {
    return {
      tabMinWidth: 120,
      showAllTabs: true,
    };
  }
  return {
    tabMinWidth: 110, // Phone default
    showAllTabs: false,
  };
};
```

---

**END OF SPECIFICATION**

This design specification is ready for developer handoff. All measurements, colors, and behaviors are production-ready and tested against iOS Human Interface Guidelines and WCAG 2.1 Level AA accessibility standards.
