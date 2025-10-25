# Quick Read Screen - Visual Wireframes & UI Specifications

**Version:** 1.0.0
**Design System:** Brutalist 2026
**Platform:** React Native Mobile App

---

## WIREFRAME 1: Default State (Article 2 of 5)

```
┌─────────────────────────────────────────┐
│                                         │ ← Safe Area Top (notch/status bar)
├─────────────────────────────────────────┤
│█████████████████████████████████████████│
│█████████████████████████████████████████│
│████████  ┌─────────────┐  █████████████│ ← Hero Image (280px)
│████████  │  DEPORTES   │  █████████████│   Full width, cover fit
│████████  └─────────────┘  █████████████│   Category badge overlaid
│█████████████████████████████████████████│   (16px from bottom, 16px from left)
│█████████████████████████████████████████│
│█████████████████████████████████████████│
├─────────────────────────────────────────┤ ← 4px black border
│                                         │
│  GOBERNADOR PRESENTA NUEVO              │ ← Title (h3, uppercase, bold)
│  PLAN ECONÓMICO PARA LA                 │   Max 3 lines, black text
│  REGIÓN                                 │   20px font, 700 weight
│                                         │   ↕ 24px padding top
│  POR MARÍA GONZÁLEZ                     │ ← Author (caption, uppercase)
│                                         │   12px font, 700 weight
│                                         │   ↕ 16px gap from title
│  El gobernador de Pachuca presentó     │
│  hoy un nuevo plan económico que       │ ← Summary (body, sentence case)
│  busca impulsar el desarrollo de la    │   16px font, 400 weight
│  región. El plan incluye inversiones   │   Max 5 lines, fixed height
│  en infraestructura, educación...      │   Near-black text (#1F1F1F)
│                                         │   ↕ 20px gap from author
│                                         │
│                                         │
│           ○ ● ○ ○ ○                    │ ← Swipe Indicators (centered)
│                                         │   Active: 32x8px white rectangle
│                                         │   Inactive: 8x8px gray squares
│                                         │   2px black borders
│                                         │   ↕ 24px from safe area bottom
├─────────────────────────────────────────┤
│                                         │ ← Safe Area Bottom (home indicator)
└─────────────────────────────────────────┘

BORDERS:
- Hero image bottom: 4px solid black
- Content left: 4px solid black
- Content right: 4px solid black
- Content bottom: 4px solid black

BACKGROUND COLORS:
- Hero image area: #F7F7F7 (while loading)
- Content area: #FFFFFF (white)
- Screen background: #F7F7F7 (gray)
```

---

## WIREFRAME 2: Pressed State - Image Tapped

```
┌─────────────────────────────────────────┐
│                                         │
├─────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Image at 80% opacity
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   (20% black overlay)
│▓▓▓▓▓▓▓  ┌─────────────┐  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   Indicates tappable state
│▓▓▓▓▓▓▓  │  DEPORTES   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓  └─────────────┘  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   User's finger touching image
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
├─────────────────────────────────────────┤
│  [Rest of card unchanged]               │
└─────────────────────────────────────────┘

INTERACTION:
- Opacity changes from 1.0 → 0.8 instantly on press
- Opacity changes from 0.8 → 1.0 with 200ms ease-out on release
- Haptic feedback (light impact) fires on press
- Navigation occurs on release (if within bounds)
```

---

## WIREFRAME 3: Pressed State - Title Tapped

```
┌─────────────────────────────────────────┐
│  [Hero image unchanged]                 │
├─────────────────────────────────────────┤
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← Background #F7F7F7
│▒▒GOBERNADOR PRESENTA NUEVO            ▒▒│   (light gray) appears
│▒▒PLAN ECONÓMICO PARA LA               ▒▒│   behind title text
│▒▒REGIÓN                               ▒▒│
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│   User's finger touching title
│                                         │
│  POR MARÍA GONZÁLEZ                     │
│                                         │
│  [Summary unchanged]                    │
│                                         │
└─────────────────────────────────────────┘

INTERACTION:
- Background color changes to #F7F7F7 instantly on press
- Background fades back to white with 200ms ease-out on release
- Haptic feedback (light impact) fires on press
- Navigation occurs on release (if within bounds)
```

