/**
 * Individual News Article Screen - Premium Version
 * Enhanced with brutalist design components and rich text formatting
 * Uses FAKE SCROLL architecture with collapsible header system
 */

import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { BrutalistButton } from '@/components/BrutalistButton';
import { ArticleCollapsibleHeader, ARTICLE_COLLAPSIBLE_HEADER_HEIGHT } from '@/components/article/ArticleCollapsibleHeader';
import { CompactHeader } from '@/components/home/CompactHeader';
import { ArticleMetaCard } from '@/components/ArticleMetaCard';
import { ShareButtonGroup } from '@/components/ShareButtonGroup';
import { RichTextContent } from '@/components/RichTextContent';
import { QuoteBox } from '@/components/QuoteBox';
import { RelatedNewsSection } from '@/components/RelatedNewsSection';
import type { RelatedNewsArticle } from '@/components/RelatedNewsCard';
import { useArticleDetails } from '@/hooks/useArticleDetails';

/**
 * Premium Individual News Screen
 *
 * Features:
 * - Fake scroll collapsible header system
 * - ArticleCollapsibleHeader (fades out on scroll)
 * - CompactHeader without subscription banner (fades in on scroll)
 * - Hero image with overlay
 * - Article metadata card with decorative corners
 * - Rich text content with inline bold formatting
 * - Highlighted quote boxes
 * - Social sharing buttons (Facebook, Twitter/X, WhatsApp)
 * - Keywords section
 * - Fully accessible and brutalist design
 *
 * Route: /(individuals)/news/[newsId]
 */
