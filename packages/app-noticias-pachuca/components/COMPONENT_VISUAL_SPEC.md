# Visual Component Specification

## Logo Component - Visual Structure

```
┌─────────────────────────────────┐
│                                 │
│          NOTICIAS               │  <- Black (#000000), Bold, Uppercase
│          PACHUCA                │  <- Brown (#854836), Bold, Uppercase
│          ________               │  <- Yellow (#FFB22C), 4px thick
│                                 │
└─────────────────────────────────┘
```

### Size Variants

#### Small (20px)
```
NOTICIAS
PACHUCA
________
```
- Font Size: 20px
- Underline: 3px height
- Spacing: 4px
- Letter Spacing: 1.5

#### Medium (28px) - Default
```
NOTICIAS
PACHUCA
___________
```
- Font Size: 28px
- Underline: 4px height
- Spacing: 6px
- Letter Spacing: 2.0

#### Large (36px)
```
NOTICIAS
PACHUCA
______________
```
- Font Size: 36px
- Underline: 5px height
- Spacing: 8px
- Letter Spacing: 2.5

---

## BrutalistButton Component - Visual Structure

### Primary Button (Brown)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                               ┃
┃      CREAR CUENTA             ┃  <- White text on Brown bg
┃                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
- Background: Brown (#854836)
- Text: White (#FFFFFF)
- Border: 4px Black (#000000)
- Pressed: Red background (#FF0000)

### Secondary Button (White)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                               ┃
┃      INICIAR SESIÓN           ┃  <- Black text on White bg
┃                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
- Background: White (#FFFFFF)
- Text: Black (#000000)
- Border: 4px Black (#000000)
- Pressed: Light Gray (#F7F7F7)

### Tertiary Button (Transparent)
```
┌───────────────────────────────┐
│                               │
│   CONTINUAR SIN CUENTA        │  <- Black text, transparent
│                               │
└───────────────────────────────┘
```
- Background: Transparent
- Text: Black (#000000)
- Border: 2px Black (#000000)
- Pressed: 0.7 opacity

---

## Complete Onboarding Layout

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           NOTICIAS                  │  <- Logo (large)
│           PACHUCA                   │
│           __________                │
│                                     │
│     Tu fuente confiable de          │
│     noticias locales en Pachuca     │  <- Body text
│                                     │
│                                     │
│                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                             ┃  │
│  ┃      CREAR CUENTA           ┃  │  <- Primary button
│  ┃                             ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                             ┃  │
│  ┃      INICIAR SESIÓN         ┃  │  <- Secondary button
│  ┃                             ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │   CONTINUAR SIN CUENTA        │ │  <- Tertiary button
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│    Al continuar, aceptas nuestros   │  <- Small legal text
│    Términos de Servicio             │
│                                     │
└─────────────────────────────────────┘
```

---

## Color Palette

### Brand Colors
```
┌────────┐
│        │  Brown (#854836)   - Primary brand color, buttons
└────────┘

┌────────┐
│        │  Yellow (#FFB22C)  - Accent, logo underline
└────────┘

┌────────┐
│        │  Red (#FF0000)     - Pressed state, urgency
└────────┘

┌────────┐
│        │  Gray (#F7F7F7)    - Subtle backgrounds
└────────┘

┌────────┐
│        │  Black (#000000)   - Text, borders
└────────┘
```

### Text Colors
- Primary Text: #000000 (Black)
- Secondary Text: #4B5563 (Gray-600)
- Disabled Text: #6B7280 (Gray-500)
- Link Text: #854836 (Brown)
- Error Text: #FF0000 (Red)

---

## Typography Scale

### Headers
- Hero: 32px/40px (phone/tablet), 900 weight
- H1: 28px/36px, 900 weight
- H2: 24px/32px, 800 weight
- H3: 20px/24px, 700 weight

### Body
- Lead: 20px/24px, 500 weight
- Body: 16px/18px, 400 weight
- Small: 14px/16px, 400 weight

### UI Elements
- Button: 16px/18px, 700 weight, uppercase
- Caption: 12px/14px, 700 weight, uppercase

---

## Spacing System

### Component Spacing
- Logo to Description: 16px (mt-4)
- Button Vertical Spacing: 16px (space-y-4)
- Screen Padding: 24px (px-6)
- Button Internal Padding: 16px vertical, 24px horizontal

### Margins
- Screen Top/Bottom: 48px (py-12)
- Section Spacing: 32px (mb-8)
- Tight Spacing: 8px (mb-2)

---

## Button States

### Normal State
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      BUTTON TEXT              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Pressed State (scale 0.98)
```
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃      BUTTON TEXT            ┃
 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
- Slightly smaller (transform: scale(0.98))
- Primary: Red background
- Secondary: Gray background
- Tertiary: 0.7 opacity

### Loading State
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   ⟳   LOADING...              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
- Spinner on left
- Text changes to loading message
- Disabled interaction

### Disabled State
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      BUTTON TEXT              ┃  (Grayed out)
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
- Gray background (#E5E7EB)
- Gray border (#9CA3AF)
- Gray text (#6B7280)
- 0.6 opacity
- No interaction

---

## Interaction States

### Button Press Animation
1. Press In → scale(0.98)
2. Background color changes
3. Haptic feedback triggers
4. onPress callback fires
5. Press Out → scale(1.0)

Duration: ~100ms (native animation)

---

## Responsive Behavior

### Phone (< 768px)
- Logo: Uses phone font sizes
- Buttons: Full width with padding
- Stack vertically
- 24px horizontal padding

### Tablet (≥ 768px)
- Logo: Uses tablet font sizes (larger)
- Buttons: Can be constrained (max-w-md)
- More generous spacing
- 32px horizontal padding

---

## Accessibility Requirements

### Touch Targets
- Minimum: 44pt height (iOS guideline)
- Button padding: 16px vertical
- Ensures easy tapping

### Screen Reader Support
- Logo: "Noticias Pachuca Logo"
- Buttons: Label + hint
- States: "disabled", "busy"

### Keyboard Navigation
- Focusable elements
- Clear focus indicators
- Logical tab order

---

## Border Specifications

### Primary/Secondary Buttons
- Width: 4px
- Color: Black (#000000)
- Style: Solid
- Radius: 0 (sharp corners, brutalist)

### Tertiary Buttons
- Width: 2px
- Color: Black (#000000)
- Style: Solid
- Radius: 0

### Logo Underline
- Height: 3-5px (size dependent)
- Color: Yellow (#FFB22C)
- 100% width of "PACHUCA" text

---

## Shadow/Elevation

**Brutalist Design = No Shadows**

Components use:
- Thick borders instead of shadows
- Flat design (no elevation)
- High contrast colors
- Sharp corners (no border radius)

Exception: NativeWind classes can add shadows if needed for specific use cases.

---

## Animation Specifications

### Button Press
- Property: `transform: scale()`
- From: 1.0
- To: 0.98
- Duration: Native (Pressable handles)
- Easing: Default

### Haptic Feedback
- Type: Impact
- Style: Light
- Trigger: onPress
- Fallback: Silent (no error if unavailable)

---

## Grid Layout (8px baseline)

All spacing uses 8px increments:
- 8px (space-2)
- 16px (space-4)
- 24px (space-6)
- 32px (space-8)
- 48px (space-12)

---

## Component Dimensions

### Logo
- Width: Auto (text width)
- Height: Auto (2 lines + underline)
- Aspect: Dynamic

### Buttons
- Min Height: 44px
- Padding: 16px vertical, 24px horizontal
- Width: Auto or 100% (fullWidth prop)

---

## Implementation Notes

1. **No border-radius** - Sharp corners for brutalist aesthetic
2. **Thick borders** - 4px for emphasis, 2px for minimal
3. **Uppercase text** - All buttons and headers
4. **High contrast** - Black/white/brown color scheme
5. **No gradients** - Flat colors only
6. **No shadows** - Unless explicitly added via className
7. **Bold typography** - 700+ weight for UI elements

---

This specification ensures consistent brutalist design across all components!
