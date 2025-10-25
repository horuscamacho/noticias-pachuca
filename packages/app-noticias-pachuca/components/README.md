# ThemedText Component

Production-ready typography component for React Native with TypeScript, NativeWind, and brutalist design system.

## Overview

`ThemedText` is a fully-typed, responsive text component implementing 18 semantic text variants based on a brutalist design system. It provides:

- **Responsive sizing**: Automatically scales from phone to tablet (768px+ breakpoint)
- **Type safety**: Full TypeScript support with discriminated unions
- **Accessibility**: Built-in ARIA roles and labels, keyboard navigation support
- **NativeWind**: First-class support for Tailwind utility classes
- **Performance**: Memoized component with optimized style calculations
- **Dynamic type**: Caps font scaling at 1.5x to prevent layout breaks

## Installation

The component is already configured in this project. Simply import and use:

```typescript
import { ThemedText } from "@/components/ThemedText";
// or
import { ThemedText } from "@/components";
```

## Text Variants

### Display & Headlines

- `hero`: 32px/40px - Extra bold uppercase hero headlines
- `h1`: 28px/36px - Main page headings
- `h2`: 24px/32px - Section headings
- `h3`: 20px/24px - Subsection headings
- `h4`: 18px/20px - Minor headings

### Body Text

- `lead`: 20px/24px - Introductory paragraphs
- `body`: 16px/18px - Standard article text
- `bodyEmphasis`: 16px/18px - Emphasized paragraphs
- `small`: 14px/16px - Secondary information

### Labels & UI

- `caption`: 12px/14px - Badge labels, categories
- `overline`: 10px/12px - Section labels
- `button`: 16px/18px - Button text
- `link`: 16px/18px - Hyperlinks (with underline)

### Special

- `breakingNews`: 14px/16px - Breaking news banners
- `breakingNewsBadge`: 11px/12px - "BREAKING" badge
- `mono`: 14px/16px - Code snippets
- `quote`: 18px/22px - Blockquotes (italic)
- `error`: 14px/16px - Error messages (red)

## Basic Usage

### Simple Text

```tsx
<ThemedText variant="body">
  This is standard article text with comfortable line height.
</ThemedText>
```

### Headlines

```tsx
<ThemedText variant="hero" numberOfLines={2}>
  Major Breaking News Event Unfolds
</ThemedText>

<ThemedText variant="h1">
  Article Title Goes Here
</ThemedText>
```

### Category Badges

```tsx
<ThemedText
  variant="caption"
  className="bg-brutalist-brown text-white px-3 py-1"
>
  POLITICS
</ThemedText>
```

### Interactive Links

```tsx
<ThemedText
  variant="link"
  onPress={() => navigation.navigate("Article", { id: articleId })}
>
  Read full story
</ThemedText>
```

### Breaking News Banner

```tsx
<View className="bg-brutalist-red p-3">
  <ThemedText variant="breakingNewsBadge" className="mb-1">
    BREAKING
  </ThemedText>
  <ThemedText variant="breakingNews">
    Major development in ongoing story
  </ThemedText>
</View>
```

### Blockquotes

```tsx
<ThemedText variant="quote" className="border-l-4 border-brutalist-brown pl-4">
  "This is a quote from an important source."
</ThemedText>
```

### Error Messages

```tsx
<ThemedText variant="error">
  Failed to load article. Please try again.
</ThemedText>
```

## Advanced Usage

### Custom Styling with NativeWind

Combine variant styles with Tailwind classes:

```tsx
<ThemedText
  variant="body"
  className="mb-4 text-center bg-gray-100 p-4 rounded-lg"
>
  Centered text with custom background
</ThemedText>
```

### Inline Style Override

```tsx
<ThemedText variant="h2" style={{ color: "#FF0000", marginBottom: 20 }}>
  Custom colored heading
</ThemedText>
```

### Text Truncation

```tsx
<ThemedText variant="body" numberOfLines={3}>
  This is a long article excerpt that will be truncated after three lines with
  an ellipsis. Perfect for article previews and cards.
</ThemedText>
```

### Accessibility

```tsx
<ThemedText
  variant="h1"
  accessibilityLabel="Main article headline"
  accessibilityRole="header"
>
  Breaking News
</ThemedText>
```

### Multiple Style Arrays

```tsx
const customStyles = [{ marginBottom: 10 }, { paddingHorizontal: 20 }];

<ThemedText variant="body" style={customStyles}>
  Text with multiple style objects
</ThemedText>;
```

## Props API

```typescript
interface ThemedTextProps extends Omit<TextProps, "style"> {
  // Required: Typography variant
  variant: TextVariant;

  // Content to display
  children: React.ReactNode;

  // NativeWind/Tailwind classes
  className?: string;

  // Inline styles (override variant)
  style?: TextStyle | TextStyle[];

  // Maximum lines before truncation
  numberOfLines?: number;

  // Makes text pressable
  onPress?: () => void;

  // Accessibility overrides
  accessibilityLabel?: string;
  accessibilityRole?: TextProps["accessibilityRole"];

  // All standard React Native Text props
  // (selectable, allowFontScaling, etc.)
}
```

