# Visual Specification - Brutalist Tab Navigation

Visual reference for design implementation and QA testing.

## Component States

### 1. Default State (Inactive Tab)

```
┌──────────┐
│ DEPORTES │  Text: #000000 at 60% opacity
│          │  Background: transparent
└──────────┘  Border: none
```

**Specifications:**
- Text Color: `#000000`
- Text Opacity: `0.6` (60%)
- Font Size: `13px`
- Font Weight: `700` (bold)
- Letter Spacing: `0.8px`
- Text Transform: `UPPERCASE`
- Background: `transparent`

### 2. Active State (Selected Tab)

```
┌──────────┐
│  TODAS   │  Text: #854836 (brown) at 100% opacity
│ ████████ │  4px Yellow indicator at bottom
└──────────┘
```

**Specifications:**
- Text Color: `#854836` (primary brown)
- Text Opacity: `1.0` (100%)
- Indicator Color: `#FFB22C` (yellow)
- Indicator Height: `4px`
- Indicator Position: `bottom: 0`
- Indicator Border Radius: `0` (sharp corners)

### 3. Pressed State (Touch Feedback)

```
┌──────────┐
│░POLÍTICA░│  Yellow background flash (30% opacity)
│          │  Scale: 0.96 (subtle shrink)
└──────────┘  Duration: 100ms
```

**Specifications:**
- Background Color: `rgba(255, 178, 44, 0.3)`
- Scale Transform: `0.96`
- Animation Duration: `100ms`
- Haptic: Light impact

### 4. Container with Borders

```
┌─────────────────────────────────────────┐
│ ███████████████████████████████████████ │ ← 3px black border
├─────────────────────────────────────────┤
│                                         │
│ ┌────────┐┌────────┐┌────────┐┌───→   │ 50px
│ │ TODAS  ││DEPORTES││POLÍTICA││ECO     │ content
│ │████████││        ││        ││        │ area
│ └────────┘└────────┘└────────┘└───     │
│                                         │
├─────────────────────────────────────────┤
│ ███████████████████████████████████████ │ ← 3px black border
└─────────────────────────────────────────┘
```

**Container Specifications:**
- Total Height: `56px`
- Content Area Height: `50px` (56 - 6px borders)
- Border Top Width: `3px`
- Border Bottom Width: `3px`
- Border Color: `#000000`
- Background: `#FFFFFF`

## Tab Dimensions

```
┌─────────────────────┐
│     16px padding    │
│  ┌──────────────┐  │
│  │              │  │ ← 12px padding
│  │   DEPORTES   │  │    (top/bottom)
│  │              │  │
│  └──────────────┘  │
│     16px padding    │
└─────────────────────┘
      110px width
```

**Tab Specifications:**
- Min Width: `110px` (fixed)
- Height: `50px`
- Padding Horizontal: `16px`
- Padding Vertical: `12px`
- Margin Left (first tab): `16px`
- Margin Right (last tab): `16px`

## Indicator Animation

### Frame-by-Frame Sequence

**Frame 1 (0ms): Initial State**
```
┌────────┐┌────────┐┌────────┐
│ TODAS  ││DEPORTES││POLÍTICA│
│████████││        ││        │
└────────┘└────────┘└────────┘
```

**Frame 2 (100ms): Sliding**
```
┌────────┐┌────────┐┌────────┐
│ TODAS  ││DEPORTES││POLÍTICA│
│  ██████││        ││        │
└────────┘└────────┘└────────┘
```

**Frame 3 (200ms): Almost There**
```
┌────────┐┌────────┐┌────────┐
│ TODAS  ││DEPORTES││POLÍTICA│
│      ██││████    ││        │
└────────┘└────────┘└────────┘
```

**Frame 4 (250ms): Complete**
```
┌────────┐┌────────┐┌────────┐
│ TODAS  ││DEPORTES││POLÍTICA│
│        ││████████││        │
└────────┘└────────┘└────────┘
```

**Animation Timing:**
- Duration: `250ms`
- Easing: `Easing.out(Easing.cubic)`
- FPS: `60fps` (16.67ms per frame)

## Color Palette

```
PRIMARY COLORS:
┌────────────┬────────────┬────────────┐
│  #854836   │  #FFB22C   │  #000000   │
│   Brown    │   Yellow   │   Black    │
│  (Active)  │(Indicator) │ (Borders)  │
└────────────┴────────────┴────────────┘

BACKGROUND:
┌────────────┐
│  #FFFFFF   │
│   White    │
│(Container) │
└────────────┘
```

## Typography Scale

```
TAB TEXT:
Font Size:       13px
Font Weight:     700 (bold)
Letter Spacing:  0.8px
Line Height:     16px
Transform:       UPPERCASE

Example:
DEPORTES ← 13px, bold, 0.8px spacing
```

