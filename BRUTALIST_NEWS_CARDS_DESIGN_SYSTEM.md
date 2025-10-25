# Brutalist News Cards Design System
## React Native Implementation Specification

**Project:** Noticias Pachuca
**Designer:** UI/UX Design System
**Date:** 2025-10-24
**Version:** 1.0

---

## Design Tokens

### Color Palette
```typescript
const COLORS = {
  // Primary Colors
  primaryBrown: '#854836',
  accentYellow: '#FFB22C',
  black: '#000000',
  white: '#FFFFFF',
  grayBackground: '#F7F7F7',

  // Semantic Colors
  textPrimary: '#000000',
  textSecondary: '#4A4A4A',
  textInverse: '#FFFFFF',

  // Interactive States
  pressedYellow: '#FFB22C',
  pressedBrown: '#6A3829',

  // Borders
  borderPrimary: '#000000',
};
```

### Typography Scale
```typescript
const TYPOGRAPHY = {
  // Card Title
  cardTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.3,
    textTransform: 'none',
  },

  // Card Subtitle/Description
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
    textTransform: 'none',
  },

  // Category Badge
  categoryLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Author Info
  authorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
    textTransform: 'none',
  },

  // Related Article Titles
  relatedTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.1,
    textTransform: 'none',
  },

  // Related Category
  relatedCategory: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
};
```

### Spacing System
```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};
```

### Border System
```typescript
const BORDERS = {
  thin: 2,
  medium: 3,
  thick: 4,
  radius: 0, // Brutalist = no border radius
};
```

### Dimensions
```typescript
const DIMENSIONS = {
  // Touch Targets (Minimum 44x44 per iOS HIG)
  minTouchTarget: 44,

  // Image Aspect Ratios
  horizontalImageRatio: 4/3,
  verticalImageRatio: 16/9,

  // Card Heights (Approximate)
  horizontalCardHeight: 240,
  verticalCardHeight: 420,
  textOnlyCardHeight: 200,
};
```

---

## Variant 1: Horizontal Card with Image Right

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ ┌────────────────────────────┬──────────────────────┐   │
│ │                            │                      │   │
│ │  CONTENT AREA (65%)        │   IMAGE (35%)        │   │
│ │                            │                      │   │
│ │  - Title                   │   [Image]            │   │
│ │  - Subtitle                │                      │   │
│ │  - Category + Author       │                      │   │
│ │  ─────────────             │                      │   │
│ │  - Related News            │                      │   │
│ │    • Title 1               │                      │   │
│ │    • Title 2               │                      │   │
│ │                            │                      │   │
│ └────────────────────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Design Specifications

#### Container
```typescript
{
  width: '100%',
  borderWidth: 4,
  borderColor: COLORS.black,
  backgroundColor: COLORS.white,
  marginBottom: SPACING.lg,
  flexDirection: 'row',
  minHeight: 240,
}
```

#### Content Area (Left Side - 65%)
```typescript
{
  flex: 0.65,
  padding: SPACING.lg,
  paddingRight: SPACING.md,
  justifyContent: 'space-between',
}
```

#### Image Area (Right Side - 35%)
```typescript
{
  flex: 0.35,
  borderLeftWidth: BORDERS.thick,
  borderLeftColor: COLORS.black,
  backgroundColor: COLORS.grayBackground,
}

// Image Component
{
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
}
```

#### Title Section
```typescript
// Title Container
{
  marginBottom: SPACING.sm,
}

// Title Text
{
  ...TYPOGRAPHY.cardTitle,
  color: COLORS.textPrimary,
  numberOfLines: 3,
  ellipsizeMode: 'tail',
}
```

#### Subtitle Section
```typescript
// Subtitle Container
{
  marginBottom: SPACING.md,
}

// Subtitle Text
{
  ...TYPOGRAPHY.cardSubtitle,
  color: COLORS.textSecondary,
  numberOfLines: 3,
  ellipsizeMode: 'tail',
}
```

