# Home Components

Brutalist React Native components for the Noticias Pachuca app header section.

## Components

### 1. HomeHeader

Main header component that combines logo, edition dropdown, and promotional banner.

#### Features
- Logo section with Logo component + EditionDropdown (80px height)
- Optional promotional banner (BrutalistBanner)
- Safe area aware (respects device notches/islands)
- 4px black borders for brutalist style
- Fully responsive and accessible

#### Props

```typescript
interface HomeHeaderProps {
  onEditionPress: () => void;
  currentEdition?: string;
  onBannerCtaPress: () => void;
  bannerTitle?: string;
  bannerCtaText?: string;
  hideBanner?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
}
```

#### Usage

```tsx
import { HomeHeader } from '@/components/home';

// Basic usage
<HomeHeader
  onEditionPress={handleOpenEditionPicker}
  onBannerCtaPress={handleRegister}
/>

// With current edition
<HomeHeader
  onEditionPress={handleOpenEditionPicker}
  currentEdition="PACHUCA"
  onBannerCtaPress={handleRegister}
/>

// Custom banner
<HomeHeader
  onEditionPress={handleOpenEditionPicker}
  onBannerCtaPress={handlePromotion}
  bannerTitle="OFERTA ESPECIAL: 3 MESES GRATIS"
  bannerCtaText="Obtener ahora"
/>

// Without banner
<HomeHeader
  onEditionPress={handleOpenEditionPicker}
  onBannerCtaPress={() => {}}
  hideBanner={true}
/>
```

---

### 2. BrutalistBanner

Reusable promotional banner component with CTA button.

