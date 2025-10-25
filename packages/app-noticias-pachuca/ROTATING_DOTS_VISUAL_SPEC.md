# Rotating Dot Indicator - Visual Specifications

## Visual Wireframes

### 1. Container Anatomy

```
┌─────────────────────────────────────────────┐
│                                             │
│          Article Content Area               │
│                                             │
│                                             │
│                   ...                       │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
                     │
                     │ 40px spacing
                     ▼
        ┌─────────────────────┐
        │  ○   ○   ●   ○   ○  │  ← Dot Indicator
        └─────────────────────┘
                     │
                     │ Safe area bottom
                     ▼
        ═══════════════════════
           Bottom of screen
```

### 2. Dot Indicator Container Details

```
┌────────────────────────────────────┐
│ Container: 120px × 40px            │
│ Border-radius: 20px                │
│ Background: rgba(0,0,0,0.4)        │
│ Backdrop-blur: 8px (iOS)           │
│                                    │
│  ┌──────────────────────────┐     │
│  │   Padding: 12px H        │     │
│  │            14px V        │     │
│  │                          │     │
│  │   ○  ○  ●  ○  ○          │     │
│  │  8  10 12 10  8  (px)    │     │
│  │                          │     │
│  │   ←12px gaps between→    │     │
│  └──────────────────────────┘     │
│                                    │
└────────────────────────────────────┘
```

### 3. Individual Dot States

```
EDGE DOT (Position 1 & 5)
┌──────┐
│  ○   │  8px diameter
│      │  #D1D5DB (gray-300)
└──────┘  opacity: 0.6
          No border


APPROACHING DOT (Position 2 & 4)
┌────────┐
│   ○    │  10px diameter
│        │  #D1D5DB (gray-300)
└────────┘  opacity: 0.8
            No border


ACTIVE DOT (Position 3 - Center)
┌──────────┐
│  ┌────┐  │
│  │ ●  │  │  12px diameter
│  └────┘  │  #854836 (brown)
│          │  opacity: 1.0
└──────────┘  2px white border
              Shadow: 0 2px 4px rgba(133,72,54,0.3)
```

---

## Frame-by-Frame Animation

### SWIPE LEFT Animation (400ms)

```
═══════════════════════════════════════════════════════
FRAME 0: INITIAL STATE (t=0ms)
═══════════════════════════════════════════════════════

                 Container Window
        ┌───────────────────────────────┐
        │                               │
        │   ○    ○    ●    ○    ○       │
        │   8   10   12   10    8  (px) │
        │  pos1 pos2 pos3 pos4 pos5     │
        │                               │
        └───────────────────────────────┘

        Article Index: 5 (active)
        Visible Dots: [3, 4, 5, 6, 7]


═══════════════════════════════════════════════════════
FRAME 1: SLIDE INITIATED (t=100ms)
═══════════════════════════════════════════════════════

Ghost dot appears →        Container slides left ←
                  ┌───────────────────────────────┐
        ○         │ ○    ○    ●    ○    ○         │
       fade      │                                │
        in       └───────────────────────────────┘
                          ←  -6px translate

        pos1 opacity: 0.6 → 0.4 (fading)
        pos6 opacity: 0 → 0.2 (appearing)


═══════════════════════════════════════════════════════
FRAME 2: MID-ANIMATION (t=200ms)
═══════════════════════════════════════════════════════

                  ┌───────────────────────────────┐
        ○         │  ○    ○    ○    ●    ○        │
      fade        │                               │
       in         └───────────────────────────────┘
                          ←  -12px translate

        Dot sizes morphing:
        pos1: 8px → 6px (shrinking out)
        pos2: 10px → 8px
        pos3: 12px → 10px (leaving center)
        pos4: 10px → 12px (becoming center)
        pos5: 8px → 10px
        pos6: 0 → 8px (new edge dot)

        Active styling shifts: pos3 → pos4
        Color transition: pos4 gray → brown


═══════════════════════════════════════════════════════
FRAME 3: NEAR COMPLETE (t=300ms)
═══════════════════════════════════════════════════════

                  ┌───────────────────────────────┐
        ○         │   ○    ○    ●    ○    ○       │
      visible     │                               │
                  └───────────────────────────────┘
                          ←  -18px translate

        pos1 opacity: 0.1 (almost gone)
        pos6 opacity: 0.5 (almost visible)
        Sizes nearly at final values


═══════════════════════════════════════════════════════
FRAME 4: FINAL STATE (t=400ms)
═══════════════════════════════════════════════════════

                 Container Window
        ┌───────────────────────────────┐
        │                               │
        │   ○    ○    ●    ○    ○       │
        │   8   10   12   10    8  (px) │
        │  pos1 pos2 pos3 pos4 pos5     │
        │                               │
        └───────────────────────────────┘

        Article Index: 6 (new active)
        Visible Dots: [4, 5, 6, 7, 8]
        Position reset: translateX = 0

        Visual result: Wheel rotated left by 1 position
```