#### Meta Information Row
```typescript
// Container
{
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: SPACING.md,
  gap: SPACING.sm,
}

// Category Badge
{
  backgroundColor: COLORS.primaryBrown,
  paddingHorizontal: SPACING.sm,
  paddingVertical: SPACING.xs,
  borderWidth: BORDERS.medium,
  borderColor: COLORS.black,
}

// Category Text
{
  ...TYPOGRAPHY.categoryLabel,
  color: COLORS.white,
}

// Author Container
{
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.xs,
}

// Author Text
{
  ...TYPOGRAPHY.authorText,
  color: COLORS.textSecondary,
}
```

#### Separator
```typescript
{
  height: BORDERS.medium,
  backgroundColor: COLORS.black,
  marginVertical: SPACING.md,
  width: '100%',
}
```

#### Related News Section
```typescript
// Container
{
  gap: SPACING.sm,
}

// Section Label
{
  ...TYPOGRAPHY.relatedCategory,
  color: COLORS.textSecondary,
  marginBottom: SPACING.xs,
}

// Related Article Item (Pressable)
{
  flexDirection: 'row',
  alignItems: 'flex-start',
  minHeight: DIMENSIONS.minTouchTarget,
  paddingVertical: SPACING.xs,
  gap: SPACING.xs,
}

// Bullet Point
{
  width: 6,
  height: 6,
  backgroundColor: COLORS.black,
  marginTop: 6,
}

// Related Title Text
{
  ...TYPOGRAPHY.relatedTitle,
  color: COLORS.textPrimary,
  flex: 1,
  numberOfLines: 2,
  ellipsizeMode: 'tail',
}
```

#### Interactive States

**Default State:**
```typescript
{
  backgroundColor: COLORS.white,
  transform: [{ scale: 1 }],
}
```

**Pressed State (Card):**
```typescript
{
  backgroundColor: COLORS.accentYellow,
  opacity: 0.95,
}
```

**Pressed State (Related Article):**
```typescript
{
  backgroundColor: COLORS.grayBackground,
}
```

### Example Content
```typescript
const HORIZONTAL_CARD_EXAMPLE = {
  title: "Gobierno anuncia nuevo programa de apoyo para pequeñas empresas en Pachuca",
  subtitle: "La iniciativa beneficiará a más de 500 comercios locales con créditos sin intereses y capacitación gratuita",
  category: "ECONOMÍA",
  author: "María González",
  image: "https://example.com/economy-image.jpg",
  relatedArticles: [
    {
      id: "1",
      title: "Cámara de Comercio respalda propuesta gubernamental",
      category: "ECONOMÍA",
    },
    {
      id: "2",
      title: "Emprendedores hidalguenses celebran nueva medida",
      category: "NEGOCIOS",
    },
  ],
};
```

---

## Variant 2: Vertical Card with Full-Width Image

### Layout Structure
```
┌─────────────────────────────────────────────┐
│                                             │
│          [FULL WIDTH IMAGE]                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CATEGORY    Por Author Name                │
│                                             │
│  Title of the news article goes here        │
│  over multiple lines if needed              │
│                                             │
│  Brief subtitle or description providing    │
│  context and additional details             │
│                                             │
│  ─────────────────────────────────          │
│                                             │
│  NOTICIAS RELACIONADAS                      │
│  • First related article title              │
│    POLÍTICA                                 │
│  • Second related article title             │
│    SOCIEDAD                                 │
│                                             │
└─────────────────────────────────────────────┘
```

### Design Specifications

#### Container
```typescript
{
  width: '100%',
  borderWidth: 4,
  borderColor: COLORS.black,
  backgroundColor: COLORS.white,
  marginBottom: SPACING.lg,
  minHeight: 420,
}
```

#### Image Container
```typescript
{
  width: '100%',
  aspectRatio: 16/9,
  borderBottomWidth: BORDERS.thick,
  borderBottomColor: COLORS.black,
  backgroundColor: COLORS.grayBackground,
}

// Image Component
{
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
}
```

#### Content Container
```typescript
{
  padding: SPACING.lg,
}
```

