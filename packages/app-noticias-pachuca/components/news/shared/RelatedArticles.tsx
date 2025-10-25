/**
 * RelatedArticles Component
 * Displays a list of related article links with optional categories
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, SPACING, DIMENSIONS, TYPOGRAPHY, BORDERS } from '../cards/NewsCard.tokens';
import type { RelatedArticlesProps } from '../cards/NewsCard.types';

/**
 * Related articles section component
 * Displays up to 2 related articles with pressable titles
 *
 * @example
 * ```tsx
 * <RelatedArticles
 *   articles={[
 *     { id: '1', title: 'Article one', slug: 'article-one' },
 *     { id: '2', title: 'Article two', slug: 'article-two', category: 'POLÍTICA' }
 *   ]}
 *   onPress={(slug) => navigate('Article', { slug })}
 *   showCategories={true}
 * />
 * ```
 */
export const RelatedArticles = React.memo<RelatedArticlesProps>(
  ({ articles, onPress, showCategories = false, sectionTitle = 'NOTICIAS RELACIONADAS' }) => {
    // Only show first 2 related articles
    const visibleArticles = articles.slice(0, 2);

    if (visibleArticles.length === 0) {
      return null;
    }

    return (
      <View style={styles.container}>
        <ThemedText variant="overline" style={styles.sectionTitle}>
          {sectionTitle}
        </ThemedText>
        {visibleArticles.map((article) => (
          <RelatedArticleItem
            key={article.id}
            article={article}
            onPress={onPress}
            showCategory={showCategories && Boolean(article.category)}
          />
        ))}
      </View>
    );
  }
);

RelatedArticles.displayName = 'RelatedArticles';

/**
 * Individual related article item
 */
interface RelatedArticleItemProps {
  article: {
    id: string;
    title: string;
    slug: string;
    category?: string;
  };
  onPress: (slug: string) => void;
  showCategory: boolean;
}

const RelatedArticleItem = React.memo<RelatedArticleItemProps>(
  ({ article, onPress, showCategory }) => {
    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(article.slug);
    }, [onPress, article.slug]);

    const titleStyle: TextStyle = {
      fontSize: TYPOGRAPHY.relatedTitle.fontSize,
      lineHeight: TYPOGRAPHY.relatedTitle.lineHeight,
      fontWeight: TYPOGRAPHY.relatedTitle.fontWeight,
      letterSpacing: TYPOGRAPHY.relatedTitle.letterSpacing,
      color: COLORS.textPrimary,
    };

    const categoryStyle: TextStyle = {
      fontSize: TYPOGRAPHY.relatedCategory.fontSize,
      lineHeight: TYPOGRAPHY.relatedCategory.lineHeight,
      fontWeight: TYPOGRAPHY.relatedCategory.fontWeight,
      letterSpacing: TYPOGRAPHY.relatedCategory.letterSpacing,
      color: COLORS.textSecondary,
    };

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.articleItem,
          pressed && styles.articleItemPressed,
        ]}
        accessible={true}
        accessibilityRole="link"
        accessibilityLabel={`Noticia relacionada: ${article.title}`}
        accessibilityHint="Toca dos veces para abrir"
      >
        <View style={styles.articleContent}>
          <View style={styles.titleRow}>
            <View style={styles.bullet} />
            <ThemedText variant="small" style={titleStyle} numberOfLines={2}>
              {article.title}
            </ThemedText>
          </View>
          {showCategory && article.category && (
            <View style={styles.categoryBadgeSmall}>
              <ThemedText variant="overline" style={categoryStyle} numberOfLines={1}>
                {article.category}
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  }
);

RelatedArticleItem.displayName = 'RelatedArticleItem';

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  articleItem: {
    minHeight: DIMENSIONS.minTouchTarget,
    paddingVertical: SPACING.xs,
  },
  articleItemPressed: {
    backgroundColor: COLORS.grayBackground,
  },
  articleContent: {
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  bullet: {
    width: DIMENSIONS.bulletSmall,
    height: DIMENSIONS.bulletSmall,
    backgroundColor: COLORS.black,
    marginTop: 6, // Align with text baseline
  },
  categoryBadgeSmall: {
    backgroundColor: COLORS.grayBackground,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.black,
    marginLeft: SPACING.md + DIMENSIONS.bulletSmall, // Align with text above
    alignSelf: 'flex-start',
  },
});