## Spacing System

```
HORIZONTAL SPACING:
├─ 16px ─┤ Tab Content ├─ 16px ─┤
│        │  (110px)    │        │
├─ Tab Padding (16px) ─┤

VERTICAL SPACING:
├─ 3px Border Top
├─ 12px Padding Top
│  Text (16px line height)
├─ 12px Padding Bottom
├─ 4px Indicator
├─ 3px Border Bottom
```

## Content Area (Testing)

### Test Background Colors

```
TODAS:      #FFB22C (Yellow)
DEPORTES:   #854836 (Brown)
POLÍTICA:   #000000 (Black)
ECONOMÍA:   #F7F7F7 (Gray)
SALUD:      #FFFFFF (White)
SEGURIDAD:  #FFB22C (Yellow)
ESTADO:     #854836 (Brown)
```

### Content Layout

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         Category Name           │ ← 24px, bold, uppercase
│       (e.g., DEPORTES)          │
│                                 │
│    Swipe to navigate tabs       │ ← 14px, 60% opacity
│                                 │
│                                 │
└─────────────────────────────────┘
```

## Responsive Behavior

### iPhone SE (375px width)

```
Viewport: 375px
Visible tabs: ~3.2 tabs
Scroll: Required
┌─────────────────────────────────┐
│ ┌───┐┌───┐┌───┐┌── │
│ │TOD││DEP││POL││ECO│→
│ └───┘└───┘└───┘└── │
└─────────────────────────────────┘
```

### iPhone 15 Pro (393px width)

```
Viewport: 393px
Visible tabs: ~3.4 tabs
Scroll: Required
┌───────────────────────────────────┐
│ ┌───┐┌───┐┌───┐┌───││
│ │TOD││DEP││POL││ECO││→
│ └───┘└───┘└───┘└───││
└───────────────────────────────────┘
```

### iPhone 15 Pro Max (430px width)

```
Viewport: 430px
Visible tabs: ~3.7 tabs
Scroll: Required
┌───────────────────────────────────────┐
│ ┌───┐┌───┐┌───┐┌───┐┌─ │
│ │TOD││DEP││POL││ECO││SA│→
│ └───┘└───┘└───┘└───┘└─ │
└───────────────────────────────────────┘
```

## Accessibility States

### VoiceOver Focus

```
┌──────────┐
│▓▓▓▓▓▓▓▓▓▓│ ← Focus indicator
│▓DEPORTES▓│   (system-provided)
│▓████████▓│
└──────────┘

Announces: "Sports, tab, selected, button.
            Double tap to view articles."
```

### High Contrast Mode (Future)

```
┌──────────┐
│║DEPORTES║│ ← 4px borders instead of 3px
│║████████║│   Black/white only (no yellow)
└──────────┘
```

## Animation Curves

### Indicator Slide (Ease Out Cubic)

```
Position
  100% │                    ████████
       │               █████
       │           ████
       │        ███
       │      ██
       │    ██
       │   █
    0% │███
       └────────────────────────────
        0ms                    250ms
```

### Press Feedback (Linear)

```
Scale
  1.00 │███                    ███
       │   ██                ██
       │     ██            ██
  0.96 │       ████████████
       │
       └────────────────────────────
        0ms   50ms   100ms   150ms
```

## Touch Targets

```
MINIMUM (iOS HIG): 44x44 px
ACTUAL TAB SIZE:   110x50 px ✓

┌────────────────────────────┐
│                            │ 50px
│        Tab Content         │ (exceeds 44px)
│                            │
└────────────────────────────┘
          110px
      (exceeds 44px)
```

## Border Rendering

### Sharp Corners (No Anti-aliasing)

```
✓ Correct:
┌─────────┐ ← Sharp 90° corners
│         │   3px solid black
└─────────┘

✗ Incorrect:
╭─────────╮ ← Rounded corners
│         │   (not brutalist)
╰─────────╯
```

## Z-Index Layering

```
Layer 5: Tab Text (on top)
Layer 4: Tab Items
Layer 3: Active Indicator
Layer 2: Top/Bottom Borders
Layer 1: Container Background
```

## QA Testing Checklist

Visual checks to perform:

- [ ] Inactive text is #000000 at 60% opacity
- [ ] Active text is #854836 at 100% opacity
- [ ] Indicator is #FFB22C, 4px height
- [ ] Borders are 3px solid black
- [ ] Tab width is exactly 110px
- [ ] Container height is 56px
- [ ] Text is uppercase and bold
- [ ] Indicator slides smoothly (no jumps)
- [ ] Press feedback shows yellow flash
- [ ] Corners are sharp (no border radius)

---

**Design System**: Brutalist
**Version**: 1.0.0
**Last Updated**: 2025-10-24
**Platform**: React Native (iOS, Android, Web)
