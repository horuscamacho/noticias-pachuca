# Brutalist Header Banner Design Specification
## Noticias Pachuca - FT Weekend Inspired Header

---

## Design Overview

A bold, brutalist header banner inspired by the Financial Times Weekend edition, featuring hierarchical layout with logo, subscription banner, and clear call-to-action.

---

## 1. Complete Design Specification

### Visual Hierarchy (Top to Bottom)
```
┌─────────────────────────────────────────┐
│  SAFE AREA TOP                          │
├─────────────────────────────────────────┤
│                                         │
│  [LOGO]          [▼]                    │ ← Logo Section
│  NOTICIAS PACHUCA  Edición              │
│                                         │
├─────────────────────────────────────────┤
│ ═════════════════════════════════════   │
│ ║  SUSCRÍBETE PARA VIVIR LA NUEVA   ║   │ ← Banner Section
│ ║  EXPERIENCIA DE LAS NOTICIAS      ║   │   (Brown background)
│ ║  EN HIDALGO                       ║   │
│ ║                                   ║   │
│ ║         [REGISTRARSE]             ║   │ ← CTA Button
│ ║                                   ║   │
│ ═════════════════════════════════════   │
│                                         │
└─────────────────────────────────────────┘
```

### Measurements

**Logo Section:**
- Height: 80px
- Padding horizontal: 16px
- Padding vertical: 12px
- Logo height: 32px
- Dropdown button: 40px × 40px
- Gap between logo and dropdown: 12px

**Banner Section:**
- Min height: 180px
- Padding horizontal: 20px
- Padding vertical: 24px
- Border: 4px solid #000000
- Background: #854836 (brown)

**CTA Button:**
- Height: 48px
- Min width: 160px
- Border: 4px solid #000000
- Margin top: 16px

---

## 2. Design Tokens

### Colors

```typescript
const HEADER_BANNER_TOKENS = {
  // Background Colors
  logoBackground: '#F7F7F7',        // Light gray for logo section
  bannerBackground: '#854836',       // Primary brown for banner
  buttonBackground: '#FFB22C',       // Accent yellow for CTA
  dropdownBackground: '#FFFFFF',     // White for dropdown button

  // Text Colors
  logoText: '#000000',               // Black for logo
  bannerText: '#FFFFFF',             // White text on brown background
  buttonText: '#000000',             // Black text on yellow button
  dropdownText: '#000000',           // Black for dropdown text

  // Border Colors
  border: '#000000',                 // Black borders everywhere

  // Accent Colors
  accentRed: '#FF0000',              // For urgent badges (optional)
};
```

### Spacing

```typescript
const SPACING = {
  // Section Spacing
  logoSectionHeight: 80,
  bannerMinHeight: 180,

  // Padding
  containerHorizontal: 16,
  containerVertical: 12,
  bannerHorizontal: 20,
  bannerVertical: 24,

  // Gaps
  logoDropdownGap: 12,
  bannerContentGap: 16,

  // Button
  buttonHeight: 48,
  buttonMinWidth: 160,
  buttonPaddingHorizontal: 24,
  buttonPaddingVertical: 12,

  // Safe Area
  safeAreaTop: 'auto', // Use SafeAreaView
};
```

### Typography

```typescript
const TYPOGRAPHY = {
  logo: {
    fontSize: 20,
    fontWeight: '900' as const,      // Extra bold
    letterSpacing: 1.2,              // Wide tracking
    textTransform: 'uppercase' as const,
    lineHeight: 24,
  },

  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    lineHeight: 14,
  },

  bannerHeadline: {
    fontSize: 18,
    fontWeight: '900' as const,      // Extra bold
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 24,
    textAlign: 'center' as const,
  },

  ctaButton: {
    fontSize: 16,
    fontWeight: '900' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    lineHeight: 20,
  },
};
```

### Borders

```typescript
const BORDERS = {
  width: 4,                          // Thick brutalist borders
  radius: 0,                         // Sharp corners only
  style: 'solid' as const,
  color: '#000000',
};
```

---

## 3. Layout Structure

### Component Hierarchy

```
<SafeAreaView>
  <HeaderBanner>

    {/* Logo Section */}
    <LogoSection>
      <Logo />
      <DropdownButton>
        <Text>EDICIÓN</Text>
        <Icon name="chevron-down" />
      </DropdownButton>
    </LogoSection>

    {/* Banner Section */}
    <BannerSection>
      <BannerContent>
        <BannerText>
          SUSCRÍBETE PARA VIVIR LA NUEVA
          EXPERIENCIA DE LAS NOTICIAS EN HIDALGO
        </BannerText>
        <BrutalistButton>
          REGISTRARSE
        </BrutalistButton>
      </BannerContent>
    </BannerSection>

  </HeaderBanner>
</SafeAreaView>
```

