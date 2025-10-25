/**
 * ThemedText Usage Examples
 * Real-world patterns for news app components
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';

// ============================================================================
// ARTICLE CARD COMPONENTS
// ============================================================================

/**
 * Featured article card with image and headline
 */
export const FeaturedArticleCard = ({ article, onPress }: any) => (
  <Pressable onPress={onPress} className="mb-6">
    {/* Category badge */}
    <ThemedText
      variant="caption"
      className="bg-brutalist-brown text-white px-3 py-1 mb-2 self-start"
    >
      {article.category}
    </ThemedText>

    {/* Headline */}
    <ThemedText variant="hero" numberOfLines={3} className="mb-3">
      {article.title}
    </ThemedText>

    {/* Lead paragraph */}
    <ThemedText variant="lead" numberOfLines={2} className="mb-2">
      {article.excerpt}
    </ThemedText>

    {/* Metadata */}
    <ThemedText variant="small" className="text-gray-600">
      {article.publishedAt} • {article.readTime} min read
    </ThemedText>
  </Pressable>
);

/**
 * Compact article list item
 */
export const ArticleListItem = React.memo(({ article, onPress }: any) => (
  <Pressable onPress={onPress} className="border-b-2 border-black py-4">
    <View className="flex-row justify-between items-start mb-2">
      <ThemedText variant="overline" className="text-gray-600">
        {article.category}
      </ThemedText>
      <ThemedText variant="overline" className="text-gray-500">
        {article.timeAgo}
      </ThemedText>
    </View>

    <ThemedText variant="h4" numberOfLines={2} className="mb-1">
      {article.title}
    </ThemedText>

    <ThemedText variant="small" numberOfLines={2} className="text-gray-700">
      {article.excerpt}
    </ThemedText>
  </Pressable>
));

ArticleListItem.displayName = 'ArticleListItem';

// ============================================================================
// ARTICLE DETAIL COMPONENTS
// ============================================================================

/**
 * Article header with metadata
 */
export const ArticleHeader = ({ article }: any) => (
  <View className="mb-6">
    {/* Category */}
    <ThemedText
      variant="caption"
      className="bg-brutalist-yellow text-black px-3 py-1 mb-3 self-start"
    >
      {article.category}
    </ThemedText>

    {/* Title */}
    <ThemedText variant="h1" className="mb-4">
      {article.title}
    </ThemedText>

    {/* Subtitle/lead */}
    <ThemedText variant="lead" className="mb-4 text-gray-700">
      {article.subtitle}
    </ThemedText>

    {/* Author and date */}
    <View className="flex-row items-center">
      <ThemedText variant="bodyEmphasis" className="mr-2">
        {article.author}
      </ThemedText>
      <ThemedText variant="small" className="text-gray-600">
        {article.publishedAt}
      </ThemedText>
    </View>
  </View>
);

/**
 * Article body with mixed content
 */
export const ArticleBody = ({ content }: any) => (
  <View>
    {content.map((block: any, index: number) => {
      switch (block.type) {
        case 'paragraph':
          return (
            <ThemedText key={index} variant="body" className="mb-4">
              {block.text}
            </ThemedText>
          );

        case 'heading':
          return (
            <ThemedText key={index} variant="h3" className="mt-6 mb-3">
              {block.text}
            </ThemedText>
          );

        case 'quote':
          return (
            <View key={index} className="my-6">
              <View className="border-l-4 border-brutalist-brown pl-4">
                <ThemedText variant="quote" className="mb-2">
                  {block.text}
                </ThemedText>
                {block.attribution && (
                  <ThemedText variant="small" className="text-gray-600">
                    — {block.attribution}
                  </ThemedText>
                )}
              </View>
            </View>
          );

        case 'emphasis':
          return (
            <ThemedText key={index} variant="bodyEmphasis" className="mb-4">
              {block.text}
            </ThemedText>
          );

        default:
          return null;
      }
    })}
  </View>
);