## Helper Functions

### getTypographyToken

Get raw typography tokens for a variant:

```typescript
import { getTypographyToken } from "@/components/ThemedText";

const heroToken = getTypographyToken("hero");
console.log(heroToken.fontSize.phone); // 32
console.log(heroToken.fontWeight); // '900'
```

### TEXT_VARIANTS

Array of all available variant names:

```typescript
import { TEXT_VARIANTS } from "@/components/ThemedText";

TEXT_VARIANTS.forEach((variant) => {
  console.log(variant); // 'hero', 'h1', 'h2', ...
});
```

## Color Palette

The component uses these configured brutalist colors:

```typescript
colors: {
  brutalist: {
    brown: '#854836',    // Primary
    yellow: '#FFB22C',   // Accent
    red: '#FF0000',      // Alerts
    gray: '#F7F7F7',     // Background
    black: '#000000',    // Text/Borders
  }
}
```

## Responsive Behavior

- **Phone** (< 768px): Base font sizes
- **Tablet** (>= 768px): Scaled font sizes (typically +20-25%)
- **Dynamic Type**: Respects user's system font size preferences
- **Max Scaling**: Capped at 1.5x to prevent layout issues

## Performance Optimizations

1. **Memoization**: Component is wrapped in `React.memo` to prevent unnecessary re-renders
2. **Computed Styles**: Uses `useMemo` for style calculations
3. **Static Tokens**: Typography definitions are constants (no runtime overhead)
4. **Efficient Merging**: Optimized style array handling

## Accessibility Features

1. **Semantic Roles**: Headers automatically get `header` role, links get `link` role
2. **Font Scaling**: Supports iOS/Android dynamic type
3. **Max Multiplier**: Prevents excessive scaling that breaks layouts
4. **Screen Readers**: Proper labeling and role announcements

## TypeScript Types

All types are exported for use in other components:

```typescript
import type {
  TextVariant, // Union of all variant names
  ThemedTextProps, // Component props interface
} from "@/components/ThemedText";

// Use in your components
type MyProps = {
  titleVariant: TextVariant;
};

const MyComponent = ({ titleVariant }: MyProps) => (
  <ThemedText variant={titleVariant}>Title</ThemedText>
);
```

## Best Practices

### Do's

- Use semantic variants (`h1` for main title, `body` for content)
- Combine with NativeWind classes for spacing and layout
- Use `numberOfLines` for cards and previews
- Leverage accessibility props for screen readers
- Use `memo` for list items to optimize scrolling

### Don'ts

- Don't override `fontSize` or `fontWeight` via style (defeats responsive design)
- Don't use `any` type - leverage the strong typing
- Don't skip accessibility - it's built-in, use it
- Don't nest ThemedText components (can cause layout issues)

## Common Patterns

### Article Card

```tsx
<View className="bg-white p-4 mb-4 border-2 border-black">
  <ThemedText variant="caption" className="mb-2">
    SPORTS
  </ThemedText>
  <ThemedText variant="h3" numberOfLines={2} className="mb-2">
    Championship Match Ends in Stunning Victory
  </ThemedText>
  <ThemedText variant="small" numberOfLines={3}>
    The final moments of the game saw an incredible turn of events...
  </ThemedText>
</View>
```

### List Item

```tsx
const ArticleListItem = React.memo(({ article }) => (
  <Pressable onPress={() => navigate("Article", { id: article.id })}>
    <View className="border-b border-black p-4">
      <ThemedText variant="overline" className="mb-1">
        {article.category}
      </ThemedText>
      <ThemedText variant="h4" numberOfLines={2}>
        {article.title}
      </ThemedText>
    </View>
  </Pressable>
));
```

### Button Component

```tsx
const BrutalistButton = ({ label, onPress }) => (
  <Pressable
    onPress={onPress}
    className="bg-brutalist-yellow border-2 border-black px-6 py-3"
  >
    <ThemedText variant="button">{label}</ThemedText>
  </Pressable>
);
```

## Testing

The component is fully testable:

```tsx
import { render, screen } from "@testing-library/react-native";
import { ThemedText } from "@/components/ThemedText";

describe("ThemedText", () => {
  it("renders with correct variant", () => {
    render(<ThemedText variant="hero">Test</ThemedText>);
    expect(screen.getByText("Test")).toBeTruthy();
  });

  it("handles press events", () => {
    const onPress = jest.fn();
    render(
      <ThemedText variant="link" onPress={onPress}>
        Click me
      </ThemedText>
    );
    fireEvent.press(screen.getByText("Click me"));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## File Locations

- Component: `/packages/app-noticias-pachuca/components/ThemedText.tsx`
- Types: Exported from the same file
- Demo: `/packages/app-noticias-pachuca/app/index.tsx`

## Support

For issues or questions, check the inline JSDoc comments in the component file or refer to:

- [React Native Text Documentation](https://reactnative.dev/docs/text)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
