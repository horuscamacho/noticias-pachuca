/**
 * HorizontalNewsCard Component
 * Variant 1: Image right (35%), content left (65%)
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { CategoryBadge } from '../shared/CategoryBadge';
import { AuthorInfo } from '../shared/AuthorInfo';
import { RelatedArticles } from '../shared/RelatedArticles';
import {
  COLORS,
  SPACING,
  BORDERS,
  DIMENSIONS,
  TYPOGRAPHY,
  LAYOUT,
} from './NewsCard.tokens';
import type { HorizontalNewsCardProps } from './NewsCard.types';

/**
 * Horizontal news card with image on the right side
 * Best for: News feeds with mixed content, general news, updates
 * Layout: 65% content left, 35% image right
 *
 * @example
 * ```tsx
 * <HorizontalNewsCard
 *   article={article}
 *   onPress={(slug) => navigate('Article', { slug })}
 *   onRelatedPress={(slug) => navigate('Article', { slug })}
 *   categoryColor="brown"
 * />
 * ```
 */
export const HorizontalNewsCard = React.memo<HorizontalNewsCardProps>(
  ({ article, onPress, onRelatedPress, categoryColor = 'brown', testID }) => {
    const handleCardPress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress(article.slug);
    }, [onPress, article.slug]);

    const titleStyle: TextStyle = {
      fontSize: TYPOGRAPHY.cardTitle.fontSize,
      lineHeight: TYPOGRAPHY.cardTitle.lineHeight,
      fontWeight: TYPOGRAPHY.cardTitle.fontWeight,
      letterSpacing: TYPOGRAPHY.cardTitle.letterSpacing,
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
        {/* Content Area - Left 65% */}
        <View style={styles.contentArea}>
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

          {/* Meta Row - Category + Author */}
          <View style={styles.metaRow}>
            <CategoryBadge category={article.category} variant={categoryColor} />
            <AuthorInfo author={article.author} />
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Related Articles */}
          <RelatedArticles
            articles={article.relatedArticles}
            onPress={onRelatedPress}
            showCategories={false}
            sectionTitle="RELACIONADAS"
          />
        </View>

        {/* Image Area - Right 35% */}
        {article.imageUrl && (
          <View style={styles.imageArea}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessible={false}
            />
          </View>
        )}
      </Pressable>
    );
  }
);

HorizontalNewsCard.displayName = 'HorizontalNewsCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: BORDERS.thick,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    minHeight: DIMENSIONS.horizontalCardHeight,
    borderRadius: BORDERS.radius,
  },
  containerPressed: {
    backgroundColor: COLORS.accentYellow,
    opacity: 0.95,
  },
  contentArea: {
    flex: LAYOUT.horizontalContent,
    padding: SPACING.lg,
    paddingRight: SPACING.md,
    justifyContent: 'space-between',
  },
  titleSection: {
    marginBottom: SPACING.sm,
  },
  subtitleSection: {
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  separator: {
    height: BORDERS.medium,
    backgroundColor: COLORS.black,
    marginVertical: SPACING.md,
    width: '100%',
  },
  imageArea: {
    flex: LAYOUT.horizontalImage,
    borderLeftWidth: BORDERS.thick,
    borderLeftColor: COLORS.black,
    backgroundColor: COLORS.grayBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
