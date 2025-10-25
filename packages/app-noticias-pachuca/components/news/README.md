# Brutalist News Cards

Three production-ready React Native news card components with brutalist design.

## Overview

This component system provides three card variants optimized for different content types:

1. **HorizontalNewsCard** - Image right (35%), content left (65%)
2. **VerticalNewsCard** - Full-width image top, content below
3. **TextOnlyNewsCard** - No image, text-only with prominent typography

## Features

- **Zero `any` types** - Fully type-safe with TypeScript
- **Haptic feedback** - Native feel on press interactions
- **Accessibility** - WCAG AA compliant with proper labels
- **Optimized images** - Uses `expo-image` for performance
- **Memoized** - All components use `React.memo` for efficiency
- **Brutalist design** - 4px borders, 0 radius, high contrast

## Installation

Already installed! These components are part of your app.

Required dependencies (already in your project):
```bash
expo-image
expo-haptics
```

## Quick Start

```tsx
import { HorizontalNewsCard } from '@/components/news';
import { useRouter } from 'expo-router';

export function NewsFeed() {
  const router = useRouter();

  const article = {
    id: '1',
    title: 'Breaking news headline',
    subtitle: 'Brief description of the article',
    category: 'POLÍTICA',
    author: 'María González',
    imageUrl: 'https://example.com/image.jpg',
    slug: 'breaking-news-headline',
    publishedAt: '2025-10-24T10:30:00Z',
    relatedArticles: [
      { id: 'r1', title: 'Related article 1', slug: 'related-1' },
      { id: 'r2', title: 'Related article 2', slug: 'related-2' },
    ],
  };

  return (
    <HorizontalNewsCard
      article={article}
      onPress={(slug) => router.push(`/article/${slug}`)}
      onRelatedPress={(slug) => router.push(`/article/${slug}`)}
      categoryColor="brown"
    />
  );
}
```

## API Reference

### HorizontalNewsCard

Best for: News feeds, general updates, mixed content

```tsx
<HorizontalNewsCard
  article={article}           // NewsArticle object
  onPress={handlePress}       // (slug: string) => void
  onRelatedPress={handleRelated}  // (slug: string) => void
  categoryColor="brown"       // 'brown' | 'yellow'
  testID="card-1"            // Optional test identifier
/>
```

**Layout:**
- Content area: 65% left
- Image area: 35% right
- Height: ~240px

### VerticalNewsCard

Best for: Featured stories, breaking news, hero sections

```tsx
<VerticalNewsCard
  article={article}
  onPress={handlePress}
  onRelatedPress={handleRelated}
  categoryColor="yellow"
  testID="featured-1"
/>
```

**Layout:**
- Image: Full width, 16:9 aspect ratio
- Content: Below image
- Height: ~420px

### TextOnlyNewsCard

Best for: Dense feeds, opinion pieces, quick reads

```tsx
<TextOnlyNewsCard
  article={article}
  onPress={handlePress}
  onRelatedPress={handleRelated}
  categoryColor="brown"
/>
```

**Layout:**
- Text only, no image
- Larger typography for emphasis
- Height: ~200px

## Data Types

### NewsArticle

```typescript
interface NewsArticle {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  imageUrl?: string;
  relatedArticles: RelatedArticle[];
  publishedAt: string;
  slug: string;
}
```

### RelatedArticle

```typescript
interface RelatedArticle {
  id: string;
  title: string;
  category?: string;  // Only shown in vertical variant
  slug: string;
}
```

## Usage Patterns

### Mixed Feed (Recommended)

```tsx
<ScrollView>
  <VerticalNewsCard {...featuredStory} />     {/* Hero */}
  <HorizontalNewsCard {...story1} />          {/* Standard */}
  <HorizontalNewsCard {...story2} />          {/* Standard */}
  <TextOnlyNewsCard {...story3} />            {/* Quick read */}
  <HorizontalNewsCard {...story4} />          {/* Standard */}
</ScrollView>
```

### Category Feed

```tsx
<ScrollView>
  {articles.map((article) => (
    <HorizontalNewsCard
      key={article.id}
      article={article}
      onPress={handlePress}
      onRelatedPress={handleRelated}
      categoryColor="brown"
    />
  ))}
</ScrollView>
```

