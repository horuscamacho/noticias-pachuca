# Fake Scroll Header - Architecture Diagram

## Visual Flow Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ HomeScreen (app/(invited)/home/index.tsx)                        ┃
┃                                                                   ┃
┃ ┌─────────────────────────────────────────────────────────────┐ ┃
┃ │ useCollapsibleHeader()                                      │ ┃
┃ │ Returns: scrollHandler, logoAnimatedStyle, bannerAnimated   │ ┃
┃ └─────────────────────────────────────────────────────────────┘ ┃
┃                                                                   ┃
┃ ┌─────────────────────────────────────────────────────────────┐ ┃
┃ │ useState(headerHeight)                                      │ ┃
┃ │ - Initially 0                                               │ ┃
┃ │ - Set via onLayout callback                                 │ ┃
┃ └─────────────────────────────────────────────────────────────┘ ┃
┃                                                                   ┃
┃  ┌──────────────────────────────────────────────────────────┐   ┃
┃  │ LAYER 1: Absolutely Positioned Header (zIndex: 10)      │   ┃
┃  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │   ┃
┃  │ ┃ CollapsibleHeader                                  ┃  │   ┃
┃  │ ┃                                                     ┃  │   ┃
┃  │ ┃ ┌─────────────────────────────────────────────────┐┃  │   ┃
┃  │ ┃ │ Animated.View (logoAnimatedStyle)              ││┃  │   ┃
┃  │ ┃ │  ┌────────────┐         ┌──────────┐          ││┃  │   ┃
┃  │ ┃ │  │ NOTICIAS   │         │ EDICIÓN  │          ││┃  │   ┃
┃  │ ┃ │  │ PACHUCA    │         │    ▼     │          ││┃  │   ┃
┃  │ ┃ │  └────────────┘         └──────────┘          ││┃  │   ┃
┃  │ ┃ └─────────────────────────────────────────────────┘┃  │   ┃
┃  │ ┃                                                     ┃  │   ┃
┃  │ ┃ ┌─────────────────────────────────────────────────┐┃  │   ┃
┃  │ ┃ │ Animated.View (bannerAnimatedStyle)            ││┃  │   ┃
┃  │ ┃ │ ╔═══════════════════════════════════════════╗  ││┃  │   ┃
┃  │ ┃ │ ║ SUSCRÍBETE PARA VIVIR LA NUEVA           ║  ││┃  │   ┃
┃  │ ┃ │ ║ EXPERIENCIA DE LAS NOTICIAS EN HIDALGO   ║  ││┃  │   ┃
┃  │ ┃ │ ║                                           ║  ││┃  │   ┃
┃  │ ┃ │ ║          [ REGISTRARSE ]                  ║  ││┃  │   ┃
┃  │ ┃ │ ╚═══════════════════════════════════════════╝  ││┃  │   ┃
┃  │ ┃ └─────────────────────────────────────────────────┘┃  │   ┃
┃  │ ┃                                                     ┃  │   ┃
┃  │ ┃ onLayout={() => setHeaderHeight(height)}           ┃  │   ┃
┃  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │   ┃
┃  └──────────────────────────────────────────────────────────┘   ┃
┃                                                                   ┃
┃  ┌──────────────────────────────────────────────────────────┐   ┃
┃  │ LAYER 2: Tab Navigation                                 │   ┃
┃  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │   ┃
┃  │ ┃ BrutalistTabs                                       ┃  │   ┃
┃  │ ┃                                                     ┃  │   ┃
┃  │ ┃ ┌─────────────────────────────────────────────────┐┃  │   ┃
┃  │ ┃ │ BrutalistTabSelector                           ││┃  │   ┃
┃  │ ┃ │ ════════════════════════════════════════════   ││┃  │   ┃
┃  │ ┃ │                                                 ││┃  │   ┃
┃  │ ┃ │ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐→     ││┃  │   ┃
┃  │ ┃ │ │TODAS ││DEPORT││POLÍT ││ECONOM││SALUD │      ││┃  │   ┃
┃  │ ┃ │ │██████││      ││      ││      ││      │      ││┃  │   ┃
┃  │ ┃ │ └──────┘└──────┘└──────┘└──────┘└──────┘      ││┃  │   ┃
┃  │ ┃ │ ↑                                               ││┃  │   ┃
┃  │ ┃ │ Yellow indicator (animated)                     ││┃  │   ┃
┃  │ ┃ │                                                 ││┃  │   ┃
┃  │ ┃ │ ════════════════════════════════════════════   ││┃  │   ┃
┃  │ ┃ └─────────────────────────────────────────────────┘┃  │   ┃
┃  │ ┃                                                     ┃  │   ┃
┃  │ ┃ ┌─────────────────────────────────────────────────┐┃  │   ┃
┃  │ ┃ │ BrutalistTabContent                            ││┃  │   ┃
┃  │ ┃ │                                                 ││┃  │   ┃
┃  │ ┃ │ ┌─────────────────────────────────────────────┐││┃  │   ┃
┃  │ ┃ │ │ TabContentWithNews                         │││┃  │   ┃
┃  │ ┃ │ │                                             │││┃  │   ┃
┃  │ ┃ │ │ Animated.ScrollView                        │││┃  │   ┃
┃  │ ┃ │ │   onScroll={scrollHandler} ←───────────────┼┼┼────┐
┃  │ ┃ │ │                                             │││┃  │ │
┃  │ ┃ │ │ ┌─────────────────────────────────────────┐│││┃  │ │
┃  │ ┃ │ │ │ Dead Space                              ││││┃  │ │
┃  │ ┃ │ │ │ height = headerHeight                   ││││┃  │ │
┃  │ ┃ │ │ │                                         ││││┃  │ │
┃  │ ┃ │ │ │ (Invisible padding)                     ││││┃  │ │
┃  │ ┃ │ │ └─────────────────────────────────────────┘│││┃  │ │
┃  │ ┃ │ │                                             │││┃  │ │
┃  │ ┃ │ │ ┌─────────────────────────────────────────┐│││┃  │ │
┃  │ ┃ │ │ │ NewsList (Actual Content)               ││││┃  │ │
┃  │ ┃ │ │ │                                         ││││┃  │ │
┃  │ ┃ │ │ │ ╔═════════════════════════════════════╗ ││││┃  │ │
┃  │ ┃ │ │ │ ║ News Card 1                         ║ ││││┃  │ │
┃  │ ┃ │ │ │ ╚═════════════════════════════════════╝ ││││┃  │ │
┃  │ ┃ │ │ │                                         ││││┃  │ │
┃  │ ┃ │ │ │ ╔═════════════════════════════════════╗ ││││┃  │ │
┃  │ ┃ │ │ │ ║ News Card 2                         ║ ││││┃  │ │
┃  │ ┃ │ │ │ ╚═════════════════════════════════════╝ ││││┃  │ │
┃  │ ┃ │ │ │                                         ││││┃  │ │
┃  │ ┃ │ │ │ ╔═════════════════════════════════════╗ ││││┃  │ │
┃  │ ┃ │ │ │ ║ News Card 3                         ║ ││││┃  │ │
┃  │ ┃ │ │ │ ╚═════════════════════════════════════╝ ││││┃  │ │
┃  │ ┃ │ │ │                                         ││││┃  │ │
┃  │ ┃ │ │ │ ...                                     ││││┃  │ │
┃  │ ┃ │ │ └─────────────────────────────────────────┘│││┃  │ │
┃  │ ┃ │ └─────────────────────────────────────────────┘││┃  │ │
┃  │ ┃ └─────────────────────────────────────────────────┘┃  │ │
┃  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ │
┃  └──────────────────────────────────────────────────────────┘ │
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                                                   │
                                                                   │
     ┌─────────────────────────────────────────────────────────────┘
     │
     ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ useCollapsibleHeader Hook                                        ┃
