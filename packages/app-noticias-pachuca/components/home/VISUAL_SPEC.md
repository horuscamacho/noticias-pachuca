# Home Components - Visual Specification

Visual reference for brutalist home header components.

## HomeHeader Component Layout

```
┌────────────────────────────────────────────────────────────┐
│ [Safe Area Top]                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────┐  ┌──────────────────┐   │
│  │        NOTICIAS              │  │    EDICIÓN    ▼  │   │
│  │        PACHUCA               │  └──────────────────┘   │
│  │        ────────              │                         │
│  └──────────────────────────────┘                         │
│                                                            │
├════════════════════════════════════════════════════════════┤ ← 4px black border
│                                                            │
│  SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA               │
│  DE LAS NOTICIAS EN HIDALGO                               │
│                                                            │
│                ┌──────────────────┐                        │
│                │   Registrarse    │                        │
│                └──────────────────┘                        │
│                                                            │
├════════════════════════════════════════════════════════════┤ ← 4px black border
└────────────────────────────────────────────────────────────┘

Logo Section: 80px height
Banner Section: 120px min-height
Total: ~200px + safe area
```

## Logo Section (80px height)

```
┌────────────────────────────────────────────────────────────┐
│  Padding: 12px vertical, 16px horizontal                   │
│                                                            │
│  ┌────────────────────┐           ┌─────────────────┐     │
│  │    NOTICIAS        │           │  EDICIÓN     ▼  │     │
│  │    PACHUCA         │           └─────────────────┘     │
│  │    ──────── (yellow underline)                         │
│  └────────────────────┘                                    │
│                                                            │
├════════════════════════════════════════════════════════════┤
```

