# Carousel Design Specification

Visual design specification for brutalist carousel components.

## Design Philosophy

**Brutalism**: Raw, functional design with emphasis on structure over decoration.

### Core Principles
1. **Sharp Edges**: No rounded corners (borderRadius: 0)
2. **Bold Borders**: Thick black borders (2-4px)
3. **High Contrast**: Black/White/Gray color palette
4. **Typography First**: Strong, uppercase headlines
5. **Functional Layout**: Grid-based, no decorative elements

## Component Specifications

### 1. PaginationDots

#### Visual States

**Inactive Dot**:
```
┌─────┐
│     │  8px × 8px
│     │  #F7F7F7 (light gray background)
│     │  2px solid black border
└─────┘  borderRadius: 0
```

**Active Dot**:
```
┌─────────────────────────────┐
│                             │  32px × 8px
│                             │  #FFFFFF (white background)
│                             │  2px solid black border
└─────────────────────────────┘  borderRadius: 0
```

**Layout**:
```
┌─────┐  8px  ┌─────────────────────────────┐  8px  ┌─────┐
│     │ <---> │                             │ <---> │     │
└─────┘       └─────────────────────────────┘       └─────┘
Inactive         Active (32px)                     Inactive
```

#### Animation
- **Type**: Spring animation
- **Duration**: ~300ms
- **Property**: Width (8px ↔ 32px)
- **Easing**: Spring (friction: 7, tension: 40)

---

### 2. CarouselSlide

#### Layout Structure
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │ 16px margin
│  │                                 │   │
│  │      IMAGE PLACEHOLDER          │   │ 400px height
│  │      #F7F7F7 background         │   │
│  │      4px solid black border     │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  BREAKING NEWS                  │   │ 24px padding
│  │  (hero variant - 32px)          │   │ Hero text
│  └─────────────────────────────────┘   │
│                                         │ 16px gap
│  ┌─────────────────────────────────┐   │
│  │  Follow stories as they         │   │ 24px padding
│  │  unfold with real-time          │   │ Body text
│  │  updates from trusted...        │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
     375px width (full screen)
```

#### Typography
- **Title**: Hero variant (32px phone, 40px tablet)
- **Description**: Body variant (16px phone, 18px tablet)
- **Spacing**: 16px vertical gap between elements

#### Colors
- **Image background**: #F7F7F7 (light gray)
- **Border**: #000000 (black, 4px)
- **Text**: Themed (black for titles, dark gray for body)

---

### 3. Complete Onboarding Screen Layout

```
┌─────────────────────────────────────────┐
│  [StatusBar]                            │
│                                         │
│                          ┌────────┐     │ 16px padding
│                          │  SKIP  │     │ Tertiary button
│                          └────────┘     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │      CAROUSEL CONTENT           │   │ Flex: 1
│  │      (scrollable area)          │   │ Centered
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     •  ▬▬▬▬▬▬  •               │   │ Pagination dots
│  │         (centered)              │   │ Centered
│  └─────────────────────────────────┘   │
│                                         │ 32px gap
│  ┌─────────────────────────────────┐   │
│  │       GET STARTED               │   │ Primary button
│  │       (full width)              │   │ Full width
│  └─────────────────────────────────┘   │
│                                         │ 32px padding bottom
└─────────────────────────────────────────┘
```

---

## Responsive Breakpoints

### Phone (< 768px)
- Hero text: 32px
- Body text: 16px
- Image height: 400px
- Padding: 24px horizontal

### Tablet (≥ 768px)
- Hero text: 40px
- Body text: 18px
- Image height: 400px (same)
- Padding: 32px horizontal

---

## Color Palette

```
PRIMARY COLORS
┌─────────────┬─────────────┬─────────────┐
│   #000000   │   #FFFFFF   │   #F7F7F7   │
│   Black     │   White     │  Light Gray │
│   Borders   │  Active Dot │  Inactive   │
└─────────────┴─────────────┴─────────────┘

BRAND COLORS
┌─────────────┬─────────────┐
│   #854836   │   #FF0000   │
│   Brown     │    Red      │
│   Primary   │   Pressed   │
└─────────────┴─────────────┘

TEXT COLORS
┌─────────────┬─────────────┬─────────────┐
│   #000000   │   #1F1F1F   │   #6B7280   │
│   Headings  │    Body     │   Caption   │
└─────────────┴─────────────┴─────────────┘
```

---

## Spacing System

### Base Unit: 8px

```
4px   - Tight spacing (borders)
8px   - Small gap (between dots)
16px  - Medium gap (between elements)
24px  - Large padding (content)
32px  - XL gap (between sections)
```

### Margin & Padding Guide
```
┌──────────────────────────────┐
│ 24px padding                 │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │  16px margin           │  │
│  │   ┌──────────────────┐ │  │
│  │   │                  │ │  │
│  │   │   CONTENT        │ │  │
│  │   │   (image/text)   │ │  │
│  │   │                  │ │  │
│  │   └──────────────────┘ │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Animation Specifications

