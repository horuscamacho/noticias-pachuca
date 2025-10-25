/**
 * RelatedNewsSection Usage Examples
 * Demonstrates how to use RelatedNewsCard and RelatedNewsSection components
 */

import React from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { RelatedNewsSection } from './RelatedNewsSection';
import { RelatedNewsCard, RelatedNewsArticle } from './RelatedNewsCard';

/**
 * Mock data for examples
 */
const mockArticles: RelatedNewsArticle[] = [
  {
    id: '1',
    title: 'Gobierno anuncia nuevas medidas económicas para reactivar el comercio local',
    category: 'ECONOMÍA',
    author: 'María García',
    imageUrl: 'https://picsum.photos/seed/news1/200/200',
    slug: 'gobierno-medidas-economicas',
    publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '2',
    title: 'Infraestructura: Inauguran nueva carretera que conectará tres municipios',
    category: 'INFRAESTRUCTURA',
    author: 'Carlos Hernández',
    imageUrl: 'https://picsum.photos/seed/news2/200/200',
    slug: 'nueva-carretera-municipios',
    publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    title: 'Salud pública: Campaña de vacunación alcanza el 85% de cobertura estatal',
    category: 'SALUD',
    author: 'Ana Martínez',
    slug: 'campana-vacunacion-cobertura',
    publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

/**
 * Example 1: Complete section with 3 articles
 */
export const CompleteSection = () => {
  const handleArticlePress = (slug: string) => {
    Alert.alert('Artículo presionado', `Navegando a: ${slug}`);
  };

  return (
    <View style={styles.container}>
      <RelatedNewsSection
        articles={mockArticles}
        onArticlePress={handleArticlePress}
        sectionTitle="NOTICIAS RELACIONADAS"
        testID="example-related-section"
      />
    </View>
  );
};

/**
 * Example 2: Individual cards (without section wrapper)
 */
export const IndividualCards = () => {
  const handlePress = (slug: string) => {
    Alert.alert('Artículo presionado', `Navegando a: ${slug}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.cardContainer}>
        <RelatedNewsCard
          article={mockArticles[0]}
          onPress={handlePress}
          categoryColor="brown"
          isLastCard={false}
          testID="card-1"
        />
        <RelatedNewsCard
          article={mockArticles[1]}
          onPress={handlePress}
          categoryColor="yellow"
          isLastCard={false}
          testID="card-2"
        />
        <RelatedNewsCard
          article={mockArticles[2]}
          onPress={handlePress}
          categoryColor="brown"
          isLastCard={true}
          testID="card-3"
        />
      </View>
    </ScrollView>
  );
};

/**
 * Example 3: Card without image
 */
export const CardWithoutImage = () => {
  const articleWithoutImage: RelatedNewsArticle = {
    id: '4',
    title: 'Artículo de ejemplo sin imagen para demostrar el placeholder gris',
    category: 'CULTURA',
    author: 'Roberto López',
    slug: 'ejemplo-sin-imagen',
  };

  const handlePress = (slug: string) => {
    Alert.alert('Artículo presionado', `Navegando a: ${slug}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <RelatedNewsCard
          article={articleWithoutImage}
          onPress={handlePress}
          categoryColor="yellow"
          isLastCard={true}
        />
      </View>
    </View>
  );
};

/**
 * Example 4: Custom section title
 */
export const CustomSectionTitle = () => {
  const handleArticlePress = (slug: string) => {
    Alert.alert('Artículo presionado', `Navegando a: ${slug}`);
  };

  return (
    <View style={styles.container}>
      <RelatedNewsSection
        articles={mockArticles}
        onArticlePress={handleArticlePress}
        sectionTitle="TE PUEDE INTERESAR"
        testID="custom-section"
      />
    </View>
  );
};

/**
 * Example 5: In article detail screen (real-world usage)
 */
export const ArticleDetailExample = () => {
  const handleArticlePress = (slug: string) => {
    // In real app: navigation.push('ArticleDetail', { slug })
    Alert.alert('Navegación', `Navegando al artículo: ${slug}`);
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      {/* Article content would go here */}
      <View style={styles.articleContent}>
        {/* ... article title, body, etc ... */}
      </View>

      {/* Related news section at the bottom */}
      <RelatedNewsSection
        articles={mockArticles}
        onArticlePress={handleArticlePress}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 4,
    borderTopColor: '#000000',
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  articleContent: {
    padding: 16,
    minHeight: 400,
    backgroundColor: '#FFFFFF',
  },
});

/**
 * Usage in navigation:
 *
 * import { RelatedNewsSection } from '@/components/RelatedNewsSection';
 * import { useNavigation } from '@react-navigation/native';
 *
 * const ArticleScreen = ({ route }) => {
 *   const navigation = useNavigation();
 *   const { article } = route.params;
 *
 *   const handleRelatedPress = (slug: string) => {
 *     navigation.push('Article', { slug });
 *   };
 *
 *   return (
 *     <ScrollView>
 *       <ArticleContent article={article} />
 *       <RelatedNewsSection
 *         articles={article.relatedArticles}
 *         onArticlePress={handleRelatedPress}
 *       />
 *     </ScrollView>
 *   );
 * };
 */
