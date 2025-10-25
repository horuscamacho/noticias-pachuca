/**
 * Brutalist News Cards - Usage Examples
 * Complete examples for all three card variants
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HorizontalNewsCard,
  VerticalNewsCard,
  TextOnlyNewsCard,
  type NewsArticle,
} from '@/components/news';

/**
 * Example: Mixed News Feed with All Three Card Variants
 * This is the recommended layout pattern for a news feed
 */
export function MixedNewsFeedExample() {
  const router = useRouter();

  // Navigate to article detail
  const handleArticlePress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  // Navigate to related article
  const handleRelatedPress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Story - Vertical Card */}
      <VerticalNewsCard
        article={VERTICAL_CARD_EXAMPLE}
        onPress={handleArticlePress}
        onRelatedPress={handleRelatedPress}
        categoryColor="yellow"
      />

      {/* Standard News - Horizontal Cards */}
      <HorizontalNewsCard
        article={HORIZONTAL_CARD_EXAMPLE_1}
        onPress={handleArticlePress}
        onRelatedPress={handleRelatedPress}
        categoryColor="brown"
      />

      <HorizontalNewsCard
        article={HORIZONTAL_CARD_EXAMPLE_2}
        onPress={handleArticlePress}
        onRelatedPress={handleRelatedPress}
        categoryColor="yellow"
      />

      {/* Quick Read - Text Only Card */}
      <TextOnlyNewsCard
        article={TEXT_ONLY_CARD_EXAMPLE}
        onPress={handleArticlePress}
        onRelatedPress={handleRelatedPress}
        categoryColor="brown"
      />

      {/* More Standard News */}
      <HorizontalNewsCard
        article={HORIZONTAL_CARD_EXAMPLE_3}
        onPress={handleArticlePress}
        onRelatedPress={handleRelatedPress}
        categoryColor="brown"
      />

      {/* Another Quick Read */}
      <TextOnlyNewsCard
        article={TEXT_ONLY_CARD_EXAMPLE_2}
        onPress={handleArticlePress}
        onRelatedPress={handleRelatedPress}
        categoryColor="yellow"
      />
    </ScrollView>
  );
}

/**
 * Example: Category-Specific Feed (All One Variant)
 * Use when displaying filtered content by category
 */
export function CategoryFeedExample() {
  const router = useRouter();

  const handleArticlePress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  const handleRelatedPress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  // Fetched from your API
  const politicsArticles: NewsArticle[] = [
    HORIZONTAL_CARD_EXAMPLE_1,
    HORIZONTAL_CARD_EXAMPLE_2,
    HORIZONTAL_CARD_EXAMPLE_3,
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {politicsArticles.map((article) => (
        <HorizontalNewsCard
          key={article.id}
          article={article}
          onPress={handleArticlePress}
          onRelatedPress={handleRelatedPress}
          categoryColor="brown"
        />
      ))}
    </ScrollView>
  );
}

/**
 * Example: Featured Stories (Vertical Cards Only)
 * Use for hero sections or featured content carousels
 */
export function FeaturedStoriesExample() {
  const router = useRouter();

  const handleArticlePress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  const handleRelatedPress = (slug: string) => {
    router.push(`/article/${slug}`);
  };

  const featuredStories: NewsArticle[] = [
    VERTICAL_CARD_EXAMPLE,
    VERTICAL_CARD_EXAMPLE_2,
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={360} // Card width + padding
      decelerationRate="fast"
    >
      {featuredStories.map((article) => (
        <VerticalNewsCard
          key={article.id}
          article={article}
          onPress={handleArticlePress}
          onRelatedPress={handleRelatedPress}
          categoryColor="yellow"
        />
      ))}
    </ScrollView>
  );
}

// ============================================================================
// MOCK DATA - Replace with your API data
// ============================================================================

const VERTICAL_CARD_EXAMPLE: NewsArticle = {
  id: '1',
  title: 'Inauguran centro cultural en el corazón de Pachuca',
  subtitle: 'El nuevo espacio promoverá el arte local y ofrecerá talleres gratuitos para la comunidad',
  category: 'CULTURA',
  author: 'Carlos Ramírez',
  imageUrl: 'https://picsum.photos/seed/cultura/800/450',
  publishedAt: '2025-10-24T10:30:00Z',
  slug: 'inauguran-centro-cultural-pachuca',
  relatedArticles: [
    {
      id: 'r1',
      title: 'Artistas locales expondrán en la nueva galería municipal',
      category: 'CULTURA',
      slug: 'artistas-locales-exponen',
    },
    {
      id: 'r2',
      title: 'Programa de talleres culturales arranca en marzo',
      category: 'EDUCACIÓN',
      slug: 'talleres-culturales-marzo',
    },
  ],
};

