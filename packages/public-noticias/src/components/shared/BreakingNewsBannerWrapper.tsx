/**
 * 🚨 BreakingNewsBannerWrapper
 *
 * Wrapper que fetch datos dinámicos de contenido URGENT desde API
 * y los pasa al componente BreakingNewsBanner (componente original del cintillo)
 */

'use client';

import { useState, useEffect } from 'react';
import { BreakingNewsBanner, BreakingNewsItem } from './BreakingNewsBanner';
import { getActiveUrgentContent } from '../../features/urgent-content/server';

export function BreakingNewsBannerWrapper() {
  const [news, setNews] = useState<BreakingNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cargar y transformar datos
  const loadUrgentContent = async () => {
    try {
      const response = await getActiveUrgentContent();

      // Transformar datos de API a formato BreakingNewsItem
      const transformed: BreakingNewsItem[] = response.content
        .filter(item => item.slug && item.title) // Solo items con slug y title
        .map(item => ({
          id: item.id,
          slug: item.slug!,
          title: item.title!,
          excerpt: item.title!, // Usar título como excerpt (breaking news es corto)
        }));

      setNews(transformed);
      setIsLoading(false);
    } catch (error) {
      console.error('[BreakingNewsBannerWrapper] Error loading urgent content:', error);
      setIsLoading(false);
      setNews([]); // Array vacío = no mostrar banner
    }
  };

  // Cargar contenido inicial
  useEffect(() => {
    loadUrgentContent();
  }, []);

  // Polling cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadUrgentContent();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // No mostrar nada mientras carga (evitar CLS)
  if (isLoading || news.length === 0) {
    return null;
  }

  // Renderizar componente original con datos dinámicos
  return <BreakingNewsBanner news={news} />;
}