#### Features
- Brown background (#854836) by default
- Yellow CTA button (#FFB22C)
- 4px black borders
- White text on brown background
- Centered layout with responsive padding
- Haptic feedback on CTA press
- WCAG compliant 44pt minimum touch target

#### Props

```typescript
interface BrutalistBannerProps {
  title: string;
  ctaText: string;
  onCtaPress: () => void;
  backgroundColor?: 'default' | 'brown' | 'yellow' | 'black';
  disabled?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
  ctaAccessibilityLabel?: string;
  enableHaptics?: boolean;
}
```

#### Usage

```tsx
import { BrutalistBanner } from '@/components/home';

// Default brown banner
<BrutalistBanner
  title="SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA"
  ctaText="Registrarse"
  onCtaPress={handleRegister}
/>

// Yellow banner
<BrutalistBanner
  title="OFERTA POR TIEMPO LIMITADO"
  ctaText="Ver oferta"
  onCtaPress={handleViewOffer}
  backgroundColor="yellow"
/>

// Disabled state
<BrutalistBanner
  title="PRÓXIMAMENTE"
  ctaText="Suscribirse"
  onCtaPress={() => {}}
  disabled={true}
/>
```

---

### 3. EditionDropdown

Compact dropdown button for edition selection.

#### Features
- Fixed 100px × 40px size
- White background with 4px black border
- Chevron-down icon from Ionicons
- Yellow background on press
- Haptic feedback
- WCAG compliant touch target (44pt height with padding)

#### Props

```typescript
interface EditionDropdownProps {
  onPress: () => void;
  currentEdition?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  enableHaptics?: boolean;
}
```

#### Usage

```tsx
import { EditionDropdown } from '@/components/home';

// Default
<EditionDropdown
  onPress={handleOpenEditionPicker}
/>

// With current edition
<EditionDropdown
  onPress={handleOpenEditionPicker}
  currentEdition="PACHUCA"
/>

// Disabled
<EditionDropdown
  onPress={() => {}}
  currentEdition="NACIONAL"
  disabled={true}
/>
```

---

## Design Specifications

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Brown background | Brown | #854836 |
| Yellow CTA | Yellow | #FFB22C |
| Black borders | Black | #000000 |
| White text | White | #FFFFFF |

### Borders

- All borders: 4px solid black (#000000)
- Sharp corners (border-radius: 0)

### Typography

- Banner title: 14px/16px (phone/tablet), 700 weight, uppercase, 0.5 letter-spacing
- CTA button: 14px/16px (phone/tablet), 700 weight, uppercase, 0.5 letter-spacing
- Edition dropdown: 12px, 700 weight, uppercase, 0.5 letter-spacing

### Spacing

- Banner padding: 20px vertical, 16px horizontal
- Logo section height: 80px
- Logo section padding: 12px vertical, 16px horizontal
- CTA button: 12px vertical, 24px horizontal padding

### Dimensions

- Edition dropdown: 100px × 40px (touch target: 44px height)
- CTA button: min-height 44px (iOS touch target)
- Logo section: 80px height
- Banner: min-height 120px

---

## Accessibility

### WCAG Compliance

- All interactive elements meet 44pt minimum touch target
- Semantic accessibility roles:
  - HomeHeader: `header`
  - BrutalistBanner CTA: `button`
  - EditionDropdown: `button`
- Descriptive accessibility labels and hints
- Support for screen readers
- Keyboard navigation support

### Accessibility Labels

```tsx
// HomeHeader
accessibilityLabel="Encabezado de página principal"

// BrutalistBanner
accessibilityLabel={title} // Banner title
ctaAccessibilityLabel="Abrir registro de usuario"

// EditionDropdown
accessibilityLabel="Edición: PACHUCA"
accessibilityHint="Seleccionar edición de noticias"
```

---

## Performance

### React.memo Optimization

All components are wrapped with `React.memo` to prevent unnecessary re-renders:

```tsx
export const HomeHeader = React.memo<HomeHeaderProps>(({ ... }) => {
  // Component implementation
});
```

### useMemo for Computed Styles

Expensive style calculations are memoized:

```tsx
const bannerStyle = useMemo<ViewStyle>(() => {
  return {
    backgroundColor: BRUTALIST_BANNER_TOKENS.background[backgroundColor],
    // ... other styles
  };
}, [backgroundColor]);
```

### useCallback for Event Handlers

Event handlers are memoized to maintain referential equality:

```tsx
const handleCtaPress = useCallback(() => {
  if (disabled) return;

  if (enableHaptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  onCtaPress();
}, [disabled, enableHaptics, onCtaPress]);
```

---

## TypeScript

### Zero `any` Types

All components use strict TypeScript with ZERO `any` types:

```typescript
// Fully typed props
export interface BrutalistBannerProps {
  title: string;
  ctaText: string;
  onCtaPress: () => void;
  backgroundColor?: BannerBackgroundColor;
  // ...
}

// Typed style objects
const bannerStyle = useMemo<ViewStyle>(() => {
  // ...
}, [backgroundColor]);

// Typed text styles
const titleStyle = useMemo<TextStyle>(() => {
  // ...
}, [isTablet, backgroundColor]);
```

### Type Exports

All types are exported for external use:

```typescript
export type {
  HomeHeaderProps,
  BrutalistBannerProps,
  BannerBackgroundColor,
  EditionDropdownProps,
};
```

---

## Design Tokens

### Separation of Concerns

Design tokens are extracted into separate `.tokens.ts` files:

```typescript
// BrutalistBanner.tokens.ts
export const BRUTALIST_BANNER_TOKENS = {
  background: {
    default: '#854836',
    brown: '#854836',
    yellow: '#FFB22C',
    black: '#000000',
  },
  // ...
} as const;
```

### Token Exports

Tokens are exported for external use:

```tsx
import {
  BRUTALIST_BANNER_TOKENS,
  EDITION_DROPDOWN_DESIGN_TOKENS,
  HOME_HEADER_DESIGN_TOKENS,
} from '@/components/home';

// Use tokens for custom styling
const customBannerStyle = {
  backgroundColor: BRUTALIST_BANNER_TOKENS.background.yellow,
};
```

---

## Integration Example

Complete example of integrating HomeHeader into a home screen:

```tsx
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HomeHeader } from '@/components/home';
import { ThemedText } from '@/components';

export const HomeScreen = () => {
  const [currentEdition, setCurrentEdition] = useState<string | undefined>();
  const [showBanner, setShowBanner] = useState(true);

  const handleEditionPress = () => {
    // Open edition picker modal/action sheet
    Alert.alert(
      'Seleccionar Edición',
      'Elige la edición que deseas ver',
      [
        { text: 'Todas', onPress: () => setCurrentEdition(undefined) },
        { text: 'Pachuca', onPress: () => setCurrentEdition('PACHUCA') },
        { text: 'Nacional', onPress: () => setCurrentEdition('NACIONAL') },
        { text: 'Hidalgo', onPress: () => setCurrentEdition('HIDALGO') },
      ]
    );
  };

  const handleRegister = () => {
    // Navigate to registration screen
    navigation.navigate('Register');
    setShowBanner(false); // Hide banner after registration starts
  };

  return (
    <View className="flex-1 bg-white">
      <HomeHeader
        onEditionPress={handleEditionPress}
        currentEdition={currentEdition}
        onBannerCtaPress={handleRegister}
        hideBanner={!showBanner}
      />

      <ScrollView className="flex-1">
        {/* Your news content here */}
      </ScrollView>
    </View>
  );
};
```

---

## File Structure

```
/components/home/
├── BrutalistBanner.tsx         # Banner component
├── BrutalistBanner.tokens.ts   # Banner design tokens
├── EditionDropdown.tsx         # Dropdown component
├── HomeHeader.tsx              # Main header component
├── HomeHeader.example.tsx      # Usage examples
├── index.ts                    # Barrel exports
└── README.md                   # This file
```

---

## Responsive Design

### Tablet Support

Components automatically scale for tablets (768px+ width):

- Typography scales from phone to tablet sizes
- Maintains brutalist aesthetic across all breakpoints
- Uses `useWindowDimensions` for responsive scaling

### Safe Area Support

HomeHeader respects device safe areas:

```tsx
const insets = useSafeAreaInsets();

const logoSectionStyle = useMemo<ViewStyle>(() => {
  return {
    paddingTop: insets.top + HOME_HEADER_TOKENS.logoSectionPaddingVertical,
    // ...
  };
}, [insets.top]);
```

---

## Testing

### Test IDs

All components include test IDs for automated testing:

```tsx
testID="home-header"
testID="home-header-logo-section"
testID="home-header-banner"
testID="brutalist-banner"
testID="brutalist-banner-cta"
testID="edition-dropdown"
```

### Example Test

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { HomeHeader } from '@/components/home';

test('calls onEditionPress when edition dropdown is pressed', () => {
  const handleEditionPress = jest.fn();
  const handleBannerCta = jest.fn();

  const { getByTestId } = render(
    <HomeHeader
      onEditionPress={handleEditionPress}
      onBannerCtaPress={handleBannerCta}
    />
  );

  fireEvent.press(getByTestId('edition-dropdown'));
  expect(handleEditionPress).toHaveBeenCalledTimes(1);
});
```

---

## Browser Compatibility

These components are built for React Native and are compatible with:

- iOS 13+
- Android 5.0+ (API level 21+)
- Expo SDK 50+

---

## Dependencies

- `react-native`: Core React Native
- `expo-haptics`: Haptic feedback
- `react-native-safe-area-context`: Safe area support
- `@expo/vector-icons`: Ionicons for chevron icon

---

## License

Proprietary - Noticias Pachuca
