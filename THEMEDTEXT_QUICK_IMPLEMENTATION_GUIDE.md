# ThemedText Quick Implementation Guide
## Ready-to-Use Code Snippets for 2025/2026

**Quick Reference for:** Coyotito
**Project:** Noticias Pachuca Mobile App

---

## Current Status: Your Implementation is EXCELLENT

Your ThemedText component at `/packages/mobile-expo/src/components/ThemedText/ThemedText.tsx` already implements best practices. This guide provides optional enhancements.

---

## Quick Wins (Copy-Paste Ready)

### 1. Add NativeWind className Support (5 minutes)

**File:** `/packages/mobile-expo/src/components/ThemedText/types.ts`

```typescript
// ADD to ThemedTextProps interface (line 88)
export interface ThemedTextProps extends Omit<TextProps, 'style'> {
  /** Variante de texto predefinida */
  variant?: TextVariant

  /** NativeWind className support (NEW) */
  className?: string  // <-- ADD THIS LINE

  /** Color del texto (semantic colors) */
  color?: keyof ThemedTextTheme['light']

  // ... rest of props
}
```

**File:** `/packages/mobile-expo/src/components/ThemedText/ThemedText.tsx`

```typescript
// UPDATE component signature (line 41)
export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  variant = 'body-medium',
  color = 'primary',
  className,  // <-- ADD THIS LINE
  customColor,
  weight,
  // ... rest of props
}) => {
  // ... existing code

  // UPDATE return statement (line 174)
  return (
    <Text
      className={className}  // <-- ADD THIS LINE
      style={finalStyle}
      selectable={selectable}
      allowFontScaling={accessibilityProps.allowFontScaling}
      maxFontSizeMultiplier={accessibilityProps.maxFontSizeMultiplier}
      testID={testID}
      accessibilityRole="text"
      {...truncationProps}
      {...textProps}
    >
      {children}
    </Text>
  )
}
```

**Usage:**
```tsx
<ThemedText
  variant="headline-large"
  className="mb-4 text-red-500 dark:text-red-400"
>
  Breaking News!
</ThemedText>
```

---

### 2. Add News-Specific Variants (10 minutes)

**File:** `/packages/mobile-expo/src/components/ThemedText/types.ts`

```typescript
// ADD to TextVariant type (after line 22)
export type TextVariant =
  | 'display-large'
  | 'display-medium'
  | 'display-small'
  | 'headline-large'
  | 'headline-medium'
  | 'headline-small'
  | 'title-large'
  | 'title-medium'
  | 'title-small'
  | 'body-large'
  | 'body-medium'
  | 'body-small'
  | 'label-large'
  | 'label-medium'
  | 'label-small'
  | 'caption'
  | 'overline'
  // NEWS-SPECIFIC VARIANTS (NEW)
  | 'article-title'      // 28px - Títulos de artículos
  | 'article-subtitle'   // 18px - Subtítulos de artículos
  | 'article-body'       // 17px - Cuerpo de artículos (optimizado lectura)
  | 'article-caption'    // 13px - Pies de foto
  | 'breaking-news'      // 16px - Etiquetas de noticias urgentes
```

**File:** `/packages/mobile-expo/src/components/ThemedText/utils.ts`

```typescript
// ADD to FONT_VARIANTS (after line 107)
export const FONT_VARIANTS: VariantDefinition = {
  // ... existing variants

  // NEWS-SPECIFIC VARIANTS
  'article-title': {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
    fontWeight: 'bold'
  },
  'article-subtitle': {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0,
    fontWeight: 'medium'
  },
  'article-body': {
    fontSize: 17,
    lineHeight: 28,        // Optimized for reading
    letterSpacing: 0.3,
    fontWeight: 'regular'
  },
  'article-caption': {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    fontWeight: 'regular'
  },
  'breaking-news': {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.8,
    fontWeight: 'bold'
  }
}
```

**File:** `/packages/mobile-expo/src/components/ThemedText/ThemedText.tsx`