┃                                                                   ┃
┃ scrollY SharedValue ◄───── scrollHandler updates this            ┃
┃                                                                   ┃
┃ logoAnimatedStyle ◄─────── interpolate(scrollY, [0, 80])         ┃
┃                            opacity: 1 → 0                         ┃
┃                                                                   ┃
┃ bannerAnimatedStyle ◄───── interpolate(scrollY, [0, 180])        ┃
┃                            opacity: 1 → 0                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Scroll Behavior Visualization

### State 1: Initial (scrollY = 0)

```
┌────────────────────────────────────┐
│ 🔆 Logo (opacity: 1.0)             │ ← Fully visible
│    NOTICIAS PACHUCA      EDICIÓN▼  │
├────────────────────────────────────┤
│ 🔆 Banner (opacity: 1.0)           │ ← Fully visible
│ ╔════════════════════════════════╗ │
│ ║ SUSCRÍBETE...                  ║ │
│ ║    [ REGISTRARSE ]             ║ │
│ ╚════════════════════════════════╝ │
├────────────────────────────────────┤
│ TODAS  DEPORTES  POLÍTICA  ...     │
│ ████                               │
├────────────────────────────────────┤
│ ╔════════════════════════════════╗ │
│ ║ News Card 1                    ║ │ ← First news visible
│ ╚════════════════════════════════╝ │
└────────────────────────────────────┘
```

### State 2: Scrolling (scrollY = 40)