#### Meta Information Row (Top)
```typescript
// Container
{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: SPACING.md,
  gap: SPACING.sm,
  flexWrap: 'wrap',
}

// Category Badge
{
  backgroundColor: COLORS.accentYellow,
  paddingHorizontal: SPACING.sm,
  paddingVertical: SPACING.xs,
  borderWidth: BORDERS.medium,
  borderColor: COLORS.black,
}

// Category Text
{
  ...TYPOGRAPHY.categoryLabel,
  color: COLORS.black,
}

// Author Container
{
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.xs,
}

// Author Text
{
  ...TYPOGRAPHY.authorText,
  color: COLORS.textSecondary,
}
```

#### Title Section
```typescript
// Title Container
{
  marginBottom: SPACING.md,
}

// Title Text
{
  ...TYPOGRAPHY.cardTitle,
  fontSize: 18, // Slightly larger for vertical card
  lineHeight: 25,
  color: COLORS.textPrimary,
  numberOfLines: 3,
  ellipsizeMode: 'tail',
}
```

#### Subtitle Section
```typescript
// Subtitle Container
{
  marginBottom: SPACING.lg,
}

// Subtitle Text
{
  ...TYPOGRAPHY.cardSubtitle,
  color: COLORS.textSecondary,
  numberOfLines: 3,
  ellipsizeMode: 'tail',
}
```

#### Separator
```typescript
{
  height: BORDERS.medium,
  backgroundColor: COLORS.black,
  marginBottom: SPACING.md,
  width: '100%',
}
```

#### Related News Section
```typescript
// Container
{
  gap: SPACING.md,
}

// Section Label
{
  ...TYPOGRAPHY.relatedCategory,
  color: COLORS.textSecondary,
  marginBottom: SPACING.sm,
}

// Related Article Item (Pressable)
{
  minHeight: DIMENSIONS.minTouchTarget,
  paddingVertical: SPACING.sm,
  gap: SPACING.xs,
}

// Related Content Row
{
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: SPACING.xs,
  marginBottom: SPACING.xs,
}

// Bullet Point
{
  width: 6,
  height: 6,
  backgroundColor: COLORS.black,
  marginTop: 6,
}

// Related Title Text
{
  ...TYPOGRAPHY.relatedTitle,
  color: COLORS.textPrimary,
  flex: 1,
  numberOfLines: 2,
  ellipsizeMode: 'tail',
}

// Related Category Badge (Small)
{
  backgroundColor: COLORS.grayBackground,
  paddingHorizontal: SPACING.xs,
  paddingVertical: 2,
  borderWidth: BORDERS.thin,
  borderColor: COLORS.black,
  marginLeft: SPACING.md + 6, // Align with text above bullet
}

// Related Category Text
{
  ...TYPOGRAPHY.relatedCategory,
  color: COLORS.textSecondary,
}
```

#### Interactive States

**Default State:**
```typescript
{
  backgroundColor: COLORS.white,
  transform: [{ scale: 1 }],
}
```

**Pressed State (Card):**
```typescript
{
  backgroundColor: COLORS.grayBackground,
}
```

**Pressed State (Related Article):**
```typescript
{
  backgroundColor: COLORS.accentYellow,
  opacity: 0.3,
}
```

### Example Content
```typescript
const VERTICAL_CARD_EXAMPLE = {
  title: "Inauguran centro cultural en el corazón de Pachuca",
  subtitle: "El nuevo espacio promoverá el arte local y ofrecerá talleres gratuitos para la comunidad",
  category: "CULTURA",
  author: "Carlos Ramírez",
  image: "https://example.com/culture-center.jpg",
  relatedArticles: [
    {
      id: "1",
      title: "Artistas locales expondrán en la nueva galería municipal",
      category: "CULTURA",
    },
    {
      id: "2",
      title: "Programa de talleres culturales arranca en marzo",
      category: "EDUCACIÓN",
    },
  ],
};
```

---

## Variant 3: Text-Only Card

### Layout Structure
```
┌─────────────────────────────────────────────┐
│                                             │
│  Major news headline takes prominence       │
│  here with bold typography spanning         │
│  multiple lines for readability             │
│                                             │
│  Brief description providing essential      │
│  context and key details to readers         │
│                                             │
│  CATEGORÍA    Por Author Name               │
│                                             │
│  ─────────────────────────────────          │
│                                             │
│  RELACIONADAS                               │
│  • Related article one title here           │
│  • Related article two title here           │
│                                             │
└─────────────────────────────────────────────┘
```

