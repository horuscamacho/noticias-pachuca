/**
 * Quick Read Screen
 * Swipeable article summaries with UNIDIRECTIONAL progression
 *
 * Features:
 * - UNIDIRECTIONAL swipe: Both left and right advance to next article
 * - Cross-fade animations (Reanimated v4)
 * - Pan gesture handling (Gesture Handler v2)
 * - Rotating dot indicator (Walkman-style wheel)
 * - Circular queue for infinite loop
 * - Memory efficient rendering (max 2 cards in DOM)
 * - 60fps performance on UI thread
 *
 * Implementation:
 * - SwipeableCard: Gesture + animation wrapper
 * - useSwipeGesture: Pan gesture configuration (unidirectional)
 * - useSwipeFadeAnimation: Cross-fade interpolation
 * - Circular queue: Move viewed article from start to end
 *
 * Navigation:
 * - Swipe left OR right: Advance to next article (unidirectional)
 * - Tap image/title: Navigate to full article
 * - Tab bar at bottom (inherited from (invited) layout)
 *
 * Circular Queue Behavior:
 * - Always show articles[0] as current
 * - On swipe complete: Remove articles[0], append to end
 * - Result: Infinite loop for testing
 *
 * @module app/(invited)/quick/index
 * @version 3.0.0
 */

import React, { useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeableCard, QuickReadArticleData } from '@/components/quick';
import { RotatingDotIndicator } from '@/components/quick/RotatingDotIndicator';
import { QUICK_READ_COLORS } from '@/components/quick/QuickRead.tokens';
import type { SwipeDirection } from '@/hooks/useSwipeGesture';

/**
 * Mock articles for testing visual design
 * TODO: Replace with API data in next phase
 */
const MOCK_ARTICLES: QuickReadArticleData[] = [
  {
    id: '1',
    slug: 'mineral-reforma-transparencia',
    title: 'Mineral de la Reforma en el radar de la transparencia',
    summary:
      'En una señal contundente de avance institucional, Mineral de la Reforma volvió a figurar entre los municipios más comprometidos con la rendición de cuentas en Hidalgo. Este reconocimiento reafirma la importancia de mantener prácticas transparentes que fortalezcan la confianza ciudadana.',
    author: {
      name: 'Pablo Domínguez',
    },
    category: {
      id: 'politica',
      label: 'POLÍTICA',
      color: '#FFB22C',
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=1',
      alt: 'Imagen de Mineral de la Reforma',
    },
  },
  {
    id: '2',
    slug: 'pachuca-gana-final',
    title: 'Pachuca se corona campeón en final histórica',
    summary:
      'Los Tuzos del Pachuca conquistaron el título en una final memorable que quedará grabada en la historia del club. Con una actuación sobresaliente, el equipo demostró su calidad y determinación en el campo, para alegría de su afición.',
    author: {
      name: 'Javier Hernández',
    },
    category: {
      id: 'deportes',
      label: 'DEPORTES',
      color: '#854836',
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=2',
      alt: 'Celebración del equipo Pachuca',
    },
  },
  {
    id: '3',
    slug: 'inversion-economia-hidalgo',
    title: 'Nueva inversión impulsa economía en Hidalgo',
    summary:
      'El estado de Hidalgo recibirá una importante inversión que promete generar miles de empleos y dinamizar la economía local. Autoridades estatales y empresarios destacaron el potencial de crecimiento que representa este proyecto para la región.',
    author: {
      name: 'María González',
    },
    category: {
      id: 'economia',
      label: 'ECONOMÍA',
      color: '#FF0000',
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=3',
      alt: 'Desarrollo económico en Hidalgo',
    },
  },
  {
    id: '4',
    slug: 'nuevo-hospital-pachuca',
    title: 'Inauguran nuevo hospital en Pachuca con tecnología de punta',
    summary:
      'La ciudad de Pachuca cuenta con un nuevo hospital equipado con tecnología de última generación. Este centro médico beneficiará a miles de habitantes y representa un avance significativo en la infraestructura de salud del estado.',
    author: {
      name: 'Carlos Ramírez',
    },
    category: {
      id: 'salud',
      label: 'SALUD',
      color: '#000000',
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=4',
      alt: 'Nuevo hospital en Pachuca',
    },
  },
  {
    id: '5',
    slug: 'seguridad-refuerzo-vigilancia',
    title: 'Refuerzan vigilancia en zonas estratégicas de la ciudad',
    summary:
      'Las autoridades implementaron un nuevo operativo de seguridad que incluye mayor presencia policial en zonas clave. Esta medida busca prevenir delitos y mejorar la percepción de seguridad entre los habitantes de la ciudad.',
    author: {
      name: 'Ana Martínez',
    },
    category: {
      id: 'seguridad',
      label: 'SEGURIDAD',
      color: '#854836',
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=5',
      alt: 'Operativo de seguridad',
    },
  },
];