// ============================================================================
// BREAKING NEWS COMPONENTS
// ============================================================================

/**
 * Breaking news banner (sticky header)
 */
export const BreakingNewsBanner = ({ headline, onPress }: any) => (
  <Pressable onPress={onPress} className="bg-brutalist-red p-3">
    <View className="flex-row items-center">
      <ThemedText variant="breakingNewsBadge" className="mr-3">
        BREAKING
      </ThemedText>
      <ThemedText variant="breakingNews" numberOfLines={1} className="flex-1">
        {headline}
      </ThemedText>
    </View>
  </Pressable>
);

/**
 * Urgent news alert card
 */
export const UrgentNewsAlert = ({ news, onDismiss }: any) => (
  <View className="bg-brutalist-red border-2 border-black p-4 mb-4">
    <View className="flex-row justify-between items-start mb-2">
      <ThemedText variant="breakingNewsBadge">
        URGENT
      </ThemedText>
      <Pressable onPress={onDismiss}>
        <ThemedText variant="button" className="text-white">
          ✕
        </ThemedText>
      </Pressable>
    </View>
    <ThemedText variant="breakingNews" className="mb-2">
      {news.title}
    </ThemedText>
    <ThemedText variant="small" className="text-white opacity-90">
      {news.timeAgo}
    </ThemedText>
  </View>
);

// ============================================================================
// CATEGORY & TAG COMPONENTS
// ============================================================================

/**
 * Category chip/badge
 */
export const CategoryChip = ({ category, isActive, onPress }: any) => (
  <Pressable onPress={onPress}>
    <ThemedText
      variant="caption"
      className={`px-4 py-2 border-2 border-black ${
        isActive
          ? 'bg-brutalist-brown text-white'
          : 'bg-white text-black'
      }`}
    >
      {category}
    </ThemedText>
  </Pressable>
);

/**
 * Tag list for article metadata
 */
export const TagList = ({ tags }: any) => (
  <View className="flex-row flex-wrap gap-2">
    <ThemedText variant="overline" className="text-gray-600 mr-2">
      Tags:
    </ThemedText>
    {tags.map((tag: string) => (
      <ThemedText
        key={tag}
        variant="caption"
        className="bg-gray-200 text-gray-800 px-2 py-1"
      >
        {tag}
      </ThemedText>
    ))}
  </View>
);

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

/**
 * Primary brutalist button
 */
export const BrutalistButton = ({ label, onPress, disabled }: any) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className={`border-2 border-black px-6 py-3 ${
      disabled ? 'bg-gray-300' : 'bg-brutalist-yellow'
    }`}
  >
    <ThemedText variant="button" className="text-black text-center">
      {label}
    </ThemedText>
  </Pressable>
);

/**
 * Text link button
 */
export const LinkButton = ({ label, onPress, icon }: any) => (
  <Pressable onPress={onPress} className="flex-row items-center">
    <ThemedText variant="link">{label}</ThemedText>
    {icon && <ThemedText variant="link" className="ml-1">{icon}</ThemedText>}
  </Pressable>
);

// ============================================================================
// NAVIGATION & UI COMPONENTS
// ============================================================================

/**
 * Section header with divider
 */
export const SectionHeader = ({ title, action }: any) => (
  <View className="mb-4">
    <View className="flex-row justify-between items-center mb-2">
      <ThemedText variant="h2">{title}</ThemedText>
      {action && (
        <Pressable onPress={action.onPress}>
          <ThemedText variant="link">{action.label}</ThemedText>
        </Pressable>
      )}
    </View>
    <View className="h-1 bg-black w-16" />
  </View>
);

/**
 * Empty state message
 */
export const EmptyState = ({ message }: any) => (
  <View className="p-8 items-center">
    <ThemedText variant="h3" className="mb-2 text-center text-gray-500">
      No articles found
    </ThemedText>
    <ThemedText variant="body" className="text-center text-gray-600">
      {message}
    </ThemedText>
  </View>
);