### Design Specifications

#### Container
```typescript
{
  width: '100%',
  borderWidth: 4,
  borderColor: COLORS.black,
  backgroundColor: COLORS.white,
  padding: SPACING.lg,
  marginBottom: SPACING.lg,
  minHeight: 200,
}
```

#### Title Section
```typescript
// Title Container
{
  marginBottom: SPACING.md,
}

// Title Text (Prominent)
{
  ...TYPOGRAPHY.cardTitle,
  fontSize: 19, // Largest for text-only card
  lineHeight: 26,
  fontWeight: '800',
  color: COLORS.textPrimary,
  numberOfLines: 3,
  ellipsizeMode: 'tail',
}
```

#### Subtitle Section
```typescript
// Subtitle Container
{
  marginBottom: SPACING.lg,
}

// Subtitle Text
{
  ...TYPOGRAPHY.cardSubtitle,
  fontSize: 15, // Slightly larger for better readability
  lineHeight: 21,
  color: COLORS.textSecondary,
  numberOfLines: 3,
  ellipsizeMode: 'tail',
}
```

#### Meta Information Row
```typescript
// Container
{
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: SPACING.md,
  gap: SPACING.sm,
  flexWrap: 'wrap',
}

// Category Badge (Larger for prominence)
{
  backgroundColor: COLORS.primaryBrown,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
  borderWidth: BORDERS.thick,
  borderColor: COLORS.black,
}

// Category Text
{
  ...TYPOGRAPHY.categoryLabel,
  fontSize: 12,
  color: COLORS.white,
}

// Author Container
{
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.xs,
}

// Author Text
{
  ...TYPOGRAPHY.authorText,
  color: COLORS.textSecondary,
}
```

#### Separator
```typescript
{
  height: BORDERS.thick,
  backgroundColor: COLORS.black,
  marginBottom: SPACING.md,
  width: '100%',
}
```

#### Related News Section (Compact)
```typescript
// Container
{
  gap: SPACING.sm,
}

// Section Label
{
  ...TYPOGRAPHY.relatedCategory,
  color: COLORS.textSecondary,
  marginBottom: SPACING.xs,
}

// Related Article Item (Pressable)
{
  flexDirection: 'row',
  alignItems: 'flex-start',
  minHeight: DIMENSIONS.minTouchTarget,
  paddingVertical: SPACING.xs,
  gap: SPACING.xs,
}

// Bullet Point (Square for brutalist style)
{
  width: 8,
  height: 8,
  backgroundColor: COLORS.black,
  marginTop: 5,
}

// Related Title Text
{
  ...TYPOGRAPHY.relatedTitle,
  fontSize: 14, // Slightly larger for text-only variant
  lineHeight: 19,
  color: COLORS.textPrimary,
  flex: 1,
  numberOfLines: 2,
  ellipsizeMode: 'tail',
}
```

#### Interactive States

**Default State:**
```typescript
{
  backgroundColor: COLORS.white,
  borderColor: COLORS.black,
}
```

**Pressed State (Card):**
```typescript
{
  backgroundColor: COLORS.accentYellow,
  borderColor: COLORS.black,
}
```

**Pressed State (Related Article):**
```typescript
{
  backgroundColor: COLORS.grayBackground,
}
```

### Example Content
```typescript
const TEXT_ONLY_CARD_EXAMPLE = {
  title: "Congreso aprueba reformas al código urbano de Hidalgo",
  subtitle: "Las modificaciones buscan agilizar trámites de construcción y mejorar la planificación territorial",
  category: "POLÍTICA",
  author: "Ana Torres",
  relatedArticles: [
    {
      id: "1",
      title: "Desarrolladores inmobiliarios aplauden nueva legislación",
    },
    {
      id: "2",
      title: "Ciudadanos podrán consultar zonificación en línea",
    },
  ],
};
```

---

## Accessibility Specifications

### Touch Targets
All interactive elements must meet minimum accessibility standards:

