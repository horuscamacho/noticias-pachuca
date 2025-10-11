import { Controller, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HtmlExtractionService } from '../services/html-extraction.service';
import { OpenAISelectorAnalyzerService } from '../services/openai-selector-analyzer.service';
import { SelectorValidatorService } from '../services/selector-validator.service';
import {
  AiAnalyzeListingDto,
  AiAnalyzeListingResponseDto,
} from '../dtos/ai-analyze-listing.dto';
import {
  AiAnalyzeContentDto,
  AiAnalyzeContentResponseDto,
} from '../dtos/ai-analyze-content.dto';
import {
  AiCreateOutletDto,
  AiCreateOutletResponseDto,
} from '../dtos/ai-create-outlet.dto';

/**
 * 🤖 AI Outlet Controller
 * Endpoints para análisis inteligente y creación automática de outlets con OpenAI
 */
@ApiTags('AI Extraction')
@Controller('generator-pro/websites/ai')
export class AiOutletController {
  private readonly logger = new Logger(AiOutletController.name);

  constructor(
    private readonly htmlExtraction: HtmlExtractionService,
    private readonly openaiAnalyzer: OpenAISelectorAnalyzerService,
    private readonly validator: SelectorValidatorService,
  ) {}

  /**
   * Analiza página de listado con AI
   */
  @Post('analyze-listing')
  @ApiOperation({ summary: 'Analiza página de listado con AI para detectar selectores' })
  @ApiResponse({
    status: 200,
    description: 'Análisis completado exitosamente',
    type: AiAnalyzeListingResponseDto,
  })
  async analyzeListing(@Body() dto: AiAnalyzeListingDto): Promise<AiAnalyzeListingResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🔍 Iniciando análisis de listado: ${dto.listingUrl}`);

    try {
      // 1. Extraer HTML
      this.logger.log('📄 Extrayendo HTML...');
      const extraction = await this.htmlExtraction.extractDynamicHTML(dto.listingUrl, {
        waitForSelector: 'article, .post, .news-item, .entry',
        waitForTimeout: 30000,
      });

      // 2. Analizar con OpenAI
      this.logger.log('🤖 Analizando con OpenAI...');
      const analysis = await this.openaiAnalyzer.analyzeListingPage(
        extraction.optimizedHtml,
        dto.listingUrl,
      );

      // 3. Validar selector
      this.logger.log('✅ Validando selector...');
      const validation = await this.validator.validateListingSelector(
        dto.listingUrl,
        analysis.articleLinks,
      );

      if (!validation.valid) {
        throw new HttpException(
          {
            message: 'Selector detectado no es válido',
            details: validation.message,
            selector: analysis.articleLinks,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Análisis completado en ${duration}ms`);

      // 4. Retornar resultado
      return {
        selector: analysis.articleLinks,
        confidence: analysis.confidence,
        urlsFound: validation.urls,
        count: validation.count,
        reasoning: analysis.reasoning,
        optimizationStats: extraction.stats,
      };
    } catch (error) {
      this.logger.error(`❌ Error en análisis de listado: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Error analizando página de listado',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Analiza página de contenido con AI
   */
  @Post('analyze-content')
  @ApiOperation({ summary: 'Analiza página de contenido con AI para detectar selectores' })
  @ApiResponse({
    status: 200,
    description: 'Análisis completado exitosamente',
    type: AiAnalyzeContentResponseDto,
  })
  async analyzeContent(@Body() dto: AiAnalyzeContentDto): Promise<AiAnalyzeContentResponseDto> {
    const startTime = Date.now();
    this.logger.log(`📄 Iniciando análisis de contenido: ${dto.contentUrl}`);

    try {
      // 1. Extraer HTML
      this.logger.log('📄 Extrayendo HTML...');
      const extraction = await this.htmlExtraction.extractDynamicHTML(dto.contentUrl, {
        waitForSelector: 'article, .post, .entry, .content',
        waitForTimeout: 30000,
      });

      // 2. Analizar con OpenAI
      this.logger.log('🤖 Analizando con OpenAI...');
      const analysis = await this.openaiAnalyzer.analyzeContentPage(
        extraction.optimizedHtml,
        dto.contentUrl,
      );

      // 3. Validar selectores
      this.logger.log('✅ Validando selectores...');
      const validation = await this.validator.validateContentSelectors(dto.contentUrl, {
        titleSelector: analysis.titleSelector,
        contentSelector: analysis.contentSelector,
        imageSelector: analysis.imageSelector,
        dateSelector: analysis.dateSelector,
        authorSelector: analysis.authorSelector,
        categorySelector: analysis.categorySelector,
      });

      if (!validation.valid) {
        throw new HttpException(
          {
            message: 'Selectores detectados no son válidos',
            details: validation.message,
            selectors: analysis,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Análisis completado en ${duration}ms`);

      // 4. Retornar resultado
      return {
        selectors: {
          titleSelector: analysis.titleSelector,
          contentSelector: analysis.contentSelector,
          imageSelector: analysis.imageSelector || '',
          dateSelector: analysis.dateSelector || '',
          authorSelector: analysis.authorSelector || '',
          categorySelector: analysis.categorySelector || '',
        },
        confidence: analysis.confidence,
        extractedPreview: {
          title: validation.extractedData.title || '',
          content: validation.extractedData.content || '',
          image: validation.extractedData.image,
          date: validation.extractedData.date,
          author: validation.extractedData.author,
          category: validation.extractedData.category,
        },
        reasoning: analysis.reasoning,
        optimizationStats: extraction.stats,
      };
    } catch (error) {
      this.logger.error(`❌ Error en análisis de contenido: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Error analizando página de contenido',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea outlet completo automáticamente con AI
   */
  @Post('create-outlet')
  @ApiOperation({
    summary: 'Crea outlet completo automáticamente analizando páginas con AI',
  })
  @ApiResponse({
    status: 201,
    description: 'Outlet creado exitosamente',
    type: AiCreateOutletResponseDto,
  })
  async createOutletWithAI(@Body() dto: AiCreateOutletDto): Promise<AiCreateOutletResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🚀 Iniciando creación automática de outlet: ${dto.name}`);

    try {
      // Determinar URL de prueba
      const testUrl = dto.testUrl;

      // Si no hay URL de prueba, intentar obtener una del listado
      let finalTestUrl = testUrl;
      let listingAnalysisResult: AiAnalyzeListingResponseDto;

      // 1. Analizar listado
      this.logger.log('🔍 Analizando listado...');
      const listingAnalysis = await this.analyzeListing({ listingUrl: dto.listingUrl });
      listingAnalysisResult = listingAnalysis;

      // Si no hay testUrl, usar la primera URL del listado
      if (!finalTestUrl && listingAnalysis.urlsFound.length > 0) {
        finalTestUrl = listingAnalysis.urlsFound[0];
        this.logger.log(`📌 Usando URL de prueba del listado: ${finalTestUrl}`);
      }

      if (!finalTestUrl) {
        throw new HttpException(
          'No se pudo determinar URL de prueba para análisis de contenido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Analizar contenido
      this.logger.log('📄 Analizando contenido...');
      const contentAnalysis = await this.analyzeContent({ contentUrl: finalTestUrl });

      // 3. Calcular confianza general
      const overallConfidence =
        (listingAnalysis.confidence + contentAnalysis.confidence) / 2;

      // 4. Preparar mensajes de validación
      const messages: string[] = [
        `${listingAnalysis.count} artículos encontrados en listado`,
        `Contenido extraído correctamente de artículo de prueba`,
        `Título: ${contentAnalysis.extractedPreview.title.substring(0, 50)}...`,
      ];

      if (contentAnalysis.extractedPreview.image) {
        messages.push('Imagen principal detectada');
      }
      if (contentAnalysis.extractedPreview.author) {
        messages.push(`Autor: ${contentAnalysis.extractedPreview.author}`);
      }

      const processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `✅ Outlet creado exitosamente en ${processingTimeMs}ms | Confianza: ${Math.round(overallConfidence * 100)}%`,
      );

      // 5. TODO: Crear outlet en base de datos
      // Por ahora retornamos solo el análisis, la creación real se hará después

      return {
        outlet: null, // TODO: Implementar creación real
        listingAnalysis: listingAnalysisResult,
        contentAnalysis,
        validationResults: {
          listingSuccess: true,
          contentSuccess: true,
          overallConfidence,
          messages,
        },
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`❌ Error creando outlet: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Error creando outlet automáticamente',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