---

### SWIPE RIGHT Animation (400ms)

```
═══════════════════════════════════════════════════════
FRAME 0: INITIAL STATE (t=0ms)
═══════════════════════════════════════════════════════

                 Container Window
        ┌───────────────────────────────┐
        │                               │
        │   ○    ○    ●    ○    ○       │
        │   8   10   12   10    8  (px) │
        │  pos1 pos2 pos3 pos4 pos5     │
        │                               │
        └───────────────────────────────┘

        Article Index: 5 (active)
        Visible Dots: [3, 4, 5, 6, 7]


═══════════════════════════════════════════════════════
FRAME 1: SLIDE INITIATED (t=100ms)
═══════════════════════════════════════════════════════

    ← Ghost dot appears    Container slides right →
        ┌───────────────────────────────┐         ○
        │   ○    ○    ●    ○    ○       │      fade
        │                               │       in
        └───────────────────────────────┘
                +6px translate →

        pos5 opacity: 0.6 → 0.4 (fading)
        pos0 opacity: 0 → 0.2 (appearing from left)


═══════════════════════════════════════════════════════
FRAME 2: MID-ANIMATION (t=200ms)
═══════════════════════════════════════════════════════

        ┌───────────────────────────────┐         ○
        │   ○    ●    ○    ○    ○       │      fade
        │                               │       out
        └───────────────────────────────┘
                +12px translate →

        Dot sizes morphing:
        pos0: 0 → 8px (appearing edge)
        pos1: 8px → 10px
        pos2: 10px → 12px (becoming center)
        pos3: 12px → 10px (leaving center)
        pos4: 10px → 8px
        pos5: 8px → 6px (shrinking out)

        Active styling shifts: pos3 → pos2
        Color transition: pos2 gray → brown


═══════════════════════════════════════════════════════
FRAME 3: NEAR COMPLETE (t=300ms)
═══════════════════════════════════════════════════════

        ┌───────────────────────────────┐
        │   ○    ○    ●    ○    ○       │         ○
        │                               │      almost
        └───────────────────────────────┘       gone
                +18px translate →

        pos5 opacity: 0.1 (almost gone)
        pos0 opacity: 0.5 (almost visible)


═══════════════════════════════════════════════════════
FRAME 4: FINAL STATE (t=400ms)
═══════════════════════════════════════════════════════

                 Container Window
        ┌───────────────────────────────┐
        │                               │
        │   ○    ○    ●    ○    ○       │
        │   8   10   12   10    8  (px) │
        │  pos1 pos2 pos3 pos4 pos5     │
        │                               │
        └───────────────────────────────┘

        Article Index: 6 (new active)
        Visible Dots: [2, 3, 4, 5, 6]
        Position reset: translateX = 0

        Visual result: Wheel rotated right by 1 position
```

---

## Infinite Wheel Conceptual Model

### Virtual Dot Ring (Birds-eye view)

