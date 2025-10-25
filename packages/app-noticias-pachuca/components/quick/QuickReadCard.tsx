/**
 * QuickReadCard Component
 * Visual card component for Quick Read screen (NO gesture logic)
 *
 * Features:
 * - Hero image (280px height, 16:9 aspect ratio)
 * - Category badge overlay (bottom-left)
 * - Tappable image and title
 * - White content area with brutalist borders
 * - Title (3 lines max), author, summary (5 lines max)
 * - Pressed states with visual feedback
 *
 * @module components/quick/QuickReadCard
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { CategoryBadge } from '../CategoryBadge';
import {
  QUICK_READ_COLORS,
  QUICK_READ_DIMENSIONS,
  QUICK_READ_TYPOGRAPHY,
  QUICK_READ_IMAGE,
  QUICK_READ_ACCESSIBILITY,
} from './QuickRead.tokens';

/**
 * Simplified article interface for visual component
 */
export interface QuickReadArticleData {
  id: string;
  title: string;
  summary: string;
  author: {
    name: string;
  };
  category: {
    id: string;
    label: string;
    color?: string;
  };
  heroImage?: {
    url: string;
    alt: string;
  };
  slug: string;
}

/**
 * Props for QuickReadCard component
 */
export interface QuickReadCardProps {
  /**
   * Article data to display
   */
  article: QuickReadArticleData;

  /**
   * Callback when card is pressed (image or title)
   */
  onPress: () => void;

