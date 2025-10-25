/**
 * Horizontal News Card with Image on Right (35% width)
 * Brutalist design with compact layout
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { CategoryBadge } from '../shared/CategoryBadge';
import { RelatedArticles } from '../shared/RelatedArticles';
import type { NewsArticle } from './NewsCard.types';

interface HorizontalImageRightCardProps {
  article: NewsArticle;
  onPress: (slug: string) => void;
  onRelatedPress: (slug: string) => void;
  categoryColor?: 'brown' | 'yellow';
}

export const HorizontalImageRightCard: React.FC<HorizontalImageRightCardProps> = React.memo(({
  article,
  onPress,
  onRelatedPress,
  categoryColor = 'brown',
}) => {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(article.slug);
  }, [article.slug, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Article: ${article.title}`}
      accessibilityHint="Double tap to read full article"
    >
      {/* Content Left (65%) */}
      <View style={styles.contentContainer}>
        {/* Category Badge */}
        <CategoryBadge category={article.category} color={categoryColor} />

        {/* Title */}
        <ThemedText
          variant="subtitle"
          numberOfLines={3}
        >
          {article.title}
        </ThemedText>

        {/* Subtitle */}
        <ThemedText
          variant="small"
          numberOfLines={2}
        >
          {article.subtitle}
        </ThemedText>

        {/* Author */}
        <ThemedText variant="caption">
          Por {article.author}
        </ThemedText>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Related Articles */}
        <RelatedArticles
          articles={article.relatedArticles}
          onPress={onRelatedPress}
        />
      </View>

      {/* Image Right (35%) */}
      {article.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
        </View>
      )}
    </Pressable>
  );
});

HorizontalImageRightCard.displayName = 'HorizontalImageRightCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    overflow: 'hidden',
    height: 240,
  },
  pressed: {
    backgroundColor: '#F7F7F7',
  },
  contentContainer: {
    width: '65%',
    padding: 16,
    justifyContent: 'flex-start',
    flexShrink: 0,
  },
  imageContainer: {
    width: '35%',
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: 240,
  },
  separator: {
    height: 3,
    backgroundColor: '#000000',
    marginVertical: 12,
  },
});
