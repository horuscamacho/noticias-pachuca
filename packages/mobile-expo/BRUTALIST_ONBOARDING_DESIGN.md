# Brutalist Onboarding Design Specification
## Mobile App - Noticias Pachuca

**Designer:** Jarvis (UI/UX Designer)
**Platform:** React Native (Expo)
**Date:** 2025-10-24
**Version:** 1.0

---

## TABLE OF CONTENTS

1. [Design Overview](#1-design-overview)
2. [Color Palette & Design Tokens](#2-color-palette--design-tokens)
3. [Typography System](#3-typography-system)
4. [Logo Component Design](#4-logo-component-design)
5. [Onboarding Carousel Design](#5-onboarding-carousel-design)
6. [Pagination Dots Design](#6-pagination-dots-design)
7. [Button Hierarchy Design](#7-button-hierarchy-design)
8. [Component Architecture](#8-component-architecture)
9. [Brutalist Accent Elements](#9-brutalist-accent-elements)
10. [Interaction Design](#10-interaction-design)
11. [Accessibility Specifications](#11-accessibility-specifications)
12. [Responsive Behavior](#12-responsive-behavior)
13. [Implementation Guide](#13-implementation-guide)
14. [Design Rationale](#14-design-rationale)

---

## 1. DESIGN OVERVIEW

### Visual Reference
This design translates the web's brutalist aesthetic to mobile onboarding, maintaining brand consistency while adapting to touch interfaces.

### Key Principles
1. **Bold & Direct**: Maximum contrast, thick borders, aggressive typography
2. **Touch-Optimized**: Minimum 44pt touch targets, clear interactive states
3. **Zero Compromise**: No softening of brutalist aesthetic for mobile
4. **Geometric Impact**: Strategic use of accent shapes (diamonds, thick lines)
5. **Information Hierarchy**: Clear visual weight through borders and color

### Screen Layout Structure

```
┌───────────────────────────────────┐
│  ┌─────────────────────────────┐  │ ← SafeArea (Top)
│  │                             │  │
│  │     NOTICIAS                │  │ ← Logo (2 lines)
│  │     PACHUCA                 │  │   with yellow underline
│  │     ════════                │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ ╔═══════════════════════╗   │  │ ← Carousel Area
│  │ ║                       ║   │  │   (4px black border)
│  │ ║   ┌───────────────┐   ║   │  │
│  │ ║   │               │   ║   │  │   Image Area
│  │ ║   │    IMAGE      │   ║   │  │   (16:9 ratio)
│  │ ║   │   PLACEHOLDER │   ║   │  │
│  │ ║   │               │   ║   │  │
│  │ ║   └───────────────┘   ║   │  │
│  │ ║   ◆                   ║   │  │ ← Diamond accent
│  │ ║                       ║   │  │
│  │ ║   SLIDE TITLE         ║   │  │ ← Title (bold, uppercase)
│  │ ║   IN UPPERCASE        ║   │  │
│  │ ║                       ║   │  │
│  │ ║   Slide description   ║   │  │ ← Description text
│  │ ║   explaining the      ║   │  │
│  │ ║   feature or benefit  ║   │  │
│  │ ║                       ║   │  │
│  │ ╚═══════════════════════╝   │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │    ▪  ▫  ▫                  │  │ ← Pagination (square dots)
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ ╔═══════════════════════╗   │  │ ← Primary Button
│  │ ║   CREAR CUENTA        ║   │  │   (brown bg, white text)
│  │ ╚═══════════════════════╝   │  │   (4px border)
│  │                             │  │
│  │ ╔═══════════════════════╗   │  │ ← Secondary Button
│  │ ║   INICIAR SESIÓN      ║   │  │   (white bg, black text)
│  │ ╚═══════════════════════╝   │  │   (4px border)
│  │                             │  │
│  │  Continuar sin cuenta       │  │ ← Tertiary Link
│  │  ──────────────────          │  │   (underline on press)
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │ ← SafeArea (Bottom)
└───────────────────────────────────┘
```

### Spacing System (8pt Grid)
```
4pt  = 0.5 (hairline elements)
8pt  = 1   (tight spacing)
16pt = 2   (base spacing)
24pt = 3   (medium spacing)
32pt = 4   (large spacing)
48pt = 6   (section spacing)
64pt = 8   (major sections)
```

---

## 2. COLOR PALETTE & DESIGN TOKENS

### Primary Colors

```typescript
// /constants/BrutalistColors.ts
export const BrutalistColors = {
  // Brand Colors
  primaryBrown: '#854836',    // Main brand color
  accentYellow: '#FFB22C',    // Highlights, CTAs, accents
  accentRed: '#FF0000',       // Hover states, urgent elements

  // Base Colors
  foregroundBlack: '#000000', // Text, borders, emphasis
  backgroundLight: '#F7F7F7', // Light backgrounds, cards
  backgroundWhite: '#FFFFFF', // Pure white backgrounds

  // Text Colors
  textPrimary: '#000000',     // Main text
  textSecondary: '#4A4A4A',   // Secondary text
  textInverse: '#FFFFFF',     // Text on dark backgrounds

  // Border Colors
  borderStrong: '#000000',    // Primary borders (4px)
  borderMedium: '#2A2A2A',    // Secondary borders (2px)

  // State Colors
  disabled: '#CCCCCC',        // Disabled states
  error: '#FF0000',           // Error states
  success: '#00AA00',         // Success states
} as const;
```

### Semantic Tokens

```typescript
export const BrutalistTokens = {
  // Button Colors
  button: {
    primary: {
      background: BrutalistColors.primaryBrown,
      text: BrutalistColors.textInverse,
      border: BrutalistColors.borderStrong,
    },
    secondary: {
      background: BrutalistColors.backgroundWhite,
      text: BrutalistColors.textPrimary,
      border: BrutalistColors.borderStrong,
    },
    tertiary: {
      background: 'transparent',
      text: BrutalistColors.textSecondary,
      border: 'transparent',
    },
  },

  // Surface Colors
  surface: {
    card: BrutalistColors.backgroundWhite,
    background: BrutalistColors.backgroundLight,
    elevated: BrutalistColors.backgroundWhite,
  },

  // Accent Colors
  accent: {
    primary: BrutalistColors.accentYellow,
    secondary: BrutalistColors.primaryBrown,
    error: BrutalistColors.accentRed,
  },
} as const;
```

---

## 3. TYPOGRAPHY SYSTEM

### Font Configuration

```typescript
// /constants/BrutalistTypography.ts
export const BrutalistTypography = {
  // Font Families (System fonts for React Native)
  fonts: {
    heading: 'System',      // Will use Inter/SF Pro (bold weights)
    body: 'System',         // Will use Inter/SF Pro (regular weights)
    mono: 'Courier',        // For technical elements
  },

  // Font Weights
  weights: {
    regular: '400',
    medium: '600',
    bold: '700',
    black: '900',
  },

  // Font Sizes (scaled for mobile)
  sizes: {
    xs: 12,   // Small labels
    sm: 14,   // Body small
    base: 16, // Body text
    lg: 18,   // Lead text
    xl: 20,   // Subheadings
    '2xl': 24, // Card titles
    '3xl': 28, // Section headers
    '4xl': 32, // Page headers
    '5xl': 40, // Logo text
  },

  // Line Heights
  lineHeights: {
    tight: 1.1,   // Headings
    snug: 1.25,   // Titles
    normal: 1.5,  // Body text
    relaxed: 1.75, // Lead paragraphs
  },

  // Letter Spacing
  tracking: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;
```

### Typography Variants (for React Native)

```typescript
// Text style variants
export const typographyVariants = {
  // Logo Text
  logoLarge: {
    fontFamily: BrutalistTypography.fonts.heading,
    fontWeight: BrutalistTypography.weights.black,
    fontSize: BrutalistTypography.sizes['5xl'],
    lineHeight: BrutalistTypography.sizes['5xl'] * BrutalistTypography.lineHeights.tight,
    letterSpacing: BrutalistTypography.tracking.wide,
    textTransform: 'uppercase',
  },

  // Headings
  h1: {
    fontFamily: BrutalistTypography.fonts.heading,
    fontWeight: BrutalistTypography.weights.black,
    fontSize: BrutalistTypography.sizes['4xl'],
    lineHeight: BrutalistTypography.sizes['4xl'] * BrutalistTypography.lineHeights.tight,
    letterSpacing: BrutalistTypography.tracking.normal,
    textTransform: 'uppercase',
  },

  h2: {
    fontFamily: BrutalistTypography.fonts.heading,
    fontWeight: BrutalistTypography.weights.black,
    fontSize: BrutalistTypography.sizes['3xl'],
    lineHeight: BrutalistTypography.sizes['3xl'] * BrutalistTypography.lineHeights.tight,
    letterSpacing: BrutalistTypography.tracking.normal,
    textTransform: 'uppercase',
  },

  h3: {
    fontFamily: BrutalistTypography.fonts.heading,
    fontWeight: BrutalistTypography.weights.bold,
    fontSize: BrutalistTypography.sizes['2xl'],
    lineHeight: BrutalistTypography.sizes['2xl'] * BrutalistTypography.lineHeights.snug,
    letterSpacing: BrutalistTypography.tracking.normal,
    textTransform: 'uppercase',
  },

  // Body Text
  bodyLarge: {
    fontFamily: BrutalistTypography.fonts.body,
    fontWeight: BrutalistTypography.weights.regular,
    fontSize: BrutalistTypography.sizes.lg,
    lineHeight: BrutalistTypography.sizes.lg * BrutalistTypography.lineHeights.normal,
    letterSpacing: BrutalistTypography.tracking.normal,
  },

  body: {
    fontFamily: BrutalistTypography.fonts.body,
    fontWeight: BrutalistTypography.weights.regular,
    fontSize: BrutalistTypography.sizes.base,
    lineHeight: BrutalistTypography.sizes.base * BrutalistTypography.lineHeights.normal,
    letterSpacing: BrutalistTypography.tracking.normal,
  },

  bodySmall: {
    fontFamily: BrutalistTypography.fonts.body,
    fontWeight: BrutalistTypography.weights.regular,
    fontSize: BrutalistTypography.sizes.sm,
    lineHeight: BrutalistTypography.sizes.sm * BrutalistTypography.lineHeights.normal,
    letterSpacing: BrutalistTypography.tracking.normal,
  },

  // Button Text
  button: {
    fontFamily: BrutalistTypography.fonts.heading,
    fontWeight: BrutalistTypography.weights.black,
    fontSize: BrutalistTypography.sizes.base,
    lineHeight: BrutalistTypography.sizes.base * 1.2,
    letterSpacing: BrutalistTypography.tracking.wider,
    textTransform: 'uppercase',
  },

  // Labels
  label: {
    fontFamily: BrutalistTypography.fonts.heading,
    fontWeight: BrutalistTypography.weights.bold,
    fontSize: BrutalistTypography.sizes.xs,
    lineHeight: BrutalistTypography.sizes.xs * 1.3,
    letterSpacing: BrutalistTypography.tracking.widest,
    textTransform: 'uppercase',
  },
} as const;
```

---

## 4. LOGO COMPONENT DESIGN

### Visual Design

```
┌─────────────────────────┐
│   NOTICIAS              │ ← Line 1: Black, 40pt
│   PACHUCA               │ ← Line 2: Brown #854836, 40pt
│   ════════              │ ← Yellow underline, 64px wide, 4pt thick
└─────────────────────────┘
```

### Logo Specifications

**Typography:**
- Font weight: 900 (Black)
- Font size: 40pt
- Letter spacing: +1pt (wide tracking)
- Text transform: UPPERCASE
- Line height: 42pt (tight)

**Colors:**
- "NOTICIAS": `#000000` (black)
- "PACHUCA": `#854836` (brown)
- Underline: `#FFB22C` (yellow)

**Underline Specs:**
- Width: 64pt (extends past "PACHUCA")
- Height: 4pt
- Position: 4pt below "PACHUCA" baseline
- Alignment: Left-aligned with "P" in PACHUCA

**Spacing:**
- Top padding: 24pt (from SafeArea)
- Bottom padding: 32pt (to carousel)
- Horizontal padding: 24pt (from screen edges)

### Logo Component Props Interface

```typescript
// /components/Logo/Logo.types.ts
export interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showUnderline?: boolean;
  align?: 'left' | 'center' | 'right';
  testID?: string;
}

export const LogoSizes = {
  small: {
    fontSize: 24,
    underlineWidth: 40,
    underlineHeight: 2,
    spacing: 2,
  },
  medium: {
    fontSize: 32,
    underlineWidth: 52,
    underlineHeight: 3,
    spacing: 3,
  },
  large: {
    fontSize: 40,
    underlineWidth: 64,
    underlineHeight: 4,
    spacing: 4,
  },
} as const;
```

### Logo Component Structure

```tsx
// /components/Logo/Logo.tsx (Pseudocode)
<View style={styles.logoContainer} accessibilityRole="header">
  <View style={styles.textContainer}>
    {/* Line 1: NOTICIAS */}
    <Text
      style={[styles.logoText, styles.logoBlack]}
      accessibilityLabel="Noticias"
    >
      NOTICIAS
    </Text>

    {/* Line 2: PACHUCA */}
    <Text
      style={[styles.logoText, styles.logoBrown]}
      accessibilityLabel="Pachuca"
    >
      PACHUCA
    </Text>
  </View>

  {/* Yellow underline accent */}
  {showUnderline && (
    <View style={styles.underline} />
  )}
</View>
```

---

## 5. ONBOARDING CAROUSEL DESIGN

### Slide Content Structure

Each onboarding slide contains:
1. **Image area** (brutalist bordered, 16:9 ratio)
2. **Diamond accent** (geometric decoration)
3. **Title** (bold, uppercase, 2-3 lines max)
4. **Description** (body text, 3-4 lines max)

### Visual Layout Per Slide

```
┌─────────────────────────────┐
│ ╔═══════════════════════╗   │ ← 4px black border
│ ║                       ║   │
│ ║   ┌───────────────┐   ║   │
│ ║   │               │   ║   │
│ ║   │    IMAGE      │   ║   │ ← Image: 16:9 ratio
│ ║   │  PLACEHOLDER  │   ║   │   2px black border
│ ║   │               │   ║   │
│ ║   └───────────────┘   ║   │
│ ║   ◆                   ║   │ ← Diamond (12x12pt, rotated 45°)
│ ║                       ║   │   Yellow fill, 2px black border
│ ║   MANTENTE            ║   │ ← Title: 24pt, bold, uppercase
│ ║   INFORMADO           ║   │   Black color, tight line height
│ ║                       ║   │
│ ║   Lee las noticias    ║   │ ← Description: 16pt, regular
│ ║   más relevantes      ║   │   Dark gray, normal line height
│ ║   de Pachuca en       ║   │   Max 4 lines
│ ║   tiempo real         ║   │
│ ║                       ║   │
│ ╚═══════════════════════╝   │
└─────────────────────────────┘
```

### Slide Specifications

**Container:**
- Border: 4px solid black
- Background: White (#FFFFFF)
- Padding: 24pt all sides
- Margin horizontal: 16pt (from screen edges)
- Border radius: 0 (sharp corners)

**Image Area:**
- Aspect ratio: 16:9
- Border: 2px solid black
- Background: Light gray (#F7F7F7) as placeholder
- Margin bottom: 16pt

**Diamond Accent:**
- Size: 12pt x 12pt
- Rotation: 45 degrees
- Background: Yellow (#FFB22C)
- Border: 2px solid black
- Position: 8pt below image, 8pt from left

**Title:**
- Typography: h3 variant (24pt, black weight)
- Color: Black (#000000)
- Text transform: UPPERCASE
- Max lines: 3 (ellipsis after)
- Margin top: 16pt
- Margin bottom: 12pt

**Description:**
- Typography: body variant (16pt, regular weight)
- Color: Dark gray (#4A4A4A)
- Max lines: 4 (ellipsis after)
- Line height: 1.5

### Carousel Slides Content

**Slide 1: Stay Informed**
```
Title: "MANTENTE INFORMADO"
Description: "Lee las noticias más relevantes de Pachuca en tiempo real"
Image: News feed illustration
Accent: Yellow diamond
```

**Slide 2: Real-Time Updates**
```
Title: "ACTUALIZACIONES EN VIVO"
Description: "Recibe notificaciones instantáneas de las últimas noticias"
Image: Notification illustration
Accent: Yellow diamond
```

**Slide 3: Local Focus**
```
Title: "ENFOQUE LOCAL"
Description: "Noticias de tu ciudad, tu estado, tu comunidad"
Image: Map/location illustration
Accent: Yellow diamond
```

### Carousel Behavior

**Swipe Gesture:**
- Direction: Horizontal (left/right)
- Velocity threshold: 0.2
- Distance threshold: 50pt
- Animation: Spring physics (tension: 68, friction: 12)
- Bounce: Disabled (strict boundaries)

**Auto-Advance:**
- Enabled: Yes
- Interval: 4000ms (4 seconds)
- Pause on touch: Yes
- Resume on release: Yes (after 1s delay)

**Edge Behavior:**
- Loop: No (stop at first/last slide)
- Resistance: Yes (rubber band effect at edges)
- Indicator: Visual feedback when at edge

---

## 6. PAGINATION DOTS DESIGN

### Visual Design

```
Active Dot:   ▪  (Square, filled, black)
Inactive Dot: ▫  (Square, outlined, black border)
```

### Pagination Specifications

**Dot Dimensions:**
- Size: 12pt x 12pt (square, not circular)
- Gap between dots: 12pt

**Active Dot:**
- Background: Black (#000000)
- Border: 2px solid black (creates layered effect)
- Shape: Square (border radius: 0)

**Inactive Dot:**
- Background: White (#FFFFFF)
- Border: 2px solid black
- Shape: Square (border radius: 0)

**Container:**
- Alignment: Center horizontal
- Margin vertical: 32pt (16pt top, 16pt bottom)
- Flex direction: Row
- Justify content: Center

**Touch Targets:**
- Minimum size: 44pt x 44pt (accessibility)
- Padding: 16pt around each dot
- Active area: Invisible but tappable

**Animation:**
- Transition: Scale + opacity
- Duration: 200ms
- Easing: Ease-out
- Active scale: 1.0
- Inactive scale: 0.85
- Opacity: Active 1.0, Inactive 0.7

### Pagination Component Props

```typescript
// /components/Pagination/Pagination.types.ts
export interface PaginationDotsProps {
  total: number;
  currentIndex: number;
  onDotPress?: (index: number) => void;
  variant?: 'square' | 'circle'; // Default: 'square'
  activeColor?: string;
  inactiveColor?: string;
  borderColor?: string;
  size?: number; // Default: 12
  gap?: number;  // Default: 12
  testID?: string;
}
```

### Accessibility

```typescript
// Screen reader announcement
`Página ${currentIndex + 1} de ${total}`
// Or in English:
`Page ${currentIndex + 1} of ${total}`

// Each dot announces:
`Ir a la página ${index + 1}`
```

---

## 7. BUTTON HIERARCHY DESIGN

### Button Visual Hierarchy

```
Primary (Crear Cuenta):
┌───────────────────────────────┐
│ ╔═══════════════════════════╗ │ ← 4px border
│ ║   CREAR CUENTA            ║ │ ← Brown bg, white text
│ ╚═══════════════════════════╝ │
└───────────────────────────────┘

Secondary (Iniciar Sesión):
┌───────────────────────────────┐
│ ╔═══════════════════════════╗ │ ← 4px border
│ ║   INICIAR SESIÓN          ║ │ ← White bg, black text
│ ╚═══════════════════════════╝ │
└───────────────────────────────┘

Tertiary (Continuar sin cuenta):
┌───────────────────────────────┐
│   Continuar sin cuenta        │ ← No border/background
│   ──────────────────          │ ← Underline (2px, black)
└───────────────────────────────┘
```

### Primary Button Specifications

**Visual:**
- Background: Brown (#854836)
- Text color: White (#FFFFFF)
- Border: 4px solid black (#000000)
- Border radius: 0 (sharp corners)

**Typography:**
- Font weight: 900 (Black)
- Font size: 16pt
- Letter spacing: +2pt (widest)
- Text transform: UPPERCASE
- Line height: 1.2

**Sizing:**
- Height: 56pt (minimum touch target)
- Padding horizontal: 32pt
- Padding vertical: 16pt
- Width: 100% minus 48pt (24pt padding each side)

**States:**
```typescript
// Default
background: '#854836'
opacity: 1.0

// Pressed (onPressIn)
background: '#6A3629' // Darker brown
opacity: 0.9
scale: 0.98

// Disabled
background: '#CCCCCC'
opacity: 0.5
cursor: 'not-allowed'
```

### Secondary Button Specifications

**Visual:**
- Background: White (#FFFFFF)
- Text color: Black (#000000)
- Border: 4px solid black (#000000)
- Border radius: 0

**Typography:** Same as primary

**Sizing:** Same as primary

**States:**
```typescript
// Default
background: '#FFFFFF'
borderColor: '#000000'
opacity: 1.0

// Pressed (onPressIn)
background: '#F7F7F7' // Light gray
borderColor: '#000000'
scale: 0.98

// Hover (on web)
background: '#FFB22C' // Yellow
borderColor: '#000000'
```

### Tertiary Button (Link) Specifications

**Visual:**
- Background: Transparent
- Text color: Dark gray (#4A4A4A)
- Border: None
- Underline: 2px solid black (on text)

**Typography:**
- Font weight: 600 (Semibold)
- Font size: 16pt
- Letter spacing: 0
- Text transform: None (sentence case)
- Line height: 1.5

**Sizing:**
- Height: 44pt (minimum touch target)
- Padding horizontal: 16pt
- Padding vertical: 12pt
- Alignment: Center

**States:**
```typescript
// Default
color: '#4A4A4A'
textDecorationLine: 'underline'
textDecorationColor: '#000000'
textDecorationStyle: 'solid'

// Pressed
color: '#000000'
textDecorationColor: '#854836' // Brown underline
opacity: 0.7
```

### Button Container Layout

```typescript
// Spacing between buttons
const buttonSpacing = {
  marginBottom: 16, // 16pt between primary and secondary
  tertiary: {
    marginTop: 24, // Extra space above tertiary (link)
  },
};

// Container padding
const containerPadding = {
  horizontal: 24, // From screen edges
  vertical: 32,   // From pagination dots
  bottom: 32,     // From SafeArea bottom
};
```

### Button Component Props

```typescript
// /components/BrutalistButton/BrutalistButton.types.ts
export interface BrutalistButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const buttonVariants = {
  primary: {
    backgroundColor: BrutalistColors.primaryBrown,
    textColor: BrutalistColors.textInverse,
    borderColor: BrutalistColors.borderStrong,
    borderWidth: 4,
  },
  secondary: {
    backgroundColor: BrutalistColors.backgroundWhite,
    textColor: BrutalistColors.textPrimary,
    borderColor: BrutalistColors.borderStrong,
    borderWidth: 4,
  },
  tertiary: {
    backgroundColor: 'transparent',
    textColor: BrutalistColors.textSecondary,
    borderColor: 'transparent',
    borderWidth: 0,
  },
} as const;
```

---

## 8. COMPONENT ARCHITECTURE

### Component Tree Structure

```
/app/(onboarding)/
├── onboarding.tsx                    # Main onboarding screen
└── _layout.tsx                       # Onboarding navigation wrapper

/components/onboarding/
├── OnboardingScreen.tsx              # Main container component
│   └── Props: { onComplete: () => void }
│
├── Logo/
│   ├── Logo.tsx                      # Logo component
│   ├── Logo.types.ts                 # TypeScript interfaces
│   └── Logo.styles.ts                # StyleSheet definitions
│
├── Carousel/
│   ├── OnboardingCarousel.tsx        # Carousel container
│   ├── CarouselSlide.tsx             # Individual slide
│   ├── SlideContent.tsx              # Slide text content
│   ├── ImagePlaceholder.tsx          # Image with border
│   ├── DiamondAccent.tsx             # Geometric accent
│   ├── Carousel.types.ts             # TypeScript interfaces
│   └── Carousel.styles.ts            # StyleSheet definitions
│
├── Pagination/
│   ├── PaginationDots.tsx            # Dot indicator component
│   ├── Pagination.types.ts           # TypeScript interfaces
│   └── Pagination.styles.ts          # StyleSheet definitions
│
└── ActionButtons/
    ├── ActionButtons.tsx             # Button container
    ├── ActionButtons.types.ts        # TypeScript interfaces
    └── ActionButtons.styles.ts       # StyleSheet definitions

/components/ui/
├── BrutalistButton/
│   ├── BrutalistButton.tsx           # Reusable button component
│   ├── BrutalistButton.types.ts      # TypeScript interfaces
│   └── BrutalistButton.styles.ts     # StyleSheet definitions
│
└── BrutalistCard/
    ├── BrutalistCard.tsx             # Reusable card wrapper
    ├── BrutalistCard.types.ts        # TypeScript interfaces
    └── BrutalistCard.styles.ts       # StyleSheet definitions

/constants/
├── BrutalistColors.ts                # Color palette
├── BrutalistTypography.ts            # Typography system
├── BrutalistSpacing.ts               # Spacing scale
└── BrutalistBorders.ts               # Border widths
```

### Component Responsibilities

#### 1. OnboardingScreen (Container)
**Responsibility:** Overall layout, state management, navigation
```typescript
interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingScreenState {
  currentSlideIndex: number;
  slides: OnboardingSlide[];
}
```

**Key Methods:**
- `handleSlideChange(index: number): void`
- `handleCreateAccount(): void`
- `handleLogin(): void`
- `handleSkip(): void`

**State Management:**
- Current slide index
- Slide data array
- Animation states
- User interaction tracking

---

#### 2. Logo Component
**Responsibility:** Display brand logo with consistent styling
```typescript
interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showUnderline?: boolean;
  align?: 'left' | 'center' | 'right';
}
```

**Key Features:**
- Responsive sizing
- Optional underline accent
- Alignment control
- Accessibility labels

---

#### 3. OnboardingCarousel (Smart Component)
**Responsibility:** Manage carousel state, gestures, animations
```typescript
interface OnboardingCarouselProps {
  slides: OnboardingSlide[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
}
```

**Key Methods:**
- `goToSlide(index: number): void`
- `goToNextSlide(): void`
- `goToPreviousSlide(): void`
- `pauseAutoAdvance(): void`
- `resumeAutoAdvance(): void`

**Uses:**
- React Native Gesture Handler for swipe
- React Native Reanimated for smooth animations
- FlatList for performant scrolling

---

#### 4. CarouselSlide (Presentational)
**Responsibility:** Display single slide content
```typescript
interface CarouselSlideProps {
  slide: OnboardingSlide;
  isActive: boolean;
  index: number;
}

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}
```

**Key Features:**
- Image with brutalist border
- Diamond accent
- Title and description
- Optimized rendering

---

#### 5. ImagePlaceholder Component
**Responsibility:** Display images with brutalist styling
```typescript
interface ImagePlaceholderProps {
  source: ImageSourcePropType;
  aspectRatio?: number;
  alt: string;
  showBorder?: boolean;
  borderWidth?: number;
}
```

**Key Features:**
- Thick black border
- Aspect ratio control
- Loading state
- Error fallback

---

#### 6. DiamondAccent Component
**Responsibility:** Display geometric accent element
```typescript
interface DiamondAccentProps {
  size?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  rotation?: number; // Default 45
}
```

**Key Features:**
- Rotated square shape
- Customizable colors
- Configurable size
- Reusable across app

---

#### 7. SlideContent Component
**Responsibility:** Display slide title and description
```typescript
interface SlideContentProps {
  title: string;
  description: string;
  titleNumberOfLines?: number;
  descriptionNumberOfLines?: number;
}
```

**Key Features:**
- Typography variants
- Line clamping
- Responsive sizing
- Accessibility

---

#### 8. PaginationDots Component
**Responsibility:** Display and manage pagination indicators
```typescript
interface PaginationDotsProps {
  total: number;
  currentIndex: number;
  onDotPress?: (index: number) => void;
  variant?: 'square' | 'circle';
  activeColor?: string;
  inactiveColor?: string;
}
```

**Key Features:**
- Square dots (brutalist style)
- Tappable navigation
- Animated transitions
- Accessibility labels

---

#### 9. ActionButtons (Container)
**Responsibility:** Display and manage CTA buttons
```typescript
interface ActionButtonsProps {
  onCreateAccount: () => void;
  onLogin: () => void;
  onSkip: () => void;
  loading?: boolean;
}
```

**Key Features:**
- Button hierarchy
- Loading states
- Disabled states
- Haptic feedback

---

#### 10. BrutalistButton (Reusable)
**Responsibility:** Reusable button with brutalist styling
```typescript
interface BrutalistButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}
```

**Key Features:**
- Three variants
- Press animations
- Loading indicator
- Icon support
- Haptic feedback
- Accessibility

---

#### 11. BrutalistCard (Reusable)
**Responsibility:** Reusable card container with brutalist styling
```typescript
interface BrutalistCardProps {
  children: React.ReactNode;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  padding?: number;
  elevation?: boolean;
}
```

**Key Features:**
- Thick borders
- Sharp corners
- Configurable padding
- Reusable wrapper

---

### Data Flow Architecture

```
┌──────────────────────────────────────┐
│     OnboardingScreen (State)         │
│  - currentSlideIndex: number         │
│  - slides: OnboardingSlide[]         │
│  - autoAdvanceEnabled: boolean       │
└────────────┬─────────────────────────┘
             │
             ├─────────────────────────┐
             │                         │
             ▼                         ▼
  ┌─────────────────────┐   ┌─────────────────────┐
  │  OnboardingCarousel │   │   ActionButtons     │
  │  - Gesture handling │   │   - Button actions  │
  │  - Animation logic  │   │   - Loading states  │
  └──────────┬──────────┘   └─────────────────────┘
             │
             ├──────────────┬──────────────┐
             │              │              │
             ▼              ▼              ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │CarouselSlide│ │PaginationDots│ │             │
  │             │ │             │ │             │
  └──────┬──────┘ └─────────────┘ │             │
         │                         │             │
         ├─────────┬───────────────┘             │
         │         │                             │
         ▼         ▼                             ▼
  ┌──────────┐ ┌──────────┐          ┌─────────────────┐
  │ImagePlaceh│ │SlideContent│          │BrutalistButton  │
  │older     │ │          │          │(Reusable)       │
  └──────────┘ └──────────┘          └─────────────────┘
         │
         ▼
  ┌──────────┐
  │Diamond   │
  │Accent    │
  └──────────┘
```

### State Management Approach

**Local State (useState):**
- Current slide index
- Auto-advance timer
- Loading states

**Derived State:**
- Is first slide
- Is last slide
- Progress percentage

**No Global State Needed:**
- Onboarding is isolated feature
- No cross-screen data sharing required
- Navigation handles completion

---

## 9. BRUTALIST ACCENT ELEMENTS

### 1. Diamond Accent (Primary)

```
Visual:
  ◆  Rotated square (45°)
     Size: 12pt x 12pt
     Fill: Yellow (#FFB22C)
     Border: 2px black
```

**Usage:**
- Below images in carousel slides
- Corner decorations on cards
- Bullet points in lists
- Visual separators

**Placement Guidelines:**
- 8pt offset from parent element
- Left-aligned or asymmetric placement
- Never centered (breaks brutalist asymmetry)
- Can overlap slightly with borders

**Component:**
```typescript
<DiamondAccent
  size={12}
  color="#FFB22C"
  borderColor="#000000"
  borderWidth={2}
  rotation={45}
/>
```

---

### 2. Thick Line Accent

```
Visual:
  ════════  Horizontal line
            Width: 64pt
            Height: 4pt
            Color: Yellow (#FFB22C)
```

**Usage:**
- Under logo (PACHUCA underline)
- Section dividers
- Progress indicators
- Emphasis bars

**Placement Guidelines:**
- Left-aligned (not centered)
- 4-8pt spacing from text above
- Width: 40-80% of parent width
- Never full width (breaks brutalist asymmetry)

**Component:**
```typescript
<View style={{
  width: 64,
  height: 4,
  backgroundColor: BrutalistColors.accentYellow,
  marginTop: 4,
}} />
```

---

### 3. Corner Accent (Advanced)

```
Visual:
  ┌─┐  L-shaped corner
  │ │  Line thickness: 4pt
  │ │  Length: 16pt each side
  └─┘  Color: Black or Yellow
```

**Usage:**
- Card corners
- Image frame decorations
- Focus indicators
- Viewport boundaries

**Placement Guidelines:**
- Top-left or bottom-right corners
- 0pt offset (flush with edge)
- Can extend outside parent slightly
- Pair with thick borders

**Component:**
```typescript
<View style={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: 16,
  height: 16,
  borderTopWidth: 4,
  borderLeftWidth: 4,
  borderColor: BrutalistColors.accentYellow,
}} />
```

---

### 4. Geometric Grid Pattern (Background)

```
Visual:
  ▓░▓░▓░  Checkerboard or grid
  ░▓░▓░▓  Subtle background pattern
  ▓░▓░▓░  Low opacity
```

**Usage:**
- Empty states
- Loading screens
- Background decorations
- Texture overlays

**Implementation:**
- Use SVG pattern or image
- Opacity: 0.05-0.1 (very subtle)
- Colors: Black/gray
- Grid size: 8pt or 16pt

---

### 5. Diagonal Slash Accent

```
Visual:
  ╱  or  ╲  Diagonal line
           Angle: 45° or 135°
           Width: 2-4pt
           Length: 24-48pt
```

**Usage:**
- Visual separators
- Decorative elements
- Directional indicators
- Loading animations

**Placement Guidelines:**
- Background layers only
- Never obscures text
- Can overlap with borders
- Use sparingly (1-2 per screen)

---

### Accent Placement Strategy

**Onboarding Screen Accents:**
```
┌─────────────────────────────┐
│   NOTICIAS                  │
│   PACHUCA                   │
│   ════════  ← Yellow line   │ ← Logo area
│                             │
│ ╔═══════════════════════╗   │
│ ║ ┌─────────────────┐   ║   │
│ ║ │     IMAGE       │   ║   │
│ ║ └─────────────────┘   ║   │
│ ║ ◆  ← Diamond accent  ║   │ ← Carousel
│ ║                       ║   │
│ ║ TITLE HERE            ║   │
│ ║ Description...        ║   │
│ ╚═══════════════════════╝   │
│                             │
│    ▪  ▫  ▫  ← Square dots  │ ← Pagination
│                             │
│ ╔═══════════════════════╗   │ ← Buttons
│ ║   CREAR CUENTA        ║   │   (No accents -
│ ╚═══════════════════════╝   │    clean & clear)
└─────────────────────────────┘
```

**Accent Density Guidelines:**
- Maximum 3 accent types per screen
- Accent elements should not exceed 5% of screen area
- Maintain asymmetric balance (not symmetry)
- Use color accents sparingly (1-2 yellow elements)

---

## 10. INTERACTION DESIGN

### Gesture Interactions

#### 1. Carousel Swipe
**Gesture:** Horizontal pan (left/right)

**Behavior:**
```typescript
const swipeConfig = {
  // Activation
  minDistance: 20,        // Start tracking after 20pt movement
  minVelocity: 0.2,       // Minimum velocity to trigger swipe

  // Thresholds
  swipeThreshold: 50,     // Distance to trigger slide change
  velocityThreshold: 0.5, // Velocity to trigger immediate change

  // Animation
  springConfig: {
    tension: 68,          // Spring tension
    friction: 12,         // Spring friction
    mass: 1,              // Spring mass
  },

  // Boundaries
  enableBounce: true,     // Bounce at first/last slide
  bounceDistance: 24,     // Max bounce distance

  // Feedback
  hapticFeedback: true,   // Vibrate on slide change
  hapticType: 'light',    // Light haptic feedback
};
```

**States:**
1. **Idle**: No touch, auto-advance active
2. **Touching**: User touched, auto-advance paused
3. **Dragging**: User panning, follow finger position
4. **Momentum**: User released, animate to nearest slide
5. **Settling**: Snapping to slide position

**Visual Feedback:**
- Card follows finger during drag
- Adjacent slides partially visible (peek effect)
- Resistance at boundaries (rubber band)
- Opacity change during drag (optional)

---

#### 2. Pagination Dot Tap
**Gesture:** Single tap

**Behavior:**
```typescript
const dotTapConfig = {
  // Touch area
  minTouchArea: 44,       // Minimum 44pt touch target

  // Animation
  transitionDuration: 300, // Slide transition time
  easing: 'easeOut',      // Easing function

  // Feedback
  hapticFeedback: true,
  hapticType: 'selection',

  // Visual
  scaleOnPress: 0.9,      // Scale down on press
};
```

**States:**
1. **Default**: Inactive dot, 0.7 opacity
2. **Active**: Current slide, 1.0 opacity
3. **Pressed**: Temporary scale + opacity change
4. **Transitioning**: Animated fade between states

---

#### 3. Button Press
**Gesture:** Single tap

**Behavior:**
```typescript
const buttonPressConfig = {
  // Press animation
  pressInDuration: 100,
  pressOutDuration: 200,

  // Scale effect
  pressedScale: 0.98,

  // Opacity effect (tertiary only)
  pressedOpacity: 0.7,

  // Feedback
  hapticFeedback: true,
  hapticType: 'medium',  // Stronger for CTAs

  // Delay before action
  delayAfterPress: 100,  // Visual feedback before navigation
};
```

**States:**
1. **Default**: Normal appearance
2. **Pressed**: Scaled down, darker color
3. **Loading**: Disabled, spinner visible
4. **Disabled**: Gray, no interaction

**Visual Feedback:**
- Scale transform (0.98x)
- Background color change
- Border remains same thickness
- Loading spinner replaces text

---

#### 4. Auto-Advance Behavior

**Default Behavior:**
```typescript
const autoAdvanceConfig = {
  enabled: true,
  interval: 4000,         // 4 seconds per slide

  // Pause conditions
  pauseOnTouch: true,     // Pause when user touches
  pauseOnForeground: false, // Continue in foreground

  // Resume behavior
  resumeDelay: 1000,      // 1 second after touch release
  resetOnManualChange: true, // Reset timer on manual swipe

  // Loop behavior
  loop: false,            // Stop at last slide
  restartDelay: 2000,     // Delay before restarting at slide 1
};
```

**Visual Indicators:**
- Progress bar below dots (optional)
- Animated dot fill (subtle pulse)
- No intrusive countdown timer

---

### Transition Animations

#### 1. Slide Transition
```typescript
const slideTransition = {
  type: 'spring',
  config: {
    tension: 68,
    friction: 12,
    mass: 1,
  },
  duration: 300, // Fallback if spring not available
};
```

**Properties Animated:**
- translateX: Slide position
- opacity: Fade in/out (subtle, 0.7 to 1.0)
- scale: Very subtle (0.95 to 1.0)

---

#### 2. Pagination Dot Transition
```typescript
const dotTransition = {
  type: 'timing',
  duration: 200,
  easing: Easing.out(Easing.ease),
};
```

**Properties Animated:**
- backgroundColor: Fill color change
- scale: Active state (1.0 vs 0.85)
- opacity: Active/inactive (1.0 vs 0.7)

---

#### 3. Button Press Animation
```typescript
const buttonPressAnimation = {
  pressIn: {
    duration: 100,
    scale: 0.98,
    easing: Easing.in(Easing.ease),
  },
  pressOut: {
    duration: 200,
    scale: 1.0,
    easing: Easing.out(Easing.spring),
  },
};
```

---

#### 4. Screen Enter/Exit
```typescript
const screenTransition = {
  enter: {
    animation: 'fade',
    duration: 300,
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  exit: {
    animation: 'slide',
    duration: 300,
    direction: 'right', // Slide out to right
  },
};
```

---

### Loading States

#### 1. Initial Load
```
┌─────────────────────────────┐
│                             │
│         NOTICIAS            │
│         PACHUCA             │
│         ════════            │
│                             │
│      [Loading Spinner]      │ ← Simple black spinner
│                             │
│   Cargando contenido...     │
│                             │
└─────────────────────────────┘
```

#### 2. Button Loading
```
Primary Button Loading:
╔═══════════════════════════╗
║  [●] Creando cuenta...    ║ ← Spinner + text
╚═══════════════════════════╝
```

#### 3. Image Loading
```
Image Placeholder:
┌───────────────────────┐
│                       │
│   [Spinner or Logo]   │ ← Light gray bg with spinner
│                       │
└───────────────────────┘
```

**Loading Spinner Specs:**
- Type: ActivityIndicator (React Native)
- Color: Black (#000000) or Brown (#854836)
- Size: 'small' (20pt) or 'large' (36pt)
- Animation: Rotate (system default)

---

### Error States

#### 1. Image Load Error
```
┌───────────────────────┐
│                       │
│   [X Icon]            │ ← Gray background
│   No disponible       │ ← Error message
│                       │
└───────────────────────┘
```

#### 2. Button Error (Failed Action)
```
╔═══════════════════════════╗
║  ⚠ Error al crear cuenta ║ ← Red text, shake animation
╚═══════════════════════════╝
```

**Shake Animation:**
```typescript
const shakeAnimation = {
  0: { translateX: 0 },
  25: { translateX: -10 },
  75: { translateX: 10 },
  100: { translateX: 0 },
  duration: 400,
  iterations: 2,
};
```

---

### Haptic Feedback Strategy

```typescript
const hapticFeedback = {
  // Light feedback
  lightImpact: {
    events: ['dotTap', 'slideChange', 'inputFocus'],
    type: Haptics.ImpactFeedbackStyle.Light,
  },

  // Medium feedback
  mediumImpact: {
    events: ['buttonPress', 'toggleSwitch'],
    type: Haptics.ImpactFeedbackStyle.Medium,
  },

  // Heavy feedback (rare)
  heavyImpact: {
    events: ['primaryCTA', 'deleteAction'],
    type: Haptics.ImpactFeedbackStyle.Heavy,
  },

  // Selection feedback
  selectionFeedback: {
    events: ['tabSwitch', 'radioSelect'],
    type: Haptics.SelectionFeedbackType,
  },

  // Notification feedback
  notificationFeedback: {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  },
};
```

**Usage Guidelines:**
- Use sparingly (not every interaction)
- Match intensity to action importance
- Respect system settings (can be disabled)
- Test on physical devices (not simulator)

---

## 11. ACCESSIBILITY SPECIFICATIONS

### Screen Reader Support

#### 1. Component Accessibility Labels

```typescript
// Logo Component
<View
  accessibilityRole="header"
  accessibilityLabel="Noticias Pachuca"
>
  <Text>NOTICIAS</Text>
  <Text>PACHUCA</Text>
</View>

// Carousel Slide
<View
  accessibilityRole="text"
  accessibilityLabel={`Diapositiva ${currentIndex + 1} de ${total}. ${slide.title}. ${slide.description}`}
  accessible={true}
>
  {/* Slide content */}
</View>

// Pagination Dots
{dots.map((_, index) => (
  <Pressable
    key={index}
    accessibilityRole="button"
    accessibilityLabel={`Ir a la página ${index + 1}`}
    accessibilityState={{
      selected: index === currentIndex,
    }}
    accessibilityHint="Toca dos veces para ver esta página"
  >
    {/* Dot */}
  </Pressable>
))}

// Buttons
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Crear cuenta"
  accessibilityHint="Toca dos veces para crear una nueva cuenta"
  accessibilityState={{
    disabled: loading,
  }}
>
  <Text>CREAR CUENTA</Text>
</Pressable>
```

---

### Focus Management

#### 1. Initial Focus
```typescript
// On screen mount, announce screen purpose
useEffect(() => {
  if (screenReaderEnabled) {
    announce(
      'Pantalla de bienvenida. Desliza para aprender sobre las funciones de la aplicación.'
    );
  }
}, []);
```

#### 2. Focus Order
```
1. Logo (header)
2. Carousel slide content (text)
3. Pagination dots (navigation)
4. Primary button (action)
5. Secondary button (action)
6. Tertiary button (action)
```

#### 3. Focus Indicators
```typescript
// Focus ring for keyboard/screen reader navigation
const focusStyle = {
  borderColor: BrutalistColors.accentYellow,
  borderWidth: 3,
  borderStyle: 'solid',
  outlineOffset: 2,
};

// Apply to focused element
<Pressable
  style={({ pressed, focused }) => [
    styles.button,
    focused && focusStyle,
  ]}
>
  {/* Button content */}
</Pressable>
```

---

### Touch Target Sizes

**Minimum Sizes (WCAG AAA):**
- Small targets: 44pt x 44pt (minimum)
- Preferred: 48pt x 48pt
- Large targets (primary actions): 56pt height minimum

**Implementation:**
```typescript
const touchTargets = {
  // Buttons
  primaryButton: {
    minHeight: 56,
    minWidth: '100%',
  },

  // Pagination dots
  dot: {
    minHeight: 44,
    minWidth: 44,
    // Actual dot is 12pt, but touch area is 44pt
  },

  // Text links
  textLink: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
};
```

---

### Color Contrast Ratios

**WCAG AAA Compliance (7:1 for normal text, 4.5:1 for large text)**

**Color Combinations:**
```typescript
const contrastRatios = {
  // Primary button: White text on brown
  primaryButton: {
    background: '#854836',
    text: '#FFFFFF',
    ratio: 5.8,    // WCAG AA compliant (large text)
  },

  // Secondary button: Black text on white
  secondaryButton: {
    background: '#FFFFFF',
    text: '#000000',
    ratio: 21,     // WCAG AAA compliant
  },

  // Slide title: Black text on white
  slideTitle: {
    background: '#FFFFFF',
    text: '#000000',
    ratio: 21,     // WCAG AAA compliant
  },

  // Slide description: Dark gray on white
  slideDescription: {
    background: '#FFFFFF',
    text: '#4A4A4A',
    ratio: 8.6,    // WCAG AAA compliant
  },

  // Tertiary link: Dark gray on light gray
  tertiaryLink: {
    background: '#F7F7F7',
    text: '#4A4A4A',
    ratio: 8.2,    // WCAG AAA compliant
  },
};
```

**Note:** All text exceeds minimum contrast requirements.

---

### Reduced Motion Support

**Respecting User Preferences:**
```typescript
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const OnboardingCarousel = () => {
  const prefersReducedMotion = useReducedMotion();

  const animationConfig = prefersReducedMotion
    ? {
        // Instant transitions, no spring
        type: 'timing',
        duration: 0,
      }
    : {
        // Normal spring animations
        type: 'spring',
        tension: 68,
        friction: 12,
      };

  // Disable auto-advance if reduced motion
  const autoAdvanceEnabled = !prefersReducedMotion;

  return (
    // Carousel with adapted animations
  );
};
```

**Custom Hook:**
```typescript
// /hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(
      (reduceMotionEnabled) => {
        setPrefersReducedMotion(reduceMotionEnabled);
      }
    );

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (reduceMotionEnabled) => {
        setPrefersReducedMotion(reduceMotionEnabled);
      }
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return prefersReducedMotion;
}
```

---

### Voice Control Support

**Button Labels:**
```typescript
// Use clear, concise labels for voice commands
const buttonLabels = {
  primary: 'Crear cuenta',     // NOT "Crear cuenta nueva"
  secondary: 'Iniciar sesión',  // NOT "Acceder con mi cuenta"
  tertiary: 'Continuar sin cuenta', // Full phrase is clear
};

// Avoid symbols in voice labels
// ✗ Bad: "➜ Siguiente"
// ✓ Good: "Siguiente"
```

---

### Dynamic Type Support (iOS)

```typescript
import { useWindowDimensions } from 'react-native';
import { moderateScale } from '@/utils/scaling';

// Scale font sizes based on accessibility settings
const scaledFontSize = (size: number): number => {
  const { fontScale } = useWindowDimensions();
  return moderateScale(size, fontScale);
};

// Usage
<Text style={{
  fontSize: scaledFontSize(16),
  lineHeight: scaledFontSize(16) * 1.5,
}}>
  {description}
</Text>
```

**Maximum Scale:**
- Allow up to 2x font scaling
- Adjust line heights proportionally
- Maintain minimum touch targets
- Reflow layout if needed

---

### Accessibility Testing Checklist

- [ ] Screen reader reads all content in logical order
- [ ] All interactive elements have labels
- [ ] Touch targets meet 44pt minimum
- [ ] Color contrast exceeds 4.5:1 (AA) for all text
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works (web)
- [ ] Reduced motion is respected
- [ ] Dynamic type scaling works
- [ ] Voice control labels are clear
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Success actions are confirmed

---

## 12. RESPONSIVE BEHAVIOR

### Device Size Breakpoints

```typescript
// /constants/BrutalistBreakpoints.ts
export const Breakpoints = {
  // Phone sizes
  small: 320,    // iPhone SE, small Android
  medium: 375,   // iPhone 12/13/14 Pro
  large: 414,    // iPhone Plus models

  // Tablet sizes
  tablet: 768,   // iPad Mini, small tablets
  tabletLarge: 1024, // iPad Pro 11", large tablets

  // Orientation
  isPortrait: () => {
    const { width, height } = Dimensions.get('window');
    return height > width;
  },

  isLandscape: () => {
    const { width, height } = Dimensions.get('window');
    return width > height;
  },
} as const;

// Hook to get current breakpoint
export const useBreakpoint = () => {
  const { width } = useWindowDimensions();

  return {
    isSmall: width < Breakpoints.medium,
    isMedium: width >= Breakpoints.medium && width < Breakpoints.large,
    isLarge: width >= Breakpoints.large && width < Breakpoints.tablet,
    isTablet: width >= Breakpoints.tablet,
    width,
  };
};
```

---

### Responsive Layout Strategy

#### Small Phones (320-374px)
```typescript
const smallPhoneLayout = {
  // Logo
  logoSize: 'small',
  logoFontSize: 28,
  logoUnderlineWidth: 48,

  // Carousel
  carouselPadding: 16,
  carouselBorderWidth: 3,
  slideImageAspectRatio: 16 / 9,
  slideTitleSize: 20,
  slideDescriptionSize: 14,

  // Pagination
  dotSize: 10,
  dotGap: 10,

  // Buttons
  buttonHeight: 52,
  buttonFontSize: 14,
  buttonSpacing: 12,

  // Spacing
  screenPadding: 16,
  sectionSpacing: 24,
};
```

#### Medium Phones (375-413px) - DEFAULT
```typescript
const mediumPhoneLayout = {
  // Logo
  logoSize: 'medium',
  logoFontSize: 32,
  logoUnderlineWidth: 52,

  // Carousel
  carouselPadding: 20,
  carouselBorderWidth: 4,
  slideImageAspectRatio: 16 / 9,
  slideTitleSize: 24,
  slideDescriptionSize: 16,

  // Pagination
  dotSize: 12,
  dotGap: 12,

  // Buttons
  buttonHeight: 56,
  buttonFontSize: 16,
  buttonSpacing: 16,

  // Spacing
  screenPadding: 24,
  sectionSpacing: 32,
};
```

#### Large Phones (414-767px)
```typescript
const largePhoneLayout = {
  // Logo
  logoSize: 'large',
  logoFontSize: 40,
  logoUnderlineWidth: 64,

  // Carousel
  carouselPadding: 24,
  carouselBorderWidth: 4,
  slideImageAspectRatio: 16 / 9,
  slideTitleSize: 28,
  slideDescriptionSize: 18,

  // Pagination
  dotSize: 14,
  dotGap: 14,

  // Buttons
  buttonHeight: 60,
  buttonFontSize: 18,
  buttonSpacing: 20,

  // Spacing
  screenPadding: 32,
  sectionSpacing: 40,
};
```

#### Tablets (768px+)
```typescript
const tabletLayout = {
  // Logo
  logoSize: 'large',
  logoFontSize: 48,
  logoUnderlineWidth: 80,

  // Carousel
  carouselMaxWidth: 600, // Constrain width
  carouselPadding: 32,
  carouselBorderWidth: 5,
  slideImageAspectRatio: 16 / 9,
  slideTitleSize: 32,
  slideDescriptionSize: 20,

  // Pagination
  dotSize: 16,
  dotGap: 16,

  // Buttons
  buttonHeight: 64,
  buttonMaxWidth: 400, // Constrain width
  buttonFontSize: 18,
  buttonSpacing: 24,

  // Spacing
  screenPadding: 48,
  sectionSpacing: 64,
};
```

---

### Orientation Handling

#### Portrait (Default)
```
┌───────────────┐
│     Logo      │ ← Top of screen
│               │
│   Carousel    │ ← Large area
│   (Full Ht)   │
│               │
│   Pagination  │
│               │
│    Buttons    │ ← Bottom
└───────────────┘
```

#### Landscape (Adapted)
```
┌─────────────────────────────┐
│ Logo │   Carousel    │Btns  │ ← Side-by-side layout
│      │   (Centered)  │      │
└─────────────────────────────┘
```

**Landscape Layout Strategy:**
```typescript
const landscapeLayout = {
  // Split screen into 3 columns
  columns: {
    logo: '20%',      // Left column
    carousel: '50%',  // Center column
    buttons: '30%',   // Right column
  },

  // Or: Keep vertical but reduce heights
  verticalLayout: {
    logoHeight: '15%',
    carouselHeight: '60%',
    paginationHeight: '10%',
    buttonsHeight: '15%',
  },
};
```

**Recommendation:** Use vertical layout even in landscape (simpler, more consistent).

---

### SafeArea Handling

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OnboardingScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* Screen content */}
    </View>
  );
};
```

**SafeArea Zones:**
- **Top**: Logo area (status bar safe)
- **Bottom**: Buttons area (home indicator safe)
- **Left/Right**: Content padding (notch safe)

---

### Responsive Images

```typescript
// Image source selection based on screen density
const getImageSource = (imageName: string) => {
  const { width } = Dimensions.get('window');
  const pixelDensity = PixelRatio.get();

  if (width < 375 || pixelDensity < 2) {
    return require(`@/assets/onboarding/${imageName}@1x.png`);
  } else if (width < 768 || pixelDensity < 3) {
    return require(`@/assets/onboarding/${imageName}@2x.png`);
  } else {
    return require(`@/assets/onboarding/${imageName}@3x.png`);
  }
};

// Usage
<Image
  source={getImageSource('slide-1')}
  style={{ width: '100%', aspectRatio: 16/9 }}
  resizeMode="cover"
/>
```

**Image Dimensions:**
```
@1x: 375 x 211 px (16:9 ratio)
@2x: 750 x 422 px
@3x: 1125 x 633 px
```

---

### Font Scaling

```typescript
// Responsive font size based on screen width
import { moderateScale } from 'react-native-size-matters';

const responsiveFontSize = (size: number): number => {
  return moderateScale(size, 0.3); // Scale factor 0.3
};

// Usage
<Text style={{
  fontSize: responsiveFontSize(24), // Base 24pt, scales with screen
}}>
  SLIDE TITLE
</Text>
```

---

### Responsive Spacing

```typescript
// Spacing scale that adapts to screen size
const getSpacing = (baseSize: number): number => {
  const { width } = Dimensions.get('window');

  if (width < 375) {
    return baseSize * 0.85; // Small phones: 85% spacing
  } else if (width >= 768) {
    return baseSize * 1.25; // Tablets: 125% spacing
  }
  return baseSize; // Default: 100% spacing
};

// Usage
const styles = StyleSheet.create({
  container: {
    padding: getSpacing(24), // 24pt base
    gap: getSpacing(16),     // 16pt base
  },
});
```

---

## 13. IMPLEMENTATION GUIDE

### Phase 1: Setup & Structure (2-3 hours)

#### 1. Create Constants Files

```bash
# Create directories
mkdir -p /constants/brutalist
mkdir -p /components/onboarding
mkdir -p /components/ui/BrutalistButton
mkdir -p /components/ui/BrutalistCard
mkdir -p /hooks
```

**Files to create:**
```
/constants/brutalist/
  - BrutalistColors.ts
  - BrutalistTypography.ts
  - BrutalistSpacing.ts
  - BrutalistBorders.ts
  - BrutalistBreakpoints.ts
  - index.ts (barrel export)
```

---

#### 2. Install Dependencies

```bash
cd /Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo

# Gesture handling
npm install react-native-gesture-handler react-native-reanimated

# Safe area
npm install react-native-safe-area-context

# Additional utilities
npm install react-native-size-matters
```

---

#### 3. Configure Reanimated

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Add this line (must be last)
    ],
  };
};
```

---

### Phase 2: Build Constants (1-2 hours)

Create all design token files as specified in sections 2-3 above.

**Deliverables:**
- `/constants/brutalist/BrutalistColors.ts`
- `/constants/brutalist/BrutalistTypography.ts`
- `/constants/brutalist/BrutalistSpacing.ts`
- `/constants/brutalist/BrutalistBorders.ts`
- `/constants/brutalist/BrutalistBreakpoints.ts`
- `/constants/brutalist/index.ts`

---

### Phase 3: Build Base Components (4-6 hours)

#### 3.1 BrutalistButton Component

```bash
# Create files
touch /components/ui/BrutalistButton/BrutalistButton.tsx
touch /components/ui/BrutalistButton/BrutalistButton.types.ts
touch /components/ui/BrutalistButton/BrutalistButton.styles.ts
touch /components/ui/BrutalistButton/index.ts
```

**Key features to implement:**
- Three variants (primary, secondary, tertiary)
- Press animations
- Loading state
- Disabled state
- Haptic feedback
- Accessibility labels
- TypeScript types

---

#### 3.2 BrutalistCard Component

```bash
touch /components/ui/BrutalistCard/BrutalistCard.tsx
touch /components/ui/BrutalistCard/BrutalistCard.types.ts
touch /components/ui/BrutalistCard/BrutalistCard.styles.ts
touch /components/ui/BrutalistCard/index.ts
```

**Key features:**
- Thick borders
- Sharp corners
- Configurable padding
- Optional shadow (for elevation)

---

#### 3.3 DiamondAccent Component

```bash
touch /components/ui/DiamondAccent/DiamondAccent.tsx
touch /components/ui/DiamondAccent/DiamondAccent.types.ts
touch /components/ui/DiamondAccent/index.ts
```

**Key features:**
- Rotated square (45°)
- Configurable size, color
- Border styling
- Reusable across app

---

### Phase 4: Build Onboarding Components (6-8 hours)

#### 4.1 Logo Component

```bash
mkdir -p /components/onboarding/Logo
touch /components/onboarding/Logo/Logo.tsx
touch /components/onboarding/Logo/Logo.types.ts
touch /components/onboarding/Logo/Logo.styles.ts
touch /components/onboarding/Logo/index.ts
```

**Implementation checklist:**
- [ ] Stacked text (NOTICIAS / PACHUCA)
- [ ] Color coding (black / brown)
- [ ] Yellow underline accent
- [ ] Responsive sizing (small/medium/large)
- [ ] Accessibility label
- [ ] TypeScript types

---

#### 4.2 Carousel Components

```bash
mkdir -p /components/onboarding/Carousel
touch /components/onboarding/Carousel/OnboardingCarousel.tsx
touch /components/onboarding/Carousel/CarouselSlide.tsx
touch /components/onboarding/Carousel/SlideContent.tsx
touch /components/onboarding/Carousel/ImagePlaceholder.tsx
touch /components/onboarding/Carousel/Carousel.types.ts
touch /components/onboarding/Carousel/Carousel.styles.ts
touch /components/onboarding/Carousel/index.ts
```

**Implementation checklist:**
- [ ] Gesture handler for swipe
- [ ] Animated slide transitions
- [ ] Auto-advance functionality
- [ ] Pause on touch
- [ ] Boundary resistance
- [ ] Accessibility announcements
- [ ] TypeScript types

---

#### 4.3 Pagination Component

```bash
mkdir -p /components/onboarding/Pagination
touch /components/onboarding/Pagination/PaginationDots.tsx
touch /components/onboarding/Pagination/Pagination.types.ts
touch /components/onboarding/Pagination/Pagination.styles.ts
touch /components/onboarding/Pagination/index.ts
```

**Implementation checklist:**
- [ ] Square dots (brutalist style)
- [ ] Active/inactive states
- [ ] Tap to navigate
- [ ] Animated transitions
- [ ] Minimum touch targets (44pt)
- [ ] Accessibility labels
- [ ] TypeScript types

---

#### 4.4 ActionButtons Component

```bash
mkdir -p /components/onboarding/ActionButtons
touch /components/onboarding/ActionButtons/ActionButtons.tsx
touch /components/onboarding/ActionButtons/ActionButtons.types.ts
touch /components/onboarding/ActionButtons/ActionButtons.styles.ts
touch /components/onboarding/ActionButtons/index.ts
```

**Implementation checklist:**
- [ ] Three buttons (primary, secondary, tertiary)
- [ ] Proper spacing/hierarchy
- [ ] Loading states
- [ ] Disabled states
- [ ] Haptic feedback
- [ ] TypeScript types

---

### Phase 5: Build Main Screen (3-4 hours)

#### 5.1 Onboarding Screen

```bash
mkdir -p /app/(onboarding)
touch /app/(onboarding)/onboarding.tsx
touch /app/(onboarding)/_layout.tsx
```

**Implementation checklist:**
- [ ] Compose all components
- [ ] State management (current slide)
- [ ] Navigation logic
- [ ] SafeArea handling
- [ ] Responsive layout
- [ ] Loading states
- [ ] Error handling
- [ ] TypeScript types

---

#### 5.2 Onboarding Data

```bash
touch /constants/onboardingSlides.ts
```

**Content:**
```typescript
export const onboardingSlides = [
  {
    id: '1',
    title: 'MANTENTE INFORMADO',
    description: 'Lee las noticias más relevantes de Pachuca en tiempo real',
    image: require('@/assets/onboarding/slide-1.png'),
  },
  {
    id: '2',
    title: 'ACTUALIZACIONES EN VIVO',
    description: 'Recibe notificaciones instantáneas de las últimas noticias',
    image: require('@/assets/onboarding/slide-2.png'),
  },
  {
    id: '3',
    title: 'ENFOQUE LOCAL',
    description: 'Noticias de tu ciudad, tu estado, tu comunidad',
    image: require('@/assets/onboarding/slide-3.png'),
  },
];
```

---

### Phase 6: Create Assets (2-3 hours)

#### 6.1 Onboarding Images

**Required images:**
```
/assets/onboarding/
  - slide-1.png (@1x, @2x, @3x)
  - slide-2.png (@1x, @2x, @3x)
  - slide-3.png (@1x, @2x, @3x)
```

**Design guidelines:**
- Style: Minimal, geometric, brutalist aesthetic
- Colors: Black, brown, yellow accents only
- Content: Simple illustrations (no photos)
- Format: PNG with transparency
- Dimensions: See responsive images section

**Tool recommendations:**
- Figma (design)
- Illustrator (vector)
- Photoshop (export)

---

#### 6.2 Placeholder Image

Create a brutalist-styled placeholder for loading states:
```
/assets/onboarding/placeholder.png
```

---

### Phase 7: Testing & Polish (3-4 hours)

#### 7.1 Unit Tests

```bash
# Create test files
touch /components/onboarding/Logo/Logo.test.tsx
touch /components/onboarding/Carousel/OnboardingCarousel.test.tsx
touch /components/onboarding/Pagination/PaginationDots.test.tsx
touch /components/ui/BrutalistButton/BrutalistButton.test.tsx
```

**Test coverage:**
- Component rendering
- User interactions
- State changes
- Accessibility
- Edge cases

---

#### 7.2 Accessibility Testing

**Testing checklist:**
- [ ] Enable VoiceOver (iOS) or TalkBack (Android)
- [ ] Navigate entire screen with screen reader
- [ ] Verify all labels are read correctly
- [ ] Test focus order
- [ ] Verify minimum touch targets
- [ ] Test with large text sizes
- [ ] Test with reduced motion enabled
- [ ] Verify color contrast

---

#### 7.3 Device Testing

**Test on:**
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (medium screen)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad Mini (tablet)
- [ ] Android small phone
- [ ] Android large phone
- [ ] Android tablet

**Test orientations:**
- [ ] Portrait
- [ ] Landscape

---

### Phase 8: Integration (2-3 hours)

#### 8.1 Navigation Integration

```typescript
// /app/_layout.tsx
export default function RootLayout() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check AsyncStorage for onboarding completion
    checkOnboardingStatus();
  }, []);

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <MainAppStack />;
}
```

---

#### 8.2 AsyncStorage Integration

```typescript
// /utils/onboarding.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_completed';

export const markOnboardingComplete = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
};

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
};

export const resetOnboarding = async (): Promise<void> => {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
};
```

---

### Phase 9: Performance Optimization (1-2 hours)

#### 9.1 Image Optimization

```bash
# Install optimization tools
npm install --save-dev @expo/image-optimizer
```

**Optimize all images:**
```bash
npx expo-optimize
```

---

#### 9.2 Code Splitting

```typescript
// Lazy load onboarding screen
const OnboardingScreen = lazy(() => import('@/components/onboarding/OnboardingScreen'));
```

---

#### 9.3 Memoization

```typescript
// Memoize expensive components
const MemoizedCarouselSlide = memo(CarouselSlide);
const MemoizedPaginationDots = memo(PaginationDots);
```

---

### Phase 10: Documentation (1-2 hours)

#### 10.1 Component Documentation

Add JSDoc comments to all components:
```typescript
/**
 * BrutalistButton - A button component with brutalist styling
 *
 * @param variant - Button style variant (primary, secondary, tertiary)
 * @param label - Button text label
 * @param onPress - Callback function when button is pressed
 * @param disabled - Whether button is disabled
 * @param loading - Whether button is in loading state
 *
 * @example
 * <BrutalistButton
 *   variant="primary"
 *   label="CREAR CUENTA"
 *   onPress={handleCreateAccount}
 * />
 */
```

---

#### 10.2 Storybook (Optional)

```bash
# Install Storybook for React Native
npx sb init --type react_native
```

Create stories for all components.

---

### Total Implementation Time Estimate

**Phase-by-phase:**
```
Phase 1: Setup & Structure        2-3 hours
Phase 2: Build Constants          1-2 hours
Phase 3: Build Base Components    4-6 hours
Phase 4: Build Onboarding Comps   6-8 hours
Phase 5: Build Main Screen        3-4 hours
Phase 6: Create Assets            2-3 hours
Phase 7: Testing & Polish         3-4 hours
Phase 8: Integration              2-3 hours
Phase 9: Performance Optimization 1-2 hours
Phase 10: Documentation           1-2 hours

TOTAL: 25-37 hours (~4-5 working days)
```

---

## 14. DESIGN RATIONALE

### Why This Brutalist Approach?

#### 1. Brand Consistency
**Problem:** Mobile apps often soften brand aesthetics for perceived "friendliness"
**Solution:** Maintain aggressive brutalist style from web version
**Benefit:** Strong, recognizable brand identity across all platforms

#### 2. Information Hierarchy
**Problem:** Mobile screens have limited space for visual hierarchy
**Solution:** Use thick borders (4px) and bold typography to create clear levels
**Benefit:** Users instantly understand what's important

#### 3. Touch Optimization
**Problem:** Brutalism can feel inaccessible on touch devices
**Solution:** Large touch targets (44pt+), clear interactive states, haptic feedback
**Benefit:** Aggressive aesthetics meet accessibility standards

#### 4. Performance First
**Problem:** Complex designs can slow mobile apps
**Solution:** Flat colors, no gradients/shadows, simple geometric shapes
**Benefit:** Fast rendering, smooth 60fps animations

---

### Why These Component Choices?

#### Logo Design
**Decision:** Two-line stacked text with underline
**Rationale:**
- More vertical space efficient than horizontal
- Brown/black contrast creates visual interest
- Yellow underline ties to brand accent color
- Uppercase creates authority/impact

**Alternative Considered:** Single-line horizontal logo
**Why Rejected:** Takes too much horizontal space, loses impact on small screens

---

#### Carousel vs. Vertical Scroll
**Decision:** Horizontal swipe carousel
**Rationale:**
- Standard onboarding pattern (users expect it)
- Swipe gesture is intuitive
- Dots show progress clearly
- Allows focused attention on one slide

**Alternative Considered:** Vertical scroll with all slides visible
**Why Rejected:** Less focused, no clear progress indicator, harder to parse

---

#### Square Dots vs. Circular
**Decision:** Square pagination dots
**Rationale:**
- Consistent with brutalist aesthetic (no curves)
- More distinctive than standard circles
- Reinforces geometric theme
- Still clearly recognizable as pagination

**Alternative Considered:** Circular dots (standard)
**Why Rejected:** Too conventional, doesn't match brand

---

#### Three-Button Hierarchy
**Decision:** Primary (brown), Secondary (white), Tertiary (link)
**Rationale:**
- Clear visual priority (brown stands out)
- Secondary still prominent but not competing
- Tertiary is accessible but de-emphasized
- Matches typical user priorities (create > login > skip)

**Alternative Considered:** Two equal CTAs
**Why Rejected:** Creates decision paralysis, no clear recommended action

---

#### Image Aspect Ratio (16:9)
**Decision:** 16:9 aspect ratio for slide images
**Rationale:**
- Standard video/screen aspect ratio (familiar)
- Works well on both phones and tablets
- Balances image prominence with text space
- Easy to create/source assets

**Alternative Considered:** Square (1:1) images
**Why Rejected:** Takes too much vertical space, feels cramped

---

#### No Rounded Corners
**Decision:** 0px border radius (sharp corners) everywhere
**Rationale:**
- Core brutalist principle (no softening)
- Creates stronger visual impact
- Differentiates from 99% of mobile apps
- Reinforces bold brand personality

**Alternative Considered:** Slight rounding (4-8px) for "usability"
**Why Rejected:** Dilutes brutalist aesthetic, makes design feel uncertain

---

#### Thick Borders (4px)
**Decision:** 4px borders on major elements
**Rationale:**
- Creates strong visual boundaries
- Maintains web version consistency
- Scales well across screen sizes
- Readable even with motion blur

**Alternative Considered:** Thinner borders (1-2px)
**Why Rejected:** Too subtle, loses brutalist impact, harder to see on high-DPI screens

---

### Typography Decisions

#### All-Caps Headings
**Decision:** UPPERCASE for all headings and buttons
**Rationale:**
- Creates authoritative, newsworthy tone
- Maximizes visual impact in limited space
- Consistent with print newspaper tradition
- Clearly distinguishes headings from body text

**Consideration:** Reduced readability at length
**Mitigation:** Only use for short text (headings, buttons), not body copy

---

#### System Fonts Only
**Decision:** Use system fonts (SF Pro, Roboto) instead of custom fonts
**Rationale:**
- Zero load time (already on device)
- Guaranteed rendering quality
- Supports all weights and languages
- Optimal performance

**Alternative Considered:** Custom brutalist display font
**Why Rejected:** Load time, licensing costs, potential rendering issues

---

#### Wide Letter Spacing
**Decision:** +2pt tracking on buttons, +1pt on headings
**Rationale:**
- Improves readability of all-caps text
- Creates premium, designed feel
- Increases visual weight
- Separates from body text

**Limitation:** Takes more horizontal space
**Mitigation:** Keep button labels short (2-3 words max)

---

### Color Strategy

#### Limited Palette (5 colors)
**Decision:** Black, white, brown, yellow, gray only
**Rationale:**
- Brutalist principle (no unnecessary color)
- High contrast for accessibility
- Consistent with brand guidelines
- Easy to maintain/extend

**What we excluded:** Blues, greens, reds (except error states)
**Why:** Dilutes brand identity, creates visual noise

---

#### Brown as Primary
**Decision:** Use brown (#854836) for primary actions
**Rationale:**
- Unique in sea of blue apps
- Earthy, grounded (local news brand)
- Stands out from black/white base
- High enough contrast with white text

**Concern:** Less "tech-forward" than blue
**Counterpoint:** We're a news app, not a tech startup. Brown conveys trustworthiness.

---

#### Yellow as Accent Only
**Decision:** Limit yellow to small accent elements
**Rationale:**
- High-energy color (use sparingly)
- Creates visual wayfinding
- Draws eye to important elements
- Too much would be overwhelming

**Rule:** Yellow elements should not exceed 5% of screen area

---

### Interaction Patterns

#### Spring Animations
**Decision:** Use spring physics (not easing curves)
**Rationale:**
- Feels natural and responsive
- Matches physical interaction metaphors
- More pleasant than linear/ease-out
- Industry standard (iOS, Material Design)

**Parameters:** Tension 68, Friction 12 (balanced for quick but not jarring)

---

#### Haptic Feedback
**Decision:** Medium haptic on button press, light on slide change
**Rationale:**
- Confirms action without audio
- Improves perceived responsiveness
- Accessibility aid (especially for low vision)
- Expected behavior in modern apps

**Caution:** Respect system settings (can be disabled)

---

#### Auto-Advance (4 seconds)
**Decision:** 4000ms interval between auto-slides
**Rationale:**
- Long enough to read text (avg reading speed: 200 words/min)
- Short enough to maintain engagement
- Standard in industry (most onboarding: 3-5s)
- Pauseable on touch (user control)

**Alternative Considered:** Manual-only (no auto-advance)
**Why Rejected:** Requires 3 swipes, creates friction, users skip onboarding

---

### Accessibility Decisions

#### 44pt Minimum Touch Targets
**Decision:** All interactive elements ≥ 44pt in smallest dimension
**Rationale:**
- WCAG AAA guideline (iOS minimum)
- Accommodates motor impairments
- Reduces mis-taps
- Better UX for all users (not just accessibility)

**Trade-off:** Takes more space
**Mitigation:** Use vertical spacing, avoid horizontal cramming

---

#### Screen Reader First
**Decision:** Design accessibility into components (not retrofitted)
**Rationale:**
- Easier than adding later
- Better quality labels/hints
- Forces clear information hierarchy
- Legal compliance (accessibility laws)

**Effort:** +15% development time
**Benefit:** 100% of users can use app (including 15% with disabilities)

---

#### No Reliance on Color Alone
**Decision:** Use borders, text, and icons in addition to color
**Rationale:**
- WCAG requirement (colorblind users)
- Better for low-vision users
- Works in grayscale mode
- More robust design overall

**Example:** Button hierarchy uses border thickness + background color (not just color)

---

### Performance Trade-offs

#### No Shadows/Gradients
**Decision:** Flat design only (no box-shadow, no gradients)
**Rationale:**
- Shadows require expensive blur operations
- Gradients require more GPU memory
- Brutalist aesthetic doesn't need them
- Faster rendering = smoother animations

**Performance Gain:** ~10-15% faster rendering in complex screens

---

#### Reanimated Over Animated API
**Decision:** Use React Native Reanimated (not Animated)
**Rationale:**
- Runs on UI thread (60fps guaranteed)
- More powerful gesture support
- Industry standard for complex animations
- Better performance on Android

**Trade-off:** Slightly larger bundle size (+100KB)
**Benefit:** Buttery-smooth interactions

---

### Why This Design Will Work

#### 1. Memorable First Impression
- **Goal:** Make users remember the app
- **How:** Bold, unique design stands out from standard Material/iOS patterns
- **Risk:** Some users find it too aggressive
- **Mitigation:** Keep it friendly through clear copy, not softened design

#### 2. Fast Perceived Performance
- **Goal:** App feels instant
- **How:** Flat design renders quickly, animations are smooth
- **Measure:** Time to interactive < 1s, 60fps animations
- **Competitor Benchmark:** Most news apps: 2-3s load time

#### 3. Brand Recognition
- **Goal:** Users recognize app from icon/screenshot alone
- **How:** Consistent brutalist aesthetic across web/mobile
- **Test:** Show screenshot to user; can they identify the brand?
- **Target:** 80% recognition after 1 week of use

#### 4. Accessibility Compliance
- **Goal:** WCAG AA compliance (ideally AAA)
- **How:** Built-in from design phase, not added later
- **Verification:** Automated testing (aXe) + manual screen reader testing
- **Legal:** Meets ADA/AODA requirements

---

### Future Considerations

#### Dark Mode (Future Phase)
**Design Challenge:** Brutalism with dark backgrounds
**Approach:**
- White text on black (#000000) background
- Keep thick black borders (visible against dark gray)
- Brown becomes lighter (#B85C42) for contrast
- Yellow remains same (high contrast with black)

**Not Implemented Now:**
- Adds complexity
- Most news consumption is daytime
- Can add in v2 after user feedback

---

#### Animation Presets (Future Phase)
**Design Challenge:** Maintain consistency as app grows
**Approach:**
- Create animation preset library
- Document all transitions
- Shared constants for timing/easing
- Example: `BrutalistAnimations.slideTransition`

---

#### Component Library (Future Phase)
**Design Challenge:** Reusing brutalist components across features
**Approach:**
- Extract onboarding components to `/components/ui`
- Create Storybook documentation
- Version components independently
- Share with web team (React components)

---

### Key Success Metrics

**After 1 Week:**
- [ ] Onboarding completion rate > 70%
- [ ] Average time on onboarding < 45 seconds
- [ ] User feedback sentiment > 3.5/5 ("unique design")

**After 1 Month:**
- [ ] Accessibility audit passes (0 critical issues)
- [ ] Performance: 60fps animations on all supported devices
- [ ] Zero crashes related to onboarding

**After 3 Months:**
- [ ] Design system adopted for 3+ other features
- [ ] Brand recognition improves (user testing)
- [ ] Design becomes case study (design community)

---

## CONCLUSION

This brutalist onboarding design maintains the aggressive, bold brand identity of the Noticias Pachuca web experience while adapting for mobile constraints. Key principles:

1. **No Compromise on Aesthetics:** Brutalism works on mobile if implemented thoughtfully
2. **Accessibility First:** Bold design doesn't mean excluding users
3. **Performance Matters:** Flat design = fast rendering = smooth UX
4. **Component Reusability:** Build once, use everywhere
5. **User Testing:** Validate bold choices with real users

**Next Steps:**
1. Review this specification with development team
2. Create clickable prototype in Figma (optional)
3. Implement in phases (setup → components → integration)
4. Test on real devices with real users
5. Iterate based on feedback

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Designer:** Jarvis (UI/UX Designer)
**Status:** Ready for Implementation

**Questions?** Review this document or contact design team.

---

**END OF SPECIFICATION**