```
                      [10]
                   [9]     [11]
               [8]             [12]
            [7]                   [13]
         [6]         ●              [14]
                  Center
         [5]       (you)            [15]
            [4]                   [16]
               [3]             [1]
                   [2]     [0]
                      [17]

5-Dot Visible Window:
┌─────────────────────┐
│  [6] [7] [●] [9] [10] │  ← What user sees
└─────────────────────┘

Swipe LEFT (counter-clockwise rotation):
- Wheel rotates ↺
- View window stays fixed
- New dot [11] enters from right
- Dot [6] exits to left

Result:
┌─────────────────────┐
│  [7] [8] [●] [10] [11] │
└─────────────────────┘


Swipe RIGHT (clockwise rotation):
- Wheel rotates ↻
- View window stays fixed
- New dot [5] enters from left
- Dot [10] exits to right

Result:
┌─────────────────────┐
│  [5] [6] [●] [8] [9] │
└─────────────────────┘
```

---

## Size Scaling Transitions

### Visual Size Changes During Left Swipe

```
BEFORE SWIPE:
┌────┬─────┬──────┬─────┬────┐
│ 8px│ 10px│ 12px │ 10px│ 8px│
│ ○  │  ○  │  ●   │  ○  │ ○  │
└────┴─────┴──────┴─────┴────┘
 pos1  pos2   pos3   pos4  pos5

    ↓ SLIDE LEFT ↓

DURING (t=200ms):
┌───┬────┬─────┬──────┬─────┬────┐
│6px│ 8px│ 10px│ 12px │ 10px│ 8px│ ← New
│ ○ │ ○  │  ○  │  ●   │  ○  │ ○  │
└───┴────┴─────┴──────┴─────┴────┘
fade pos1  pos2   pos4   pos5  pos6
out                ↑
                 New center

AFTER SWIPE:
     ┌────┬─────┬──────┬─────┬────┐
     │ 8px│ 10px│ 12px │ 10px│ 8px│
     │ ○  │  ○  │  ●   │  ○  │ ○  │
     └────┴─────┴──────┴─────┴────┘
      pos1  pos2   pos3   pos4  pos5
                (indices shifted)
```

---

## Color & Opacity Transitions

### Active State Transition Timeline

```
t=0ms (Before):
pos3: #854836 (brown), opacity 1.0, size 12px [ACTIVE]
pos4: #D1D5DB (gray),  opacity 0.8, size 10px [approaching]

t=100ms:
pos3: #854836 → #C49A8E (transitioning), opacity 1.0 → 0.9, size 12px → 11px
pos4: #D1D5DB → #9F8A7B (transitioning), opacity 0.8 → 0.85, size 10px → 11px

t=200ms (Mid):
pos3: #C49A8E (mid-gray-brown), opacity 0.9 → 0.85, size 11px → 10px
pos4: #9F8A7B (mid-brown-gray), opacity 0.85 → 0.95, size 11px → 12px

t=300ms:
pos3: #D1D5DB (gray),  opacity 0.85 → 0.8, size 10px
pos4: #854836 (brown), opacity 0.95 → 1.0, size 12px

t=400ms (Complete):
pos3: #D1D5DB (gray),  opacity 0.8, size 10px [approaching]
pos4: #854836 (brown), opacity 1.0, size 12px [ACTIVE]
```

---

## Shadow & Border Effects

### Active Dot Styling Details

```
INACTIVE DOT:
    ┌─────┐
    │  ○  │  8px or 10px
    └─────┘  No border
             No shadow


ACTIVE DOT:
    ┌─────────────┐
    │   ┌─────┐   │  Outer shadow
    │   │ ●   │   │  12px diameter
    │   │     │   │  2px white border
    │   └─────┘   │  Shadow: 0 2px 4px rgba(133,72,54,0.3)
    └─────────────┘

Shadow anatomy:
     ○ ← Dot
     │
     ▼
    ░░░  ← Shadow blur (4px radius)
    ░░░
     ░

iOS: Uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
Android: Uses elevation (approximate equivalent)
```

