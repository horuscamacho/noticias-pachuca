# Related News Components

Production-ready React Native components for displaying related news articles with brutalist design.

## Components

### RelatedNewsCard

Compact horizontal card component for individual related articles.

**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RelatedNewsCard.tsx`

#### Features

- 80x80px square image on the left
- 2-line title with bold styling (15px font)
- Category badge (reuses CategoryBadge component)
- Author info with optional relative timestamp
- Yellow background (#FFB22C) on press
- 4px black separator between cards
- Minimum 88px touch target height
- Graceful handling of missing images (gray placeholder)
- Full accessibility support (WCAG compliant)
- Optimized with React.memo

#### Props

```typescript
interface RelatedNewsArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  imageUrl?: string;
  slug: string;
  publishedAt?: string;
}

interface RelatedNewsCardProps {
  article: RelatedNewsArticle;
  onPress: (slug: string) => void;
  categoryColor?: 'brown' | 'yellow';
  isLastCard?: boolean;
  testID?: string;
}
```

#### Usage

```tsx
import { RelatedNewsCard } from '@/components/RelatedNewsCard';

<RelatedNewsCard
  article={{
    id: '1',
    title: 'Breaking news headline here',
    category: 'POLÍTICA',
    author: 'John Doe',
    imageUrl: 'https://example.com/image.jpg',
    slug: 'breaking-news',
    publishedAt: '2024-01-15T10:30:00Z'
  }}
  onPress={(slug) => navigation.push('Article', { slug })}
  categoryColor="brown"
  isLastCard={false}
/>
```

#### Design Tokens

- **Image Size:** 80x80px
- **Title:** 15px font, 20px line height, bold
- **Author:** 11px font, 14px line height, regular
- **Border:** 4px black
- **Pressed State:** #FFB22C (yellow)
- **Touch Target:** minimum 88px height

---

### RelatedNewsSection

Container component that displays a section header with 3 related news cards.

**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RelatedNewsSection.tsx`

#### Features

- Bold uppercase section header ("NOTICIAS RELACIONADAS")
- White background with 4px black top/bottom borders
- Vertical list of cards (typically 3)
- Black separators between cards
- No spacing between cards (tight brutalist layout)
- Alternating category colors (brown/yellow)
- Returns null if no articles provided
- Full accessibility support
- Optimized with React.memo

#### Props

```typescript
interface RelatedNewsSectionProps {
  articles: RelatedNewsArticle[];
  onArticlePress: (slug: string) => void;
  sectionTitle?: string;
  testID?: string;
}
```

#### Usage

```tsx
import { RelatedNewsSection } from '@/components/RelatedNewsSection';

<RelatedNewsSection
  articles={[
    {
      id: '1',
      title: 'First related article',
      category: 'POLÍTICA',
      author: 'John Doe',
      imageUrl: 'https://example.com/1.jpg',
      slug: 'first-article',
    },
    {
      id: '2',
      title: 'Second related article',
      category: 'ECONOMÍA',
      author: 'Jane Smith',
      imageUrl: 'https://example.com/2.jpg',
      slug: 'second-article',
    },
    {
      id: '3',
      title: 'Third related article',
      category: 'CULTURA',
      author: 'Bob Johnson',
      slug: 'third-article',
    },
  ]}
  onArticlePress={(slug) => navigation.push('Article', { slug })}
  sectionTitle="NOTICIAS RELACIONADAS"
/>
```

#### Design Tokens