---

## WIREFRAME 4: Swipe Left Gesture (In Progress)

```
Current Card (Fading Out)              Next Card (Fading In)
Opacity: 0.4 (mid-transition)         Opacity: 0.6 (mid-transition)
zIndex: 100                           zIndex: 99

┌──────────────────────┐              ┌──────────────────────┐
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│              │██████████████████████│
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ────────>   │██████████████████████│
│▒▒DEPORTES          ▒▒│  Swipe Left  │██POLÍTICA          ██│
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│              │██████████████████████│
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│              │██████████████████████│
├──────────────────────┤              ├──────────────────────┤
│▒▒GOBERNADOR...     ▒▒│              │██PRESIDENTE...     ██│
│▒▒                  ▒▒│              │██                  ██│
│▒▒POR MARÍA...      ▒▒│              │██POR CARLOS...     ██│
│▒▒                  ▒▒│              │██                  ██│
│▒▒El gobernador...  ▒▒│              │██El presidente...  ██│
│▒▒                  ▒▒│              │██                  ██│
│▒▒  ○ ● ○ ○ ○      ▒▒│              │██  ○ ○ ● ○ ○      ██│
└──────────────────────┘              └──────────────────────┘

ANIMATION TIMELINE:
0ms     → User starts swiping left
0-300ms → Both cards animate simultaneously
          - Current card opacity: 1.0 → 0.0
          - Next card opacity: 0.0 → 1.0
300ms   → Animation complete, next card is now current
          - zIndex updates: next becomes 100, others 99/98
          - Pagination dots update (dot 3 becomes active)

INTERPOLATION:
translationX: 0 → -screenWidth
currentOpacity: interpolate(translationX, [-sw, 0], [0, 1])
nextOpacity: interpolate(translationX, [-sw, 0], [1, 0])
```

---

## WIREFRAME 5: Edge State - First Article (No Previous)

```
┌─────────────────────────────────────────┐
│  Article 1 of 5                         │
│  (Dot 1 active: ● ○ ○ ○ ○)             │
│                                         │
│  ← Swipe right is disabled              │
│    (or shows elastic bounce)            │
│                                         │
│  Swipe left → Goes to Article 2        │
│                                         │
└─────────────────────────────────────────┘

BEHAVIOR:
- Swiping right feels "sticky"
- Gesture is clamped at translationX = 0
- No card appears behind/before
- Visual feedback: subtle elastic resistance
```

---

## WIREFRAME 6: Edge State - Last Article (No Next)

```
┌─────────────────────────────────────────┐
│  Article 5 of 5                         │
│  (Dot 5 active: ○ ○ ○ ○ ●)             │
│                                         │
│  Swipe right → Goes to Article 4        │
│                                         │
│  Swipe left is disabled →               │
│    (or shows elastic bounce)            │
│                                         │
└─────────────────────────────────────────┘

BEHAVIOR:
- Swiping left feels "sticky"
- Gesture is clamped at translationX = 0
- No card appears after
- Could trigger "Load More" if applicable
```

---

## DETAILED MEASUREMENTS

### Hero Image + Category Badge

```
┌──────────────────────────────────────────┐
│                                          │ ← Top edge (0px)
│                                          │
│  (Image fills full width)                │
│  280px height                            │
│                                          │
│                                          │
│   16px ↓                                 │
│   ┌─────────────┐ ← 16px from left      │
│   │  DEPORTES   │   Category Badge       │
│   └─────────────┘   8px ↕ padding       │
│   ↑ 16px from bottom  16px ↔ padding    │
│                                          │
└──────────────────────────────────────────┘ ← Bottom edge (280px)
   ═══════════════════════════════════════    4px black border

CATEGORY BADGE SPECS:
- Background: Category color (#854836, #FFB22C, etc.)
- Border: 4px solid #000000
- Text: White, 11px, font-weight 900, uppercase
- Padding: 8px (vertical) × 16px (horizontal)
- Border radius: 0 (sharp corners)
- Position: Absolute, bottom 16px, left 16px
```

