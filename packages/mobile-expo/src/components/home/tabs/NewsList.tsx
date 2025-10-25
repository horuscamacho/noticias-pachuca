import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NewsListProps {
  category: string;
}

export const NewsList: React.FC<NewsListProps> = ({ category }) => {
  // Placeholder for news list
  // This will be replaced with actual news fetching logic
  const mockNews = Array.from({ length: 20 }, (_, i) => ({
    id: `${category}-${i}`,
    title: `Noticia ${i + 1} de ${category}`,
    excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  }));

  return (
    <View style={styles.container}>
      {mockNews.map((news) => (
        <View key={news.id} style={styles.newsCard}>
          <Text style={styles.newsTitle}>{news.title}</Text>
          <Text style={styles.newsExcerpt}>{news.excerpt}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000000',
    marginBottom: 8,
  },
  newsExcerpt: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