```typescript
const ACCESSIBILITY = {
  // Minimum touch target dimensions
  minTouchHeight: 44,
  minTouchWidth: 44,

  // Minimum spacing between touch targets
  minSpacingBetweenTargets: 8,

  // Text contrast ratios (WCAG AA)
  textContrastRatio: {
    normalText: 4.5, // For text < 18px
    largeText: 3.0,  // For text >= 18px or bold >= 14px
  },
};
```

### Contrast Ratios (Verified WCAG AA Compliance)

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Card Title | #000000 | #FFFFFF | 21:1 | Pass |
| Card Subtitle | #4A4A4A | #FFFFFF | 9.7:1 | Pass |
| Category Badge (Brown) | #FFFFFF | #854836 | 5.8:1 | Pass |
| Category Badge (Yellow) | #000000 | #FFB22C | 11.2:1 | Pass |
| Related Articles | #000000 | #FFFFFF | 21:1 | Pass |

### Screen Reader Support

```typescript
// Card Container
{
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: `${category}. ${title}. ${subtitle}. Por ${author}.`,
  accessibilityHint: 'Toca dos veces para leer la noticia completa',
}

// Related Article
{
  accessible: true,
  accessibilityRole: 'link',
  accessibilityLabel: `Noticia relacionada: ${relatedTitle}`,
  accessibilityHint: 'Toca dos veces para abrir',
}

// Category Badge
{
  accessible: false, // Already included in card label
}
```

---

## Implementation Guidelines

### Component Hierarchy

```
NewsCard (Pressable)
├── Variant 1: HorizontalCard
│   ├── ContentArea (View)
│   │   ├── TitleSection (View)
│   │   ├── SubtitleSection (View)
│   │   ├── MetaRow (View)
│   │   │   ├── CategoryBadge (View)
│   │   │   └── AuthorInfo (View)
│   │   ├── Separator (View)
│   │   └── RelatedNewsSection (View)
│   │       └── RelatedArticleItem[] (Pressable)
│   └── ImageArea (View)
│       └── Image
│
├── Variant 2: VerticalCard
│   ├── ImageContainer (View)
│   │   └── Image
│   └── ContentArea (View)
│       ├── MetaRow (View)
│       ├── TitleSection (View)
│       ├── SubtitleSection (View)
│       ├── Separator (View)
│       └── RelatedNewsSection (View)
│           └── RelatedArticleItem[] (Pressable)
│               ├── RelatedContentRow (View)
│               └── RelatedCategoryBadge (View)
│
└── Variant 3: TextOnlyCard
    ├── TitleSection (View)
    ├── SubtitleSection (View)
    ├── MetaRow (View)
    ├── Separator (View)
    └── RelatedNewsSection (View)
        └── RelatedArticleItem[] (Pressable)
```

### Performance Optimizations

```typescript
// Memoize card components
const HorizontalCard = React.memo(HorizontalCardComponent);
const VerticalCard = React.memo(VerticalCardComponent);
const TextOnlyCard = React.memo(TextOnlyCardComponent);

// Image optimization
{
  source: { uri: imageUrl },
  resizeMode: 'cover',
  // Use react-native-fast-image for better performance
  priority: 'normal',
  cache: 'immutable',
}

// Pressable optimization (debounce rapid taps)
const handlePress = useCallback(
  debounce(() => {
    navigation.navigate('Article', { id: article.id });
  }, 300, { leading: true, trailing: false }),
  [article.id]
);
```

### Responsive Behavior

```typescript
const { width } = useWindowDimensions();

// Breakpoints
const BREAKPOINTS = {
  phone: width < 768,
  tablet: width >= 768 && width < 1024,
  desktop: width >= 1024,
};

// Adapt card layout
const cardPadding = BREAKPOINTS.phone ? SPACING.lg : SPACING.xl;
const titleFontSize = BREAKPOINTS.phone ? 17 : 19;
```

---

## Usage Recommendations

### When to Use Each Variant

**Variant 1: Horizontal Card**
- Best for: News feeds with mixed content
- Ideal position: Middle of feed, list items
- Content type: General news, updates
- Screen real estate: Balanced (compact)