### Dot Width Animation
```typescript
{
  type: 'spring',
  friction: 7,
  tension: 40,
  useNativeDriver: false, // Width can't use native driver
  duration: ~300ms
}
```

### Scroll Behavior
```typescript
{
  pagingEnabled: true,
  decelerationRate: 'fast',
  scrollEventThrottle: 16, // ~60fps
  snapToInterval: windowWidth
}
```

### Button Press Animation
```typescript
{
  transform: [{ scale: 0.98 }],
  duration: 100ms,
  hapticFeedback: 'light'
}
```

---

## Touch Targets

### Minimum Sizes (WCAG Compliance)
```
Button minimum: 44pt × 44pt (iOS)
Button minimum: 48dp × 48dp (Android)

Implemented: 44px minimum height
```

### Interactive Areas
```
Skip Button:    Minimum 44px height
Next/CTA:       Minimum 44px height
Pagination:     Visual only (non-interactive)
Carousel:       Full swipe area
```

---

## Accessibility Features

### Screen Reader Support
```
PaginationDots:
"Page 2 of 3"

CarouselSlide:
"Slide 2 of 3: Breaking news. Follow stories as they unfold with real-time updates."

OnboardingCarousel:
"Onboarding carousel with 3 slides"
```

### Keyboard Navigation
- ✅ ScrollView supports standard scroll gestures
- ✅ Buttons support tab navigation
- ✅ Enter/Space activates buttons

### Visual Considerations
- ✅ High contrast (4.5:1 minimum)
- ✅ Large touch targets (44pt+)
- ✅ Clear visual hierarchy
- ✅ No color-only indicators

---

## State Visualization

### PaginationDots States
```
Initial (Index 0):
▬▬▬▬▬▬  •  •

After Swipe (Index 1):
•  ▬▬▬▬▬▬  •

Final (Index 2):
•  •  ▬▬▬▬▬▬
```

### Carousel States
```
State 1: Initial Load
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Slide 1   │  │   Slide 2   │  │   Slide 3   │
│   VISIBLE   │  │   OFFSCREEN │  │   OFFSCREEN │
└─────────────┘  └─────────────┘  └─────────────┘

State 2: After First Swipe
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Slide 1   │  │   Slide 2   │  │   Slide 3   │
│   OFFSCREEN │  │   VISIBLE   │  │   OFFSCREEN │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Platform-Specific Considerations

### iOS
- Spring animations feel native
- Scroll bouncing enabled
- StatusBar: dark-content
- SafeAreaView for notch support

### Android
- Material Design touch ripples (disabled for brutalist style)
- Hardware back button (handled by navigation)
- StatusBar: translucent with dark icons
- Edge-to-edge layout

---

## Design Resources

### Figma Variables
```javascript
// Copy-paste into Figma
const carouselTokens = {
  colors: {
    border: '#000000',
    background: '#FFFFFF',
    placeholder: '#F7F7F7',
    activeDot: '#FFFFFF',
    inactiveDot: '#F7F7F7',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borders: {
    image: 4,
    dot: 2,
    radius: 0,
  },
};
```

### Design Checklist
- [ ] All borders are sharp (borderRadius: 0)
- [ ] Border widths match spec (2px or 4px)
- [ ] Colors use palette (#000, #FFF, #F7F7F7)
- [ ] Typography uses hero/body variants
- [ ] Spacing uses 8px grid system
- [ ] Touch targets meet 44pt minimum
- [ ] High contrast maintained (4.5:1+)
- [ ] Animations use spring physics

---

## Export for Designers

### Sketch Symbols
```
Carousel/Slide/Default
Carousel/Slide/With Image
Carousel/Pagination/3 Dots
Carousel/Pagination/5 Dots
Carousel/Button/Skip
Carousel/Button/Next
Carousel/Button/Get Started
```

### Component States
```
PaginationDot/Inactive
PaginationDot/Active
PaginationDot/Animating

CarouselSlide/Default
CarouselSlide/First
CarouselSlide/Last

Button/Skip/Default
Button/Skip/Pressed
Button/Next/Default
Button/Next/Pressed
```

---

## Version History

- **v1.0.0**: Initial brutalist carousel implementation
  - Square pagination dots
  - Sharp-cornered slides
  - Spring animations
  - Full accessibility support
  - TypeScript types
  - Comprehensive tests

---

## Contact

For design questions or feedback:
- Review design tokens in `PaginationDots.tsx`
- Review layout in `CarouselSlide.tsx`
- Check responsive breakpoints in `ThemedText.tsx`
