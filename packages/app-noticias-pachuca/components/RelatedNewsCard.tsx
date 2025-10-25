/**
 * RelatedNewsCard Component - REDESIGNED
 * Vertical card layout with hero images for related news articles
 *
 * Design Improvements:
 * - Vertical layout instead of cramped horizontal
 * - Large 16:9 hero image (~200px height)
 * - Category badge overlaid on image
 * - Better typography hierarchy (17px/24px title, 3 lines)
 * - Generous spacing and breathing room
 * - Dramatic 4px brutalist borders
 * - 16px gaps between cards
 *
 * @example
 * ```tsx
 * <RelatedNewsCard
 *   article={{
 *     id: '1',
 *     title: 'Breaking news headline here',
 *     category: 'POLÍTICA',
 *     author: 'John Doe',
 *     imageUrl: 'https://...',
 *     slug: 'breaking-news',
 *     publishedAt: '2024-01-15T10:30:00Z'
 *   }}
 *   onPress={(slug) => console.log('Pressed:', slug)}
 *   categoryColor="brown"
 * />
 * ```
 */

import React from 'react';
import { View, Pressable, Image, StyleSheet, ViewStyle, ImageStyle, TextStyle, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { CategoryBadge } from '@/components/news/shared/CategoryBadge';

/**
 * Related news article data structure
 */
export interface RelatedNewsArticle {
  /** Unique identifier */
  id: string;
  /** Article headline (max 3 lines) */
  title: string;
  /** Article category */
  category: string;
  /** Author name */
  author: string;
  /** Article image URL (optional) */
  imageUrl?: string;
  /** URL slug for navigation */
  slug: string;
  /** Publication timestamp (optional, shows relative time) */
  publishedAt?: string;
}

/**
 * Props for RelatedNewsCard component
 */
export interface RelatedNewsCardProps {
  /** Article data to display */
  article: RelatedNewsArticle;
  /** Callback when card is pressed */
  onPress: (slug: string) => void;
  /** Category badge color variant */
  categoryColor?: 'brown' | 'yellow';
  /** Whether this is the last card (still has margin for consistency) */
  isLastCard?: boolean;
  /** Test identifier for automated testing */
  testID?: string;
}

/**
 * Brutalist design tokens - Enhanced for new vertical layout
 */
const TOKENS = {
  colors: {
    white: '#FFFFFF',
    black: '#000000',
    brown: '#854836',
    yellow: '#FFB22C',
    gray: '#F7F7F7',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
  },
  borders: {
    thick: 4,
  },
  image: {
    aspectRatio: 16 / 9, // Cinematic 16:9 ratio
    height: 200, // Fixed height for consistency
  },
  typography: {
    title: {
      fontSize: 17, // Larger for better readability
      lineHeight: 24, // More breathing room
      fontWeight: '700' as const,
    },
    author: {
      fontSize: 12, // More legible than 11px
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },
  card: {
    marginBottom: 16, // Space between cards
    marginHorizontal: 16, // Screen edge margins
  },
  badge: {
    offset: 8, // Distance from image edges
  },
} as const;

/**
 * Format relative time from ISO timestamp
 */
const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    }
  } catch {
    return '';
  }
};

/**
 * RelatedNewsCard - Vertical card with hero image
 *
 * Features:
 * - Full-width 16:9 hero image (200px height)
 * - Category badge overlaid on image (bottom-left)
 * - 3-line title with improved typography (17px/24px)
 * - Author info with optional timestamp
 * - Yellow background on press
 * - 4px brutalist borders (all sides + image separator)
 * - 16px spacing between cards
 * - Large touch target (entire card)
 */
export const RelatedNewsCard = React.memo<RelatedNewsCardProps>(
  ({ article, onPress, categoryColor = 'brown', isLastCard = false, testID }) => {
    const { id, title, category, author, imageUrl, slug, publishedAt } = article;

    // Format author text with optional timestamp
    const authorText = publishedAt
      ? `${author} · ${formatRelativeTime(publishedAt)}`
      : `Por ${author}`;

    const handlePress = () => {
      onPress(slug);
    };

    return (
      <View style={styles.wrapper}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.container,
            pressed && styles.containerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Leer artículo: ${title}, categoría ${category}, por ${author}`}
          accessibilityHint="Toca para leer el artículo completo"
          testID={testID || `related-news-card-${id}`}
        >
          {/* Image Section - 16:9 Hero Image with Overlaid Category Badge */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
                accessible={false}
              />
            ) : (
              <View style={styles.imagePlaceholder} accessible={false} />
            )}

            {/* Category Badge - Overlaid on Image (Bottom-Left) */}
            <View style={styles.badgeContainer}>
              <CategoryBadge
                category={category}
                variant={categoryColor}
                size="default"
              />
            </View>
          </View>

          {/* Content Section - Title and Author */}
          <View style={styles.content}>
            {/* Title - 3 lines max, improved typography */}
            <ThemedText
              variant="small"
              numberOfLines={3}
              style={styles.title}
              accessibilityRole="header"
            >
              {title}
            </ThemedText>

            {/* Author Info */}
            <ThemedText
              variant="small"
              numberOfLines={1}
              style={styles.author}
            >
              {authorText}
            </ThemedText>
          </View>
        </Pressable>
      </View>
    );
  }
);

RelatedNewsCard.displayName = 'RelatedNewsCard';

/**
 * Component styles - Brutalist vertical card design
 */
const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: TOKENS.card.marginHorizontal,
    marginBottom: TOKENS.card.marginBottom,
  } as ViewStyle,

  container: {
    backgroundColor: TOKENS.colors.white,
    borderWidth: TOKENS.borders.thick,
    borderColor: TOKENS.colors.black,
    overflow: 'hidden', // Ensures content respects border radius if added
  } as ViewStyle,

  containerPressed: {
    backgroundColor: TOKENS.colors.yellow,
  } as ViewStyle,

  // Image section with 16:9 aspect ratio
  imageContainer: {
    width: '100%',
    height: TOKENS.image.height,
    position: 'relative', // For absolute positioned badge
    borderBottomWidth: TOKENS.borders.thick,
    borderBottomColor: TOKENS.colors.black,
  } as ViewStyle,

  image: {
    width: '100%',
    height: '100%',
  } as ImageStyle,

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: TOKENS.colors.gray,
  } as ViewStyle,

  // Category badge overlaid on image (bottom-left)
  badgeContainer: {
    position: 'absolute',
    bottom: TOKENS.badge.offset,
    left: TOKENS.badge.offset,
    // Optional: Add shadow for better contrast on light images
    shadowColor: TOKENS.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  } as ViewStyle,

  // Content section with improved spacing
  content: {
    padding: TOKENS.spacing.lg,
    backgroundColor: TOKENS.colors.white,
  } as ViewStyle,

  // Improved title typography
  title: {
    fontSize: TOKENS.typography.title.fontSize,
    lineHeight: TOKENS.typography.title.lineHeight,
    fontWeight: TOKENS.typography.title.fontWeight,
    color: TOKENS.colors.black,
    marginBottom: TOKENS.spacing.sm,
  } as TextStyle,

  // Improved author typography
  author: {
    fontSize: TOKENS.typography.author.fontSize,
    lineHeight: TOKENS.typography.author.lineHeight,
    fontWeight: TOKENS.typography.author.fontWeight,
    color: TOKENS.colors.black,
  } as TextStyle,
});