**Colors:**
- Background: White (#FFFFFF)
- "NOTICIAS" text: Black (#000000)
- "PACHUCA" text: Brown (#854836)
- Yellow underline: Yellow (#FFB22C)
- Bottom border: 4px solid Black (#000000)

## EditionDropdown (100px × 40px)

```
┌─────────────────────┐
│  EDICIÓN         ▼  │  ← 12px font, 700 weight, uppercase
└─────────────────────┘
 ↑                   ↑
 └─ 4px black border ┘

Width: 100px
Height: 40px (min 44px touch target)
Background: White (#FFFFFF)
Border: 4px solid Black (#000000)
Text: Black (#000000)
Icon: chevron-down (16px)
Padding: 8px horizontal

Press state:
┌─────────────────────┐
│  EDICIÓN         ▼  │  ← Background: Yellow (#FFB22C)
└─────────────────────┘
```

## BrutalistBanner (120px min-height)

### Default (Brown) Banner

```
┌════════════════════════════════════════════════════════════┐ ← 4px top border
│                                                            │
│  SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA               │ ← White text
│  DE LAS NOTICIAS EN HIDALGO                               │ ← 14px/16px font
│                                                            │
│                ┌──────────────────┐                        │
│                │   Registrarse    │  ← Black text on yellow│
│                └──────────────────┘  ← 44px min height     │
│                                                            │
└════════════════════════════════════════════════════════════┘ ← 4px bottom border

Background: Brown (#854836)
Title: White (#FFFFFF), 14px phone / 16px tablet, 700 weight
CTA Button: Yellow (#FFB22C) background, Black (#000000) text
Padding: 20px vertical, 16px horizontal
```

### CTA Button Detail

```
┌────────────────────┐
│   Registrarse      │  ← 14px/16px, 700 weight, uppercase
└────────────────────┘
 ↑                 ↑
 └─ 4px border ────┘

Normal state:
- Background: Yellow (#FFB22C)
- Text: Black (#000000)
- Border: 4px solid Black (#000000)

Pressed state:
- Background: Black (#000000)
- Text: White (#FFFFFF)
- Scale: 0.98

Disabled state:
- Background: Gray (#9CA3AF)
- Text: Dark Gray (#4B5563)
- Opacity: 0.6
```

## Color Variations

### Yellow Banner

```
┌════════════════════════════════════════════════════════════┐
│                                                            │
│  OFERTA POR TIEMPO LIMITADO                               │ ← Black text
│                                                            │
│                ┌──────────────────┐                        │
│                │   Ver oferta     │                        │
│                └──────────────────┘                        │
│                                                            │
└════════════════════════════════════════════════════════════┘

Background: Yellow (#FFB22C)
Text: Black (#000000)
```

### Black Banner

```
┌════════════════════════════════════════════════════════════┐
│                                                            │
│  EDICIÓN ESPECIAL DISPONIBLE                              │ ← White text
│                                                            │
│                ┌──────────────────┐                        │
│                │   Leer ahora     │                        │
│                └──────────────────┘                        │
│                                                            │
└════════════════════════════════════════════════════════════┘

Background: Black (#000000)
Text: White (#FFFFFF)
```

## Responsive Scaling

### Phone (< 768px)

```
Logo: Small size
Title: 14px
CTA: 14px
Edition: 12px

┌──────────────────────┐
│  NOTICIAS            │ (20px font)
│  PACHUCA             │
│  ────                │
└──────────────────────┘
```

### Tablet (≥ 768px)

```
Logo: Small size
Title: 16px
CTA: 16px
Edition: 12px

┌──────────────────────┐
│  NOTICIAS            │ (20px font)
│  PACHUCA             │
│  ────                │
└──────────────────────┘
```

## Press States

### EditionDropdown

Normal:
```
┌─────────────────────┐
│  EDICIÓN         ▼  │
└─────────────────────┘
White background, black text
```

Pressed:
```
┌─────────────────────┐
│  EDICIÓN         ▼  │
└─────────────────────┘
Yellow background, black text, scale 0.98
```

### Banner CTA

Normal:
```
┌──────────────────┐
│   Registrarse    │
└──────────────────┘
Yellow background, black text
```

Pressed:
```
┌──────────────────┐
│   Registrarse    │
└──────────────────┘
Black background, white text, scale 0.98
```

## Spacing and Dimensions

```
HomeHeader Total Height:
├─ Safe Area Top (variable)
├─ Logo Section: 80px
│  ├─ Padding top: 12px
│  ├─ Logo height: ~56px
│  └─ Padding bottom: 12px
├─ Border: 4px
└─ Banner: 120px min
   ├─ Padding top: 20px
   ├─ Title: ~36-40px (2 lines)
   ├─ Spacing: 12px
   ├─ CTA Button: 44px
   └─ Padding bottom: 20px

Total: ~204px + safe area (without banner: ~84px + safe area)
```

## Typography Scale

```
Edition Dropdown: 12px, 700 weight, uppercase, 0.5 letter-spacing
Banner Title:     14px phone / 16px tablet, 700 weight, uppercase, 0.5 spacing
Banner CTA:       14px phone / 16px tablet, 700 weight, uppercase, 0.5 spacing

Line heights:
- Edition: 1.2 (tight)
- Title: 1.3 (comfortable for multi-line)
- CTA: 1.2 (tight for single line)
```

## Border Specifications

All borders: 4px solid Black (#000000)

```
Border positions:
- Logo section bottom: 4px
- Banner top: 4px
- Banner bottom: 4px
- Edition dropdown: 4px all sides
- CTA button: 4px all sides

Corner radius: 0 (sharp brutalist corners)
```

## Touch Targets (WCAG Compliance)

Minimum 44pt × 44pt touch targets:

```
Edition Dropdown:
- Visual: 100px × 40px
- Touch target: 100px × 44px (with padding)
✓ WCAG compliant

CTA Button:
- Visual: Variable width × 40-44px
- Touch target: Variable × 44px min
✓ WCAG compliant
```

## Accessibility Tree

```
HomeHeader [header]
├─ Logo Section [group]
│  ├─ Logo [header] "Noticias Pachuca Logo"
│  └─ EditionDropdown [button] "Edición: PACHUCA"
│     └─ Hint: "Seleccionar edición de noticias"
└─ Banner [text] "SUSCRÍBETE PARA..."
   └─ CTA Button [button] "Registrarse"
      └─ Hint: "Abrir registro de usuario"
```

## Animation Specifications

### Press Animation

```
Scale transform on press: 0.98
Duration: 150ms
Easing: ease-out

Normal → Pressed:
scale(1) → scale(0.98)

Pressed → Normal:
scale(0.98) → scale(1)
```

### Haptic Feedback

```
Trigger: On press
Type: Light impact
Platform: iOS + Android (when supported)
Fallback: Silent fail if not supported
```

## Color Contrast Ratios (WCAG AAA)

```
Brown background + White text:
- Contrast ratio: 7.2:1 ✓ AAA compliant

Yellow background + Black text:
- Contrast ratio: 10.1:1 ✓ AAA compliant

Black background + White text:
- Contrast ratio: 21:1 ✓ AAA compliant

White background + Black text:
- Contrast ratio: 21:1 ✓ AAA compliant
```

## Safe Area Handling

```
┌────────────────────────────────────┐
│ ← iPhone notch / Dynamic Island    │ insets.top
├────────────────────────────────────┤
│ Logo Section                       │
│ (paddingTop = insets.top + 12px)   │
├════════════════════════════════════┤
│ Banner Section                     │
└────────────────────────────────────┘

Safe area applied to:
✓ Logo section top padding
✗ Banner (no safe area needed)
✗ Sides (full width design)
```

## Implementation Notes

- All colors: Brutalist design tokens
- All borders: Sharp corners (borderRadius: 0)
- All measurements: Responsive (phone/tablet)
- All interactions: Haptic feedback enabled
- All components: React.memo optimized
- All props: Fully typed (zero `any`)
