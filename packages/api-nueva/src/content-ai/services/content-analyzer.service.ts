import { Injectable, Logger } from '@nestjs/common';
import { ProviderFactoryService } from './provider-factory.service';
import {
  ContentAnalysisResult,
  ContentAnalysisInput,
  ContentAnalysisOptions,
} from '../interfaces/content-analysis.interface';

/**
 * 🔍 Content Analyzer Service
 * Analiza contenido de noticias para extraer contexto narrativo
 * usado en la generación de prompts editoriales profesionales
 *
 * RESPONSABILIDAD:
 * - Analizar título y contenido de noticia
 * - Extraer sujeto, acción, ubicación, tono
 * - Identificar elementos visuales clave
 * - Categorizar el contenido
 * - Preparar input estructurado para prompt editorial
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ NO usa forwardRef (inyección directa de ProviderFactoryService)
 * ✅ Types explícitos en todos los métodos
 * ✅ Manejo de errores completo
 *
 * @example
 * const result = await contentAnalyzer.analyze({
 *   title: "Alcalde anuncia 68 obras para la ciudad",
 *   content: "El alcalde presentó hoy un ambicioso plan..."
 * });
 * // result.mainSubject = "Municipal mayor"
 * // result.action = "announcing infrastructure plan"
 * // result.tone = "hopeful"
 */
@Injectable()
export class ContentAnalyzerService {
  private readonly logger = new Logger(ContentAnalyzerService.name);

  // Modelo por defecto (GPT-4o-mini: barato y eficiente para análisis)
  private readonly DEFAULT_MODEL = 'gpt-4o-mini';

  // Pricing (aproximado al Oct 2025)
  private readonly MODEL_PRICING = {
    'gpt-4o-mini': {
      input: 0.00015 / 1000,  // $0.15 per 1M tokens
      output: 0.0006 / 1000,  // $0.60 per 1M tokens
    },
    'gpt-4o': {
      input: 0.0025 / 1000,
      output: 0.01 / 1000,
    },
  };

  constructor(
    private readonly providerFactory: ProviderFactoryService,
  ) {
    this.logger.log('🔍 Content Analyzer Service initialized');
  }

