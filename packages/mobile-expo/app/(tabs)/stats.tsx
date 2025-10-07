import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';

export default function StatsScreen() {
  const { isTablet } = useResponsive();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet
        ]}
      >
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Estadísticas
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Analiza el rendimiento de tu contenido
          </ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText variant="title-medium" style={styles.cardTitle}>
            Dashboard de Estadísticas
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            Aquí irán las métricas y análisis de rendimiento
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    marginBottom: 32
  },
  title: {
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    color: '#6B7280'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  cardTitle: {
    color: '#111827',
    marginBottom: 12
  }
});