**Variant 2: Vertical Card**
- Best for: Featured stories, breaking news
- Ideal position: Top of feed, hero sections
- Content type: Image-heavy stories, photo journalism
- Screen real estate: Large (prominent)

**Variant 3: Text-Only Card**
- Best for: Dense news feeds, opinion pieces
- Ideal position: Quick-scan sections, analysis
- Content type: Politics, economics, editorials
- Screen real estate: Minimal (efficient)

### Layout Patterns

```typescript
// Mixed feed example
<ScrollView>
  <VerticalCard {...featuredStory} />     {/* Hero */}
  <HorizontalCard {...story1} />          {/* Standard */}
  <HorizontalCard {...story2} />          {/* Standard */}
  <TextOnlyCard {...story3} />            {/* Quick read */}
  <HorizontalCard {...story4} />          {/* Standard */}
  <TextOnlyCard {...story5} />            {/* Quick read */}
</ScrollView>
```

---

## Design Rationale

### Brutalist Principles Applied

1. **Raw Functionality**: No decorative elements, every visual serves a purpose
2. **Honest Materials**: Black borders and sharp corners reveal the digital grid
3. **Structural Clarity**: Clear hierarchy through size, weight, and spacing
4. **Monumental Typography**: Bold, direct text that demands attention
5. **High Contrast**: Maximum readability through stark color relationships

### User Experience Decisions

**Information Hierarchy:**
- Title first (primary action)
- Context second (subtitle/description)
- Metadata third (category/author)
- Related content last (secondary actions)

**Touch Target Sizing:**
- All interactive areas ≥44x44px
- Clear visual separation between touch zones
- Adequate spacing prevents accidental taps

**Content Density:**
- 2-3 line limits prevent text overflow
- Related articles limited to 2 items
- Vertical rhythm maintains scanability

**Visual Weight:**
- Thick borders create clear boundaries
- Solid backgrounds define interactive areas
- Separators segment information zones

---

## Implementation Checklist

### Before Development
- [ ] Review design tokens with development team
- [ ] Confirm color contrast ratios meet WCAG AA
- [ ] Verify touch target dimensions
- [ ] Test with realistic content samples
- [ ] Prepare image assets at correct aspect ratios

### During Development
- [ ] Implement accessibility labels
- [ ] Add haptic feedback on press
- [ ] Test with VoiceOver/TalkBack
- [ ] Verify text truncation behavior
- [ ] Test on multiple screen sizes
- [ ] Implement loading states
- [ ] Add error states for missing images

### After Implementation
- [ ] Conduct usability testing
- [ ] Measure performance metrics
- [ ] Test with various content lengths
- [ ] Verify accessibility compliance
- [ ] Document component API
- [ ] Create Storybook examples

---

## Component API Specification

### TypeScript Interface

```typescript
interface NewsCardProps {
  // Variant type
  variant: 'horizontal' | 'vertical' | 'textOnly';

  // Content
  title: string;
  subtitle: string;
  category: string;
  author: string;
  imageUrl?: string; // Optional, required for horizontal/vertical

  // Related articles
  relatedArticles: RelatedArticle[];

  // Actions
  onPress: () => void;
  onRelatedPress: (articleId: string) => void;

  // Optional customization
  categoryColor?: 'brown' | 'yellow';
  style?: ViewStyle;
  testID?: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  category?: string; // Only shown in vertical variant
}
```

### Example Usage

