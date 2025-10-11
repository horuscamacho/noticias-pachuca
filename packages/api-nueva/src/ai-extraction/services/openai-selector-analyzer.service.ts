import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LISTING_ANALYSIS_SYSTEM_PROMPT,
  generateListingAnalysisUserPrompt,
  LISTING_ANALYSIS_JSON_SCHEMA,
} from '../prompts/listing-analysis.prompt';
import {
  CONTENT_ANALYSIS_SYSTEM_PROMPT,
  generateContentAnalysisUserPrompt,
  CONTENT_ANALYSIS_JSON_SCHEMA,
} from '../prompts/content-analysis.prompt';

/**
 * 🤖 OpenAI Selector Analyzer Service
 * Servicio para analizar HTML y detectar selectores CSS con OpenAI GPT-4o-mini
 */

export interface ListingAnalysisResult {
  articleLinks: string;
  confidence: number;
  reasoning: string;
}

export interface ContentAnalysisResult {
  titleSelector: string;
  contentSelector: string;
  imageSelector?: string;
  dateSelector?: string;
  authorSelector?: string;
  categorySelector?: string;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class OpenAISelectorAnalyzerService {
  private readonly logger = new Logger(OpenAISelectorAnalyzerService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('❌ OPENAI_API_KEY no configurada en variables de entorno');
      throw new Error('OPENAI_API_KEY is required');
    }

    this.openai = new OpenAI({ apiKey });
    this.logger.log('✅ OpenAI cliente inicializado');
  }

  /**
   * Analiza página de listado y detecta selector de artículos
   */
  async analyzeListingPage(html: string, url: string): Promise<ListingAnalysisResult> {
    const startTime = Date.now();
    this.logger.log(`🔍 Analizando página de listado: ${url}`);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo cost-efficient
        messages: [
          {
            role: 'system',
            content: LISTING_ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: generateListingAnalysisUserPrompt(html, url),
          },
        ],
        temperature: 0.1, // Baja temperatura para respuestas más determinísticas
        max_tokens: 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'listing_analysis',
            schema: LISTING_ANALYSIS_JSON_SCHEMA,
            strict: true,
          },
        },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result: ListingAnalysisResult = JSON.parse(response);

      const duration = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;
      const estimatedCost = (tokensUsed / 1_000_000) * 0.15; // $0.15 por 1M tokens input

      this.logger.log(
        `✅ Análisis de listado completado en ${duration}ms | Tokens: ${tokensUsed} | Costo estimado: $${estimatedCost.toFixed(6)} | Confianza: ${result.confidence}`,
      );
      this.logger.debug(`Selector detectado: ${result.articleLinks}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error analizando listado:`, error.message);
      throw error;
    }
  }

  /**
   * Analiza página de contenido individual y detecta selectores
   */
  async analyzeContentPage(html: string, url: string): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    this.logger.log(`📄 Analizando página de contenido: ${url}`);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: CONTENT_ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: generateContentAnalysisUserPrompt(html, url),
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'content_analysis',
            schema: CONTENT_ANALYSIS_JSON_SCHEMA,
            strict: true,
          },
        },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result: ContentAnalysisResult = JSON.parse(response);

      const duration = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;
      const estimatedCost = (tokensUsed / 1_000_000) * 0.15;

      this.logger.log(
        `✅ Análisis de contenido completado en ${duration}ms | Tokens: ${tokensUsed} | Costo estimado: $${estimatedCost.toFixed(6)} | Confianza: ${result.confidence}`,
      );
      this.logger.debug(`Selectores detectados:`, {
        title: result.titleSelector,
        content: result.contentSelector,
        image: result.imageSelector,
      });

      return result;
    } catch (error) {
      this.logger.error(`❌ Error analizando contenido:`, error.message);
      throw error;
    }
  }

  /**
   * Analiza ambas páginas (listado + contenido) en paralelo
   */
  async analyzeBoth(
    listingHtml: string,
    listingUrl: string,
    contentHtml: string,
    contentUrl: string,
  ): Promise<{ listing: ListingAnalysisResult; content: ContentAnalysisResult }> {
    this.logger.log(`🚀 Analizando listado y contenido en paralelo...`);

    const [listing, content] = await Promise.all([
      this.analyzeListingPage(listingHtml, listingUrl),
      this.analyzeContentPage(contentHtml, contentUrl),
    ]);

    return { listing, content };
  }
}
