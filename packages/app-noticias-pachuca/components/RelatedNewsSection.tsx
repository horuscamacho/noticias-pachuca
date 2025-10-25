/**
 * RelatedNewsSection Component
 * Container for related news articles with header
 *
 * @example
 * ```tsx
 * <RelatedNewsSection
 *   articles={[
 *     {
 *       id: '1',
 *       title: 'First related article',
 *       category: 'POLÍTICA',
 *       author: 'John Doe',
 *       imageUrl: 'https://...',
 *       slug: 'first-article',
 *     },
 *     // ... 2 more articles
 *   ]}
 *   onArticlePress={(slug) => navigation.navigate('Article', { slug })}
 *   sectionTitle="NOTICIAS RELACIONADAS"
 * />
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { RelatedNewsCard, RelatedNewsArticle } from './RelatedNewsCard';

/**
 * Props for RelatedNewsSection component
 */
export interface RelatedNewsSectionProps {
  /** Array of related articles (typically 3 items) */
  articles: RelatedNewsArticle[];
  /** Callback when any article is pressed */
  onArticlePress: (slug: string) => void;
  /** Custom section title (defaults to "NOTICIAS RELACIONADAS") */
  sectionTitle?: string;
  /** Test identifier for automated testing */
  testID?: string;
}

/**
 * Brutalist design tokens
 */
const TOKENS = {
  colors: {
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    md: 12,
    lg: 16,
  },
  borders: {
    thick: 4,
  },
  typography: {
    header: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
  },
} as const;

/**
 * RelatedNewsSection - Container with header and card list
 *
 * Features:
 * - Bold uppercase section header
 * - White background with black top/bottom borders
 * - Vertical list of 3 related news cards
 * - Black separators between cards
 * - No spacing between cards (tight layout)
 * - Full accessibility support
 * - Optimized with React.memo
 */
export const RelatedNewsSection = React.memo<RelatedNewsSectionProps>(
  ({ articles, onArticlePress, sectionTitle = 'NOTICIAS RELACIONADAS', testID }) => {
    // Early return if no articles
    if (!articles || articles.length === 0) {
      return null;
    }

    // Determine category colors (alternating brown/yellow for visual variety)
    const getCategoryColor = (index: number): 'brown' | 'yellow' => {
      return index % 2 === 0 ? 'brown' : 'yellow';
    };

    return (
      <View
        style={styles.container}
        accessibilityRole="region"
        accessibilityLabel={`Sección de ${sectionTitle.toLowerCase()}`}
        testID={testID || 'related-news-section'}
      >
        {/* Section Header */}
        <View style={styles.headerContainer}>
          <ThemedText
            variant="caption"
            style={styles.headerText}
            accessibilityRole="header"
          >
            {sectionTitle}
          </ThemedText>
        </View>

        {/* Cards List */}
        <View style={styles.cardsContainer}>
          {articles.map((article, index) => (
            <RelatedNewsCard
              key={article.id}
              article={article}
              onPress={onArticlePress}
              categoryColor={getCategoryColor(index)}
              isLastCard={index === articles.length - 1}
              testID={`${testID || 'related-news-section'}-card-${index}`}
            />
          ))}
        </View>
      </View>
    );
  }
);

RelatedNewsSection.displayName = 'RelatedNewsSection';

/**
 * Component styles following brutalist design system
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: TOKENS.colors.white,
    borderTopWidth: TOKENS.borders.thick,
    borderTopColor: TOKENS.colors.black,
    borderBottomWidth: TOKENS.borders.thick,
    borderBottomColor: TOKENS.colors.black,
  } as ViewStyle,

  headerContainer: {
    paddingHorizontal: TOKENS.spacing.lg,
    paddingTop: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.md,
    backgroundColor: TOKENS.colors.white,
    borderBottomWidth: TOKENS.borders.thick,
    borderBottomColor: TOKENS.colors.black,
  } as ViewStyle,

  headerText: {
    fontSize: TOKENS.typography.header.fontSize,
    lineHeight: TOKENS.typography.header.lineHeight,
    fontWeight: TOKENS.typography.header.fontWeight,
    letterSpacing: TOKENS.typography.header.letterSpacing,
    textTransform: 'uppercase',
    color: TOKENS.colors.black,
  } as TextStyle,

  cardsContainer: {
    backgroundColor: TOKENS.colors.white,
    paddingTop: 20,
  } as ViewStyle,
});