const VERTICAL_CARD_EXAMPLE_2: NewsArticle = {
  id: '2',
  title: 'Descubren nuevas pinturas rupestres en zona arqueológica',
  subtitle: 'Los hallazgos datan de más de 2,000 años y revelan aspectos desconocidos de la cultura tolteca',
  category: 'CULTURA',
  author: 'Ana Torres',
  imageUrl: 'https://picsum.photos/seed/arqueologia/800/450',
  publishedAt: '2025-10-24T09:15:00Z',
  slug: 'pinturas-rupestres-descubrimiento',
  relatedArticles: [
    {
      id: 'r3',
      title: 'INAH anuncia nueva inversión para preservar patrimonio',
      category: 'CULTURA',
      slug: 'inah-inversion-patrimonio',
    },
    {
      id: 'r4',
      title: 'Turismo cultural aumenta 30% en Hidalgo',
      category: 'ECONOMÍA',
      slug: 'turismo-cultural-hidalgo',
    },
  ],
};

const HORIZONTAL_CARD_EXAMPLE_1: NewsArticle = {
  id: '3',
  title: 'Gobierno anuncia nuevo programa de apoyo para pequeñas empresas',
  subtitle: 'La iniciativa beneficiará a más de 500 comercios locales con créditos sin intereses',
  category: 'ECONOMÍA',
  author: 'María González',
  imageUrl: 'https://picsum.photos/seed/economia/600/450',
  publishedAt: '2025-10-24T08:45:00Z',
  slug: 'programa-apoyo-pequenas-empresas',
  relatedArticles: [
    {
      id: 'r5',
      title: 'Cámara de Comercio respalda propuesta gubernamental',
      slug: 'camara-comercio-respalda',
    },
    {
      id: 'r6',
      title: 'Emprendedores hidalguenses celebran nueva medida',
      slug: 'emprendedores-celebran',
    },
  ],
};

const HORIZONTAL_CARD_EXAMPLE_2: NewsArticle = {
  id: '4',
  title: 'Modernización del transporte público llegará a zonas periféricas',
  subtitle: 'Nuevas rutas de autobuses eléctricos conectarán colonias con el centro de la ciudad',
  category: 'SOCIEDAD',
  author: 'Roberto Martínez',
  imageUrl: 'https://picsum.photos/seed/transporte/600/450',
  publishedAt: '2025-10-24T07:30:00Z',
  slug: 'modernizacion-transporte-publico',
  relatedArticles: [
    {
      id: 'r7',
      title: 'Ciudadanos aprueban inversión en movilidad sustentable',
      slug: 'ciudadanos-movilidad-sustentable',
    },
    {
      id: 'r8',
      title: 'Reducción de emisiones podría alcanzar meta 2030',
      slug: 'reduccion-emisiones-meta',
    },
  ],
};

const HORIZONTAL_CARD_EXAMPLE_3: NewsArticle = {
  id: '5',
  title: 'Universidad hidalguense lanza programa de becas internacionales',
  subtitle: 'Estudiantes destacados podrán realizar estancias académicas en Europa y Asia',
  category: 'EDUCACIÓN',
  author: 'Laura Sánchez',
  imageUrl: 'https://picsum.photos/seed/educacion/600/450',
  publishedAt: '2025-10-24T06:15:00Z',
  slug: 'programa-becas-internacionales',
  relatedArticles: [
    {
      id: 'r9',
      title: 'Instituciones extranjeras firman convenios con UAEH',
      slug: 'instituciones-convenios-uaeh',
    },
    {
      id: 'r10',
      title: 'Movilidad estudiantil se duplica en últimos 5 años',
      slug: 'movilidad-estudiantil-duplica',
    },
  ],
};

const TEXT_ONLY_CARD_EXAMPLE: NewsArticle = {
  id: '6',
  title: 'Congreso aprueba reformas al código urbano de Hidalgo',
  subtitle: 'Las modificaciones buscan agilizar trámites de construcción y mejorar la planificación territorial',
  category: 'POLÍTICA',
  author: 'Ana Torres',
  publishedAt: '2025-10-24T11:00:00Z',
  slug: 'congreso-reformas-codigo-urbano',
  relatedArticles: [
    {
      id: 'r11',
      title: 'Desarrolladores inmobiliarios aplauden nueva legislación',
      slug: 'desarrolladores-aplauden',
    },
    {
      id: 'r12',
      title: 'Ciudadanos podrán consultar zonificación en línea',
      slug: 'zonificacion-en-linea',
    },
  ],
};

const TEXT_ONLY_CARD_EXAMPLE_2: NewsArticle = {
  id: '7',
  title: 'Diputados discuten iniciativa para proteger zonas naturales protegidas',
  subtitle: 'La propuesta incluye sanciones más severas para actividades que dañen ecosistemas',
  category: 'MEDIO AMBIENTE',
  author: 'Pedro Hernández',
  publishedAt: '2025-10-24T05:45:00Z',
  slug: 'iniciativa-zonas-naturales',
  relatedArticles: [
    {
      id: 'r13',
      title: 'Organizaciones ambientalistas respaldan medida',
      slug: 'organizaciones-respaldan',
    },
    {
      id: 'r14',
      title: 'Parques nacionales recibirán mayor presupuesto',
      slug: 'parques-presupuesto',
    },
  ],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
});
