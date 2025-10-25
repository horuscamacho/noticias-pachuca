# Visual Reference Guide - Logo & BrutalistButton

## Logo Component Variants

### Small Logo (20px)
```
┌─────────────────┐
│   NOTICIAS      │  #000000 (Black)
│   PACHUCA       │  #854836 (Brown)
│   ─────         │  #FFB22C (Yellow) 3px
└─────────────────┘
```
**Use Cases:**
- Navigation bars
- Compact headers
- Mobile menu
- Footer branding

---

### Medium Logo (28px) - DEFAULT
```
┌────────────────────────┐
│     NOTICIAS           │  #000000 (Black)
│     PACHUCA            │  #854836 (Brown)
│     ──────────         │  #FFB22C (Yellow) 4px
└────────────────────────┘
```
**Use Cases:**
- Default app screens
- Content headers
- General layouts
- Article bylines

---

### Large Logo (36px)
```
┌──────────────────────────────┐
│       NOTICIAS               │  #000000 (Black)
│       PACHUCA                │  #854836 (Brown)
│       ───────────────        │  #FFB22C (Yellow) 5px
└──────────────────────────────┘
```
**Use Cases:**
- Hero sections
- Splash screens
- Onboarding flow
- About page

---

## BrutalistButton Variants

### Primary Button (Main CTA)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓  ← 4px black border
┃                         ┃
┃    CREAR CUENTA         ┃  Brown bg (#854836)
┃                         ┃  White text (#FFFFFF)
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

PRESS STATE:
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    CREAR CUENTA         ┃  Red bg (#FF0000)
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  + Scale 0.98
```

**Specifications:**
- Background: `#854836` (Brown)
- Text: `#FFFFFF` (White)
- Border: `4px solid #000000` (Black)
- Press: `#FF0000` (Red background)
- Min Height: `44pt` (iOS standard)
- Padding: `16px vertical, 24px horizontal`
- Border Radius: `0` (Sharp corners)

**When to Use:**
- Primary call-to-action (CTA)
- Account creation
- Form submission
- Purchase/checkout
- Most important action on screen

---

### Secondary Button (Alternative Action)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓  ← 4px black border
┃                         ┃
┃   INICIAR SESIÓN        ┃  White bg (#FFFFFF)
┃                         ┃  Black text (#000000)
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

PRESS STATE:
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   INICIAR SESIÓN        ┃  Light gray bg (#F7F7F7)
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  + Scale 0.98
```

**Specifications:**
- Background: `#FFFFFF` (White)
- Text: `#000000` (Black)
- Border: `4px solid #000000` (Black)
- Press: `#F7F7F7` (Light gray background)
- Min Height: `44pt`
- Padding: `16px vertical, 24px horizontal`
- Border Radius: `0`

**When to Use:**
- Alternative action to primary
- Sign in / Log in
- Cancel actions
- Go back / Previous
- Secondary importance

---

### Tertiary Button (Subtle Action)
```
┌─────────────────────────┐  ← 2px black border
│                         │
│  CONTINUAR SIN CUENTA   │  Transparent bg
│                         │  Black text (#000000)
└─────────────────────────┘

PRESS STATE:
┌─────────────────────────┐
│  CONTINUAR SIN CUENTA   │  70% opacity
└─────────────────────────┘
```

**Specifications:**
- Background: `transparent`
- Text: `#000000` (Black)
- Border: `2px solid #000000` (Black)
- Press: `opacity: 0.7`
- Min Height: `44pt`
- Padding: `16px vertical, 24px horizontal`
- Border Radius: `0`

**When to Use:**
- Optional actions
- Skip steps
- "Learn more" links
- Tertiary importance
- Subtle interactions

---

## Button States

### Loading State
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⟳  CARGANDO...        ┃  Spinner + text
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  (Interaction disabled)
```
- Shows ActivityIndicator spinner
- Button disabled during loading
- `accessibilityState: { busy: true }`

### Disabled State
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    DISABLED BUTTON      ┃  Gray bg (#E5E7EB)
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  60% opacity, no interaction
```
- Background: `#E5E7EB` (Gray-200)
- Border: `#9CA3AF` (Gray-400)
- Text: `#6B7280` (Gray-500)
- Opacity: `0.6`
- No press events
- `accessibilityState: { disabled: true }`

---

## Common Layout Patterns

### Onboarding Screen
```
┌─────────────────────────────────┐
│                                 │
│        ┌──────────────┐         │
│        │   NOTICIAS   │  Large  │
│        │   PACHUCA    │  Logo   │
│        │   ─────────  │         │
│        └──────────────┘         │
│                                 │
│     ÚLTIMAS NOTICIAS DE        │
│          PACHUCA               │
│                                 │
│  Mantente informado con las    │
│  noticias más relevantes...    │
│                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃   CREAR CUENTA         ┃  │  Primary
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃   INICIAR SESIÓN       ┃  │  Secondary
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                 │
│  ┌─────────────────────────┐  │
│  │ CONTINUAR SIN CUENTA    │  │  Tertiary
│  └─────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Article Actions (Horizontal)
```
┌─────────────────────────────────┐
│  Article Title Here...          │
│                                 │
│  Article content...             │
│                                 │
│  ┏━━━━━━━━━━━┓ ┏━━━━━━━━━━━┓ │
│  ┃ COMPARTIR ┃ ┃  GUARDAR  ┃ │
│  ┗━━━━━━━━━━━┛ ┗━━━━━━━━━━━┛ │
│                                 │
│  ┌─────────────────────────┐  │
│  │  VER COMENTARIOS (24)   │  │
│  └─────────────────────────┘  │
└─────────────────────────────────┘
```

### Form Submission
```
┌─────────────────────────────────┐
│        CONTACTO                 │
│                                 │
│  Nombre:  [____________]        │
│  Email:   [____________]        │
│  Mensaje: [____________]        │
│           [____________]        │
│                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃      ENVIAR            ┃  │  Primary
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃     CANCELAR           ┃  │  Secondary
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────┘
```

### Header Navigation
```
┌──────────────────────────────────────┐
│  ┌───────┐  ┌────────┐  ┌────────┐ │
│  │ MENU  │  │ LOGO   │  │ BUSCAR │ │  ← 4px border
│  └───────┘  │ SMALL  │  └────────┘ │
│             └────────┘              │
└──────────────────────────────────────┘
```

---

## Color Palette Reference

### Primary Colors
```
BLACK                BROWN               YELLOW
#000000              #854836             #FFB22C
█████████            █████████           █████████
Logo "NOTICIAS"      Logo "PACHUCA"      Underline
Borders              Primary button bg   Accents
Text
```

### State Colors
```
RED                  GRAY                WHITE
#FF0000              #F7F7F7             #FFFFFF
█████████            █████████           █████████
Primary press        Background          Secondary bg
Error states         Secondary press     Primary text
```

### Disabled Colors
```
GRAY-200             GRAY-400            GRAY-500
#E5E7EB              #9CA3AF             #6B7280
█████████            █████████           █████████
Disabled bg          Disabled border     Disabled text
```

---

## Typography Reference

### Logo Typography
```
Font Weight:     900 (Black/Heavy)
Text Transform:  UPPERCASE
Letter Spacing:  2px (tight)
Line Height:     1.1 (condensed)
Alignment:       Center
```

### Button Typography
```
Font Weight:     700 (Bold)
Text Transform:  UPPERCASE
Letter Spacing:  0.5px
Line Height:     1.2
Alignment:       Center
```

---

## Spacing Reference

### Button Dimensions
```
┌─────────────────────────────────┐
│   ↑ 16px padding                │
│   BUTTON TEXT                   │  44pt minimum
│   ↓ 16px padding                │  (iOS touch target)
└─────────────────────────────────┘
    ← 24px →            ← 24px →
```

### Logo Spacing
```
Small:   4px gap between text and underline
Medium:  6px gap between text and underline
Large:   8px gap between text and underline
```

---

## Animation Reference

### Button Press Animation
```
1. User taps button
   ↓
2. Scale: 1.0 → 0.98 (compress)
   Background: variant default → variant pressed
   Haptic: Light impact feedback
   ↓
3. User releases
   ↓
4. Scale: 0.98 → 1.0 (restore)
   Background: variant pressed → variant default
   ↓
5. onPress() callback fires
```

**Timing:**
- Transform duration: 100ms
- Perceived as instant (<100ms)
- Haptic feedback: <50ms delay

---

## Accessibility Reference

### WCAG Color Contrast

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Primary button | White #FFFFFF | Brown #854836 | 5.8:1 | ✅ AA |
| Secondary button | Black #000000 | White #FFFFFF | 21:1 | ✅ AAA |
| Logo "NOTICIAS" | Black #000000 | Gray #F7F7F7 | 18.5:1 | ✅ AAA |
| Logo "PACHUCA" | Brown #854836 | Gray #F7F7F7 | 4.6:1 | ✅ AA |

### Touch Targets
```
Minimum: 44pt × 44pt (iOS Human Interface Guidelines)
Actual:  44pt × variable width (meets standard)
Spacing: 8pt minimum between buttons
```

### Screen Reader Announcements

**Logo:**
```
"Noticias Pachuca Logo, heading"
```

**Primary Button (Normal):**
```
"Crear cuenta, button"
```

**Primary Button (Disabled):**
```
"Crear cuenta, button, disabled"
```

**Primary Button (Loading):**
```
"Crear cuenta, button, busy"
```

---

## Responsive Behavior

### Logo Scaling
```
Phone (<768px):     Use base font sizes
Tablet (≥768px):    Scale up typography
Orientation:        Center aligned, adapts to width
```

### Button Scaling
```
Width:
- Default: Content width + padding
- fullWidth={true}: 100% of parent

Height:
- Fixed: 44pt minimum (accessibility)
- Padding: 16px vertical (fixed)
```

---

## Development Checklist

### Pre-deployment
- [ ] All variants tested on iOS simulator
- [ ] All variants tested on Android emulator
- [ ] Tested with VoiceOver (iOS)
- [ ] Tested with TalkBack (Android)
- [ ] Tested on physical device (haptics)
- [ ] Verified color contrast
- [ ] Verified touch target sizes
- [ ] TypeScript compilation successful
- [ ] No console warnings/errors

### Integration
- [ ] Import paths working
- [ ] NativeWind classes applying correctly
- [ ] ThemedText component available
- [ ] expo-haptics installed
- [ ] Tailwind config has brutalist colors

---

## Quick Copy-Paste Templates

### Onboarding Screen Template
```tsx
import { View } from 'react-native';
import { Logo, BrutalistButton, ThemedText } from '@/components';

export default function OnboardingScreen() {
  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <Logo size="large" className="mb-12" />

      <ThemedText variant="h2" className="text-center mb-4">
        HEADING TEXT
      </ThemedText>

      <ThemedText variant="body" className="text-center mb-12 px-4">
        Description text here...
      </ThemedText>

      <BrutalistButton
        variant="primary"
        onPress={() => {}}
        fullWidth
        className="mb-4"
      >
        Primary Action
      </BrutalistButton>

      <BrutalistButton
        variant="secondary"
        onPress={() => {}}
        fullWidth
        className="mb-4"
      >
        Secondary Action
      </BrutalistButton>

      <BrutalistButton
        variant="tertiary"
        onPress={() => {}}
        fullWidth
      >
        Skip Action
      </BrutalistButton>
    </View>
  );
}
```

### Form Template
```tsx
<BrutalistButton
  variant="primary"
  onPress={handleSubmit}
  disabled={!formValid || isSubmitting}
  loading={isSubmitting}
  fullWidth
  accessibilityLabel="Submit form"
>
  Submit
</BrutalistButton>

<BrutalistButton
  variant="secondary"
  onPress={handleCancel}
  disabled={isSubmitting}
  fullWidth
  className="mt-4"
>
  Cancel
</BrutalistButton>
```

### Header Template
```tsx
<View className="flex-row items-center justify-between px-6 py-4">
  <BrutalistButton variant="tertiary" onPress={handleMenu}>
    Menu
  </BrutalistButton>

  <Logo size="small" />

  <BrutalistButton variant="tertiary" onPress={handleSearch}>
    Search
  </BrutalistButton>
</View>
```

---

**Reference Version:** 1.0.0
**Last Updated:** 2025-10-24
**Optimized for:** React Native 0.81.5, Expo SDK 54, NativeWind 4.2.1