```typescript
// ADD at bottom of file (after line 257)

// NEWS-SPECIFIC COMPONENT EXPORTS
export const ArticleTitle = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText variant="article-title" {...props} />
)

export const ArticleSubtitle = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText variant="article-subtitle" {...props} />
)

export const ArticleBody = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText
    variant="article-body"
    accessibility={{ maxFontSizeMultiplier: 1.5 }} // Allow more scaling for reading
    {...props}
  />
)

export const ArticleCaption = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText variant="article-caption" color="secondary" {...props} />
)

export const BreakingNewsLabel = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText
    variant="breaking-news"
    color="error"
    transform="uppercase"
    {...props}
  />
)
```

**File:** `/packages/mobile-expo/src/components/ThemedText/index.ts`

```typescript
// UPDATE exports (add these lines)
export {
  ThemedText,
  Display,
  Headline,
  Title,
  Body,
  Label,
  Caption,
  Overline,
  // NEWS-SPECIFIC EXPORTS (NEW)
  ArticleTitle,
  ArticleSubtitle,
  ArticleBody,
  ArticleCaption,
  BreakingNewsLabel
} from './ThemedText'

export * from './types'
```

**Usage:**
```tsx
import {
  ArticleTitle,
  ArticleSubtitle,
  ArticleBody,
  BreakingNewsLabel
} from '@/components/ThemedText'

// In your article screen:
<ScrollView className="px-4">
  <BreakingNewsLabel className="mb-2">
    Última hora
  </BreakingNewsLabel>

  <ArticleTitle className="mb-3">
    Gran desarrollo en la industria tecnológica
  </ArticleTitle>

  <ArticleSubtitle className="mb-6">
    Líderes de la industria responden a nuevas regulaciones
  </ArticleSubtitle>

  <ArticleBody>
    {article.content}
  </ArticleBody>
</ScrollView>
```

---

### 3. Increase Font Scaling for Article Content (2 minutes)

For better accessibility in article reading:

**File:** `/packages/mobile-expo/src/components/ThemedText/utils.ts`

```typescript
// UPDATE line 344
export const DEFAULT_ACCESSIBILITY_CONFIG = {
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.3,  // Change from 1.2 to 1.3
  respectDeviceSettings: true,
  dynamicTypeScaling: false
}
```

**Alternative:** Keep global at 1.2, but allow article content to scale more:

```tsx
// In article components
<ArticleBody
  accessibility={{ maxFontSizeMultiplier: 1.5 }}
>
  {content}
</ArticleBody>
```

---

### 4. Add Truncation with "Read More" (15 minutes)

**File:** `/packages/mobile-expo/src/components/ThemedText/TruncatedText.tsx` (NEW FILE)

```typescript
import React, { useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { ThemedText, type ThemedTextProps } from './ThemedText'

interface TruncatedTextProps extends ThemedTextProps {
  /** Maximum number of lines before truncation */
  maxLines: number
  /** Allow expansion when tapped */
  expandable?: boolean
  /** Callback when expanded */
  onExpand?: () => void
  /** Custom "Read more" text */
  expandLabel?: string
  /** Custom "Show less" text */
  collapseLabel?: string
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  children,
  maxLines,
  expandable = true,
  onExpand,
  expandLabel = 'Leer más',
  collapseLabel = 'Mostrar menos',
  ...props
}) => {
  const [expanded, setExpanded] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)

  const handleTextLayout = useCallback((e: any) => {
    const { lines } = e.nativeEvent
    if (lines && lines.length > maxLines) {
      setShouldTruncate(true)
    }
  }, [maxLines])

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev)
    if (!expanded) {
      onExpand?.()
    }
  }, [expanded, onExpand])

  return (
    <View>
      <ThemedText
        numberOfLines={expanded ? undefined : maxLines}
        onTextLayout={handleTextLayout}
        {...props}
      >
        {children}
      </ThemedText>

      {shouldTruncate && expandable && (
        <TouchableOpacity onPress={handleToggle} className="mt-2">
          <ThemedText
            variant="label-medium"
            color="accent"
            weight="semibold"
          >
            {expanded ? collapseLabel : expandLabel}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

**File:** `/packages/mobile-expo/src/components/ThemedText/index.ts`

```typescript
// ADD export
export { TruncatedText } from './TruncatedText'
```

**Usage:**
```tsx
import { TruncatedText } from '@/components/ThemedText'

<TruncatedText
  variant="body-medium"
  maxLines={3}
  expandable={true}
  onExpand={() => console.log('Article expanded')}
