# Home Components - Quick Reference

Fast reference guide for using home header components.

## Import

```tsx
import { HomeHeader, BrutalistBanner, EditionDropdown } from '@/components/home';
```

## HomeHeader

Complete header with logo, dropdown, and banner.

```tsx
<HomeHeader
  onEditionPress={() => {}}      // Required
  onBannerCtaPress={() => {}}    // Required
  currentEdition="PACHUCA"       // Optional
  hideBanner={false}             // Optional
/>
```

## BrutalistBanner

Promotional banner with CTA button.

```tsx
<BrutalistBanner
  title="YOUR TITLE HERE"        // Required
  ctaText="CTA TEXT"             // Required
  onCtaPress={() => {}}          // Required
  backgroundColor="default"      // Optional: default|brown|yellow|black
  disabled={false}               // Optional
/>
```

## EditionDropdown

Dropdown button for edition selection.

```tsx
<EditionDropdown
  onPress={() => {}}             // Required
  currentEdition="EDICIÓN"       // Optional
  disabled={false}               // Optional
/>
```

## Design Tokens

```tsx
import {
  BRUTALIST_BANNER_TOKENS,
  EDITION_DROPDOWN_DESIGN_TOKENS,
  HOME_HEADER_DESIGN_TOKENS,
} from '@/components/home';

// Access token values
const brownColor = BRUTALIST_BANNER_TOKENS.background.brown;  // '#854836'
const yellowColor = BRUTALIST_BANNER_TOKENS.ctaButton.background;  // '#FFB22C'
```

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Brown | #854836 | Banner background, logo "PACHUCA" |
| Yellow | #FFB22C | CTA button, press states |
| Black | #000000 | Borders, text |
| White | #FFFFFF | Text on brown, dropdown background |

## Props Cheatsheet

### HomeHeader Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| onEditionPress | () => void | Yes | - |
| onBannerCtaPress | () => void | Yes | - |
| currentEdition | string | No | undefined |
| bannerTitle | string | No | Default title |
| bannerCtaText | string | No | "Registrarse" |
| hideBanner | boolean | No | false |

### BrutalistBanner Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| title | string | Yes | - |
| ctaText | string | Yes | - |
| onCtaPress | () => void | Yes | - |
| backgroundColor | 'default' \| 'brown' \| 'yellow' \| 'black' | No | 'default' |
| disabled | boolean | No | false |

### EditionDropdown Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| onPress | () => void | Yes | - |
| currentEdition | string | No | "EDICIÓN" |
| disabled | boolean | No | false |

## Common Patterns

### Edition Picker Flow

```tsx
const [edition, setEdition] = useState('EDICIÓN');

const handleEditionPress = () => {
  Alert.alert('Edición', 'Seleccionar', [
    { text: 'Pachuca', onPress: () => setEdition('PACHUCA') },
    { text: 'Nacional', onPress: () => setEdition('NACIONAL') },
  ]);
};

<HomeHeader
  onEditionPress={handleEditionPress}
  currentEdition={edition}
  onBannerCtaPress={handleRegister}
/>
```

### Conditional Banner

```tsx
const [showBanner, setShowBanner] = useState(true);

<HomeHeader
  onEditionPress={handleEdition}
  onBannerCtaPress={() => setShowBanner(false)}
  hideBanner={!showBanner}
/>
```

### Custom Banner Content

```tsx
<HomeHeader
  onEditionPress={handleEdition}
  onBannerCtaPress={handlePromo}
  bannerTitle="OFERTA ESPECIAL"
  bannerCtaText="Ver más"
/>
```

## Accessibility

All components support:
- Screen readers (VoiceOver/TalkBack)
- Keyboard navigation
- 44pt minimum touch targets
- Semantic ARIA roles

```tsx
<HomeHeader
  accessibilityLabel="Encabezado principal"
/>

<BrutalistBanner
  accessibilityLabel={title}
  ctaAccessibilityLabel="Abrir registro"
/>

<EditionDropdown
  accessibilityLabel="Edición actual: PACHUCA"
  accessibilityHint="Seleccionar edición"
/>
```

## Testing

```tsx
const { getByTestId } = render(<HomeHeader ... />);

fireEvent.press(getByTestId('home-header'));
fireEvent.press(getByTestId('edition-dropdown'));
fireEvent.press(getByTestId('brutalist-banner-cta'));
```

## File Paths

```
/components/home/
├── BrutalistBanner.tsx
├── BrutalistBanner.tokens.ts
├── EditionDropdown.tsx
├── HomeHeader.tsx
├── HomeHeader.example.tsx
├── index.ts
├── README.md
└── QUICK_REFERENCE.md
```

## Dependencies

- `react-native` - Core
- `expo-haptics` - Haptic feedback
- `react-native-safe-area-context` - Safe areas
- `@expo/vector-icons` - Icons