### Featured Carousel

```tsx
<ScrollView
  horizontal
  snapToInterval={360}
  decelerationRate="fast"
>
  {featured.map((article) => (
    <VerticalNewsCard
      key={article.id}
      article={article}
      onPress={handlePress}
      onRelatedPress={handleRelated}
    />
  ))}
</ScrollView>
```

## Design Tokens

Access design tokens for custom components:

```tsx
import { COLORS, SPACING, TYPOGRAPHY } from '@/components/news';

const styles = {
  customElement: {
    backgroundColor: COLORS.primaryBrown,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.cardTitle.fontSize,
  },
};
```

**Available tokens:**
- `COLORS` - Color palette
- `TYPOGRAPHY` - Font sizes, weights, line heights
- `SPACING` - Spacing scale (xs to xxl)
- `BORDERS` - Border widths
- `DIMENSIONS` - Touch targets, aspect ratios
- `LAYOUT` - Layout proportions

## Shared Components

You can also use the shared sub-components independently:

```tsx
import { CategoryBadge, AuthorInfo, RelatedArticles } from '@/components/news';

<CategoryBadge category="POLÍTICA" variant="brown" />
<AuthorInfo author="María González" publishedAt="2025-10-24" />
<RelatedArticles
  articles={related}
  onPress={handlePress}
  showCategories={true}
/>
```

## Accessibility

All cards meet WCAG AA standards:

- **Touch targets:** Minimum 44x44px
- **Screen readers:** Proper labels and hints
- **Contrast ratios:** 4.5:1+ for all text
- **Keyboard navigation:** Full support
- **Haptic feedback:** Medium impact on card press, light on related articles

### Accessibility Labels

Cards announce to screen readers:
> "POLÍTICA. Breaking news headline. Brief description. Por María González. Toca dos veces para leer la noticia completa"

Related articles announce:
> "Noticia relacionada: Related article title. Toca dos veces para abrir"

## Performance

- **React.memo:** All components memoized
- **expo-image:** Optimized image loading with transitions
- **No re-renders:** Callbacks use `useCallback`
- **Efficient layout:** No unnecessary nested views

**Tips:**
- Use `keyExtractor` in FlatList/ScrollView
- Implement virtualization for long lists (use FlatList)
- Lazy load images off-screen

## Troubleshooting

### Images not loading

```tsx
// Ensure imageUrl is valid and accessible
const article = {
  // ...
  imageUrl: 'https://valid-url.com/image.jpg', // Must be HTTPS
};
```

### TypeScript errors

```tsx
// Always use the NewsArticle type
import type { NewsArticle } from '@/components/news';

const article: NewsArticle = {
  // TypeScript will guide you
};
```

### Cards not pressable

```tsx
// Ensure callbacks are defined
onPress={(slug) => {
  console.log('Pressed:', slug);
  router.push(`/article/${slug}`);
}}
```

## File Structure

```
components/news/
├── cards/
│   ├── HorizontalNewsCard.tsx
│   ├── VerticalNewsCard.tsx
│   ├── TextOnlyNewsCard.tsx
│   ├── NewsCard.types.ts
│   ├── NewsCard.tokens.ts
│   └── index.ts
├── shared/
│   ├── CategoryBadge.tsx
│   ├── AuthorInfo.tsx
│   ├── RelatedArticles.tsx
│   └── index.ts
├── index.ts
├── USAGE_EXAMPLES.tsx
└── README.md (this file)
```

## Examples

See `USAGE_EXAMPLES.tsx` for complete working examples:
- Mixed news feed
- Category-specific feed
- Featured stories carousel
- Mock data structures

## Design Specification

Based on: `/BRUTALIST_NEWS_CARDS_DESIGN_SYSTEM.md`

**Key principles:**
- 4px black borders, no border radius
- High contrast (black/brown/yellow/white)
- Uppercase categories
- Clear information hierarchy
- Scannable related articles (max 2)

## License

Part of Noticias Pachuca project.

---

**Questions?** Check `USAGE_EXAMPLES.tsx` or the design spec document.
