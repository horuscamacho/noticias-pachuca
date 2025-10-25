/**
 * Tab content with news cards examples
 * @module TabContentWithNews
 * @version 2.0.0 - Fake Scroll Architecture
 */

import type { NewsArticle } from "@/components/news";
import {
  HorizontalNewsCard,
  TextOnlyNewsCard,
  VerticalNewsCard,
} from "@/components/news";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

// Mock data para ejemplos
const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    title:
      "Gobierno anuncia nuevas inversiones para infraestructura en Hidalgo",
    subtitle:
      "El proyecto incluye la construcción de nuevas carreteras y modernización del transporte público",
    category: "POLÍTICA",
    author: "María González",
    imageUrl: "https://picsum.photos/400/300?random=1",
    slug: "gobierno-inversiones-hidalgo",
    publishedAt: "2025-10-24T10:30:00Z",
    relatedArticles: [
      {
        id: "r1",
        title: "Presupuesto 2025 aprobado por el congreso",
        slug: "presupuesto-2025",
        category: "ECONOMÍA",
      },
      {
        id: "r2",
        title: "Obra del nuevo hospital inicia en diciembre",
        slug: "nuevo-hospital",
        category: "SALUD",
      },
    ],
  },
  {
    id: "2",
    title: "Tuzos del Pachuca clasifican a la final del torneo apertura 2025",
    subtitle:
      "El equipo hidalguense venció 3-1 al líder general y se enfrentará al América en la gran final",
    category: "DEPORTES",
    author: "Carlos Ramírez",
    imageUrl: "https://picsum.photos/400/300?random=2",
    slug: "tuzos-clasifican-final",
    publishedAt: "2025-10-24T09:15:00Z",
    relatedArticles: [
      {
        id: "r3",
        title: "Aficionados celebran en las calles de Pachuca",
        slug: "celebracion-aficionados",
      },
      {
        id: "r4",
        title: "Entrevista exclusiva con el entrenador",
        slug: "entrevista-dt",
      },
    ],
  },
  {
    id: "3",
    title: "Inflación en Hidalgo se mantiene estable según últimos indicadores",
    subtitle:
      "Los precios de la canasta básica muestran incremento moderado del 2.1% anual",
    category: "ECONOMÍA",
    author: "Laura Hernández",
    slug: "inflacion-hidalgo-estable",
    publishedAt: "2025-10-24T08:00:00Z",
    relatedArticles: [
      {
        id: "r5",
        title: "Peso mexicano se fortalece frente al dólar",
        slug: "peso-fortalece",
      },
      {
        id: "r6",
        title: "Comerciantes locales reportan buenas ventas",
        slug: "ventas-comerciantes",
      },
    ],
  },
  {
    id: "4",
    title:
      "Nueva campaña de vacunación contra influenza inicia la próxima semana",
    subtitle:
      "Centros de salud atenderán de lunes a sábado con horario extendido",
    category: "SALUD",
    author: "Dr. Roberto Sánchez",
    imageUrl: "https://picsum.photos/400/300?random=4",
    slug: "campana-vacunacion-influenza",
    publishedAt: "2025-10-24T07:30:00Z",
    relatedArticles: [
      {
        id: "r7",
        title: "Recomendaciones para prevenir enfermedades respiratorias",
        slug: "prevenir-respiratorias",
        category: "SALUD",
      },
      {
        id: "r8",
        title: "Hospital general amplía horarios de atención",
        slug: "hospital-horarios",
        category: "SALUD",
      },
    ],
  },
  {
    id: "5",
    title: "Refuerzan seguridad en zona centro tras reportes ciudadanos",
    subtitle:
      "Aumentan patrullajes nocturnos y se instalan nuevas cámaras de vigilancia",
    category: "SEGURIDAD",
    author: "José Luis Torres",
    slug: "refuerzan-seguridad-centro",
    publishedAt: "2025-10-24T06:45:00Z",
    relatedArticles: [
      {
        id: "r9",
        title: "Vecinos forman comités de vigilancia",
        slug: "comites-vigilancia",
      },
      {
        id: "r10",
        title: "Coordinación entre policía municipal y estatal",
        slug: "coordinacion-policial",
      },
    ],
  },
];

interface TabContentWithNewsProps {
  categorySlug: string;
  /** Height of the collapsible header (for dead space) */
  headerHeight: number;
  /** Reanimated scroll handler from parent hook */
  scrollHandler: any;
}

export const TabContentWithNews: React.FC<TabContentWithNewsProps> = ({
  categorySlug,
  headerHeight,
  scrollHandler,
}) => {
  const router = useRouter();

  const handleCardPress = (slug: string) => {
    console.log("📰 Article pressed:", slug);
    // Navigate to individual article screen
    // We need to find the article ID from the slug
    const article = MOCK_ARTICLES.find((a) => a.slug === slug);
    if (article) {
      router.push(`/(individuals)/news/${article.id}`);
    }
  };

  const handleRelatedPress = (slug: string) => {
    console.log("🔗 Related article pressed:", slug);
    // For related articles, we'll need to find them by slug as well
    // For now, let's navigate to a placeholder ID
    const article = MOCK_ARTICLES.find((a) => a.slug === slug);
    if (article) {
      router.push(`/(individuals)/news/${article.id}`);
    }
  };

  // Filter articles by category (for TODAS show all)
  const filteredArticles =
    categorySlug === "todas"
      ? MOCK_ARTICLES
      : MOCK_ARTICLES.filter((a) => a.category.toLowerCase() === categorySlug);

  console.log(
    "🎯 TabContentWithNews rendered for:",
    categorySlug,
    "Articles:",
    filteredArticles.length
  );

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Dead space for fake scroll effect */}
      <View style={{ height: headerHeight }} />

      {/* Actual content */}
      <View style={styles.container}>
        {/* Example: Vertical card for first article */}
        {filteredArticles[0] && (
          <View style={styles.cardWrapper}>
            <VerticalNewsCard
              article={filteredArticles[0]}
              onPress={handleCardPress}
              onRelatedPress={handleRelatedPress}
              categoryColor="brown"
            />
          </View>
        )}

        {/* Example: Horizontal card for second article */}
        {filteredArticles[1] && (
          <View style={styles.cardWrapper}>
            <HorizontalNewsCard
              article={filteredArticles[1]}
              onPress={handleCardPress}
              onRelatedPress={handleRelatedPress}
              categoryColor="yellow"
            />
          </View>
        )}

        {/* Example: Horizontal cards for middle articles */}
        {filteredArticles.slice(2, 3).map((article) => (
          <View key={article.id} style={styles.cardWrapper}>
            <HorizontalNewsCard
              article={article}
              onPress={handleCardPress}
              onRelatedPress={handleRelatedPress}
              categoryColor="yellow"
            />
          </View>
        ))}

        {/* Example: Text-only card */}
        {filteredArticles[3] && (
          <View style={styles.cardWrapper}>
            <TextOnlyNewsCard
              article={filteredArticles[3]}
              onPress={handleCardPress}
              onRelatedPress={handleRelatedPress}
              categoryColor="brown"
            />
          </View>
        )}

        {/* Example: More horizontal cards */}
        {filteredArticles.slice(4).map((article) => (
          <View key={article.id} style={styles.cardWrapper}>
            <HorizontalNewsCard
              article={article}
              onPress={handleCardPress}
              onRelatedPress={handleRelatedPress}
              categoryColor="yellow"
            />
          </View>
        ))}
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    paddingBottom: 80,
  },
  container: {
    backgroundColor: "#F7F7F7",
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
});