```
┌────────────────────────────────────┐
│ 🌗 Logo (opacity: 0.5)             │ ← Fading out
│    NOTICIAS PACHUCA      EDICIÓN▼  │
├────────────────────────────────────┤
│ 🔆 Banner (opacity: 0.8)           │ ← Still mostly visible
│ ╔════════════════════════════════╗ │
│ ║ SUSCRÍBETE...                  ║ │
│ ║    [ REGISTRARSE ]             ║ │
│ ╚════════════════════════════════╝ │
├────────────────────────────────────┤
│ TODAS  DEPORTES  POLÍTICA  ...     │
│ ████                               │
├────────────────────────────────────┤
│ ╔════════════════════════════════╗ │
│ ║ News Card 2                    ║ │ ← Scrolled up
│ ╚════════════════════════════════╝ │
└────────────────────────────────────┘
```

### State 3: Scrolled (scrollY = 100)

```
┌────────────────────────────────────┐
│ 🌑 Logo (opacity: 0.0)             │ ← Invisible
│                                    │
├────────────────────────────────────┤
│ 🌗 Banner (opacity: 0.4)           │ ← Fading out
│ ╔════════════════════════════════╗ │
│ ║                                ║ │
│ ║                                ║ │
│ ╚════════════════════════════════╝ │
├────────────────────────────────────┤
│ TODAS  DEPORTES  POLÍTICA  ...     │
│ ████                               │
├────────────────────────────────────┤
│ ╔════════════════════════════════╗ │
│ ║ News Card 4                    ║ │ ← More scrolled
│ ╚════════════════════════════════╝ │
└────────────────────────────────────┘
```

### State 4: Fully Scrolled (scrollY = 200+)

```
┌────────────────────────────────────┐
│ 🌑 Logo (invisible)                │
│                                    │
├────────────────────────────────────┤
│ 🌑 Banner (invisible)              │
│                                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│ TODAS  DEPORTES  POLÍTICA  ...     │ ← Only tabs visible
│ ████                               │
├────────────────────────────────────┤
│ ╔════════════════════════════════╗ │
│ ║ News Card 8                    ║ │ ← Deep in content
│ ╚════════════════════════════════╝ │
└────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Scrolls content down                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Animated.ScrollView detects scroll                              │
│ - Native event: { contentOffset: { y: number } }                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ scrollHandler (useAnimatedScrollHandler)                        │
│ - Runs on UI thread (Reanimated)                                │
│ - No bridge crossing                                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Updates scrollY SharedValue                                     │
│ scrollY.value = event.contentOffset.y                           │
└────────────┬───────────────┬────────────────────────────────────┘
             │               │
             ▼               ▼
   ┌──────────────┐   ┌──────────────┐
   │ logoAnimated │   │ bannerAnimated│
   │ Style        │   │ Style         │
   └──────┬───────┘   └──────┬────────┘
          │                   │
          │                   │
          ▼                   ▼
   ┌──────────────────────────────────┐
   │ useAnimatedStyle reruns          │
   │ - Interpolates scrollY           │
   │ - Returns new opacity            │
   └──────┬───────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────┐
   │ Animated.View updates            │
   │ - Logo fades out                 │
   │ - Banner fades out               │
   │ - Smooth 60fps animation         │
   └──────────────────────────────────┘
```

---

## Component Dependency Graph

```
HomeScreen
├── useCollapsibleHeader() ────────┐
│   ├── scrollY                    │
│   ├── scrollHandler              │
│   ├── logoAnimatedStyle          │
│   └── bannerAnimatedStyle        │
│                                   │
├── CollapsibleHeader              │
│   ├── receives: logoAnimatedStyle◄┘
│   ├── receives: bannerAnimatedStyle
│   ├── sends: onLayout → setHeaderHeight
│   │
│   ├── LogoSection (Animated.View)
│   │   ├── Logo text
│   │   └── Edition dropdown
│   │
│   └── BannerSection (Animated.View)
│       ├── Banner text
│       └── CTA button
│
└── BrutalistTabs
    ├── receives: headerHeight ◄──────┐
    ├── receives: scrollHandler       │
    │                                  │
    ├── BrutalistTabSelector           │
    │   ├── useState(activeTab)        │
    │   ├── Tab buttons (Pressable)    │
    │   └── Animated indicator         │
    │                                  │
    └── BrutalistTabContent            │
        ├── receives: activeTab        │
        ├── receives: headerHeight ────┘
        ├── receives: scrollHandler
        │
        ├── TabContentWithNews (if news tab)
        │   ├── Animated.ScrollView ──────┐
        │   │   └── connects scrollHandler ┘
        │   ├── Dead space View (height = headerHeight)
        │   └── NewsList
        │       └── News cards (map)
        │
        └── ColoredTabContent (if other tab)
            ├── Animated.ScrollView
            ├── Dead space View
            └── Placeholder content
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ LOCAL STATE (useState)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ HomeScreen                                                      │
│ ├── headerHeight (number)                                      │
│ │   - Initially: 0                                             │
│ │   - Updated: onLayout callback                               │
│ │   - Used: passed to tabs for dead space                      │
│                                                                 │
│ BrutalistTabs                                                   │
│ ├── activeTab (string)                                         │
│ │   - Initially: tabs[0].id                                    │
│ │   - Updated: onTabChange callback                            │
│ │   - Used: determines which content to show                   │
│                                                                 │
│ BrutalistTabSelector                                            │
│ ├── tabLayouts (Map<string, { x, width }>)                     │
│ │   - Ref, not state                                           │
│ │   - Stores: measured positions of tabs                       │
│ │   - Used: for indicator animation                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SHARED VALUES (Reanimated)                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ useCollapsibleHeader                                            │
│ ├── scrollY                                                     │
│ │   - Type: SharedValue<number>                                │
│ │   - Updated: scrollHandler                                   │
│ │   - Used: opacity interpolation                              │
│                                                                 │
│ BrutalistTabSelector                                            │
│ ├── indicatorOffset                                             │
│ │   - Type: SharedValue<number>                                │
│ │   - Updated: withTiming on tab press                         │
│ │   - Used: indicator translateX                               │
│ │                                                               │
│ └── indicatorWidth                                              │
│     - Type: SharedValue<number>                                 │
│     - Updated: withTiming on tab press                          │
│     - Used: indicator width                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Animation Timeline

```
User taps "DEPORTES" tab
         │
         ▼
    [0ms] Press detected
         │
         ├─► onPress handler fires
         │
    [0ms] Start animations
         │
         ├─► indicatorOffset.value = withTiming(newX, 250ms)
         ├─► indicatorWidth.value = withTiming(newWidth, 250ms)
         │
