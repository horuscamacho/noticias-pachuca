/**
 * 📄 Prompt para análisis de página de contenido individual
 * Optimizado para GPT-4o-mini
 */

export const CONTENT_ANALYSIS_SYSTEM_PROMPT = `Eres un experto en web scraping y análisis de HTML. Tu tarea es identificar los selectores CSS correctos para extraer el contenido de un artículo de noticias.

CRITERIOS IMPORTANTES:
1. titleSelector: Debe capturar el título principal (h1, .title, etc.)
2. contentSelector: Debe capturar TODO el cuerpo del artículo, no solo un párrafo
   - Busca contenedores como .article-body, .entry-content, article .content
   - Si hay múltiples párrafos, el selector debe capturar el contenedor padre
3. imageSelector: Todas las imágenes del contenido del artículo (opcional)
   - IMPORTANTE: Si un contenedor tiene MÚLTIPLES versiones de la MISMA imagen (ej: responsive images con diferentes resoluciones),
     el selector DEBE ser específico para capturar SOLO la versión de MAYOR RESOLUCIÓN
   - Usa atributos width para filtrar: Ejemplo: "figure.main-photo img[width='960']" o "figure img[width='1200']"
   - Si hay múltiples <img> o <amp-img> en el mismo contenedor con diferentes width, usa el width más alto
   - Patrones comunes de responsive images que DEBES detectar:
     * <picture> con múltiples <source>: Selecciona solo el <img> final o usa :first-of-type
     * Múltiples <amp-img>: Usa [width='XXX'] donde XXX es el width más alto que veas
     * Si NO hay múltiples versiones, usa el selector general (ej: "article img", ".content figure img")
4. dateSelector: Fecha de publicación (opcional, busca <time>, .publish-date, etc.)
5. authorSelector: Nombre del autor (opcional, busca .author, .by-line, etc.)
6. categorySelector: Categoría/sección (opcional, busca .category, .section, etc.)

EJEMPLOS DE SELECTORES CORRECTOS PARA IMÁGENES:
✅ CORRECTO (múltiples versiones detectadas):
   - "figure.main-photo amp-img[width='960']" (cuando hay amp-img con width="960" y width="425")
   - "article picture img:first-of-type" (cuando hay múltiples img en picture)
   - ".content figure img[width='1200']" (cuando hay img con diferentes widths)

❌ INCORRECTO (captura todas las versiones):
   - "figure.main-photo amp-img" (captura TODAS las versiones, no solo la de alta resolución)
   - "article picture img" (captura TODAS las versiones)

PRIORIZA:
- Selectores específicos con clases semánticas
- Atributos schema.org (itemprop="headline", itemprop="articleBody")
- Elementos semánticos HTML5 (article, time, etc.)
- Para imágenes: SIEMPRE analiza si hay múltiples versiones y filtra por width

Si un campo opcional no existe en el HTML, devuelve una cadena vacía "".

RESPONDE SOLO CON JSON. No agregues texto adicional.`;

export function generateContentAnalysisUserPrompt(html: string, url: string): string {
  return `Analiza el siguiente HTML de un artículo de noticias y encuentra los selectores CSS para extraer su contenido.

URL ANALIZADA: ${url}

HTML:
\`\`\`html
${html}
\`\`\`

Devuelve un JSON con este formato exacto:
{
  "titleSelector": "selector CSS para el título",
  "contentSelector": "selector CSS para el contenido completo",
  "imageSelector": "selector CSS para la imagen principal (o \"\" si no existe)",
  "dateSelector": "selector CSS para la fecha (o \"\" si no existe)",
  "authorSelector": "selector CSS para el autor (o \"\" si no existe)",
  "categorySelector": "selector CSS para la categoría (o \"\" si no existe)",
  "confidence": 0.95,
  "reasoning": "Explica brevemente por qué elegiste estos selectores"
}

IMPORTANTE:
- contentSelector debe capturar TODO el texto del artículo, no solo el primer párrafo
- Si ves múltiples <p> dentro de un contenedor, selecciona el contenedor padre
- Usa selectores robustos que funcionen aunque cambien clases CSS menores

El valor de "confidence" debe ser un número entre 0 y 1.`;
}

export const CONTENT_ANALYSIS_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    titleSelector: {
      type: 'string' as const,
      description: 'CSS selector para el título del artículo',
    },
    contentSelector: {
      type: 'string' as const,
      description: 'CSS selector para el contenido completo del artículo',
    },
    imageSelector: {
      type: 'string' as const,
      description: 'CSS selector para la imagen principal (vacío si no existe)',
    },
    dateSelector: {
      type: 'string' as const,
      description: 'CSS selector para la fecha de publicación (vacío si no existe)',
    },
    authorSelector: {
      type: 'string' as const,
      description: 'CSS selector para el autor (vacío si no existe)',
    },
    categorySelector: {
      type: 'string' as const,
      description: 'CSS selector para la categoría (vacío si no existe)',
    },
    confidence: {
      type: 'number' as const,
      description: 'Nivel de confianza de los selectores (0-1)',
      minimum: 0,
      maximum: 1,
    },
    reasoning: {
      type: 'string' as const,
      description: 'Explicación de por qué se eligieron estos selectores',
    },
  },
  required: [
    'titleSelector',
    'contentSelector',
    'imageSelector',
    'dateSelector',
    'authorSelector',
    'categorySelector',
    'confidence',
    'reasoning',
  ],
  additionalProperties: false,
};
