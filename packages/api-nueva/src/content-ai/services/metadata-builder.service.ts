import { Injectable, Logger } from '@nestjs/common';
import {
  MetadataBuilderInput,
  MetadataBuilderOptions,
  MetadataBuilderResult,
} from '../interfaces/metadata-builder.interface';

/**
 * 📝 Metadata Builder Service
 * Construye metadata limpia y profesional para imágenes editoriales
 * SIN instrucciones técnicas de fotografía o branding
 *
 * RESPONSABILIDAD:
 * - Generar altText accesible (<125 chars) para screen readers
 * - Crear caption editorial profesional con contexto
 * - Extraer keywords relevantes (sin términos técnicos)
 * - NUNCA incluir instrucciones de branding
 * - SOLO usar basePrompt (limpio), NUNCA fullPrompt
 *
 * ARQUITECTURA:
 * - NO llama a OpenAI (ahorro de costos)
 * - Usa análisis de contenido existente
 * - Generación determinística basada en reglas
 * - Optimizado para metadata editorial
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ NO usa forwardRef (servicio standalone)
 * ✅ Types explícitos en todos los métodos
 *
 * @example
 * const result = await metadataBuilder.build({
 *   basePrompt: "Editorial portrait: distinguished mayor announcing plan...",
 *   contentAnalysis: { mainSubject: 'Municipal mayor', action: 'announcing', ... },
 *   originalTitle: "Alcalde anuncia 68 obras"
 * });
 * // result.altText = "Alcalde municipal anunciando plan de infraestructura"
 * // result.caption = "El alcalde presenta un ambicioso plan de 68 obras..."
 * // result.keywords = ["alcalde", "obras", "infraestructura", "municipal", ...]
 */
@Injectable()
export class MetadataBuilderService {
  private readonly logger = new Logger(MetadataBuilderService.name);
  private readonly BUILDER_VERSION = '1.0.0';

  constructor() {
    this.logger.log('📝 Metadata Builder Service initialized');
  }