/**
 * QuickReadScreen - Main screen component
 *
 * Displays swipeable article cards with UNIDIRECTIONAL progression and
 * circular queue for infinite loop.
 *
 * Gesture Behavior:
 * - UNIDIRECTIONAL: Swipe left OR right → Always advances to next article
 * - Direction passed to dot indicator for rotation animation
 * - Threshold: 40% screen width OR 800px/s velocity
 * - Cancel: Spring back if threshold not met
 *
 * Circular Queue:
 * - Always display articles[0] as current article
 * - On swipe complete: Remove articles[0], append to end
 * - Result: Infinite loop, never runs out of articles
 *
 * Animation:
 * - Current card fades out (1 → 0) with parallax
 * - Next card fades in (0 → 1)
 * - Duration: 300ms with cubic easing
 * - Dots rotate based on swipe direction (Walkman-style)
 * - 60fps performance on UI thread
 *
 * Navigation:
 * - Tap image/title: Navigate to full article detail
 * - Tab bar at bottom (inherited from (invited) layout)
 *
 * Accessibility:
 * - Screen reader support for all interactive elements
 * - Progress indicator shows current position in rotation
 * - Swipe gesture accessible via screen reader
 * - Proper roles and labels throughout
 */
export default function QuickReadScreen() {
  const router = useRouter();

  // Base articles array (never changes)
  const articles = MOCK_ARTICLES;

  // Virtual index that always increases (use modulo for circular access)
  const [virtualIndex, setVirtualIndex] = useState(0);

  // Last swipe direction for dot indicator animation
  const [lastSwipeDirection, setLastSwipeDirection] = useState<SwipeDirection | null>(null);

  /**
   * Handle swipe completion (unidirectional - always advances)
   * Just increment virtual index - articles array stays the same
   * Direction is used for dot indicator rotation animation
   */
  const handleSwipeComplete = useCallback((direction: SwipeDirection) => {
    // Store direction for dot indicator animation
    setLastSwipeDirection(direction);

    // Increment virtual index (circular with modulo)
    setVirtualIndex((prev) => prev + 1);
  }, []);

  /**
   * Handle rotation animation complete
   * Reset swipe direction to prepare for next swipe
   */
  const handleAnimationComplete = useCallback(() => {
    setLastSwipeDirection(null);
  }, []);

  /**
   * Handle press on card (image or title)
   * Navigates to full article detail screen
   */
  const handleArticlePress = useCallback(
    (slug: string) => {
      // Navigate to article detail using slug
      router.push(`/(individuals)/news/${slug}`);
    },
    [router]
  );

  // Calculate current and next articles using modulo for circular access
  const currentArticle = articles[virtualIndex % articles.length];
  const nextArticle = articles[(virtualIndex + 1) % articles.length];

  // Create array with only these 2 articles for SwipeableCard
  const visibleArticles = [currentArticle, nextArticle];

  return (
    <>
      {/* Status bar configuration */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={QUICK_READ_COLORS.screenBackground}
      />

      {/* Gesture Handler Root (required for gesture detection) */}
      <GestureHandlerRootView style={styles.gestureRoot}>
        {/* Main container with safe area */}
        <SafeAreaView style={styles.container}>
          {/* Swipeable Card Stack */}
          {/* Key by virtualIndex so React creates new instance each swipe */}
          <SwipeableCard
            key={`swipeable-${virtualIndex}`}
            articles={visibleArticles}
            currentIndex={0} // Always 0 (first of the 2 visible articles)
            onSwipeComplete={handleSwipeComplete}
            onArticlePress={handleArticlePress}
            testID="quick-read-swipeable"
          />

          {/* Rotating Dot Indicator (Walkman-style) */}
          <RotatingDotIndicator
            lastSwipeDirection={lastSwipeDirection}
            onAnimationComplete={handleAnimationComplete}
            testID="quick-read-indicators"
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </>
  );
}

/**
 * Styles for QuickReadScreen
 */
const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
});