### Content Container

```
═══════════════════════════════════════════ ← 4px top border
│                                          │
│   ↕ 24px padding top                     │
│                                          │
│   GOBERNADOR PRESENTA NUEVO              │ ← Title
│   PLAN ECONÓMICO PARA LA REGIÓN          │   20px font
│                                          │   700 weight
│   ↕ 16px gap                             │   28px line height
│                                          │   Max 3 lines
│   POR MARÍA GONZÁLEZ                     │ ← Author
│                                          │   12px font
│   ↕ 20px gap                             │   700 weight
│                                          │
│   El gobernador de Pachuca presentó      │ ← Summary
│   hoy un nuevo plan económico que        │   16px font
│   busca impulsar el desarrollo de la     │   400 weight
│   región. El plan incluye inversiones    │   25.6px line height
│   en infraestructura, educación...       │   Max 5 lines
│                                          │   Fixed height: 128px
│   ↕ flex space                           │
│                                          │
│            ○ ● ○ ○ ○                     │ ← Indicators (centered)
│                                          │
│   ↕ 24px + safe area                     │
│                                          │
║                                          ║ ← 4px left border
                                             ← 4px right border
═══════════════════════════════════════════ ← 4px bottom border

HORIZONTAL PADDING:
- Left: 20px (inside 4px border)
- Right: 20px (inside 4px border)

TOTAL BORDERS:
- Top: 4px black (hero image bottom border)
- Left: 4px black
- Right: 4px black
- Bottom: 4px black
```

### Pagination Dots (Detailed)

```
Active State (Dot 2)        Inactive States
┌──────────────────────┐    ┌───┐ ┌───┐ ┌───┐ ┌───┐
│                      │    │   │ │   │ │   │ │   │
│                      │    │   │ │   │ │   │ │   │
│   32px × 8px         │    │ 8 │ │ 8 │ │ 8 │ │ 8 │
│   White background   │    │ × │ │ × │ │ × │ │ × │
│   2px black border   │    │ 8 │ │ 8 │ │ 8 │ │ 8 │
│                      │    │   │ │   │ │   │ │   │
└──────────────────────┘    └───┘ └───┘ └───┘ └───┘

Full Layout:
┌───┐   ┌──────────────────────┐   ┌───┐ ┌───┐ ┌───┐
│ 1 │ 8 │         2            │ 8 │ 3 │ │ 4 │ │ 5 │
└───┘   └──────────────────────┘   └───┘ └───┘ └───┘
  ↕         ↕                        ↕     ↕     ↕
  8px       8px gap                  All 8px gaps

ANIMATION:
- When changing from dot 2 to dot 3:
  - Dot 2: Width animates 32px → 8px (spring animation)
  - Dot 2: Background #FFFFFF → #F7F7F7
  - Dot 3: Width animates 8px → 32px (spring animation)
  - Dot 3: Background #F7F7F7 → #FFFFFF
  - Duration: ~250ms with spring (friction: 7, tension: 40)
```

---

## COLOR PALETTE REFERENCE