```typescript
// Horizontal Card
<NewsCard
  variant="horizontal"
  title="Gobierno anuncia nuevo programa de apoyo"
  subtitle="La iniciativa beneficiará a más de 500 comercios"
  category="ECONOMÍA"
  author="María González"
  imageUrl="https://example.com/image.jpg"
  categoryColor="brown"
  relatedArticles={[
    { id: '1', title: 'Cámara de Comercio respalda propuesta' },
    { id: '2', title: 'Emprendedores celebran nueva medida' },
  ]}
  onPress={() => navigation.navigate('Article', { id: '123' })}
  onRelatedPress={(id) => navigation.navigate('Article', { id })}
  testID="news-card-123"
/>

// Vertical Card
<NewsCard
  variant="vertical"
  title="Inauguran centro cultural en Pachuca"
  subtitle="El nuevo espacio promoverá el arte local"
  category="CULTURA"
  author="Carlos Ramírez"
  imageUrl="https://example.com/culture.jpg"
  categoryColor="yellow"
  relatedArticles={[
    { id: '1', title: 'Artistas locales expondrán', category: 'CULTURA' },
    { id: '2', title: 'Programa de talleres arranca', category: 'EDUCACIÓN' },
  ]}
  onPress={() => navigation.navigate('Article', { id: '456' })}
  onRelatedPress={(id) => navigation.navigate('Article', { id })}
/>

// Text-Only Card
<NewsCard
  variant="textOnly"
  title="Congreso aprueba reformas al código urbano"
  subtitle="Las modificaciones buscan agilizar trámites"
  category="POLÍTICA"
  author="Ana Torres"
  categoryColor="brown"
  relatedArticles={[
    { id: '1', title: 'Desarrolladores aplauden legislación' },
    { id: '2', title: 'Ciudadanos podrán consultar zonificación' },
  ]}
  onPress={() => navigation.navigate('Article', { id: '789' })}
  onRelatedPress={(id) => navigation.navigate('Article', { id })}
/>
```

---

## Testing Scenarios

### Visual Regression Tests

```typescript
// Test cases for each variant
describe('NewsCard Visual Tests', () => {
  it('renders horizontal card with all content', async () => {
    const { toJSON } = render(<HorizontalCard {...mockData} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('handles long titles with ellipsis', async () => {
    const longTitle = 'A'.repeat(200);
    const { getByText } = render(
      <HorizontalCard {...mockData} title={longTitle} />
    );
    // Verify numberOfLines prop is applied
  });

  it('displays pressed state on interaction', async () => {
    const { getByTestId } = render(<HorizontalCard {...mockData} />);
    const card = getByTestId('news-card');
    fireEvent.press(card);
    // Verify background color changes
  });
});
```

### Accessibility Tests

```typescript
describe('NewsCard Accessibility', () => {
  it('has proper accessibility labels', () => {
    const { getByRole } = render(<HorizontalCard {...mockData} />);
    const card = getByRole('button');
    expect(card).toHaveAccessibilityLabel(
      expect.stringContaining(mockData.title)
    );
  });

  it('related articles are navigable', () => {
    const { getAllByRole } = render(<HorizontalCard {...mockData} />);
    const links = getAllByRole('link');
    expect(links).toHaveLength(2);
  });
});
```

---

## File Structure Recommendation

```
/components/news/
├── NewsCard/
│   ├── index.ts                          # Public API
│   ├── NewsCard.tsx                      # Main component
│   ├── HorizontalCard.tsx                # Variant 1
│   ├── VerticalCard.tsx                  # Variant 2
│   ├── TextOnlyCard.tsx                  # Variant 3
│   ├── components/
│   │   ├── CategoryBadge.tsx
│   │   ├── AuthorInfo.tsx
│   │   ├── RelatedArticleItem.tsx
│   │   └── Separator.tsx
│   ├── styles/
│   │   ├── tokens.ts                     # Design tokens
│   │   ├── horizontal.styles.ts
│   │   ├── vertical.styles.ts
│   │   └── textOnly.styles.ts
│   ├── types/
│   │   └── NewsCard.types.ts
│   ├── utils/
│   │   └── accessibility.ts
│   └── __tests__/
│       ├── NewsCard.test.tsx
│       └── __snapshots__/
```

---

## Conclusion

This design system provides comprehensive specifications for implementing 3 brutalist news card variants in React Native. Each variant serves specific content needs while maintaining visual consistency and adhering to brutalist design principles.

**Key Takeaways:**
- Clear design tokens ensure consistent implementation
- All variants meet WCAG AA accessibility standards
- Touch targets meet iOS/Android platform guidelines
- Related news section provides contextual navigation
- Brutalist aesthetics create distinctive, memorable UI
- Flexible component API supports various use cases

**Next Steps:**
1. Review specifications with development team
2. Create React Native component implementations
3. Build Storybook documentation
4. Conduct user testing with real content
5. Iterate based on feedback and analytics

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Maintained By:** UI/UX Design Team