  /**
   * Additional animated styles (for future gesture integration)
   */
  style?: ViewStyle;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * QuickReadCard - Visual card component for Quick Read
 *
 * A brutalist article card with hero image, category badge, title, author,
 * and summary. Image and title are tappable with visual feedback.
 * NO gesture logic - that will be added in the next phase.
 *
 * Design Specifications:
 * - Hero Image: 280px height, 16:9 aspect, cover resize mode
 * - Category Badge: Overlaid bottom-left (12px offset), reuses CategoryBadge
 * - Content Area: White background, 20px padding, 4px top border
 * - Title: h3 variant, 3 lines max, tappable, brown on press
 * - Author: caption variant, "Por [Name]" format, black color
 * - Summary: body variant, 5 lines max, black color
 * - Image Press: 95% scale, 90% opacity
 * - Title Press: Brown color (#854836)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <QuickReadCard
 *   article={article}
 *   onPress={() => router.push(`/news/${article.id}`)}
 * />
 *
 * // With custom style (for animation)
 * <QuickReadCard
 *   article={article}
 *   onPress={handlePress}
 *   style={{ opacity: fadeAnim }}
 * />
 * ```
 */
export const QuickReadCard = React.memo<QuickReadCardProps>(
  ({ article, onPress, style, testID = 'quick-read-card' }) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= QUICK_READ_DIMENSIONS.tabletBreakpoint;

    // Press state for image
    const [isImagePressed, setIsImagePressed] = useState(false);

    // Press state for title
    const [isTitlePressed, setIsTitlePressed] = useState(false);

    // Compute hero image height based on device
    const heroHeight = isTablet
      ? QUICK_READ_DIMENSIONS.heroHeightTablet
      : QUICK_READ_DIMENSIONS.heroHeight;

    // Compute content padding
    const contentPadding = isTablet
      ? QUICK_READ_DIMENSIONS.contentPaddingTablet
      : QUICK_READ_DIMENSIONS.contentPadding;

    // Generate accessibility labels
    const imageAccessibilityLabel = QUICK_READ_ACCESSIBILITY.labels.image.replace(
      '{title}',
      article.title
    );
    const titleAccessibilityLabel = QUICK_READ_ACCESSIBILITY.labels.title.replace(
      '{title}',
      article.title
    );
    const authorAccessibilityLabel = QUICK_READ_ACCESSIBILITY.labels.author.replace(
      '{author}',
      article.author.name
    );

    // Fallback image URL
    const imageUrl =
      article.heroImage?.url || QUICK_READ_IMAGE.fallbackImage;
    const imageAlt =
      article.heroImage?.alt || `Imagen del artículo: ${article.title}`;

    return (
      <Animated.View
        style={[styles.container, style]}
        accessible={true}
        testID={testID}
      >
        {/* Hero Image with Category Badge */}
        <Pressable
          onPress={onPress}
          onPressIn={() => setIsImagePressed(true)}
          onPressOut={() => setIsImagePressed(false)}
          accessibilityRole="imagebutton"
          accessibilityLabel={imageAccessibilityLabel}
          accessibilityHint={QUICK_READ_ACCESSIBILITY.labels.imageHint}
          testID={`${testID}-image`}
        >
          <View style={[styles.imageContainer, { height: heroHeight }]}>
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                isImagePressed && styles.imagePressed,
              ]}
              resizeMode={QUICK_READ_IMAGE.resizeMode}
              accessibilityIgnoresInvertColors={true}
              accessible={false} // Parent Pressable has accessibility
            />

            {/* Category Badge Overlay */}
            <View style={styles.badgeOverlay}>
              <CategoryBadge
                categoryId={article.category.id}
                label={article.category.label}
                backgroundColor={article.category.color}
                size="medium"
              />
            </View>
          </View>
        </Pressable>

        {/* Content Area */}
        <View style={[styles.content, { paddingHorizontal: contentPadding }]}>
          {/* Title (Tappable) */}
          <Pressable
            onPress={onPress}
            onPressIn={() => setIsTitlePressed(true)}
            onPressOut={() => setIsTitlePressed(false)}
            accessibilityRole="header"
            accessibilityLabel={titleAccessibilityLabel}
            accessibilityHint={QUICK_READ_ACCESSIBILITY.labels.titleHint}
            testID={`${testID}-title`}
          >
            <ThemedText
              variant="h3"
              numberOfLines={QUICK_READ_TYPOGRAPHY.title.maxLines}
              style={[
                styles.title,
                ...(isTitlePressed ? [styles.titlePressed] : []),
              ]}
            >
              {article.title}
            </ThemedText>
          </Pressable>

          {/* Author */}
          <ThemedText
            variant="caption"
            style={styles.author}
            accessibilityLabel={authorAccessibilityLabel}
          >
            {QUICK_READ_TYPOGRAPHY.author.prefix}
            {article.author.name.toUpperCase()}
          </ThemedText>

          {/* Summary */}
          <ThemedText
            variant="body"
            numberOfLines={QUICK_READ_TYPOGRAPHY.summary.maxLines}
            style={styles.summary}
          >
            {article.summary}
          </ThemedText>
        </View>
      </Animated.View>
    );
  }
);

// Display name for debugging
QuickReadCard.displayName = 'QuickReadCard';

/**
 * Styles for QuickReadCard
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: QUICK_READ_COLORS.screenBackground, // Placeholder color
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }], // Slightly smaller on press
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: QUICK_READ_DIMENSIONS.badgeBottom,
    left: QUICK_READ_DIMENSIONS.badgeLeft,
  },
  content: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.cardBackground,
    paddingTop: QUICK_READ_DIMENSIONS.contentPaddingTop,
    paddingBottom: QUICK_READ_DIMENSIONS.contentPaddingBottom,
    borderTopWidth: QUICK_READ_DIMENSIONS.borderWidth,
    borderTopColor: QUICK_READ_COLORS.borderColor,
  },
  title: {
    color: QUICK_READ_COLORS.titleColor,
    marginBottom: 0, // No margin, gap handled by author's marginTop
  },
  titlePressed: {
    color: QUICK_READ_COLORS.category.deportes, // Brown on press
  },
  author: {
    color: QUICK_READ_COLORS.authorColor,
    marginTop: QUICK_READ_DIMENSIONS.titleToAuthor,
    marginBottom: 0,
  },
  summary: {
    color: QUICK_READ_COLORS.summaryColor,
    marginTop: QUICK_READ_DIMENSIONS.authorToSummary,
  },
});

/**
 * Export styles for testing
 */
export const QuickReadCardStyles = styles;