[0-250ms] Indicator slides smoothly
         │
         ├─► Yellow bar moves from "TODAS" to "DEPORTES"
         ├─► Width adjusts if tabs different sizes
         │
   [250ms] Animation complete
         │
         ├─► Indicator positioned under "DEPORTES"
         ├─► Tab selector state updated
         │
         ▼
    Content switches to "DEPORTES" news
         │
         ▼
    New ScrollView mounts with fresh scrollY = 0
         │
         ▼
    Header resets to full opacity
```

---

## Performance Optimization Points

```
┌─────────────────────────────────────────────────────────────────┐
│ OPTIMIZATION STRATEGY                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Reanimated UI Thread                                        │
│    ✅ All animations run on UI thread                          │
│    ✅ No bridge crossing during scroll                         │
│    ✅ Guaranteed 60fps                                         │
│                                                                 │
│ 2. Conditional Rendering                                       │
│    ✅ Tabs only render after headerHeight > 0                  │
│    ✅ Prevents layout thrashing                                │
│    ✅ Clean initial render                                     │
│                                                                 │
│ 3. Scroll Event Throttling                                     │
│    ✅ scrollEventThrottle={16}                                 │
│    ✅ 60fps update rate                                        │
│    ✅ Balanced performance/smoothness                          │
│                                                                 │
│ 4. Component Stability                                         │
│    ✅ Stable props (no inline objects/functions)               │
│    ✅ Ready for React.memo                                     │
│    ✅ Minimal re-render triggers                               │
│                                                                 │
│ 5. Ref-Based State (where appropriate)                         │
│    ✅ tabLayouts stored in ref                                 │
│    ✅ No re-renders on layout updates                          │
│    ✅ Only updates when needed                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Details

### Dead Space Pattern

```typescript
// TabContentWithNews.tsx
<Animated.ScrollView onScroll={scrollHandler}>
  {/* This creates the "fake scroll under header" illusion */}
  <View style={{ height: headerHeight }} />

  {/* When user scrolls, scrollY reports offset including dead space */}
  {/* Header animates based on this offset */}
  {/* Content appears to scroll "under" the absolutely positioned header */}

  <NewsList category={category} />
</Animated.ScrollView>
```

**Why it works:**
1. Header is absolutely positioned (doesn't affect layout flow)
2. ScrollView starts at y=0 (top of screen)
3. Dead space pushes content down by headerHeight
4. As user scrolls, content moves up, but scrollY increases
5. Header opacity decreases based on scrollY
6. Result: Smooth parallax-like effect

### Header Height Measurement

```typescript
// HomeScreen
const [headerHeight, setHeaderHeight] = useState(0);

// CollapsibleHeader
<Animated.View onLayout={(event) => {
  const { height } = event.nativeEvent.layout;
  setHeaderHeight(height);
}}>

// Why wait for measurement?
{headerHeight > 0 && <BrutalistTabs headerHeight={headerHeight} />}
```

**Benefits:**
- Accurate height regardless of content
- Handles safe area automatically
- Adapts to different devices
- No hardcoded magic numbers

---

**END OF ARCHITECTURE DIAGRAM**