---

## Spacing & Alignment Grid

### Precise Layout Measurements

```
Container: 120px width
├─ Left padding: 12px
├─ Dot area: 96px
│  ├─ Dot 1: 8px
│  ├─ Gap: 12px
│  ├─ Dot 2: 10px
│  ├─ Gap: 12px
│  ├─ Dot 3: 12px (center)
│  ├─ Gap: 12px
│  ├─ Dot 4: 10px
│  ├─ Gap: 12px
│  └─ Dot 5: 8px
└─ Right padding: 12px

Total: 12 + (8+12+10+12+12+12+10+12+8) + 12 = 120px ✓

Vertical alignment:
Container height: 40px
├─ Top padding: 14px
├─ Dots centered vertically
│  (max dot height = 12px)
│  Vertical center: (40 - 12) / 2 = 14px
└─ Bottom padding: 14px
```

---

## Responsive Breakpoints

### Small Screen Adaptation (<360px width)

```
DEFAULT (≥360px):
┌──────────────────────────┐
│  ○   ○   ●   ○   ○       │  120px container
│  8  10  12  10   8       │  12px gaps
└──────────────────────────┘

SMALL (<360px):
┌────────────────────┐
│  ○  ○  ●  ○  ○     │  100px container
│  6  8  10  8  6    │  10px gaps
└────────────────────┘

Scaling factor: 0.83x
- All measurements × 0.83
- Maintains proportions
- Preserves visual balance
```

### Landscape Mode Variation

```
PORTRAIT (Default):
         Screen
┌──────────────────┐
│                  │
│    Article       │
│                  │
│                  │
│                  │
│    ┌──────┐     │
│    │○○●○○ │     │  ← Bottom center
│    └──────┘     │
└──────────────────┘


LANDSCAPE:
  Screen
┌────────────────────────────┐
│                      ┌───┐ │
│     Article          │ ○ │ │
│                      │ ○ │ │  ← Right side
│                      │ ● │ │     Vertical
│                      │ ○ │ │     orientation
│                      │ ○ │ │
│                      └───┘ │
└────────────────────────────┘
```

---

## Easing Curve Visualizations

### Animation Timing Functions

```
SLIDE EASING: cubic-bezier(0.25, 0.1, 0.25, 1.0) - ease-out

Progress over time:
100% ┤                    ╭──────
     │                 ╭──╯
 75% ┤              ╭──╯
     │           ╭──╯
 50% ┤        ╭──╯
     │     ╭──╯
 25% ┤  ╭──╯
     │╭─╯
  0% └┴────┴────┴────┴────┴────
     0   100  200  300  400 (ms)

Characteristic: Fast start, smooth deceleration


SCALE EASING: cubic-bezier(0.34, 1.56, 0.64, 1) - back-out

Progress over time:
120% ┤            ╭╮  ← Slight overshoot
     │           ╱ ╰╮
100% ┤        ╭─╯   ╰──────
     │      ╭─╯
 75% ┤    ╭─╯
     │  ╭─╯
 50% ┤╭─╯
     │╯
  0% └┴────┴────┴────┴────┴────
     0   100  200  300  400 (ms)

Characteristic: Bouncy, playful feel


FADE EASING: linear

Progress over time:
100% ┤              ╭─────
     │             ╱
 75% ┤           ╱
     │         ╱
 50% ┤       ╱
     │     ╱
 25% ┤   ╱
     │ ╱
  0% └┴────┴────┴────┴────┴────
     0   100  200  300  400 (ms)

Characteristic: Constant rate, predictable
```

---

## Accessibility Visual Indicators

### Screen Reader Conceptual Model

```
User's mental model with screen reader:

┌─────────────────────────────────┐
│                                 │
│  Current article: 5 of 10       │  ← Announced
│                                 │
│  Article content here...        │
│                                 │
│  Progress: 50%                  │  ← Progress bar role
│                                 │
└─────────────────────────────────┘

Dots are hidden from screen reader
(accessibilityElementsHidden: true)

Only container announces:
"Article 5 of 10, progress indicator"
```

