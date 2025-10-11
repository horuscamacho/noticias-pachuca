/**
 * 🎯 Selector Validator Utility
 * Funciones para validar selectores CSS
 */

/**
 * Valida si un selector CSS es sintácticamente válido
 */
export function isSelectorValid(selector: string): { valid: boolean; reason?: string } {
  if (!selector || typeof selector !== 'string') {
    return { valid: false, reason: 'Selector is empty or not a string' };
  }

  // Trim whitespace
  const trimmed = selector.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'Selector is empty after trimming' };
  }

  // Verificar caracteres prohibidos o peligrosos
  if (trimmed.includes('<') || trimmed.includes('>') || trimmed.includes('{') || trimmed.includes('}')) {
    return { valid: false, reason: 'Selector contains HTML/CSS injection characters' };
  }

  // Intentar parsear como selector (validación básica)
  try {
    // Si comienza con caracteres válidos de CSS selector
    const validStart = /^[a-zA-Z#.\[\*]/.test(trimmed);
    if (!validStart) {
      return { valid: false, reason: 'Selector does not start with valid CSS selector character' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: `Invalid CSS selector syntax: ${error.message}` };
  }
}

/**
 * Sugiere alternativas más robustas para un selector
 */
export function suggestSelectorAlternatives(selector: string): string[] {
  const alternatives: string[] = [];

  // Si es un selector muy genérico, sugerir versiones más específicas
  if (selector === 'a') {
    alternatives.push(
      'a.article-link',
      'a.post-title',
      'article a',
      '.news-item a',
      'a[href*="/articulo"]',
      'a[href*="/noticia"]',
    );
  }

  if (selector === 'h1') {
    alternatives.push('h1.title', 'h1.entry-title', 'article h1', '.post-title', 'h1[itemprop="headline"]');
  }

  if (selector === 'img') {
    alternatives.push('img.featured-image', 'img.main-image', 'article img', 'figure img', 'img[itemprop="image"]');
  }

  if (selector === 'p') {
    alternatives.push('.content p', '.entry-content p', 'article p', '.post-body p', 'div[itemprop="articleBody"] p');
  }

  return alternatives;
}

/**
 * Calcula un score de especificidad del selector
 * Más alto = más específico y robusto
 */
export function calculateSelectorSpecificity(selector: string): number {
  let score = 0;

  // ID es muy específico
  if (selector.includes('#')) score += 10;

  // Clases son moderadamente específicas
  const classMatches = selector.match(/\./g);
  if (classMatches) score += classMatches.length * 5;

  // Atributos son buenos
  const attrMatches = selector.match(/\[/g);
  if (attrMatches) score += attrMatches.length * 7;

  // Elementos semánticos son mejores que divs
  if (selector.match(/\b(article|section|header|main|aside|nav)\b/)) score += 3;

  // Penalizar selectores muy genéricos
  if (selector === 'a' || selector === 'div' || selector === 'span') score -= 5;

  // Penalizar selectores muy largos (frágiles)
  const parts = selector.split(/\s+/);
  if (parts.length > 5) score -= 2;

  return Math.max(0, score);
}

/**
 * Determina si un selector es muy genérico (probablemente malo)
 */
export function isSelectorTooGeneric(selector: string): boolean {
  const genericSelectors = ['a', 'div', 'span', 'p', 'img', 'h1', 'h2', 'h3', 'li', 'ul', 'ol'];

  return genericSelectors.includes(selector.trim());
}

/**
 * Extrae el tipo de elemento principal del selector
 */
export function extractElementType(selector: string): string | null {
  // Intentar extraer el elemento HTML principal
  const elementMatch = selector.match(/^([a-zA-Z]+)/);
  return elementMatch ? elementMatch[1] : null;
}
