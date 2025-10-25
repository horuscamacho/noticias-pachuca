# Article Components

This directory contains article-related components for the Noticias Pachuca mobile app.

## Components

### ArticleCollapsibleHeader

A brutalist-design collapsible header that animates based on scroll position.

#### Features

- **Animated Visibility**: Smoothly fades in/out based on scroll position using Reanimated shared values
- **Brutalist Design**: Bold borders, uppercase text, and sharp corners matching app design system
- **Logo & Info**: Displays app logo with current date and weather information
- **Back Navigation**: Full-width button to return to home screen
- **Safe Area Support**: Automatically handles device safe areas (notches, status bar)
- **Performance Optimized**: Native-thread animations at 60fps
- **Fully Accessible**: WCAG compliant with proper ARIA labels and keyboard navigation

#### Props

```typescript
interface ArticleCollapsibleHeaderProps {
  onBackPress: () => void;                    // Back button callback
  animatedOpacity: Animated.SharedValue<number>; // Opacity control (0-1)
  testID?: string;                            // Test identifier
}
```

#### Usage

```tsx
import { useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { ArticleCollapsibleHeader } from '@/components/article';

// In your component
const scrollY = useSharedValue(0);

const headerOpacity = useDerivedValue(() => {
  // Show header when scrolled past 100px
  return scrollY.value > 100 ? withTiming(1) : withTiming(0);
});

<ArticleCollapsibleHeader
  onBackPress={() => router.back()}
  animatedOpacity={headerOpacity}
/>
```

#### Styling

The component uses the following design tokens:

- **Background**: `#F7F7F7` (Light gray)
- **Border**: `4px solid #000000` (Black)
- **Padding**: `16px` horizontal, `16px` bottom
- **Button**: Primary variant (Brown #854836)
- **Text**: Overline for date, Small for weather
- **Height**: ~192px including safe area

#### Accessibility

All accessibility features are built-in:

- ✅ Header role for semantic structure
- ✅ Descriptive labels for screen readers
- ✅ Touch targets meet 44pt minimum
- ✅ Text meets minimum size (11px+)
- ✅ Decorative icons hidden from screen readers
- ✅ Keyboard navigation support

#### Performance

Optimizations included:

- ✅ React.memo prevents unnecessary re-renders
- ✅ useMemo for computed styles and data
- ✅ Reanimated for native-thread animations
- ✅ Pointer events disabled when invisible
- ✅ No layout calculations in render

#### Example

See `ArticleCollapsibleHeader.example.tsx` for a complete working example with scroll handler.

#### Constants

```typescript
export const ARTICLE_COLLAPSIBLE_HEADER_HEIGHT = 192; // Height in pixels
```

Use this constant for scroll calculations or offset adjustments.

## File Structure

```
article/
├── ArticleCollapsibleHeader.tsx          # Main component
├── ArticleCollapsibleHeader.example.tsx  # Usage example
├── index.ts                              # Barrel export
└── README.md                             # This file
```

## Dependencies

Required packages (already in project):

- `react-native-reanimated` - Smooth animations
- `react-native-safe-area-context` - Safe area handling
- `@expo/vector-icons` - Icons
- `expo-router` - Navigation

## Testing

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

test('calls onBackPress when button is pressed', () => {
  const onBackPress = jest.fn();
  const opacity = useSharedValue(1);

  const { getByTestId } = render(
    <ArticleCollapsibleHeader
      onBackPress={onBackPress}
      animatedOpacity={opacity}
    />
  );

  fireEvent.press(getByTestId('article-collapsible-header-back-button'));
  expect(onBackPress).toHaveBeenCalledTimes(1);
});
```

## Notes

- Parent component must handle positioning (typically `position: absolute`)
- Use high z-index (999) to keep header above content
- Date/weather are currently mocked - integrate with real APIs as needed
- Spanish locale is hardcoded - can be made configurable if needed
