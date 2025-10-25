# Component Architecture - Brutalist News Cards

Visual reference for component structure and relationships.

---

## Component Hierarchy

```
NewsCard Components
│
├── HorizontalNewsCard (Variant 1)
│   ├── Pressable (Container)
│   │   ├── View (Content Area 65%)
│   │   │   ├── ThemedText (Title)
│   │   │   ├── ThemedText (Subtitle)
│   │   │   ├── View (Meta Row)
│   │   │   │   ├── CategoryBadge ───────┐
│   │   │   │   └── AuthorInfo ──────────┤
│   │   │   ├── View (Separator)         │
│   │   │   └── RelatedArticles ─────────┤
│   │   └── View (Image Area 35%)        │
│   │       └── Image (expo-image)       │
│   │                                     │
├── VerticalNewsCard (Variant 2)         │
│   ├── Pressable (Container)            │
│   │   ├── View (Image Container)       │
│   │   │   └── Image (expo-image)       │
│   │   └── View (Content Area)          │
│   │       ├── View (Meta Row)          │
│   │       │   ├── CategoryBadge ◄──────┤ Shared
│   │       │   └── AuthorInfo ◄─────────┤ Components
│   │       ├── ThemedText (Title)       │
│   │       ├── ThemedText (Subtitle)    │
│   │       ├── View (Separator)         │
│   │       └── RelatedArticles ◄────────┤
│   │                                     │
└── TextOnlyNewsCard (Variant 3)         │
    └── Pressable (Container)            │
        ├── ThemedText (Title)           │
        ├── ThemedText (Subtitle)        │
        ├── View (Meta Row)              │
        │   ├── CategoryBadge ◄──────────┤
        │   └── AuthorInfo ◄─────────────┤
        ├── View (Separator)             │
        └── RelatedArticles ◄────────────┘
```

---

## Shared Components (Reusable)

```
CategoryBadge
├── Props: { category, variant, size? }
├── Variants: 'brown' | 'yellow'
├── Sizes: 'default' | 'large'
└── Output: View > ThemedText (uppercase category)

AuthorInfo
├── Props: { author, publishedAt? }
└── Output: View > ThemedText ("Por [author]")

RelatedArticles
├── Props: { articles, onPress, showCategories?, sectionTitle? }
├── Output: View
│   ├── ThemedText (section title)
│   └── RelatedArticleItem[] (Pressable)
│       ├── View (bullet + title)
│       └── CategoryBadge? (optional)
└── Max Articles: 2
```

---

## Data Flow

```
App/Screen
    │
    ├─→ NewsArticle[]
    │       │
    │       ├─→ HorizontalNewsCard
    │       ├─→ VerticalNewsCard
    │       └─→ TextOnlyNewsCard
    │               │
    │               ├─→ CategoryBadge (category, variant)
    │               ├─→ AuthorInfo (author, publishedAt)
    │               └─→ RelatedArticles (relatedArticles[])
    │                       │
    │                       └─→ RelatedArticleItem (individual press handlers)
    │
    ├─→ onPress(slug)
    └─→ onRelatedPress(slug)
```

---

## Type System

```typescript
// Core Data Types
NewsArticle
├── id: string
├── title: string
├── subtitle: string
├── category: string
├── author: string
├── imageUrl?: string
├── slug: string
├── publishedAt: string
└── relatedArticles: RelatedArticle[]

RelatedArticle
├── id: string
├── title: string
├── category?: string
└── slug: string

// Component Props
BaseNewsCardProps
├── article: NewsArticle
├── onPress: (slug: string) => void
├── onRelatedPress: (slug: string) => void
└── testID?: string

HorizontalNewsCardProps extends BaseNewsCardProps
└── categoryColor?: 'brown' | 'yellow'

VerticalNewsCardProps extends BaseNewsCardProps
└── categoryColor?: 'brown' | 'yellow'

TextOnlyNewsCardProps extends BaseNewsCardProps
└── categoryColor?: 'brown' | 'yellow'
```

---

## Design Token Structure