  /**
   * Analizar contenido de noticia
   *
   * @param input - Título y contenido a analizar
   * @param options - Opciones de análisis
   * @returns Resultado estructurado del análisis
   */
  async analyze(
    input: ContentAnalysisInput,
    options?: ContentAnalysisOptions,
  ): Promise<ContentAnalysisResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`📊 Analyzing content: "${input.title.substring(0, 50)}..."`);

      // Validar input
      if (!input.title || input.title.trim().length === 0) {
        throw new Error('Title is required for content analysis');
      }

      // Configuración
      const model = options?.model || this.DEFAULT_MODEL;
      const maxVisualElements = options?.maxVisualElements || 5;
      const includeContext = options?.includeContext !== false;

      // Obtener provider
      const provider = await this.providerFactory.getProvider('openai');

      // Construir prompt de análisis
      const analysisPrompt = this.buildAnalysisPrompt(
        input,
        maxVisualElements,
        includeContext,
      );

      // Llamar a OpenAI usando generateContent
      const response = await provider.generateContent({
        systemPrompt: 'You are an expert editorial image analyst specialized in extracting narrative structure from news articles for professional editorial photography.',
        userPrompt: analysisPrompt,
        maxTokens: 800,
        temperature: 0.3, // Baja temperatura para análisis más consistente
      });

      // Parsear respuesta JSON
      const analysis = this.parseAnalysisResponse(response.content);

      // Calcular costo
      const pricing = this.MODEL_PRICING[model as keyof typeof this.MODEL_PRICING] || this.MODEL_PRICING['gpt-4o-mini'];
      const cost = (response.usage.promptTokens * pricing.input) + (response.usage.completionTokens * pricing.output);

      const processingTime = Date.now() - startTime;

      const result: ContentAnalysisResult = {
        ...analysis,
        metadata: {
          model,
          tokensUsed: response.usage.totalTokens,
          cost,
          processingTime,
          analyzedAt: new Date(),
        },
      };

      this.logger.log(
        `✅ Analysis completed: subject="${result.mainSubject}", ` +
        `action="${result.action}", tone="${result.tone}", ` +
        `cost=$${cost.toFixed(4)}, time=${processingTime}ms`,
      );

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'} ` +
        `(${processingTime}ms)`,
      );
      throw error;
    }
  }

  /**
   * Construir prompt de análisis
   * Prompt específico para extraer estructura narrativa de noticias
   */
  private buildAnalysisPrompt(
    input: ContentAnalysisInput,
    maxVisualElements: number,
    includeContext: boolean,
  ): string {
    const contentPart = input.content
      ? `\n\nCONTENIDO:\n${input.content.substring(0, 2000)}` // Limitar a 2000 chars
      : '';

    const categoryHint = input.suggestedCategory
      ? `\n\nCATEGORÍA SUGERIDA: ${input.suggestedCategory}`
      : '';

    return `You are an expert editorial image analyst. Analyze this Spanish news article and extract structured information for generating a professional editorial photograph.

TÍTULO: ${input.title}${contentPart}${categoryHint}

Extract the following information and respond ONLY with valid JSON (no markdown, no comments):

{
  "mainSubject": "Main subject of the story (in English, e.g., 'Municipal official', 'Healthcare workers')",
  "action": "Main action or event (in English, e.g., 'announcing infrastructure plan', 'protesting conditions')",
  "location": "Location or setting (in English, e.g., 'city hall', 'hospital entrance') or null if not relevant",
  "tone": "Narrative tone (choose ONE: serious, hopeful, urgent, celebratory, neutral, dramatic, inspiring)",
  "visualElements": ["array", "of", "${maxVisualElements}", "key", "visual", "elements", "in English"],
  "category": "Main category (choose ONE: politics, health, economy, social, sports, culture, technology, general)",
  "context": "${includeContext ? 'Additional relevant context in English or null' : 'null'}"
}

IMPORTANT RULES:
1. Keep descriptions concise (max 10 words each)
2. Use English for all descriptions (even if article is in Spanish)
3. Focus on visual and photographic elements
4. Be specific about people, objects, and settings
5. Tone must be exactly one of: serious, hopeful, urgent, celebratory, neutral, dramatic, inspiring
6. Category must be exactly one of: politics, health, economy, social, sports, culture, technology, general
7. Return ONLY valid JSON, no extra text

Respond now with the JSON:`;
  }

  /**
   * Parsear respuesta de análisis
   * Convierte JSON string a objeto tipado con validación
   */
  private parseAnalysisResponse(responseText: string): Omit<ContentAnalysisResult, 'metadata'> {
    try {
      // Limpiar respuesta (a veces viene con markdown ```json)
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedText);

      // Validar estructura básica
      if (!parsed.mainSubject || !parsed.action) {
        throw new Error('Missing required fields: mainSubject or action');
      }

      // Validar tone
      const validTones = ['serious', 'hopeful', 'urgent', 'celebratory', 'neutral', 'dramatic', 'inspiring'];
      if (!validTones.includes(parsed.tone)) {
        this.logger.warn(`Invalid tone "${parsed.tone}", defaulting to "neutral"`);
        parsed.tone = 'neutral';
      }

      // Validar category
      const validCategories = ['politics', 'health', 'economy', 'social', 'sports', 'culture', 'technology', 'general'];
      if (!validCategories.includes(parsed.category)) {
        this.logger.warn(`Invalid category "${parsed.category}", defaulting to "general"`);
        parsed.category = 'general';
      }

      // Asegurar visualElements es array
      if (!Array.isArray(parsed.visualElements)) {
        parsed.visualElements = [];
      }

      return {
        mainSubject: String(parsed.mainSubject),
        action: String(parsed.action),
        location: parsed.location ? String(parsed.location) : null,
        tone: parsed.tone,
        visualElements: parsed.visualElements.map((el: unknown) => String(el)),
        category: parsed.category,
        context: parsed.context ? String(parsed.context) : null,
      };
    } catch (error) {
      this.logger.error(`Failed to parse analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.debug(`Raw response: ${responseText.substring(0, 500)}`);
      throw new Error(`Invalid analysis response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
