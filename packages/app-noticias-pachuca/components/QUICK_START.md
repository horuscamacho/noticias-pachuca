# ThemedText Quick Start

Get started with ThemedText in 60 seconds.

## Installation

Already installed! Just import and use:

```tsx
import { ThemedText } from '@/components/ThemedText';
```

## Basic Usage

```tsx
// Article headline
<ThemedText variant="hero">
  Breaking News Story
</ThemedText>

// Body text
<ThemedText variant="body">
  This is the article content.
</ThemedText>

// Category badge
<ThemedText variant="caption" className="bg-brutalist-brown text-white px-3 py-1">
  POLITICS
</ThemedText>
```

## Common Variants

| Use Case | Variant | Example |
|----------|---------|---------|
| Main headline | `hero` | Breaking news titles |
| Page title | `h1` | Article titles |
| Section header | `h2` | Section headings |
| Subsection | `h3` | Subheadings |
| Article text | `body` | Paragraphs |
| Lead paragraph | `lead` | Article intro |
| Category badge | `caption` | POLITICS, SPORTS |
| Link | `link` | Read more → |
| Button | `button` | SHARE, SAVE |
| Breaking banner | `breakingNews` | Urgent updates |
| Error | `error` | Error messages |

## With NativeWind

```tsx
<ThemedText variant="h2" className="mb-4 text-center">
  Centered Heading
</ThemedText>
```

## Interactive Text

```tsx
<ThemedText
  variant="link"
  onPress={() => navigation.navigate('Article')}
>
  Read full story
</ThemedText>
```

## Truncation

```tsx
<ThemedText variant="body" numberOfLines={3}>
  Long text that will be truncated...
</ThemedText>
```

## Real-World Example

```tsx
// Article Card
<View className="bg-white p-4 border-2 border-black">
  <ThemedText
    variant="caption"
    className="bg-brutalist-yellow text-black px-2 py-1 mb-2 self-start"
  >
    TECHNOLOGY
  </ThemedText>

  <ThemedText variant="h3" numberOfLines={2} className="mb-2">
    New AI Breakthrough Changes Everything
  </ThemedText>

  <ThemedText variant="small" numberOfLines={3} className="mb-3">
    Scientists have discovered a revolutionary new approach...
  </ThemedText>

  <ThemedText
    variant="link"
    onPress={() => navigate('Article', { id: article.id })}
  >
    Read more →
  </ThemedText>
</View>
```

## Brutalist Colors

Use these NativeWind classes:

- `bg-brutalist-brown` - Primary brown (#854836)
- `bg-brutalist-yellow` - Accent yellow (#FFB22C)
- `bg-brutalist-red` - Alert red (#FF0000)
- `bg-brutalist-gray` - Background (#F7F7F7)
- `bg-brutalist-black` - Black (#000000)

## All Variants Cheat Sheet

```tsx
// Headlines
<ThemedText variant="hero">Hero Headline</ThemedText>
<ThemedText variant="h1">H1 Heading</ThemedText>
<ThemedText variant="h2">H2 Heading</ThemedText>
<ThemedText variant="h3">H3 Heading</ThemedText>
<ThemedText variant="h4">H4 Heading</ThemedText>

// Body
<ThemedText variant="lead">Lead paragraph</ThemedText>
<ThemedText variant="body">Body text</ThemedText>
<ThemedText variant="bodyEmphasis">Emphasized</ThemedText>
<ThemedText variant="small">Small text</ThemedText>

// Labels
<ThemedText variant="caption">CAPTION</ThemedText>
<ThemedText variant="overline">OVERLINE</ThemedText>
<ThemedText variant="button">BUTTON</ThemedText>
<ThemedText variant="link">Link text</ThemedText>

// Special
<ThemedText variant="breakingNews">Breaking news</ThemedText>
<ThemedText variant="breakingNewsBadge">BREAKING</ThemedText>
<ThemedText variant="mono">Code text</ThemedText>
<ThemedText variant="quote">"Quote"</ThemedText>
<ThemedText variant="error">Error message</ThemedText>
```

## TypeScript Types

```tsx
import type { TextVariant, ThemedTextProps } from '@/components/ThemedText';

// Use in your components
interface ArticleCardProps {
  titleVariant?: TextVariant;
}

const ArticleCard = ({ titleVariant = 'h3' }: ArticleCardProps) => (
  <ThemedText variant={titleVariant}>Title</ThemedText>
);
```

## Props Reference

```tsx
interface ThemedTextProps {
  variant: TextVariant;           // Required
  children: React.ReactNode;      // Required
  className?: string;             // NativeWind classes
  style?: TextStyle | TextStyle[]; // Inline styles
  numberOfLines?: number;         // Truncation
  onPress?: () => void;           // Makes interactive
  accessibilityLabel?: string;    // A11y override
  // ...all React Native Text props
}
```

## Need More Help?

- Full docs: `components/README.md`
- Examples: `components/ThemedText.examples.tsx`
- Accessibility: `components/ThemedText.a11y.md`
- Performance: `components/ThemedText.performance.md`
- Demo: `app/index.tsx`

## Run Demo

```bash
npm run ios
# or
npm run android
```

---

That's it! You're ready to build beautiful brutalist typography. 🎨