### Reduced Motion Mode

```
NORMAL ANIMATION (400ms slide):
Frame 0:  [○ ○ ● ○ ○]
Frame 100: ←[○ ○ ● ○ ○]
Frame 200:  ←[○ ○ ○ ● ○]
Frame 300:   ←[○ ○ ○ ● ○]
Frame 400:    [○ ○ ● ○ ○]


REDUCED MOTION (instant):
Frame 0:  [○ ○ ● ○ ○]  Article 5
Frame 1:  [○ ○ ● ○ ○]  Article 6 (different indices, same visual)

No sliding, no scaling, only opacity cross-fade if any
Duration: 0ms or max 150ms simple fade
```

---

## Design System Integration

### Color Tokens

```
// Design system mapping
const COLORS = {
  dot: {
    active: {
      fill: tokens.color.brand.brown[500],     // #854836
      border: tokens.color.neutral.white,      // #FFFFFF
      shadow: tokens.color.brand.brown[500],   // rgba(133,72,54,0.3)
    },
    inactive: {
      fill: tokens.color.neutral.gray[300],    // #D1D5DB
    },
  },
  container: {
    background: tokens.color.overlay.dark[40], // rgba(0,0,0,0.4)
  },
};

// Size tokens
const SIZES = {
  dot: {
    edge: tokens.size.icon.xs,        // 8px
    approaching: tokens.size.icon.sm, // 10px
    active: tokens.size.icon.md,      // 12px
  },
  spacing: {
    gap: tokens.space[3],             // 12px
    padding: tokens.space[3],         // 12px
  },
};
```

---

## Dark Mode / Theme Variations

### Light vs Dark Theme

```
LIGHT THEME:
┌──────────────────────────┐
│ Background: rgba(255,255,255,0.8) │
│                          │
│  ○   ○   ●   ○   ○       │
│ #9CA3AF   #854836        │  ← Lighter gray for contrast
│                          │
└──────────────────────────┘


DARK THEME (Default):
┌──────────────────────────┐
│ Background: rgba(0,0,0,0.4) │
│                          │
│  ○   ○   ●   ○   ○       │
│ #D1D5DB   #854836        │
│                          │
└──────────────────────────┘


HIGH CONTRAST:
┌──────────────────────────┐
│ Background: rgba(0,0,0,0.8) │
│                          │
│  ○   ○   ●   ○   ○       │
│ #FFFFFF   #FF6B35        │  ← Maximum contrast colors
│                          │
└──────────────────────────┘
```

---

## Implementation Checklist

### Visual QA Points

- [ ] Container is 120px × 40px
- [ ] Border radius is exactly 20px (perfect pill shape)
- [ ] 5 dots always visible
- [ ] Center dot is 12px diameter
- [ ] Edge dots are 8px diameter
- [ ] Approaching dots are 10px diameter
- [ ] Gaps between dots are 12px
- [ ] Active dot has 2px white border
- [ ] Active dot has subtle shadow
- [ ] Container background is semi-transparent
- [ ] Backdrop blur on iOS (if supported)
- [ ] Positioned 40px from bottom
- [ ] Horizontally centered on screen
- [ ] Animation duration is 400ms
- [ ] Smooth easing curves applied
- [ ] No jank or stuttering at 60fps
- [ ] Dots don't overlap during animation
- [ ] Fade in/out smooth for entering/exiting dots
- [ ] Works in both portrait and landscape
- [ ] Safe area insets respected
- [ ] Reduced motion mode works
- [ ] Screen reader announces progress
- [ ] Color contrast meets WCAG AA

---

## File Reference

**Related Files:**
- Design Spec: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/QUICK_READ_DOT_INDICATOR_DESIGN.md`
- Component: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RotatingDotIndicator.tsx`
- Usage Guide: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/ROTATING_DOTS_USAGE.md`

**Version:** 1.0.0
**Last Updated:** 2025-10-25