```
NewsCard.tokens.ts
│
├── COLORS
│   ├── primaryBrown: '#854836'
│   ├── accentYellow: '#FFB22C'
│   ├── black: '#000000'
│   ├── white: '#FFFFFF'
│   ├── grayBackground: '#F7F7F7'
│   ├── textPrimary: '#000000'
│   ├── textSecondary: '#4A4A4A'
│   └── borderPrimary: '#000000'
│
├── TYPOGRAPHY
│   ├── cardTitle: { fontSize, lineHeight, fontWeight, letterSpacing }
│   ├── cardTitleVertical: { ... }
│   ├── cardTitleTextOnly: { ... }
│   ├── cardSubtitle: { ... }
│   ├── categoryLabel: { ... }
│   ├── authorText: { ... }
│   ├── relatedTitle: { ... }
│   └── relatedCategory: { ... }
│
├── SPACING
│   ├── xs: 4
│   ├── sm: 8
│   ├── md: 12
│   ├── lg: 16
│   ├── xl: 20
│   └── xxl: 24
│
├── BORDERS
│   ├── thin: 2
│   ├── medium: 3
│   ├── thick: 4
│   └── radius: 0
│
├── DIMENSIONS
│   ├── minTouchTarget: 44
│   ├── horizontalImageRatio: 4/3
│   ├── verticalImageRatio: 16/9
│   ├── horizontalCardHeight: 240
│   ├── verticalCardHeight: 420
│   └── textOnlyCardHeight: 200
│
└── LAYOUT
    ├── horizontalContent: 0.65
    └── horizontalImage: 0.35
```

---

## Import/Export Map

```
@/components/news (index.ts)
│
├── Cards
│   ├── HorizontalNewsCard ←─ cards/HorizontalNewsCard.tsx
│   ├── VerticalNewsCard ←─── cards/VerticalNewsCard.tsx
│   └── TextOnlyNewsCard ←─── cards/TextOnlyNewsCard.tsx
│
├── Shared Components
│   ├── CategoryBadge ←────── shared/CategoryBadge.tsx
│   ├── AuthorInfo ←────────── shared/AuthorInfo.tsx
│   └── RelatedArticles ←──── shared/RelatedArticles.tsx
│
├── Types
│   ├── NewsArticle ←─────────┐
│   ├── RelatedArticle ←──────┤
│   ├── BaseNewsCardProps ←───┤
│   ├── HorizontalNewsCardProps  cards/NewsCard.types.ts
│   ├── VerticalNewsCardProps
│   ├── TextOnlyNewsCardProps
│   ├── CategoryBadgeProps
│   ├── AuthorInfoProps
│   └── RelatedArticlesProps ←┘
│
└── Tokens
    ├── COLORS ←──────────────┐
    ├── TYPOGRAPHY ←──────────┤
    ├── SPACING ←─────────────┤ cards/NewsCard.tokens.ts
    ├── BORDERS ←─────────────┤
    ├── DIMENSIONS ←──────────┤
    └── LAYOUT ←──────────────┘
```

---

## Interaction Flow

```
User Action: Tap on Card
    │
    ├─→ Haptics.impactAsync(Medium)
    ├─→ Pressable pressed state → backgroundColor change
    └─→ onPress(article.slug)
            │
            └─→ Router navigation to article detail

User Action: Tap on Related Article
    │
    ├─→ Haptics.impactAsync(Light)
    ├─→ Pressable pressed state → backgroundColor change
    └─→ onRelatedPress(relatedArticle.slug)
            │
            └─→ Router navigation to related article
```

---

## Accessibility Tree

```
HorizontalNewsCard (role: button)
├── accessibilityLabel: "POLÍTICA. Title. Subtitle. Por Author."
├── accessibilityHint: "Toca dos veces para leer la noticia completa"
│
├── CategoryBadge (accessible: false) ← Already in parent label
├── AuthorInfo (accessible: false) ← Already in parent label
│
└── RelatedArticles
    └── RelatedArticleItem[] (role: link)
        ├── accessibilityLabel: "Noticia relacionada: [title]"
        └── accessibilityHint: "Toca dos veces para abrir"
```

---

## Performance Optimizations