>
  {longArticleSummary}
</TruncatedText>
```

---

### 5. Global Font Scaling Override (1 minute)

If you need to disable font scaling for specific UI elements:

```tsx
// For fixed-size UI elements (tabs, buttons)
<ThemedText
  variant="label-medium"
  accessibility={{
    allowFontScaling: false  // Disable for this component
  }}
>
  Tab Label
</ThemedText>

// Or set maxFontSizeMultiplier to 1.0
<ThemedText
  variant="label-large"
  accessibility={{
    maxFontSizeMultiplier: 1.0  // No scaling
  }}
>
  Button Text
</ThemedText>
```

---

## Complete Usage Examples

### Example 1: Article Screen

```tsx
// app/article/[id].tsx
import { ScrollView, View, Image } from 'react-native'
import {
  ArticleTitle,
  ArticleSubtitle,
  ArticleBody,
  ArticleCaption,
  BreakingNewsLabel,
  ThemedText
} from '@/components/ThemedText'

export default function ArticleScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-4 pt-4">
        {/* Breaking news badge */}
        {article.isBreaking && (
          <BreakingNewsLabel className="mb-3">
            Última hora
          </BreakingNewsLabel>
        )}

        {/* Article title */}
        <ArticleTitle className="mb-3">
          {article.title}
        </ArticleTitle>

        {/* Article subtitle */}
        <ArticleSubtitle className="mb-6 text-gray-700 dark:text-gray-300">
          {article.subtitle}
        </ArticleSubtitle>

        {/* Metadata */}
        <View className="flex-row items-center mb-6">
          <ThemedText variant="label-medium" color="secondary">
            Por {article.author}
          </ThemedText>
          <ThemedText variant="label-medium" color="muted" className="ml-2">
            • {formatDate(article.date)}
          </ThemedText>
        </View>

        {/* Featured image */}
        <Image
          source={{ uri: article.imageUrl }}
          className="w-full h-64 rounded-lg mb-2"
          resizeMode="cover"
        />

        {/* Image caption */}
        <ArticleCaption className="mb-6">
          {article.imageCaption}
        </ArticleCaption>

        {/* Article body */}
        <ArticleBody className="mb-8">
          {article.content}
        </ArticleBody>

        {/* Tags */}
        <View className="flex-row flex-wrap mb-8">
          {article.tags.map(tag => (
            <ThemedText
              key={tag}
              variant="label-small"
              className="px-3 py-1 mr-2 mb-2 bg-blue-100 dark:bg-blue-900 rounded-full"
            >
              {tag}
            </ThemedText>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
```

### Example 2: News Card Component

```tsx
// components/NewsCard.tsx
import { TouchableOpacity, View, Image } from 'react-native'
import { ThemedText, TruncatedText } from '@/components/ThemedText'

interface NewsCardProps {
  article: Article
  onPress: () => void
}

export function NewsCard({ article, onPress }: NewsCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden mb-4 shadow-sm"
    >
      {/* Image */}
      <Image
        source={{ uri: article.thumbnailUrl }}
        className="w-full h-48"
        resizeMode="cover"
      />

      <View className="p-4">
        {/* Category badge */}
        <ThemedText
          variant="label-small"
          className="mb-2 text-blue-600 dark:text-blue-400"
          transform="uppercase"
        >
          {article.category}
        </ThemedText>

        {/* Title */}
        <ThemedText
          variant="title-medium"
          weight="bold"
          className="mb-2"
          truncate={2}
        >
          {article.title}
        </ThemedText>

        {/* Summary */}
        <TruncatedText
          variant="body-small"
          color="secondary"
          maxLines={3}
          expandable={false}
        >
          {article.summary}
        </TruncatedText>

        {/* Metadata */}
        <View className="flex-row items-center mt-3">
          <ThemedText variant="caption" color="muted">
            {formatDate(article.date)}
          </ThemedText>

          <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />

          <ThemedText variant="caption" color="muted">
            {article.readTime} min de lectura
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  )
}
```

### Example 3: News Feed List

```tsx
// app/(tabs)/index.tsx
import { FlashList } from '@legendapp/list'
import { View } from 'react-native'
import { ThemedText, BreakingNewsLabel } from '@/components/ThemedText'
import { NewsCard } from '@/components/NewsCard'

export default function HomeScreen() {
  const { data: articles } = useArticles()

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlashList
        data={articles}
        renderItem={({ item }) => (
          <View className="px-4">
            {item.isBreaking && (
              <BreakingNewsLabel className="mb-2">
                Breaking News
              </BreakingNewsLabel>
            )}
            <NewsCard
              article={item}
              onPress={() => router.push(`/article/${item.id}`)}
            />
          </View>
        )}
        estimatedItemSize={280}
        ListHeaderComponent={() => (
          <View className="p-4">
            <ThemedText variant="display-medium" weight="bold">
              Últimas Noticias
            </ThemedText>
            <ThemedText variant="body-medium" color="secondary" className="mt-2">
              Mantente informado con lo último de Pachuca
            </ThemedText>
          </View>
        )}
      />
    </View>
  )
}
```

### Example 4: Settings Screen with Font Size Preview

```tsx
// app/settings/typography.tsx
import { View, ScrollView } from 'react-native'
import { ThemedText } from '@/components/ThemedText'

export default function TypographySettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4">
      <ThemedText variant="headline-medium" className="mb-6">
        Vista previa de tipografía
      </ThemedText>

      {/* Display variants */}
      <Section title="Display">
        <ThemedText variant="display-large">Display Large</ThemedText>
        <ThemedText variant="display-medium">Display Medium</ThemedText>
        <ThemedText variant="display-small">Display Small</ThemedText>
      </Section>

      {/* Headline variants */}
      <Section title="Headlines">
        <ThemedText variant="headline-large">Headline Large</ThemedText>
        <ThemedText variant="headline-medium">Headline Medium</ThemedText>
        <ThemedText variant="headline-small">Headline Small</ThemedText>
      </Section>

      {/* Article variants */}
      <Section title="Article (News-Specific)">
        <ThemedText variant="article-title">Article Title</ThemedText>
        <ThemedText variant="article-subtitle">Article Subtitle</ThemedText>
        <ThemedText variant="article-body">
          Article Body - Optimized for reading with comfortable line height
          and spacing. Perfect for long-form content.
        </ThemedText>
        <ThemedText variant="article-caption">Article Caption</ThemedText>
      </Section>

      {/* Body variants */}
      <Section title="Body">
        <ThemedText variant="body-large">Body Large</ThemedText>
        <ThemedText variant="body-medium">Body Medium (Default)</ThemedText>
        <ThemedText variant="body-small">Body Small</ThemedText>
      </Section>

      {/* Label variants */}
      <Section title="Labels">
        <ThemedText variant="label-large">Label Large</ThemedText>
        <ThemedText variant="label-medium">Label Medium</ThemedText>
        <ThemedText variant="label-small">Label Small</ThemedText>
      </Section>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <ThemedText variant="title-medium" className="mb-4 text-blue-600">
        {title}
      </ThemedText>
      <View className="space-y-2">
        {children}
      </View>
    </View>
  )
}
```

---

## Testing Checklist

```typescript
// Test script for accessibility
// app/test-typography.tsx