export default function IndividualNewsScreen() {
  const { newsId } = useLocalSearchParams<{ newsId: string }>();
  const router = useRouter();

  const {
    article,
    isLoading,
    error,
    handleBack,
  } = useArticleDetails({ articleId: newsId || '' });

  // Fake scroll animation setup
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Create shared value for ArticleCollapsibleHeader opacity
  const collapsibleHeaderOpacity = useSharedValue(1);

  // CollapsibleHeader container opacity - fades out as user scrolls
  const collapsibleOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, ARTICLE_COLLAPSIBLE_HEADER_HEIGHT],
      [1, 0],
      Extrapolation.CLAMP
    );

    // Update the shared value for the header component
    collapsibleHeaderOpacity.value = opacity;

    return {
      opacity,
      pointerEvents: scrollY.value > ARTICLE_COLLAPSIBLE_HEADER_HEIGHT / 2 ? 'none' : 'auto',
    } as ViewStyle;
  });

  // CompactHeader opacity - fades in as user scrolls
  const compactOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, ARTICLE_COLLAPSIBLE_HEADER_HEIGHT],
        [0, 1],
        Extrapolation.CLAMP
      ),
      pointerEvents: scrollY.value > ARTICLE_COLLAPSIBLE_HEADER_HEIGHT / 2 ? 'auto' : 'none',
    } as ViewStyle;
  });

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#854836" />
          <ThemedText variant="body" style={styles.loadingText}>
            Cargando artículo...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <View style={styles.errorContent}>
          <ThemedText variant="h3" style={styles.errorTitle}>
            ERROR
          </ThemedText>
          <ThemedText variant="body" style={styles.errorText}>
            {error?.message || 'No se pudo cargar el artículo'}
          </ThemedText>
          <BrutalistButton
            variant="primary"
            onPress={handleBack}
            style={styles.errorButton}
          >
            REGRESAR
          </BrutalistButton>
        </View>
      </SafeAreaView>
    );
  }

  const shareUrl = `https://noticiaspachuca.com/news/${article.id}`;

  // Mock related articles (TODO: Replace with actual API call)
  const relatedArticles: RelatedNewsArticle[] = [
    {
      id: '2',
      title: 'Presupuesto 2025 aprobado por el congreso estatal',
      category: 'ECONOMÍA',
      author: 'María González',
      imageUrl: 'https://picsum.photos/200/200?random=2',
      slug: 'presupuesto-2025-aprobado',
      publishedAt: '2025-10-24T08:30:00Z',
    },
    {
      id: '3',
      title: 'Inauguran nueva clínica de salud en la región',
      category: 'SALUD',
      author: 'Carlos Ramírez',
      imageUrl: 'https://picsum.photos/200/200?random=3',
      slug: 'nueva-clinica-salud',
      publishedAt: '2025-10-23T15:20:00Z',
    },
    {
      id: '4',
      title: 'Tuzos clasifican a la liguilla del torneo',
      category: 'DEPORTES',
      author: 'Luis Hernández',
      imageUrl: 'https://picsum.photos/200/200?random=4',
      slug: 'tuzos-liguilla',
      publishedAt: '2025-10-23T12:00:00Z',
    },
  ];

  const handleRelatedArticlePress = (slug: string) => {
    const relatedArticle = relatedArticles.find((a) => a.slug === slug);
    if (relatedArticle) {
      router.push(`/(individuals)/news/${relatedArticle.id}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* ArticleCollapsibleHeader - Large initial header (fades out) */}
      <Animated.View style={[styles.collapsibleHeaderContainer, collapsibleOpacity]}>
        <ArticleCollapsibleHeader
          onBackPress={handleBack}
          animatedOpacity={collapsibleHeaderOpacity}
        />
      </Animated.View>

      {/* CompactHeader - Shows when scrolling (fades in) */}
      <Animated.View style={[styles.compactHeaderContainer, compactOpacity]}>
        <CompactHeader
          showSubscriptionBanner={false}
        />
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        testID="article-scroll-view"
      >
        {/* Dead Space - matches header height to create fake scroll effect */}
        <View style={{ height: ARTICLE_COLLAPSIBLE_HEADER_HEIGHT }} />
        {/* Hero Image */}
        {article.imageUrl && (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              accessibilityLabel={article.imageTitle || article.title}
              accessibilityRole="image"
            />
          </View>
        )}

        {/* Image Title Bar (Below Image) */}
        {article.imageTitle && (
          <View style={styles.imageTitleBar}>
            <ThemedText variant="h4" style={styles.imageTitleText}>
              {article.imageTitle.toUpperCase()}
            </ThemedText>
          </View>
        )}

        {/* Article Meta Card */}
        <ArticleMetaCard
          category={article.category}
          date={article.publishedAt}
          author={article.author}
          title={article.title}
          showDiamond={true}
        />

        {/* Share Button Group */}
        <ShareButtonGroup
          title={article.title}
          url={shareUrl}
          showLabel={true}
        />

        {/* Summary Section - Full Width Yellow Background */}
        <View style={styles.summarySection}>
          <ThemedText variant="caption" style={styles.summaryLabel}>
            RESUMEN
          </ThemedText>
          <RichTextContent
            content={article.summary}
            variant="body"
          />
        </View>

        {/* Main Content (First Part - Before Quote) */}
        <View style={styles.contentSection}>
          <RichTextContent
            content={article.content}
            variant="body"
          />
        </View>

        {/* Highlight Quote Box */}
        {article.highlightQuote && (
          <QuoteBox
            variant="default"
            showDiamonds={true}
            author={article.quoteAuthor}
          >
            {article.highlightQuote}
          </QuoteBox>
        )}

        {/* Keywords Section */}
        {article.keywords && article.keywords.length > 0 && (
          <View style={styles.keywordsSection}>
            <ThemedText variant="caption" style={styles.sectionLabel}>
              PALABRAS CLAVE:
            </ThemedText>
            <View style={styles.keywordsContainer}>
              {article.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordChip}>
                  <ThemedText variant="small" style={styles.keywordText}>
                    {keyword.toUpperCase()}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related News Section */}
        <RelatedNewsSection
          articles={relatedArticles}
          onArticlePress={handleRelatedArticlePress}
          testID="article-related-news"
        />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  } as ViewStyle,

  // Header Containers - Absolutely Positioned
  collapsibleHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  } as ViewStyle,
  compactHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  } as ViewStyle,

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  } as ViewStyle,
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  } as ViewStyle,
  loadingText: {
    color: '#4B5563',
  } as TextStyle,
  errorContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  } as ViewStyle,
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  } as ViewStyle,
  errorTitle: {
    color: '#FF0000',
  } as TextStyle,
  errorText: {
    textAlign: 'center',
    color: '#4B5563',
  } as TextStyle,
  errorButton: {
    marginTop: 8,
  } as ViewStyle,

  // ScrollView
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  } as ViewStyle,
  scrollContent: {
    backgroundColor: '#F7F7F7',
  } as ViewStyle,

  // Hero Image
  heroImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  } as ViewStyle,
  heroImage: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  imageTitleBar: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  } as ViewStyle,
  imageTitleText: {
    color: '#FFFFFF',
    lineHeight: 24,
  } as TextStyle,

  // Summary Section - Full Width Yellow
  summarySection: {
    backgroundColor: '#FFB22C',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 16,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#000000',
  } as ViewStyle,
  summaryLabel: {
    color: '#000000',
    marginBottom: 12,
    fontWeight: '900',
  } as TextStyle,

  // Content Section
  contentSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  } as ViewStyle,

  // Keywords Section
  keywordsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  } as ViewStyle,
  sectionLabel: {
    marginBottom: 12,
    color: '#000000',
  } as TextStyle,
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  keywordChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
  } as ViewStyle,
  keywordText: {
    color: '#000000',
  } as TextStyle,

  // Bottom Spacing
  bottomSpacing: {
    height: 40,
  } as ViewStyle,
});