```
Component Level
├── React.memo() on all components
├── useCallback() for all event handlers
└── useMemo() for computed styles

Image Level
├── expo-image (optimized native image component)
├── contentFit="cover" (no distortion)
├── transition={200} (smooth fade-in)
└── No placeholder images (gray background fallback)

List Level (User Implementation)
├── FlatList over ScrollView for long lists
├── keyExtractor={(item) => item.id}
├── initialNumToRender={5}
└── maxToRenderPerBatch={10}
```

---

## Layout Dimensions

```
HorizontalNewsCard
┌─────────────────────────────────────────┐
│ ┌──────────────────┬──────────────────┐ │
│ │                  │                  │ │
│ │   Content 65%    │    Image 35%     │ │
│ │   ~234px width   │   ~126px width   │ │
│ │                  │                  │ │
│ └──────────────────┴──────────────────┘ │
└─────────────────────────────────────────┘
Height: ~240px

VerticalNewsCard
┌─────────────────────────────────────────┐
│                                         │
│          Image 16:9 aspect              │
│          ~360px width × 202px height    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│          Content Area                   │
│          ~218px height                  │
│                                         │
└─────────────────────────────────────────┘
Height: ~420px

TextOnlyNewsCard
┌─────────────────────────────────────────┐
│                                         │
│          Text Content Only              │
│          No images                      │
│          Larger typography              │
│                                         │
└─────────────────────────────────────────┘
Height: ~200px
```

---

## Color Application Map

```
Component         | Background | Text    | Border | Badge
──────────────────┼────────────┼─────────┼────────┼──────────
HorizontalCard    | White      | Black   | Black  | Brown
  (pressed)       | Yellow     | Black   | Black  | Brown
VerticalCard      | White      | Black   | Black  | Yellow
  (pressed)       | Gray       | Black   | Black  | Yellow
TextOnlyCard      | White      | Black   | Black  | Brown
  (pressed)       | Yellow     | Black   | Black  | Brown
CategoryBadge     | Brown/Yel. | W/B     | Black  | N/A
RelatedArticles   | Transparen | Black   | N/A    | N/A
  (pressed)       | Gray       | Black   | N/A    | N/A
```

---

## File Dependencies

```
HorizontalNewsCard.tsx
├── Imports
│   ├── react
│   ├── react-native (View, Pressable, StyleSheet)
│   ├── expo-image (Image)
│   ├── expo-haptics
│   ├── @/components/ThemedText
│   ├── ../shared/CategoryBadge
│   ├── ../shared/AuthorInfo
│   ├── ../shared/RelatedArticles
│   ├── ./NewsCard.tokens
│   └── ./NewsCard.types
└── Exports
    └── HorizontalNewsCard (React.memo)

(Similar for VerticalNewsCard and TextOnlyNewsCard)

Shared Components
├── CategoryBadge.tsx
│   └── Imports: ThemedText, tokens, types
├── AuthorInfo.tsx
│   └── Imports: ThemedText, tokens, types
└── RelatedArticles.tsx
    └── Imports: ThemedText, tokens, types, expo-haptics
```

---

## Variant Decision Tree

```
Choose News Card Variant
│
├─ Has prominent image? ───YES─→ Position in feed?
│   │                              │
│   │                              ├─ Top/Hero? ──→ VerticalNewsCard
│   │                              └─ Middle? ────→ HorizontalNewsCard
│   │
│   └─ NO ──────────────────────→ TextOnlyNewsCard
```

---

## Testing Strategy

```
Unit Tests (Recommended)
├── Component rendering
├── Prop validation
├── Event handler calls
├── Accessibility labels
└── Snapshot tests

Integration Tests
├── Navigation flow
├── API data integration
├── User interactions
└── Screen reader compatibility

Visual Regression
├── Storybook snapshots
├── Different screen sizes
├── Light/dark themes (if applicable)
└── RTL support (if applicable)
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Components | 6 |
| Card Variants | 3 |
| Shared Components | 3 |
| Type Files | 1 |
| Token Files | 1 |
| Documentation Files | 4 |
| Total Files | 15 |
| Total Lines of Code | ~1,500 |
| TypeScript Coverage | 100% |
| `any` Types Used | 0 |

---

**Legend:**
- `→` Data flow
- `◄` Shared/imported
- `├─` Child component
- `└─` Last child component
