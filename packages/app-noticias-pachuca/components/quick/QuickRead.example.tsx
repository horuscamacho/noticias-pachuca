/**
 * Quick Read Components Usage Examples
 *
 * Demonstrates how to use QuickReadCard and SwipeIndicator components.
 * This file is for development reference only.
 *
 * @module components/quick/QuickRead.example
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet, ScrollView, Button } from 'react-native';
import { QuickReadCard, QuickReadArticleData } from './QuickReadCard';
import { SwipeIndicator } from './SwipeIndicator';
import { ThemedText } from '../ThemedText';
import { QUICK_READ_COLORS } from './QuickRead.tokens';

/**
 * Example 1: Single QuickReadCard
 * Most basic usage - just render a card with article data
 */
export function Example1_SingleCard() {
  const article: QuickReadArticleData = {
    id: '1',
    slug: 'example-article',
    title: 'Esta es una noticia de ejemplo con título largo',
    summary:
      'Este es un resumen de ejemplo que muestra cómo se ve el texto del artículo. ' +
      'Puede incluir varias líneas de texto que se truncarán automáticamente después ' +
      'de 5 líneas para mantener el diseño consistente.',
    author: {
      name: 'Juan Pérez',
    },
    category: {
      id: 'deportes',
      label: 'DEPORTES',
      color: '#854836',
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=1',
      alt: 'Imagen de ejemplo',
    },
  };

  const handlePress = () => {
    console.log('Card pressed!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <QuickReadCard article={article} onPress={handlePress} />
    </SafeAreaView>
  );
}

/**
 * Example 2: SwipeIndicator Component
 * Shows pagination dots for multiple articles
 */
export function Example2_SwipeIndicator() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalArticles = 5;

  return (
    <View style={styles.indicatorExample}>
      <ThemedText variant="h3" style={{ textAlign: 'center', marginBottom: 20 }}>
        Swipe Indicator Demo
      </ThemedText>

      <View style={{ height: 100, position: 'relative' }}>
        <SwipeIndicator total={totalArticles} currentIndex={currentIndex} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 20 }}>
        <Button
          title="Previous"
          onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        />
        <Button
          title="Next"
          onPress={() => setCurrentIndex(Math.min(totalArticles - 1, currentIndex + 1))}
          disabled={currentIndex === totalArticles - 1}
        />
      </View>

      <ThemedText variant="body" style={{ textAlign: 'center', marginTop: 20 }}>
        Current: {currentIndex + 1} / {totalArticles}
      </ThemedText>
    </View>
  );
}

/**
 * Example 3: Multiple Cards with Navigation
 * Simulates the full Quick Read experience with manual navigation
 */
export function Example3_MultipleCards() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const articles: QuickReadArticleData[] = [
    {
      id: '1',
      slug: 'politica-ejemplo',
      title: 'Mineral de la Reforma destaca en transparencia',
      summary:
        'En una señal contundente de avance institucional, Mineral de la Reforma volvió a figurar entre los municipios más comprometidos.',
      author: { name: 'Pablo Domínguez' },
      category: { id: 'politica', label: 'POLÍTICA', color: '#FFB22C' },
      heroImage: {
        url: 'https://picsum.photos/800/450?random=1',
        alt: 'Política',
      },
    },
    {
      id: '2',
      slug: 'deportes-ejemplo',
      title: 'Pachuca gana partido histórico',
      summary:
        'Los Tuzos conquistaron una victoria memorable que quedará en la historia del club hidalguense.',
      author: { name: 'Javier Hernández' },
      category: { id: 'deportes', label: 'DEPORTES', color: '#854836' },
      heroImage: {
        url: 'https://picsum.photos/800/450?random=2',
        alt: 'Deportes',
      },
    },
    {
      id: '3',
      slug: 'economia-ejemplo',
      title: 'Nueva inversión impulsa economía',
      summary:
        'Importante proyecto económico promete generar miles de empleos en el estado.',
      author: { name: 'María González' },
      category: { id: 'economia', label: 'ECONOMÍA', color: '#FF0000' },
      heroImage: {
        url: 'https://picsum.photos/800/450?random=3',
        alt: 'Economía',
      },
    },
  ];

  const handleCardPress = () => {
    console.log(`Navigating to article: ${articles[currentIndex].slug}`);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(articles.length - 1, prev + 1));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Card */}
      <QuickReadCard article={articles[currentIndex]} onPress={handleCardPress} />

      {/* Indicators */}
      <SwipeIndicator total={articles.length} currentIndex={currentIndex} />

      {/* Manual Navigation (for testing - will be replaced by gestures) */}
      <View style={styles.navigationButtons}>
        <Button title="← Previous" onPress={goToPrevious} disabled={currentIndex === 0} />
        <Button
          title="Next →"
          onPress={goToNext}
          disabled={currentIndex === articles.length - 1}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Example 4: Card without Image
 * Shows how the component handles missing hero images
 */
export function Example4_NoImage() {
  const article: QuickReadArticleData = {
    id: '4',
    slug: 'no-image-example',
    title: 'Artículo sin imagen de ejemplo',
    summary:
      'Este artículo no tiene imagen, por lo que se mostrará una imagen placeholder. ' +
      'El componente maneja este caso automáticamente.',
    author: { name: 'Editor' },
    category: { id: 'estado', label: 'ESTADO', color: '#FFB22C' },
    // No heroImage property - fallback will be used
  };

  return (
    <SafeAreaView style={styles.container}>
      <QuickReadCard article={article} onPress={() => console.log('Pressed')} />
    </SafeAreaView>
  );
}

/**
 * Example 5: Custom Category Colors
 * Demonstrates using custom colors for category badges
 */
export function Example5_CustomColors() {
  const article: QuickReadArticleData = {
    id: '5',
    slug: 'custom-color-example',
    title: 'Artículo con categoría personalizada',
    summary: 'Este artículo usa un color personalizado para la categoría.',
    author: { name: 'Editor' },
    category: {
      id: 'especial',
      label: 'ESPECIAL',
      color: '#9333EA', // Custom purple color
    },
    heroImage: {
      url: 'https://picsum.photos/800/450?random=10',
      alt: 'Especial',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <QuickReadCard article={article} onPress={() => console.log('Pressed')} />
    </SafeAreaView>
  );
}

/**
 * Example 6: All Examples in ScrollView
 * Showcases all components together
 */
export function AllExamples() {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.exampleSection}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          1. Single Card
        </ThemedText>
        <Example1_SingleCard />
      </View>

      <View style={styles.exampleSection}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          2. Swipe Indicator
        </ThemedText>
        <Example2_SwipeIndicator />
      </View>

      <View style={styles.exampleSection}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          3. Multiple Cards
        </ThemedText>
        <Example3_MultipleCards />
      </View>

      <View style={styles.exampleSection}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          4. No Image
        </ThemedText>
        <Example4_NoImage />
      </View>

      <View style={styles.exampleSection}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          5. Custom Colors
        </ThemedText>
        <Example5_CustomColors />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: QUICK_READ_COLORS.screenBackground,
  },
  exampleSection: {
    marginBottom: 40,
    paddingVertical: 20,
    borderBottomWidth: 4,
    borderBottomColor: QUICK_READ_COLORS.borderColor,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  indicatorExample: {
    padding: 20,
    backgroundColor: QUICK_READ_COLORS.cardBackground,
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    borderTopWidth: 4,
    borderTopColor: QUICK_READ_COLORS.borderColor,
  },
});
