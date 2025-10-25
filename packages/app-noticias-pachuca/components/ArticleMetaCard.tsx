/**
 * ArticleMetaCard Component
 * Article metadata card with category, date, author, and title
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { DecorativeCorner } from './DecorativeCorner';

interface ArticleMetaCardProps {
  category: string;
  categoryColor?: string;
  date: string | Date;
  author: string;
  title: string;
  showDiamond?: boolean;
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Formats date to Spanish long format
 * Example: "24 DE OCTUBRE DE 2025, 10:45 A.M."
 */
function formatFullDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'P.M.' : 'A.M.';
  const displayHours = hours % 12 || 12;

  return `${day} DE ${month} DE ${year}, ${displayHours}:${minutes} ${period}`;
}

/**
 * Article metadata card with brutalist styling
 *
 * @example
 * ```tsx
 * <ArticleMetaCard
 *   category="POLÍTICA"
 *   date="2025-10-24T10:45:00Z"
 *   author="Pablo Domínguez"
 *   title="Título del artículo"
 * />
 * ```
 */
export const ArticleMetaCard = React.memo<ArticleMetaCardProps>(
  ({
    category,
    categoryColor = '#854836',
    date,
    author,
    title,
    showDiamond = true,
    style,
    testID = 'article-meta-card',
  }) => {
    const formattedDate = useMemo(() => formatFullDate(date), [date]);
    const accessibilityLabel = `${category}, ${formattedDate}, por ${author}. ${title}`;

    return (
      <View
        style={[styles.container, style]}
        testID={testID}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={accessibilityLabel}
      >
        {/* Decorative Corner */}
        {showDiamond && (
          <DecorativeCorner
            variant="yellow"
            position="top-left"
            size="medium"
          />
        )}

        {/* Category Badge */}
        <View
          style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
          importantForAccessibility="no"
        >
          <ThemedText variant="caption" style={styles.categoryText}>
            {category.toUpperCase()}
          </ThemedText>
        </View>

        {/* Date */}
        <ThemedText
          variant="subtitle"
          style={styles.dateText}
          importantForAccessibility="no"
        >
          {formattedDate}
        </ThemedText>

        {/* Author with Yellow Bar */}
        <View style={styles.authorContainer} importantForAccessibility="no">
          <View style={styles.yellowBar} />
          <ThemedText variant="small" style={styles.authorText}>
            POR {author.toUpperCase()}
          </ThemedText>
        </View>

        {/* Title */}
        <ThemedText
          variant="h3"
          style={styles.titleText}
          importantForAccessibility="no"
        >
          {title.toUpperCase()}
        </ThemedText>
      </View>
    );
  }
);

ArticleMetaCard.displayName = 'ArticleMetaCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 16,
    position: 'relative',
  } as ViewStyle,
  categoryBadge: {
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  } as ViewStyle,
  categoryText: {
    color: '#FFFFFF',
  } as TextStyle,
  dateText: {
    marginBottom: 12,
    color: '#000000',
    fontWeight: '700',
  } as TextStyle,
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,
  yellowBar: {
    width: 4,
    height: '100%',
    backgroundColor: '#FFB22C',
    marginRight: 8,
  } as ViewStyle,
  authorText: {
    color: '#000000',
    textTransform: 'uppercase',
  } as TextStyle,
  titleText: {
    lineHeight: 30,
    color: '#000000',
  } as TextStyle,
});