  /**
   * Construir metadata completa para imagen editorial
   *
   * @param input - Prompt limpio + análisis de contenido + título original
   * @param options - Opciones de construcción
   * @returns Metadata limpia y profesional
   */
  build(
    input: MetadataBuilderInput,
    options?: MetadataBuilderOptions,
  ): MetadataBuilderResult {
    const startTime = Date.now();

    try {
      this.logger.log(`📝 Building metadata for: "${input.originalTitle.substring(0, 50)}..."`);

      // Validar input
      this.validateInput(input);

      // Configuración con defaults
      const opts: Required<MetadataBuilderOptions> = {
        includeExtendedContext: options?.includeExtendedContext !== false,
        maxAltTextLength: options?.maxAltTextLength || 125,
        maxCaptionLength: options?.maxCaptionLength || 200,
        maxKeywords: options?.maxKeywords || 10,
        language: options?.language || 'es',
        includeCategoryKeyword: options?.includeCategoryKeyword !== false,
      };

      // Generar metadata
      const altText = this.buildAltText(input, opts);
      const caption = this.buildCaption(input, opts);
      const keywords = this.extractKeywords(input, opts);

      const processingTime = Date.now() - startTime;

      const result: MetadataBuilderResult = {
        altText,
        caption,
        keywords,
        metadata: {
          altTextLength: altText.length,
          captionLength: caption.length,
          keywordCount: keywords.length,
          language: opts.language,
          generatedAt: new Date(),
          builderVersion: this.BUILDER_VERSION,
        },
      };

      this.logger.log(
        `✅ Metadata built: altText=${altText.length}ch, caption=${caption.length}ch, ` +
        `keywords=${keywords.length}, ${processingTime}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Failed to build metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Construir alt text accesible y descriptivo
   * Optimizado para screen readers (<125 caracteres recomendado)
   *
   * REGLAS:
   * - Descriptivo y conciso
   * - En español (o idioma especificado)
   * - SIN instrucciones técnicas
   * - Enfocado en contenido editorial
   * - <125 chars (WAI-ARIA recommendation)
   */
  private buildAltText(
    input: MetadataBuilderInput,
    options: Required<MetadataBuilderOptions>,
  ): string {
    const { contentAnalysis } = input;
    const { maxAltTextLength, language } = options;

    // Traducción de términos si es necesario
    const translations = this.getTranslations(language);

    // Construir partes del alt text
    let parts: string[] = [];

    // Sujeto + Acción (siempre incluir)
    const subjectAction = this.translateSubjectAction(
      contentAnalysis.mainSubject,
      contentAnalysis.action,
      language,
    );
    parts.push(subjectAction);

    // Ubicación (si existe y hay espacio)
    if (contentAnalysis.location) {
      const location = this.translateLocation(contentAnalysis.location, language);
      parts.push(`en ${location}`);
    }

    // Unir todas las partes
    let altText = parts.join(' ');

    // Truncar si excede maxLength (con elipsis)
    if (altText.length > maxAltTextLength) {
      altText = altText.substring(0, maxAltTextLength - 3) + '...';
    }

    // Capitalizar primera letra
    altText = altText.charAt(0).toUpperCase() + altText.slice(1);

    return altText;
  }

  /**
   * Construir caption editorial profesional
   * Estilo periodístico con contexto narrativo
   *
   * REGLAS:
   * - Estilo periodístico profesional
   * - Referencia al artículo original
   * - SIN instrucciones técnicas
   * - Contexto narrativo
   */
  private buildCaption(
    input: MetadataBuilderInput,
    options: Required<MetadataBuilderOptions>,
  ): string {
    const { originalTitle, contentAnalysis, outletName } = input;
    const { maxCaptionLength, language } = options;

    // Construir caption base desde el título
    let caption = originalTitle;

    // Agregar contexto si existe
    if (contentAnalysis.context && options.includeExtendedContext) {
      const context = this.translateContext(contentAnalysis.context, language);
      caption += `. ${context}`;
    }

    // Agregar outlet si existe
    if (outletName) {
      caption += ` | ${outletName}`;
    }

    // Truncar si excede maxLength
    if (caption.length > maxCaptionLength) {
      caption = caption.substring(0, maxCaptionLength - 3) + '...';
    }

    return caption;
  }

  /**
   * Extraer keywords relevantes
   * SIN términos técnicos de fotografía
   *
   * REGLAS:
   * - Extraídos del análisis de contenido
   * - SIN términos técnicos de fotografía (no "bokeh", "f/1.8", "three-point lighting")
   * - Enfocados en temática editorial
   * - En español (o idioma especificado)
   */
  private extractKeywords(
    input: MetadataBuilderInput,
    options: Required<MetadataBuilderOptions>,
  ): string[] {
    const { contentAnalysis, originalTitle } = input;
    const { maxKeywords, language, includeCategoryKeyword } = options;

    const keywords: string[] = [];

    // 1. Extraer del mainSubject
    const subjectKeywords = this.extractKeywordsFromText(
      contentAnalysis.mainSubject,
      language,
    );
    keywords.push(...subjectKeywords);

    // 2. Extraer del action
    const actionKeywords = this.extractKeywordsFromText(
      contentAnalysis.action,
      language,
    );
    keywords.push(...actionKeywords);

    // 3. Extraer del location (si existe)
    if (contentAnalysis.location) {
      const locationKeywords = this.extractKeywordsFromText(
        contentAnalysis.location,
        language,
      );
      keywords.push(...locationKeywords);
    }

    // 4. Agregar category como keyword (si está habilitado)
    if (includeCategoryKeyword) {
      const categoryTranslated = this.translateCategory(contentAnalysis.category, language);
      keywords.push(categoryTranslated);
    }

    // 5. Extraer del título original (palabras clave)
    const titleKeywords = this.extractKeywordsFromTitle(originalTitle, language);
    keywords.push(...titleKeywords);

    // Remover duplicados y términos técnicos
    const uniqueKeywords = [...new Set(keywords)]
      .filter(kw => kw.length > 2) // Filtrar palabras muy cortas
      .filter(kw => !this.isTechnicalTerm(kw)) // Filtrar términos técnicos
      .map(kw => kw.toLowerCase()) // Normalizar a minúsculas
      .slice(0, maxKeywords); // Limitar cantidad

    return uniqueKeywords;
  }

  /**
   * Validar input
   */
  private validateInput(input: MetadataBuilderInput): void {
    if (!input.basePrompt || input.basePrompt.trim().length === 0) {
      throw new Error('basePrompt is required');
    }

    if (!input.contentAnalysis) {
      throw new Error('contentAnalysis is required');
    }

    if (!input.originalTitle || input.originalTitle.trim().length === 0) {
      throw new Error('originalTitle is required');
    }

    // Verificar que basePrompt NO contiene instrucciones de branding
    if (this.containsBrandingInstructions(input.basePrompt)) {
      this.logger.warn('⚠️ basePrompt appears to contain branding instructions. This should NOT happen!');
    }
  }

  /**
   * Detectar si un texto contiene instrucciones de branding
   * (para validación de seguridad)
   */
  private containsBrandingInstructions(text: string): boolean {
    const brandingKeywords = [
      'watermark',
      'branding instructions',
      'include',
      'bottom-right corner',
      'semi-transparent',
      'brand colors',
    ];

    const lowerText = text.toLowerCase();
    return brandingKeywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  /**
   * Traducir sujeto + acción
   */
  private translateSubjectAction(subject: string, action: string, language: string): string {
    if (language === 'en') {
      return `${subject} ${action}`;
    }

    // Traducciones básicas para español
    const subjectTranslations: Record<string, string> = {
      'municipal mayor': 'alcalde municipal',
      'mayor': 'alcalde',
      'official': 'funcionario',
      'healthcare workers': 'trabajadores de salud',
      'protesters': 'manifestantes',
      'students': 'estudiantes',
      'teacher': 'maestro',
      'doctor': 'doctor',
    };

    const actionTranslations: Record<string, string> = {
      'announcing': 'anunciando',
      'protesting': 'protestando',
      'celebrating': 'celebrando',
      'inaugurating': 'inaugurando',
      'demonstrating': 'manifestando',
      'meeting': 'reuniéndose',
    };

    const translatedSubject = subjectTranslations[subject.toLowerCase()] || subject;
    const translatedAction = actionTranslations[action.toLowerCase()] || action;

    return `${translatedSubject} ${translatedAction}`;
  }

  /**
   * Traducir ubicación
   */
  private translateLocation(location: string, language: string): string {
    if (language === 'en') {
      return location;
    }

    const locationTranslations: Record<string, string> = {
      'city hall': 'palacio municipal',
      'hospital entrance': 'entrada del hospital',
      'school': 'escuela',
      'town square': 'plaza principal',
      'conference room': 'sala de conferencias',
    };

    return locationTranslations[location.toLowerCase()] || location;
  }

  /**
   * Traducir contexto
   */
  private translateContext(context: string, language: string): string {
    // Por ahora, asumir que el contexto ya viene en el idioma correcto del análisis
    return context;
  }

  /**
   * Traducir categoría
   */
  private translateCategory(category: string, language: string): string {
    if (language === 'en') {
      return category;
    }

    const categoryTranslations: Record<string, string> = {
      'politics': 'política',
      'health': 'salud',
      'economy': 'economía',
      'social': 'social',
      'sports': 'deportes',
      'culture': 'cultura',
      'technology': 'tecnología',
      'general': 'general',
    };

    return categoryTranslations[category] || category;
  }

  /**
   * Extraer keywords de texto
   */
  private extractKeywordsFromText(text: string, language: string): string[] {
    // Separar por espacios, remover artículos y preposiciones
    const stopWords = ['the', 'a', 'an', 'of', 'in', 'at', 'for', 'with', 'on', 'el', 'la', 'de', 'en', 'para', 'con'];

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.includes(word))
      .filter(word => word.length > 2);
  }

  /**
   * Extraer keywords del título
   */
  private extractKeywordsFromTitle(title: string, language: string): string[] {
    // Remover puntuación y extraer palabras significativas
    const cleaned = title.toLowerCase().replace(/[^\w\sáéíóúñ]/g, '');
    return this.extractKeywordsFromText(cleaned, language);
  }

  /**
   * Verificar si un término es técnico de fotografía
   */
  private isTechnicalTerm(term: string): boolean {
    const technicalTerms = [
      'bokeh',
      'f/',
      'aperture',
      'iso',
      'shutter',
      'exposure',
      'lens',
      'camera',
      'canon',
      'nikon',
      'sony',
      'three-point',
      'lighting',
      'softbox',
      'photorealistic',
      'depth of field',
      '4k',
      'quality',
    ];

    const lowerTerm = term.toLowerCase();
    return technicalTerms.some(tech => lowerTerm.includes(tech.toLowerCase()));
  }

  /**
   * Obtener traducciones por idioma
   */
  private getTranslations(language: string): Record<string, string> {
    // Placeholder para sistema de traducciones más complejo en el futuro
    return {};
  }
}
