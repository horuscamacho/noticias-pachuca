/**
 * VerticalNewsCard Component
 * Variant 2: Full-width image on top, content below
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { CategoryBadge } from '../shared/CategoryBadge';
import { AuthorInfo } from '../shared/AuthorInfo';
import { RelatedArticles } from '../shared/RelatedArticles';
import { COLORS, SPACING, BORDERS, DIMENSIONS, TYPOGRAPHY } from './NewsCard.tokens';
import type { VerticalNewsCardProps } from './NewsCard.types';

/**
 * Vertical news card with full-width image on top
 * Best for: Featured stories, breaking news, image-heavy content
 * Layout: Full-width image top, content below
 *
 * @example
 * ```tsx
 * <VerticalNewsCard
 *   article={article}
 *   onPress={(slug) => navigate('Article', { slug })}
 *   onRelatedPress={(slug) => navigate('Article', { slug })}
 *   categoryColor="yellow"
 * />
 * ```
 */
export const VerticalNewsCard = React.memo<VerticalNewsCardProps>(
  ({ article, onPress, onRelatedPress, categoryColor = 'yellow', testID }) => {
    const handleCardPress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress(article.slug);
    }, [onPress, article.slug]);

    const titleStyle: TextStyle = {
      fontSize: TYPOGRAPHY.cardTitleVertical.fontSize,
      lineHeight: TYPOGRAPHY.cardTitleVertical.lineHeight,
      fontWeight: TYPOGRAPHY.cardTitleVertical.fontWeight,
      letterSpacing: TYPOGRAPHY.cardTitleVertical.letterSpacing,
      color: COLORS.textPrimary,
    };

    const subtitleStyle: TextStyle = {
      fontSize: TYPOGRAPHY.cardSubtitle.fontSize,
      lineHeight: TYPOGRAPHY.cardSubtitle.lineHeight,
      fontWeight: TYPOGRAPHY.cardSubtitle.fontWeight,
      letterSpacing: TYPOGRAPHY.cardSubtitle.letterSpacing,
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
        {/* Image Container - Top */}
        {article.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessible={false}
            />
          </View>
        )}

        {/* Content Area - Bottom */}
        <View style={styles.contentArea}>
          {/* Meta Row - Category + Author */}
          <View style={styles.metaRow}>
            <CategoryBadge category={article.category} variant={categoryColor} />
            <AuthorInfo author={article.author} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <ThemedText variant="body" style={titleStyle} numberOfLines={3}>
              {article.title}
            </ThemedText>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleSection}>
            <ThemedText variant="small" style={subtitleStyle} numberOfLines={3}>
              {article.subtitle}
            </ThemedText>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Related Articles with Categories */}
          <RelatedArticles
            articles={article.relatedArticles}
            onPress={onRelatedPress}
            showCategories={true}
          />
        </View>
      </Pressable>
    );
  }
);

VerticalNewsCard.displayName = 'VerticalNewsCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: BORDERS.thick,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    minHeight: DIMENSIONS.verticalCardHeight,
    borderRadius: BORDERS.radius,
  },
  containerPressed: {
    backgroundColor: COLORS.grayBackground,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: DIMENSIONS.verticalImageRatio,
    borderBottomWidth: BORDERS.thick,
    borderBottomColor: COLORS.black,
    backgroundColor: COLORS.grayBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentArea: {
    padding: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  subtitleSection: {
    marginBottom: SPACING.lg,
  },
  separator: {
    height: BORDERS.medium,
    backgroundColor: COLORS.black,
    marginBottom: SPACING.md,
    width: '100%',
  },
});
