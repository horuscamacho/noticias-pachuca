/**
 * 📋 Prompt para análisis de página de listado
 * Optimizado para GPT-4o-mini
 */

export const LISTING_ANALYSIS_SYSTEM_PROMPT = `Eres un experto en web scraping y análisis de HTML móvil. Tu tarea es identificar el selector CSS correcto para extraer enlaces de artículos de una página de noticias.

IMPORTANTE: Este HTML proviene de la versión MÓVIL del sitio web. Los selectores pueden ser diferentes a la versión desktop.

CRITERIOS IMPORTANTES:
1. El selector debe matchear MÚLTIPLES elementos (lista de artículos) - MÍNIMO 5 artículos
2. Busca estos patrones COMUNES en sitios de noticias:

   WORDPRESS (muy común):
   - .entry-title a, h3.entry-title a, .post-title a
   - .td-module-title a (tema Newspaper)
   - .entry-header a, .article-title a

   HTML5 SEMÁNTICO:
   - article a[rel="bookmark"]
   - article h2 a, article h3 a
   - article .title a

   GENÉRICOS:
   - .news-item a, .post a, .item-title a
   - .card-title a, .headline a

3. VERIFICA que los enlaces sean a artículos individuales:
   - URLs deben contener slugs únicos (/2025/10/09/titulo-articulo/)
   - Deben tener atributo rel="bookmark" o title descriptivo
   - NO deben ser enlaces de categorías, tags, "ver más", compartir, etc.

4. Prioriza selectores ESPECÍFICOS sobre genéricos:
   ✅ BUENO: .entry-title.td-module-title a
   ✅ BUENO: h3.entry-title a[rel="bookmark"]
   ❌ MALO: a (demasiado genérico)
   ❌ MALO: div > a (muy genérico)

5. El selector DEBE apuntar directamente a elementos <a>
6. EXCLUYE enlaces de navegación, header, footer, sidebar

RESPONDE SOLO CON JSON. No agregues texto adicional.`;

export function generateListingAnalysisUserPrompt(html: string, url: string): string {
  return `Analiza el siguiente HTML MÓVIL de una página de noticias y encuentra el selector CSS que captura TODOS los enlaces de artículos individuales.

URL ANALIZADA: ${url}
NOTA: Este HTML fue extraído usando un user agent móvil (iPhone Safari).

HTML:
\`\`\`html
${html}
\`\`\`

Devuelve un JSON con este formato exacto:
{
  "articleLinks": "selector CSS aquí",
  "confidence": 0.95,
  "reasoning": "Explica brevemente por qué elegiste este selector y cuántos artículos debería encontrar"
}

IMPORTANTE:
- El selector DEBE funcionar en la versión móvil del sitio
- Cuenta mentalmente cuántos elementos matchearía (debe ser 5-20 artículos)
- Verifica que los hrefs sean URLs de artículos individuales, NO categorías
- Si ves clases como "entry-title", "post-title", "td-module-title" úsalas
- Si hay múltiples patrones, elige el MÁS ESPECÍFICO

EJEMPLOS de buenos selectores:
- h3.entry-title a → matchea <h3 class="entry-title"><a href="...">
- .td-module-title a[rel="bookmark"] → enlaces con bookmark
- article .post-title a → títulos dentro de article

El valor de "confidence" debe ser un número entre 0 y 1, donde:
- 0.9-1.0: Muy confiado (selector robusto que matchea claramente los artículos)
- 0.7-0.9: Confiado (selector funcional pero podría optimizarse)
- 0.5-0.7: Moderadamente confiado (selector basado en estructura genérica)
- < 0.5: Poco confiado (selector incierto)`;
}

export const LISTING_ANALYSIS_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    articleLinks: {
      type: 'string' as const,
      description: 'CSS selector que captura los enlaces de artículos',
    },
    confidence: {
      type: 'number' as const,
      description: 'Nivel de confianza del selector (0-1)',
      minimum: 0,
      maximum: 1,
    },
    reasoning: {
      type: 'string' as const,
      description: 'Explicación de por qué se eligió este selector',
    },
  },
  required: ['articleLinks', 'confidence', 'reasoning'],
  additionalProperties: false,
};