import { View, ScrollView, Button } from 'react-native'
import { useState } from 'react'
import { ThemedText } from '@/components/ThemedText'

export default function TypographyTestScreen() {
  const [fontScale, setFontScale] = useState(1.0)

  return (
    <ScrollView className="flex-1 p-4">
      <ThemedText variant="headline-large" className="mb-4">
        Typography Test
      </ThemedText>

      {/* Font scale controls */}
      <View className="flex-row mb-6">
        <Button title="1.0x" onPress={() => setFontScale(1.0)} />
        <Button title="1.3x" onPress={() => setFontScale(1.3)} />
        <Button title="1.5x" onPress={() => setFontScale(1.5)} />
        <Button title="2.0x" onPress={() => setFontScale(2.0)} />
      </View>

      <ThemedText variant="body-medium" className="mb-4">
        Current scale: {fontScale}x
      </ThemedText>

      {/* Test all variants */}
      <TestVariant variant="article-title" scale={fontScale} />
      <TestVariant variant="article-body" scale={fontScale} />
      <TestVariant variant="body-medium" scale={fontScale} />
    </ScrollView>
  )
}

function TestVariant({ variant, scale }: { variant: string; scale: number }) {
  return (
    <View className="mb-4 p-4 border border-gray-300 rounded">
      <ThemedText
        variant={variant as any}
        accessibility={{ maxFontSizeMultiplier: scale }}
      >
        Testing {variant} at {scale}x scale
      </ThemedText>
    </View>
  )
}
```

**Manual Tests:**
```bash
# 1. Test on different devices
npm run ios  # Test on iPhone SE, 14 Pro, iPad
npm run android  # Test on small/large Android devices

