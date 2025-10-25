/**
 * useArticleDetails Hook
 * Manages article details logic including data fetching, sharing, and formatting
 */

import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export interface ArticleDetailsData {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  imageUrl?: string;
  imageTitle?: string;
  publishedAt: string;
  summary: string;
  content: string;
  highlightQuote?: string;
  quoteAuthor?: string;
  keywords: string[];
  slug: string;
}

interface UseArticleDetailsOptions {
  articleId: string;
}

interface UseArticleDetailsReturn {
  article: ArticleDetailsData | null;
  isLoading: boolean;
  error: Error | null;
  formattedDate: string;
  handleBack: () => void;
  handleShareTwitter: () => void;
  handleShareFacebook: () => void;
}

/**
 * Custom hook for managing article details screen logic
 *
 * @param options - Hook options containing articleId
 * @returns Article data, loading state, and action handlers
 *
 * @example
 * ```tsx
 * const {
 *   article,
 *   isLoading,
 *   formattedDate,
 *   handleBack,
 *   handleShareTwitter,
 *   handleShareFacebook
 * } = useArticleDetails({ articleId: '123' });
 * ```
 */
export function useArticleDetails({
  articleId,
}: UseArticleDetailsOptions): UseArticleDetailsReturn {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Format published date
  const formattedDate = article?.publishedAt
    ? formatPublishedDate(article.publishedAt)
    : '';

  // Fetch article data (mock for now, replace with actual API call)
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const response = await fetch(`/api/articles/${articleId}`);
        // const data = await response.json();

        // Mock data for development
        const mockArticle: ArticleDetailsData = {
          id: articleId,
          title: 'Mineral de la Reforma en el radar de la transparencia: reconocimiento por segunda vez',
          subtitle: 'La comisionada presidenta del ITAIH entregó constancia de cumplimiento al municipio',
          category: 'POLÍTICA',
          author: 'Pablo Domínguez',
          imageUrl: 'https://picsum.photos/800/450?random=1',
          imageTitle: 'Mineral de la Reforma en el radar de la transparencia: reconocimiento por segunda vez',
          publishedAt: '2025-10-24T10:45:00Z',
          summary: 'En una señal contundente de avance institucional, Mineral de la Reforma volvió a figurar entre los municipios más comprometidos con la rendición de cuentas. Por segunda ocasión, la comisionada presidenta del **Instituto de Transparencia y Acceso a la Información Pública Gubernamental**, **Myrna Moncada Mahuem**, entregó una constancia de cumplimiento al municipio, luego de que la calificación obtenida en la materia alcanzara el máximo puntaje.',
          content: `La entrega tuvo lugar ante la presencia de autoridades municipales y estatales, y se inscribe en una política de fortalecimiento de la transparencia que busca consolidar la confianza ciudadana frente a las gestiones públicas. **Moncada Mahuem** subrayó que el reconocimiento no es un fin en sí mismo, sino un resultado de un esfuerzo sostenido por una administración que ha priorizado la publicación de información y la lucha contra la corrupción.

Este logro es posible gracias al trabajo coordinado de secretarios municipales, integrantes del Cabildo y funcionarios estatales, quienes destacaron que la calificación máxima no solo acredita el cumplimiento de obligaciones básicas de acceso a la información, sino que impulsa una cultura de rendición de cuentas sostenida en el tiempo. **Medécigo Rubio** afirmó que este logro no sería posible sin un equipo diverso que ha trabajado de manera coordinada para publicar información de forma oportuna y transparente.

La regidora **Julia Sayonara Ramos Olivares** destacó que la constancia dictaminadora respalda el cumplimiento de las obligaciones de transparencia y de la publicación de información gubernamental relevante. Agradeció, además, el respaldo del alcalde y de la presidenta del DIF municipal, **Samantha Esparza**, para continuar fortaleciendo la transparencia como columna vertebral de la gestión pública. En esa línea, la funcionaria recordó la importancia de mantener mecanismos de supervisión y participación ciudadana para consolidar el progreso obtenido.`,
          highlightQuote: 'Este certificado de cumplimiento con la calificación más alta es el reflejo de una labor que involucra a todas las dependencias y a los servidores públicos que integran el Ayuntamiento, desde el primer nivel hasta la toma de decisiones estratégicas.',
          quoteAuthor: 'Medécigo Rubio, Alcalde de Mineral de la Reforma',
          keywords: ['transparencia', 'mineral de la reforma', 'política', 'gobierno', 'rendición de cuentas'],
          slug: 'mineral-reforma-reconocimiento-transparencia',
        };

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setArticle(mockArticle);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar el artículo'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Handle Twitter share
  const handleShareTwitter = useCallback(() => {
    if (!article) return;

    const text = encodeURIComponent(article.title);
    const url = encodeURIComponent(`https://noticiaspachuca.com/article/${article.id}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

    Linking.canOpenURL(twitterUrl).then((supported) => {
      if (supported) {
        Linking.openURL(twitterUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir Twitter en este dispositivo');
      }
    });
  }, [article]);

  // Handle Facebook share
  const handleShareFacebook = useCallback(() => {
    if (!article) return;

    const url = encodeURIComponent(`https://noticiaspachuca.com/article/${article.id}`);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;

    Linking.canOpenURL(facebookUrl).then((supported) => {
      if (supported) {
        Linking.openURL(facebookUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir Facebook en este dispositivo');
      }
    });
  }, [article]);

  return {
    article,
    isLoading,
    error,
    formattedDate,
    handleBack,
    handleShareTwitter,
    handleShareFacebook,
  };
}

/**
 * Format ISO date to readable format
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string (e.g., "24 Oct 2025")
 */
function formatPublishedDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-MX', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return isoDate;
  }
}