```
Background Colors:
┌─────────┐ ┌─────────┐ ┌─────────┐
│#FFFFFF  │ │#F7F7F7  │ │#1F1F1F  │
│ White   │ │Lt Gray  │ │Dk Gray  │
└─────────┘ └─────────┘ └─────────┘
Card BG     Screen BG   Text Color

Border & Accent Colors:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│#000000  │ │#854836  │ │#FFB22C  │ │#FF0000  │
│ Black   │ │ Brown   │ │ Yellow  │ │  Red    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
Borders     Category    Category    Category

Category Badge Examples:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  DEPORTES   │  │  POLÍTICA   │  │  ECONOMÍA   │
│   Brown     │  │   Yellow    │  │    Red      │
│  #854836    │  │  #FFB22C    │  │  #FF0000    │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## TABLET LAYOUT (Width >= 768px)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│        ┌─────────────────────────────┐             │
│        │                             │             │
│        │   Hero Image: 360px         │ ← Taller   │
│        │                             │             │
│        │   ┌─────────────┐           │             │
│        │   │  DEPORTES   │           │             │
│        │   └─────────────┘           │             │
│        │                             │             │
│        ├─────────────────────────────┤             │
│        │                             │             │
│        │   GOBERNADOR...             │ ← 24px font │
│        │   (Max width: 600px)        │             │
│        │                             │             │
│        │   POR MARÍA...              │ ← 14px font │
│        │                             │             │
│        │   El gobernador...          │ ← 18px font │
│        │                             │             │
│        │   Padding: 32px             │ ← More space│
│        │                             │             │
│        │      ○ ● ○ ○ ○              │             │
│        │                             │             │
│        └─────────────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘
        ↑                             ↑
     Centered                      Max 600px

TABLET CHANGES:
- Hero height: 280px → 360px
- Content padding: 20px → 32px
- Max content width: 600px (centered)
- Title font: 20px → 24px
- Author font: 12px → 14px
- Summary font: 16px → 18px
- All other spacing proportionally increased
```

---

## ACCESSIBILITY LABELS (VoiceOver Example)

```
Screen Focus:
"Quick Read. Artículo 2 de 5."

Hero Image Focus:
"Gobernador en conferencia de prensa.
Ver artículo completo: Gobernador presenta nuevo plan económico.
Toca para abrir artículo."

Category Badge Focus:
"Categoría: DEPORTES"

Title Focus:
"Encabezado.
GOBERNADOR PRESENTA NUEVO PLAN ECONÓMICO PARA LA REGIÓN.
Leer artículo. Toca para abrir artículo."

Author Focus:
"Por MARÍA GONZÁLEZ"

Summary Focus:
"El gobernador de Pachuca presentó hoy un nuevo plan económico
que busca impulsar el desarrollo de la región. El plan incluye
inversiones en infraestructura, educación..."

Pagination Dots Focus:
"Indicador de progreso. Artículo 2 de 5."

Swipe Gesture Hint:
"Desliza izquierda para siguiente artículo,
derecha para artículo anterior."
```

---

## ANIMATION TIMING DIAGRAM

```
Swipe Left Gesture (300ms total):

Current Card Opacity:
1.0 ████████████████████████████
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▒▒▒▒▒▒▒▒▒▒▒▒
    ░░░░░░
0.0 ───────────────────────────>
    0ms                  300ms

Next Card Opacity:
0.0 ───────────────────────────>
    ░░░░░░
    ▒▒▒▒▒▒▒▒▒▒▒▒
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
1.0 ████████████████████████████
    0ms                  300ms

Easing: cubic ease-out
  → Fast start, smooth end
  → Natural deceleration

Pagination Dot Animation (concurrent):
Dot 2 width: 32px → 8px (spring)
Dot 3 width: 8px → 32px (spring)
Duration: ~250ms (slight overshoot, then settle)
```

---

## IMPLEMENTATION CHECKLIST

### Visual Polish:
- [ ] Hero image aspect ratio maintains focal point
- [ ] Category badge doesn't obscure important image areas
- [ ] Text truncation feels natural (not mid-word)
- [ ] Borders are crisp 4px (no antialiasing blur)
- [ ] Summary height is fixed (no layout shift)
- [ ] Pagination dots centered perfectly

### Interaction Feel:
- [ ] Swipe feels responsive (not laggy)
- [ ] Cross-fade is elegant (not jarring)
- [ ] Press states give clear feedback
- [ ] Haptics fire at right moments
- [ ] Edge resistance feels natural

### Consistency:
- [ ] Colors match existing design system
- [ ] Typography scales match other screens
- [ ] Borders match home screen cards
- [ ] Spacing follows 4px/16px/20px/24px system

---

## CONCLUSION

These wireframes provide pixel-perfect specifications for implementing the Quick Read screen. Every measurement, color, animation, and interaction state is documented for developers to follow.

The design maintains brutalist principles while providing a modern, delightful swipe experience that feels premium in 2026.

Ready to build! 🎨