/**
 * Error message banner
 */
export const ErrorBanner = ({ message, onRetry }: any) => (
  <View className="bg-red-50 border-l-4 border-brutalist-red p-4 mb-4">
    <ThemedText variant="error" className="mb-2">
      {message}
    </ThemedText>
    {onRetry && (
      <Pressable onPress={onRetry}>
        <ThemedText variant="link" className="text-red-700">
          Try again
        </ThemedText>
      </Pressable>
    )}
  </View>
);

// ============================================================================
// STATS & METADATA COMPONENTS
// ============================================================================

/**
 * Article stats (views, shares, etc.)
 */
export const ArticleStats = ({ views, shares, comments }: any) => (
  <View className="flex-row justify-around border-y-2 border-black py-3">
    <View className="items-center">
      <ThemedText variant="h4">{views}</ThemedText>
      <ThemedText variant="overline" className="text-gray-600">
        Views
      </ThemedText>
    </View>
    <View className="items-center">
      <ThemedText variant="h4">{shares}</ThemedText>
      <ThemedText variant="overline" className="text-gray-600">
        Shares
      </ThemedText>
    </View>
    <View className="items-center">
      <ThemedText variant="h4">{comments}</ThemedText>
      <ThemedText variant="overline" className="text-gray-600">
        Comments
      </ThemedText>
    </View>
  </View>
);

/**
 * Loading skeleton for article card
 */
export const ArticleCardSkeleton = () => (
  <View className="mb-6">
    <View className="h-4 w-20 bg-gray-300 mb-2" />
    <View className="h-10 bg-gray-300 mb-3" />
    <View className="h-6 bg-gray-200 mb-1" />
    <View className="h-6 w-3/4 bg-gray-200 mb-2" />
    <View className="h-4 w-32 bg-gray-200" />
  </View>
);

// ============================================================================
// COMMENT COMPONENTS
// ============================================================================

/**
 * Comment item
 */
export const CommentItem = ({ comment }: any) => (
  <View className="border-l-2 border-gray-300 pl-4 mb-4">
    <View className="flex-row items-center mb-2">
      <ThemedText variant="bodyEmphasis" className="mr-2">
        {comment.author}
      </ThemedText>
      <ThemedText variant="small" className="text-gray-600">
        {comment.timeAgo}
      </ThemedText>
    </View>
    <ThemedText variant="body" className="mb-2">
      {comment.text}
    </ThemedText>
    <Pressable>
      <ThemedText variant="link" className="text-sm">
        Reply
      </ThemedText>
    </Pressable>
  </View>
);

// ============================================================================
// SEARCH & FILTER COMPONENTS
// ============================================================================

/**
 * Search result item
 */
export const SearchResultItem = ({ result, query, onPress }: any) => (
  <Pressable onPress={onPress} className="border-b border-gray-300 py-3">
    <ThemedText variant="overline" className="text-gray-500 mb-1">
      {result.category} • {result.date}
    </ThemedText>
    <ThemedText variant="h4" numberOfLines={2} className="mb-1">
      {result.title}
    </ThemedText>
    <ThemedText variant="small" numberOfLines={2} className="text-gray-700">
      {result.excerpt}
    </ThemedText>
  </Pressable>
);

/**
 * Filter chip
 */
export const FilterChip = ({ label, count, isActive, onToggle }: any) => (
  <Pressable onPress={onToggle}>
    <View
      className={`flex-row items-center px-3 py-2 border-2 border-black ${
        isActive ? 'bg-brutalist-brown' : 'bg-white'
      }`}
    >
      <ThemedText
        variant="caption"
        className={isActive ? 'text-white' : 'text-black'}
      >
        {label}
      </ThemedText>
      {count !== undefined && (
        <ThemedText
          variant="caption"
          className={`ml-2 ${isActive ? 'text-white' : 'text-gray-600'}`}
        >
          ({count})
        </ThemedText>
      )}
    </View>
  </Pressable>
);
