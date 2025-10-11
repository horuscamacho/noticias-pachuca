import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HtmlExtractionService } from './services/html-extraction.service';
import { OpenAISelectorAnalyzerService } from './services/openai-selector-analyzer.service';
import { SelectorValidatorService } from './services/selector-validator.service';
import { AiOutletController } from './controllers/ai-outlet.controller';

/**
 * 🤖 AI Extraction Module
 * Módulo para extracción inteligente de selectores CSS con OpenAI
 */
@Module({
  imports: [ConfigModule],
  controllers: [AiOutletController],
  providers: [HtmlExtractionService, OpenAISelectorAnalyzerService, SelectorValidatorService],
  exports: [HtmlExtractionService, OpenAISelectorAnalyzerService, SelectorValidatorService],
})
export class AiExtractionModule {}
