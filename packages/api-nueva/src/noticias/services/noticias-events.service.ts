import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UrlDetectionService } from './url-detection.service';

/**
 * 🎯 Servicio de eventos para el módulo de Noticias
 * Maneja eventos de otros módulos usando EventEmitter2
 */
@Injectable()
export class NoticiasEventsService {
  private readonly logger = new Logger(NoticiasEventsService.name);

  constructor(
    private readonly urlDetectionService: UrlDetectionService,
  ) {}

  /**
   * 🔍 Maneja evento cuando se guardan nuevos posts de Facebook
   */
  @OnEvent('posts.saved')
  async handlePostsSaved(payload: {
    pageId: string;
    postCount: number;
    posts: Array<{
      id: string;
      url: string;
      content: {
        text?: string;
        links?: string[];
      };
    }>;
  }): Promise<void> {
    this.logger.log(`📨 Received 'posts.saved' event: ${payload.postCount} posts from page ${payload.pageId}`);

    try {
      // Clear cache to force fresh URL detection
      await this.urlDetectionService.clearUrlCache();

      // Trigger URL detection for the specific page
      const result = await this.urlDetectionService.detectExternalUrls(
        { pageId: payload.pageId },
        { page: 1, limit: 100 }
      );

      this.logger.log(`✅ URL detection completed: found ${result.pagination.total} URLs from page ${payload.pageId}`);

      // Log details of detected URLs
      if (result.data.length > 0) {
        result.data.forEach(url => {
          this.logger.log(`🔗 Detected URL: ${url.url} (domain: ${url.domain}, hasConfig: ${url.hasConfig})`);
        });
      } else {
        this.logger.log(`ℹ️ No external URLs detected in posts from page ${payload.pageId}`);
      }

    } catch (error) {
      this.logger.error(`❌ Error in URL detection for page ${payload.pageId}:`, error);
    }
  }

  /**
   * 🔄 Maneja evento para redetectar URLs (útil para testing o reprocessing manual)
   */
  @OnEvent('noticias.redetect-urls')
  async handleRedetectUrls(payload: {
    pageId?: string;
    forceRefresh?: boolean;
  }): Promise<void> {
    this.logger.log(`🔄 Received 'noticias.redetect-urls' event`);

    try {
      if (payload.forceRefresh) {
        await this.urlDetectionService.clearUrlCache();
      }

      const filters = payload.pageId ? { pageId: payload.pageId } : {};
      const result = await this.urlDetectionService.detectExternalUrls(filters, { page: 1, limit: 100 });

      this.logger.log(`✅ Manual URL redetection completed: found ${result.pagination.total} URLs`);

    } catch (error) {
      this.logger.error('❌ Error in manual URL redetection:', error);
    }
  }
}