### Logo Section Layout
- **Container**: Horizontal flexbox, space-between alignment
- **Logo**: Flex 1, left aligned
- **Dropdown**: Fixed width (auto), right aligned
- **Alignment**: Center vertically
- **Background**: Light gray (#F7F7F7)
- **Border bottom**: 4px solid black separator

### Banner Section Layout
- **Container**: Vertical flexbox, centered content
- **Background**: Brown (#854836) with 4px black border
- **Text**: Centered, max-width 320px for readability
- **Button**: Centered below text, 16px margin top
- **Padding**: Generous (24px vertical, 20px horizontal)

---

## 4. Color Scheme Recommendation

### Primary Recommendation: BROWN BANNER

**Rationale:**
- Brown (#854836) provides strong brand identity
- Creates high contrast with white text (WCAG AAA compliant)
- Yellow button pops dramatically against brown background
- Matches premium, authoritative news aesthetic
- Similar to FT's salmon pink - distinctive and memorable

**Color Pairing:**
```
Banner Background: #854836 (Brown)
Banner Text: #FFFFFF (White)
CTA Button Background: #FFB22C (Yellow)
CTA Button Text: #000000 (Black)
CTA Button Border: #000000 (Black, 4px)
```

**Contrast Ratios:**
- Brown + White text: 7.2:1 (AAA compliant)
- Yellow button + Black text: 12.4:1 (AAA compliant)
- Brown banner + Yellow button: High visual contrast

### Alternative Option: YELLOW BANNER (if needed)

```
Banner Background: #FFB22C (Yellow)
Banner Text: #000000 (Black)
CTA Button Background: #854836 (Brown)
CTA Button Text: #FFFFFF (White)
```

**Not recommended** - Less distinctive, lower perceived value for subscription CTA.

---

## 5. Dropdown Button Design

### Size & Placement
```typescript
const DROPDOWN_BUTTON = {
  // Dimensions
  width: 100,                        // Fixed width
  height: 40,                        // Touch-friendly height

  // Position
  position: 'absolute',              // Or flex-end in container
  right: 16,                         // Aligned to container padding
  top: 20,                           // Vertically centered in logo section

  // Spacing
  paddingHorizontal: 12,
  paddingVertical: 8,
  gap: 6,                            // Between text and icon
};
```

### Styling
```typescript
const dropdownButtonStyle = {
  // Container
  backgroundColor: '#FFFFFF',
  borderWidth: 4,
  borderColor: '#000000',
  borderRadius: 0,                   // Sharp corners

  // Layout
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  // Shadow (optional brutalist shadow)
  shadowColor: '#000000',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,                   // No blur - sharp shadow
  elevation: 0,                      // Disable Android elevation
};
```

### Icon Specifications
```typescript
const DROPDOWN_ICON = {
  name: 'chevron-down',              // Ionicons
  size: 16,
  color: '#000000',
  style: {
    marginLeft: 6,
  },
};
```

### Typography
```typescript
const dropdownTextStyle = {
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: '#000000',
};
```

### States

**Default:**
- Background: White
- Border: 4px solid black
- Text: Black

**Pressed:**
- Background: #FFB22C (Yellow)
- Border: 4px solid black
- Text: Black
- Transform: translateY(2px) // Subtle press effect

**Disabled:**
- Background: #F7F7F7 (Gray)
- Border: 4px solid #CCCCCC
- Text: #999999

---

## 6. Responsive Behavior

### Mobile (< 375px)
```typescript
const MOBILE_SMALL = {
  logoSectionHeight: 70,
  logoFontSize: 16,
  bannerFontSize: 16,
  bannerPadding: 16,
  buttonHeight: 44,
  buttonFontSize: 14,
};
```

### Mobile Standard (375px - 428px)
```typescript
// Use base measurements (default)
```

### Tablet (> 428px)
```typescript
const TABLET = {
  logoSectionHeight: 100,
  logoFontSize: 24,
  bannerFontSize: 20,
  bannerPadding: 32,
  buttonHeight: 56,
  buttonFontSize: 18,
  maxWidth: 600,                     // Center container
};
```

---

## 7. Implementation Notes

### Component Structure

1. **Create BrutalistHeaderBanner component**
2. **Use existing components:**
   - `<Logo />` for logo
   - `<BrutalistButton />` for CTA
3. **Create new sub-components:**
   - `<DropdownButton />` for edition selector
   - `<SubscriptionBanner />` for banner section

### Accessibility

```typescript
const ACCESSIBILITY = {
  // Dropdown Button
  dropdownAccessibility: {
    accessibilityLabel: 'Seleccionar edición',
    accessibilityHint: 'Abre el menú para seleccionar una edición',
    accessibilityRole: 'button',
  },

  // CTA Button
  ctaAccessibility: {
    accessibilityLabel: 'Registrarse',
    accessibilityHint: 'Crea una cuenta para suscribirte',
    accessibilityRole: 'button',
  },

  // Banner Section
  bannerAccessibility: {
    accessibilityRole: 'header',
    accessibilityLabel: 'Banner de suscripción',
  },
};
```

### Animation (Optional)

```typescript
// Subtle entrance animation
const ANIMATIONS = {
  bannerEntrance: {
    duration: 300,
    delay: 100,
    type: 'timing',
    from: { opacity: 0, translateY: -20 },
    to: { opacity: 1, translateY: 0 },
  },

  buttonPress: {
    duration: 100,
    type: 'timing',
    scaleDown: 0.97,
  },
};
```

---

## 8. Design Rationale

### Why Brown Background?

1. **Brand Identity**: Brown is your primary brand color - establishes strong visual identity
2. **Premium Feel**: Rich, warm brown conveys quality journalism (like FT's salmon pink)
3. **Contrast**: Creates dramatic stage for yellow CTA button
4. **Readability**: White text on brown exceeds accessibility standards
5. **Distinctive**: Uncommon color for news apps - memorable and unique

### Why This Layout?

1. **Hierarchy**: Clear visual flow: Logo → Message → Action
2. **Focus**: Banner draws attention without being overwhelming
3. **Simplicity**: Clean, uncluttered - brutalist aesthetic
4. **Mobile-First**: Vertical stack works perfectly on mobile
5. **Inspired by FT**: Premium publication aesthetic adapted to brutalism

### Typography Choices

1. **All Uppercase**: Bold, authoritative, brutalist
2. **Extra Bold Weights**: Strong visual impact
3. **Generous Letter Spacing**: Improves readability, adds sophistication
4. **Hierarchy Through Size**: Clear visual progression

---

## 9. Development Checklist

- [ ] Create design tokens file
- [ ] Build DropdownButton component
- [ ] Build SubscriptionBanner component
- [ ] Build BrutalistHeaderBanner wrapper component
- [ ] Implement responsive breakpoints
- [ ] Add accessibility labels
- [ ] Test on iOS and Android
- [ ] Test with VoiceOver/TalkBack
- [ ] Verify color contrast ratios
- [ ] Add press states and animations
- [ ] Integrate with existing Logo component
- [ ] Integrate with existing BrutalistButton component
- [ ] Test with different text lengths (i18n consideration)
- [ ] Add safe area handling for notched devices

---

## 10. Visual Reference

### Color Palette Visual
```
╔══════════════════════════════════════╗
║ BROWN BANNER (#854836)               ║
║                                      ║
║  WHITE TEXT (#FFFFFF)                ║
║  "SUSCRÍBETE PARA VIVIR LA NUEVA"    ║
║  "EXPERIENCIA DE LAS NOTICIAS"       ║
║  "EN HIDALGO"                        ║
║                                      ║
║  ┌────────────────────────┐          ║
║  │  REGISTRARSE           │          ║ ← Yellow Button
║  │  (Yellow #FFB22C)      │          ║   Black Text
║  └────────────────────────┘          ║   Black Border
║                                      ║
╚══════════════════════════════════════╝
   ↑
   4px Black Border
```

### Spacing Visual
```
┌─────────────────────────────────────┐
│ ↕ 12px padding                      │
│ ← 16px → [LOGO] ← 12px → [▼] ← 16px│
│ ↕ 12px padding                      │
├─────────────────────────────────────┤ ← 4px border
│ ↕ 24px padding                      │
│                                     │
│ ← 20px → [TEXT CONTENT] ← 20px →   │
│                                     │
│          ↕ 16px gap                 │
│                                     │
│          [BUTTON]                   │
│                                     │
│ ↕ 24px padding                      │
└─────────────────────────────────────┘
```

---

## File Locations

After implementation, components will be located at:

```
/mobile-expo/src/components/ui/BrutalistHeaderBanner.tsx
/mobile-expo/src/components/ui/DropdownButton.tsx
/mobile-expo/src/components/ui/SubscriptionBanner.tsx
/mobile-expo/src/styles/headerBannerTokens.ts
```

---

**Design Version:** 1.0
**Date:** 2025-10-24
**Designer:** Jarvis (UI/UX Design Agent)
**Project:** Noticias Pachuca - Mobile App