- **Header Font:** 14px, bold, uppercase, 0.5px letter spacing
- **Borders:** 4px black top/bottom
- **Background:** White (#FFFFFF)
- **Spacing:** 12px padding on header

---

## Integration Examples

### In Article Detail Screen

```tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { RelatedNewsSection } from '@/components/RelatedNewsSection';
import { useNavigation } from '@react-navigation/native';

const ArticleDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { article } = route.params;

  const handleRelatedPress = (slug: string) => {
    navigation.push('Article', { slug });
  };

  return (
    <ScrollView>
      {/* Article content */}
      <ArticleHeader article={article} />
      <ArticleBody content={article.body} />

      {/* Related news at bottom */}
      <RelatedNewsSection
        articles={article.relatedArticles}
        onArticlePress={handleRelatedPress}
      />
    </ScrollView>
  );
};
```

### With Custom Section Title

```tsx
<RelatedNewsSection
  articles={trendingArticles}
  onArticlePress={handlePress}
  sectionTitle="TE PUEDE INTERESAR"
/>
```

### Manual Card Layout

```tsx
import { View } from 'react-native';
import { RelatedNewsCard } from '@/components/RelatedNewsCard';

<View style={{ borderTopWidth: 4, borderBottomWidth: 4 }}>
  {articles.map((article, index) => (
    <RelatedNewsCard
      key={article.id}
      article={article}
      onPress={handlePress}
      categoryColor={index % 2 === 0 ? 'brown' : 'yellow'}
      isLastCard={index === articles.length - 1}
    />
  ))}
</View>
```

---

## Accessibility

Both components are fully accessible:

- **Screen Readers:** Proper semantic roles and labels
- **Keyboard Navigation:** Full keyboard support (on web)
- **Touch Targets:** Minimum 88px height (exceeds 44pt requirement)
- **Color Contrast:** WCAG AAA compliant
- **Dynamic Type:** Respects system font size settings (capped at 1.5x)

### Accessibility Labels

- **RelatedNewsCard:** "Leer artículo: [title], categoría [category], por [author]"
- **RelatedNewsSection:** "Sección de noticias relacionadas"

---

## Performance

Both components are optimized for performance:

- **React.memo:** Prevents unnecessary re-renders
- **Optimized Styles:** StyleSheet.create for style caching
- **Image Optimization:** resizeMode="cover" for efficient rendering
- **Conditional Rendering:** Early returns for empty states

---

## Dependencies

- `react-native` - Core primitives
- `@/components/ThemedText` - Typography component
- `@/components/news/shared/CategoryBadge` - Category badge component

---

## Design System

### Colors

- **White:** #FFFFFF (background)
- **Black:** #000000 (borders, text)
- **Brown:** #854836 (category badge)
- **Yellow:** #FFB22C (category badge, pressed state)
- **Gray:** #F7F7F7 (image placeholder)

### Typography

- **Title:** 15px, bold, 20px line height
- **Author:** 11px, regular, 14px line height
- **Header:** 14px, bold, uppercase, 18px line height

### Spacing

- **xs:** 4px
- **sm:** 8px
- **md:** 12px
- **lg:** 16px

### Borders

- **Thick:** 4px
- **Radius:** 0px (brutalist style)

---

## Error Handling

### Missing Images

Cards gracefully handle missing images by displaying a gray placeholder:

```tsx
{imageUrl ? (
  <Image source={{ uri: imageUrl }} />
) : (
  <View style={styles.imagePlaceholder} />
)}
```

### Empty Articles

The section returns null if no articles are provided:

```tsx
if (!articles || articles.length === 0) {
  return null;
}
```

### Invalid Timestamps

The relative time formatter handles invalid dates gracefully:

```tsx
try {
  const date = new Date(timestamp);
  // ... format logic
} catch {
  return '';
}
```

---

## Testing

Both components include testID props for automated testing:

```tsx
// E2E Testing
await element(by.id('related-news-section')).tap();
await element(by.id('related-news-card-1')).tap();

// Component Testing
const { getByTestId } = render(
  <RelatedNewsSection
    articles={mockArticles}
    onArticlePress={mockHandler}
    testID="test-section"
  />
);

expect(getByTestId('test-section')).toBeTruthy();
```

---

## Examples

See complete usage examples in:
`/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RelatedNewsSection.example.tsx`

---

## Changelog

### v1.0.0 (2025-10-25)

- Initial implementation
- RelatedNewsCard component with brutalist design
- RelatedNewsSection container component
- Full accessibility support
- Performance optimizations
- Comprehensive documentation

---

## License

Internal component for Noticias Pachuca mobile application.