# 2. Enable accessibility
# iOS: Settings > Accessibility > Display & Text Size > Larger Text
# Android: Settings > Display > Font size

# 3. Test with VoiceOver/TalkBack
# iOS: Settings > Accessibility > VoiceOver
# Android: Settings > Accessibility > TalkBack

# 4. Test dark mode
# Swipe up on home screen or Settings > Display
```

---

## Performance Monitoring

```typescript
// utils/performance-monitor.ts
import { useEffect, useRef } from 'react'

export function useRenderCount(componentName: string) {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    console.log(`${componentName} rendered ${renderCount.current} times`)
  })
}

// Usage in ThemedText:
// useRenderCount('ThemedText')
```

**Expected Results:**
- ThemedText should re-render only when props change
- Scrolling through FlashList should maintain 60fps
- Theme changes should update within 16ms

---

## Troubleshooting

### Problem: Text looks blurry on Android

**Solution:** Ensure pixel-perfect sizing
```typescript
import { PixelRatio } from 'react-native'

const fontSize = PixelRatio.roundToNearestPixel(16)
```

### Problem: Custom fonts not loading

**Solution:** Check expo-font is loaded
```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font'

const [fontsLoaded] = useFonts({
  'Aleo-Regular': require('../assets/fonts/Aleo-Regular.ttf'),
  // ... all Aleo variants
})

if (!fontsLoaded) {
  return <SplashScreen />
}
```

### Problem: NativeWind classes not working

**Solution:** Ensure proper configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  // ...
}
```

### Problem: Text cut off on small screens

**Solution:** Enable responsive scaling
```tsx
<ThemedText
  variant="headline-large"
  responsive={true}  // Enable auto-scaling
>
  Very Long Title
</ThemedText>
```

---

## What NOT to Do

```tsx
// ❌ DON'T: Create new style objects on every render
<ThemedText style={{ fontSize: 16, color: '#000' }}>Bad</ThemedText>

// ✓ DO: Use variants or memoized styles
<ThemedText variant="body-medium">Good</ThemedText>

// ❌ DON'T: Disable font scaling globally
<ThemedText accessibility={{ allowFontScaling: false }}>Bad</ThemedText>

// ✓ DO: Use maxFontSizeMultiplier to limit scaling
<ThemedText accessibility={{ maxFontSizeMultiplier: 1.3 }}>Good</ThemedText>

// ❌ DON'T: Apply too many utility classes
<ThemedText className="text-lg font-bold text-blue-500 dark:text-blue-400 mb-4 mt-2 px-4 py-2">
  Too many classes
</ThemedText>

// ✓ DO: Use variants + minimal utility classes
<ThemedText variant="title-large" className="mb-4 text-blue-500">
  Clean and maintainable
</ThemedText>

// ❌ DON'T: Set fixed heights on text containers
<View style={{ height: 100 }}>
  <ThemedText>Text might overflow</ThemedText>
</View>

// ✓ DO: Let text determine container height
<View>
  <ThemedText>Text will fit properly</ThemedText>
</View>
```

---

## Summary: What You Should Implement

**Priority 1 (Recommended):**
1. Add className support for NativeWind integration
2. Add news-specific variants (article-title, article-body, etc.)

**Priority 2 (Optional):**
3. Create convenience components (ArticleTitle, ArticleBody)
4. Add TruncatedText component for summaries
5. Increase maxFontSizeMultiplier to 1.3 for article content

**Priority 3 (Nice to have):**
6. Create typography showcase screen
7. Add performance monitoring
8. Document all variants in Storybook

---

**Your current implementation is already production-ready!** These enhancements will make it even better for your news app context.

**Happy coding, Coyotito!** 🚀

**- Jarvis (Technical Researcher)**
