/**
 * TextOnlyNewsCard Component
 * Variant 3: No image, text-only with prominent typography
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { CategoryBadge } from '../shared/CategoryBadge';
import { AuthorInfo } from '../shared/AuthorInfo';
import { RelatedArticles } from '../shared/RelatedArticles';
import { COLORS, SPACING, BORDERS, DIMENSIONS, TYPOGRAPHY } from './NewsCard.tokens';
import type { TextOnlyNewsCardProps } from './NewsCard.types';

/**
 * Text-only news card without image
 * Best for: Dense news feeds, opinion pieces, politics, economics, editorials
 * Layout: Text-only with larger typography for emphasis
 *
 * @example
 * ```tsx
 * <TextOnlyNewsCard
 *   article={article}
 *   onPress={(slug) => navigate('Article', { slug })}
 *   onRelatedPress={(slug) => navigate('Article', { slug })}
 *   categoryColor="brown"
 * />
 * ```
 */
export const TextOnlyNewsCard = React.memo<TextOnlyNewsCardProps>(
  ({ article, onPress, onRelatedPress, categoryColor = 'brown', testID }) => {
    const handleCardPress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress(article.slug);
    }, [onPress, article.slug]);

    const titleStyle: TextStyle = {
      fontSize: TYPOGRAPHY.cardTitleTextOnly.fontSize,
      lineHeight: TYPOGRAPHY.cardTitleTextOnly.lineHeight,
      fontWeight: TYPOGRAPHY.cardTitleTextOnly.fontWeight,
      letterSpacing: TYPOGRAPHY.cardTitleTextOnly.letterSpacing,
      color: COLORS.textPrimary,
    };

    const subtitleStyle: TextStyle = {
      fontSize: TYPOGRAPHY.cardSubtitleTextOnly.fontSize,
      lineHeight: TYPOGRAPHY.cardSubtitleTextOnly.lineHeight,
      fontWeight: TYPOGRAPHY.cardSubtitleTextOnly.fontWeight,
      letterSpacing: TYPOGRAPHY.cardSubtitleTextOnly.letterSpacing,
      color: COLORS.textSecondary,
    };

    return (
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${article.category}. ${article.title}. ${article.subtitle}. Por ${article.author}.`}
        accessibilityHint="Toca dos veces para leer la noticia completa"
        testID={testID}
      >
        {/* Title - Prominent */}
        <View style={styles.titleSection}>
          <ThemedText variant="body" style={titleStyle} numberOfLines={3}>
            {article.title}
          </ThemedText>
        </View>

        {/* Subtitle - Enhanced readability */}
        <View style={styles.subtitleSection}>
          <ThemedText variant="small" style={subtitleStyle} numberOfLines={3}>
            {article.subtitle}
          </ThemedText>
        </View>

        {/* Meta Row - Category + Author */}
        <View style={styles.metaRow}>
          <CategoryBadge category={article.category} variant={categoryColor} size="large" />
          <AuthorInfo author={article.author} />
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Related Articles - Compact */}
        <RelatedArticles
          articles={article.relatedArticles}
          onPress={onRelatedPress}
          showCategories={false}
          sectionTitle="RELACIONADAS"
        />
      </Pressable>
    );
  }
);

TextOnlyNewsCard.displayName = 'TextOnlyNewsCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: BORDERS.thick,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    minHeight: DIMENSIONS.textOnlyCardHeight,
    borderRadius: BORDERS.radius,
  },
  containerPressed: {
    backgroundColor: COLORS.accentYellow,
    borderColor: COLORS.black,
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  subtitleSection: {
    marginBottom: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  separator: {
    height: BORDERS.thick,
    backgroundColor: COLORS.black,
    marginBottom: SPACING.md,
    width: '100%',
  },
});
