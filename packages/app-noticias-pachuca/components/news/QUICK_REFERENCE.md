# Quick Reference - Brutalist News Cards

Copy-paste snippets for rapid development.

---

## Basic Import

```tsx
import { HorizontalNewsCard, VerticalNewsCard, TextOnlyNewsCard } from '@/components/news';
import type { NewsArticle } from '@/components/news';
```

---

## Data Structure

```tsx
const article: NewsArticle = {
  id: '1',
  title: 'Your headline here',
  subtitle: 'Brief description',
  category: 'POLÍTICA',
  author: 'Author Name',
  imageUrl: 'https://example.com/image.jpg', // Optional
  slug: 'your-headline-here',
  publishedAt: '2025-10-24T10:30:00Z',
  relatedArticles: [
    { id: 'r1', title: 'Related article 1', slug: 'related-1', category: 'CULTURA' },
    { id: 'r2', title: 'Related article 2', slug: 'related-2' },
  ],
};
```

---

## Horizontal Card

```tsx
<HorizontalNewsCard
  article={article}
  onPress={(slug) => router.push(`/article/${slug}`)}
  onRelatedPress={(slug) => router.push(`/article/${slug}`)}
  categoryColor="brown"
/>
```

---

## Vertical Card

```tsx
<VerticalNewsCard
  article={article}
  onPress={(slug) => router.push(`/article/${slug}`)}
  onRelatedPress={(slug) => router.push(`/article/${slug}`)}
  categoryColor="yellow"
/>
```

---

## Text-Only Card

```tsx
<TextOnlyNewsCard
  article={article}
  onPress={(slug) => router.push(`/article/${slug}`)}
  onRelatedPress={(slug) => router.push(`/article/${slug}`)}
  categoryColor="brown"
/>
```

---

## Mixed Feed Layout

```tsx
import { ScrollView } from 'react-native';
import { HorizontalNewsCard, VerticalNewsCard, TextOnlyNewsCard } from '@/components/news';

export function NewsFeed({ articles }) {
  return (
    <ScrollView>
      <VerticalNewsCard {...articles[0]} />      {/* Hero */}
      <HorizontalNewsCard {...articles[1]} />    {/* Standard */}
      <HorizontalNewsCard {...articles[2]} />    {/* Standard */}
      <TextOnlyNewsCard {...articles[3]} />      {/* Quick read */}
      <HorizontalNewsCard {...articles[4]} />    {/* Standard */}
    </ScrollView>
  );
}
```

---

## FlatList Implementation

```tsx
import { FlatList } from 'react-native';
import { HorizontalNewsCard } from '@/components/news';

export function NewsFeed({ articles }) {
  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HorizontalNewsCard
          article={item}
          onPress={(slug) => router.push(`/article/${slug}`)}
          onRelatedPress={(slug) => router.push(`/article/${slug}`)}
        />
      )}
    />
  );
}
```

---

## With React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { HorizontalNewsCard } from '@/components/news';

export function NewsFeed() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const res = await fetch('/api/articles');
      return res.json();
    },
  });

  if (isLoading) return <Loading />;

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HorizontalNewsCard
          article={item}
          onPress={(slug) => router.push(`/article/${slug}`)}
          onRelatedPress={(slug) => router.push(`/article/${slug}`)}
        />
      )}
    />
  );
}
```

---

## Shared Components

```tsx
import { CategoryBadge, AuthorInfo, RelatedArticles } from '@/components/news';

// Category Badge
<CategoryBadge category="POLÍTICA" variant="brown" />
<CategoryBadge category="CULTURA" variant="yellow" size="large" />

// Author Info
<AuthorInfo author="María González" />
<AuthorInfo author="Carlos Ramírez" publishedAt="2025-10-24" />

// Related Articles
<RelatedArticles
  articles={article.relatedArticles}
  onPress={(slug) => router.push(`/article/${slug}`)}
  showCategories={true}
  sectionTitle="RELACIONADAS"
/>
```

---

## Design Tokens

```tsx
import { COLORS, SPACING, TYPOGRAPHY } from '@/components/news';

const styles = {
  custom: {
    backgroundColor: COLORS.primaryBrown,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.cardTitle.fontSize,
  },
};
```

---

## Color Palette

```tsx
COLORS.primaryBrown    // #854836
COLORS.accentYellow    // #FFB22C
COLORS.black           // #000000
COLORS.white           // #FFFFFF
COLORS.grayBackground  // #F7F7F7
COLORS.textPrimary     // #000000
COLORS.textSecondary   // #4A4A4A
```

---

## Spacing Scale

```tsx
SPACING.xs    // 4px
SPACING.sm    // 8px
SPACING.md    // 12px
SPACING.lg    // 16px
SPACING.xl    // 20px
SPACING.xxl   // 24px
```

---

## Common Props

```tsx
// All cards accept:
article: NewsArticle           // Required
onPress: (slug) => void        // Required
onRelatedPress: (slug) => void // Required
categoryColor?: 'brown' | 'yellow'  // Optional
testID?: string                // Optional
```

---

## Mock Data Generator

```tsx
const mockArticle = (id: number): NewsArticle => ({
  id: `${id}`,
  title: `Article title ${id}`,
  subtitle: `Brief description of article ${id}`,
  category: ['POLÍTICA', 'CULTURA', 'ECONOMÍA'][id % 3],
  author: ['María González', 'Carlos Ramírez', 'Ana Torres'][id % 3],
  imageUrl: `https://picsum.photos/seed/${id}/800/450`,
  slug: `article-${id}`,
  publishedAt: new Date().toISOString(),
  relatedArticles: [
    { id: `r${id}1`, title: `Related ${id}-1`, slug: `related-${id}-1` },
    { id: `r${id}2`, title: `Related ${id}-2`, slug: `related-${id}-2` },
  ],
});

// Generate 10 mock articles
const articles = Array.from({ length: 10 }, (_, i) => mockArticle(i));
```

---

## Navigation Handlers

```tsx
import { useRouter } from 'expo-router';

export function NewsFeed() {
  const router = useRouter();

  const handleArticlePress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  const handleRelatedPress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  return (
    <HorizontalNewsCard
      article={article}
      onPress={handleArticlePress}
      onRelatedPress={handleRelatedPress}
    />
  );
}
```

---

## Conditional Rendering

```tsx
// Render different variants based on position
{articles.map((article, index) => {
  if (index === 0) {
    return <VerticalNewsCard key={article.id} {...props} />;
  }
  if (index % 3 === 0) {
    return <TextOnlyNewsCard key={article.id} {...props} />;
  }
  return <HorizontalNewsCard key={article.id} {...props} />;
})}
```

---

## File Locations

```
/components/news/
├── cards/
│   ├── HorizontalNewsCard.tsx
│   ├── VerticalNewsCard.tsx
│   ├── TextOnlyNewsCard.tsx
│   ├── NewsCard.types.ts
│   └── NewsCard.tokens.ts
├── shared/
│   ├── CategoryBadge.tsx
│   ├── AuthorInfo.tsx
│   └── RelatedArticles.tsx
└── index.ts
```

---

## Absolute Paths

```
/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/news/
```

---

**Need more examples?** See `USAGE_EXAMPLES.tsx`
**Need documentation?** See `README.md`
