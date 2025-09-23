import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import axios, { AxiosResponse } from 'axios';
import {
  RapidAPIConfig,
  RapidAPIConfigDocument
} from '../schemas/rapidapi-config.schema';
import {
  RapidAPIExtractionLog,
  RapidAPIExtractionLogDocument
} from '../schemas/rapidapi-extraction-log.schema';
import {
  RapidAPIFacebookPost,
  RapidAPIFacebookPostDocument
} from '../schemas/rapidapi-facebook-post.schema';
import {
  SocialMediaScraperProvider,
  PageDetails,
  Post,
  PostOptions,
  RapidAPIResponse,
  RapidAPIRequestConfig
} from '../interfaces/rapidapi-facebook.interfaces';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RapidAPIConfigService } from './rapidapi-config.service';

@Injectable()
export class RapidAPIFacebookService implements SocialMediaScraperProvider {
  private readonly logger = new Logger(RapidAPIFacebookService.name);
  private readonly CACHE_TTL = 300; // 5 minutes - seguir patrón del FB service

  // Hardcoded endpoints - managed by developer, not user
  // Based on RapidAPI documentation: https://facebook-scraper3.p.rapidapi.com
  private readonly ENDPOINTS = {
    getPageId: '/page/page_id',        // ✅ curl: /page/page_id?url=...
    getPageDetails: '/page/details',   // ✅ curl: /page/details?url=...
    getPagePosts: '/page/posts'        // ✅ curl: /page/posts?page_id=...
  };

  constructor(
    @InjectModel(RapidAPIConfig.name)
    private configModel: Model<RapidAPIConfigDocument>,
    @InjectModel(RapidAPIExtractionLog.name)
    private logModel: Model<RapidAPIExtractionLogDocument>,
    @InjectModel(RapidAPIFacebookPost.name)
    private postModel: Model<RapidAPIFacebookPostDocument>,
    @InjectConnection()
    private connection: Connection,
    private readonly configService: RapidAPIConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getPageId(url: string, configId?: string): Promise<string> {
    const config = await this.getActiveConfig(configId);

    // Check quota before making request using EventEmitter2
    const quotaCheck = await this.emitAndWaitForResponse('quota.check', { configId: String(config.id), requestCount: 1 }) as { canProceed: boolean; warnings: string[] };
    if (!quotaCheck.canProceed) {
      throw new BadRequestException(`Quota exceeded: ${quotaCheck.warnings.join(', ')}`);
    }

    const cleanUrl = this.extractPageIdentifierFromUrl(url);

    const requestConfig: RapidAPIRequestConfig = {
      host: config.host,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      endpoint: this.ENDPOINTS.getPageId,
      params: { url: encodeURIComponent(url) }
    };

    const startTime = Date.now();

    try {
      const response = await this.makeRapidAPIRequest<{ page_id: string }>(requestConfig);
      const responseTime = Date.now() - startTime;

      // 🔍 LOG RESPUESTA COMPLETA DE RAPIDAPI PARA MAPEO DE TIPOS
      this.logger.log(`🔍 RapidAPI getPageId RESPONSE - Config: ${config.name}`);
      this.logger.log(`📊 Status: ${response.success ? 'SUCCESS' : 'FAILED'}`);
      this.logger.log(`📦 Raw Response Data: ${JSON.stringify(response.data, null, 2)}`);
      this.logger.log(`🔧 Response Data Type: ${typeof response.data}`);
      this.logger.log(`🏗️ Response Data Keys: ${Object.keys(response.data || {}).join(', ')}`);
      this.logger.log(`⏱️ Response Time: ${responseTime}ms`);

      // Increment usage after successful request using EventEmitter2
      this.logger.log(`🔥 Emitting quota.increment event for config: ${config._id}`);
      this.eventEmitter.emit('quota.increment', { configId: String(config.id), requestCount: 1 });

      await this.logExtraction(
        String((response.data as { page_id?: string })?.page_id || null),
        String(config.id),
        this.ENDPOINTS.getPageId,
        { url },
        'success',
        200,
        responseTime,
        1,
        {
          host: requestConfig.host,
          apiKey: requestConfig.apiKey,
          baseUrl: requestConfig.baseUrl,
          endpoint: requestConfig.endpoint,
          timeout: requestConfig.timeout || 30000
        },
        response.data
      );

      return String(response.data?.page_id || '');
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 🚨 LOG ERROR COMPLETO DE RAPIDAPI getPageId
      this.logger.error(`❌ RapidAPI getPageId ERROR - Config: ${config.name}`);
      this.logger.error(`📊 HTTP Status: ${error.response?.status || 'NO_RESPONSE'}`);
      this.logger.error(`📦 Error Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
      this.logger.error(`🔍 Error Message: ${error.message}`);
      this.logger.error(`📋 Error Headers: ${JSON.stringify(error.response?.headers || {})}`);
      this.logger.error(`⏱️ Response Time: ${responseTime}ms`);

      // Still increment usage on error (API call was made) using EventEmitter2
      this.eventEmitter.emit('quota.increment', { configId: String(config.id), requestCount: 1 });

      await this.logExtraction(
        String((error.response?.data as { page_id?: string })?.page_id || null),
        String(config.id),
        this.ENDPOINTS.getPageId,
        { url },
        'error',
        error.response?.status || 500,
        responseTime,
        0,
        {
          host: requestConfig.host,
          apiKey: requestConfig.apiKey,
          baseUrl: requestConfig.baseUrl,
          endpoint: requestConfig.endpoint,
          timeout: requestConfig.timeout || 30000
        },
        error.response?.data,
        {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          details: { stack: error.stack }
        }
      );
      throw new BadRequestException(`Failed to extract page ID: ${error.message}`);
    }
  }

  async getPageDetails(identifier: string, configId?: string): Promise<PageDetails> {
    const config = await this.getActiveConfig(configId);

    // Check quota before making request using EventEmitter2
    const quotaCheck = await this.emitAndWaitForResponse('quota.check', { configId: String(config.id), requestCount: 1 }) as { canProceed: boolean; warnings: string[] };
    if (!quotaCheck.canProceed) {
      throw new BadRequestException(`Quota exceeded: ${quotaCheck.warnings.join(', ')}`);
    }

    const requestConfig: RapidAPIRequestConfig = {
      host: config.host,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      endpoint: this.ENDPOINTS.getPageDetails,
      params: { url: encodeURIComponent(identifier) }
    };

    const startTime = Date.now();

    try {
      const response = await this.makeRapidAPIRequest<Record<string, string | number | boolean>>(requestConfig);
      const responseTime = Date.now() - startTime;

      // 🔍 LOG RESPUESTA COMPLETA DE RAPIDAPI PARA MAPEO DE TIPOS
      this.logger.log(`🔍 RapidAPI getPageDetails RESPONSE - Config: ${config.name}`);
      this.logger.log(`📊 Status: ${response.success ? 'SUCCESS' : 'FAILED'}`);
      this.logger.log(`📦 Raw Response Data: ${JSON.stringify(response.data, null, 2)}`);
      this.logger.log(`🔧 Response Data Type: ${typeof response.data}`);
      this.logger.log(`🏗️ Response Data Keys: ${Object.keys(response.data || {}).join(', ')}`);
      this.logger.log(`⏱️ Response Time: ${responseTime}ms`);

      // Increment usage after successful request using EventEmitter2
      this.logger.log(`🔥 Emitting quota.increment event for config: ${config._id}`);
      this.eventEmitter.emit('quota.increment', { configId: String(config.id), requestCount: 1 });

      await this.logExtraction(
        String((response.data as { page_id?: string })?.page_id || null),
        String(config.id),
        this.ENDPOINTS.getPageDetails,
        { url: identifier },
        'success',
        200,
        responseTime,
        1,
        {
          host: requestConfig.host,
          apiKey: requestConfig.apiKey,
          baseUrl: requestConfig.baseUrl,
          endpoint: requestConfig.endpoint,
          timeout: requestConfig.timeout || 30000
        },
        response.data
      );

      return this.mapPageDetails(response.data);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 🚨 LOG ERROR COMPLETO DE RAPIDAPI getPageDetails
      this.logger.error(`❌ RapidAPI getPageDetails ERROR - Config: ${config.name}`);
      this.logger.error(`📊 HTTP Status: ${error.response?.status || 'NO_RESPONSE'}`);
      this.logger.error(`📦 Error Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
      this.logger.error(`🔍 Error Message: ${error.message}`);
      this.logger.error(`📋 Error Headers: ${JSON.stringify(error.response?.headers || {})}`);
      this.logger.error(`⏱️ Response Time: ${responseTime}ms`);

      // Still increment usage on error (API call was made) using EventEmitter2
      this.eventEmitter.emit('quota.increment', { configId: String(config.id), requestCount: 1 });

      await this.logExtraction(
        String((error.response?.data as { page_id?: string })?.page_id || null),
        String(config.id),
        this.ENDPOINTS.getPageDetails,
        { url: identifier },
        'error',
        error.response?.status || 500,
        responseTime,
        0,
        {
          host: requestConfig.host,
          apiKey: requestConfig.apiKey,
          baseUrl: requestConfig.baseUrl,
          endpoint: requestConfig.endpoint,
          timeout: requestConfig.timeout || 30000
        },
        error.response?.data,
        {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          details: { stack: error.stack }
        }
      );
      throw new BadRequestException(`Failed to get page details: ${error.message}`);
    }
  }

  async getPagePosts(identifier: string, options: PostOptions, configId?: string): Promise<Post[]> {
    const config = await this.getActiveConfig(configId);

    const params: Record<string, string | number | boolean> = {
      page_id: identifier,
      ...(options.startDate && { start_date: options.startDate.toISOString().split('T')[0] }),
      ...(options.endDate && { end_date: options.endDate.toISOString().split('T')[0] }),
      ...(options.cursor && { cursor: options.cursor }),
      ...(options.limit && { limit: options.limit })
    };

    const requestConfig: RapidAPIRequestConfig = {
      host: config.host,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      endpoint: this.ENDPOINTS.getPagePosts,
      params
    };

    const startTime = Date.now();

    try {
      const response = await this.makeRapidAPIRequest<{
        results: {
          post_id: string;
          type: string;
          url: string;
          message: string | null;
          timestamp: number;
          comments_count: number;
          reactions_count: number;
          reshare_count: number;
          image?: { uri: string; height: number; width: number; id: string };
          video?: string;
          external_url?: string;
          author: { id: string; name: string };
          reactions: Record<string, number>;
        }[];
        cursor?: string;
      }>(requestConfig);
      const responseTime = Date.now() - startTime;

      // 🔍 LOG RESPUESTA COMPLETA DE RAPIDAPI PARA MAPEO DE TIPOS
      this.logger.log(`🔍 RapidAPI getPagePosts RESPONSE - Config: ${config.name}`);
      this.logger.log(`📊 Status: ${response.success ? 'SUCCESS' : 'FAILED'}`);
      this.logger.log(`📦 Raw Response Data: ${JSON.stringify(response.data, null, 2)}`);
      this.logger.log(`🔧 Response Data Type: ${typeof response.data}`);
      this.logger.log(`🏗️ Response Data Keys: ${Object.keys(response.data || {}).join(', ')}`);
      this.logger.log(`📝 Posts Count: ${response.data.results?.length || 0}`);
      this.logger.log(`⏱️ Response Time: ${responseTime}ms`);

      // Increment usage after successful request using EventEmitter2
      this.logger.log(`🔥 Emitting quota.increment event for config: ${config._id}`);
      this.eventEmitter.emit('quota.increment', { configId: String(config.id), requestCount: 1 });

      await this.logExtraction(
        String((response.data as { page_id?: string })?.page_id || null),
        String(config.id),
        this.ENDPOINTS.getPagePosts,
        params,
        'success',
        200,
        responseTime,
        response.data.results?.length || 0,
        {
          host: requestConfig.host,
          apiKey: requestConfig.apiKey,
          baseUrl: requestConfig.baseUrl,
          endpoint: requestConfig.endpoint,
          timeout: requestConfig.timeout || 30000
        },
        response.data
      );

      return await this.mapAndSavePosts(response.data.results || [], identifier, String(config.id));
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 🚨 LOG ERROR COMPLETO DE RAPIDAPI getPagePosts
      this.logger.error(`❌ RapidAPI getPagePosts ERROR - Config: ${config.name}`);
      this.logger.error(`📊 HTTP Status: ${error.response?.status || 'NO_RESPONSE'}`);
      this.logger.error(`📦 Error Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
      this.logger.error(`🔍 Error Message: ${error.message}`);
      this.logger.error(`📋 Error Headers: ${JSON.stringify(error.response?.headers || {})}`);
      this.logger.error(`⏱️ Response Time: ${responseTime}ms`);

      // Still increment usage on error (API call was made) using EventEmitter2
      this.eventEmitter.emit('quota.increment', { configId: String(config.id), requestCount: 1 });

      await this.logExtraction(
        String((error.response?.data as { page_id?: string })?.page_id || null),
        String(config.id),
        this.ENDPOINTS.getPagePosts,
        params,
        'error',
        error.response?.status || 500,
        responseTime,
        0,
        {
          host: requestConfig.host,
          apiKey: requestConfig.apiKey,
          baseUrl: requestConfig.baseUrl,
          endpoint: requestConfig.endpoint,
          timeout: requestConfig.timeout || 30000
        },
        error.response?.data,
        {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          details: { stack: error.stack }
        }
      );
      throw new BadRequestException(`Failed to get page posts: ${error.message}`);
    }
  }

  private async getActiveConfig(configId?: string): Promise<RapidAPIConfigDocument> {
    if (configId) {
      return await this.configService.findById(configId);
    } else {
      const config = await this.configService.findActive();
      if (!config) {
        throw new NotFoundException('No active RapidAPI configuration found');
      }
      return config;
    }
  }

  private async makeRapidAPIRequest<T>(config: RapidAPIRequestConfig): Promise<RapidAPIResponse<T>> {
    const url = `${config.baseUrl}${config.endpoint}`;

    const headers = {
      'x-rapidapi-host': config.host,
      'x-rapidapi-key': config.apiKey,
      'User-Agent': 'Pachuca-Noticias/1.0'
    };

    this.logger.debug(`🚀 Making RapidAPI request to: ${url}`);
    this.logger.debug(`📋 Headers: ${JSON.stringify(headers)}`);
    this.logger.debug(`🔧 Params: ${JSON.stringify(config.params)}`);

    const response: AxiosResponse<T> = await axios.get(url, {
      headers,
      params: config.params,
      timeout: config.timeout || 30000
    });

    // 🔍 LOG RESPUESTA RAW DE RAPIDAPI
    this.logger.log(`✅ RapidAPI RAW RESPONSE - Endpoint: ${config.endpoint}`);
    this.logger.log(`📊 HTTP Status: ${response.status}`);
    this.logger.log(`🏷️ Response Headers: ${JSON.stringify(response.headers)}`);
    this.logger.log(`📦 Response Body (RAW): ${JSON.stringify(response.data, null, 2)}`);

    return {
      data: response.data,
      success: true
    };
  }

  private extractPageIdentifierFromUrl(pageUrl: string): string {
    try {
      const url = new URL(pageUrl);
      const pathname = url.pathname;

      // Handle /pages/ format
      const pagesMatch = pathname.match(/\/pages\/[^\/]+\/(\d+)/);
      if (pagesMatch) {
        return pagesMatch[1];
      }

      // Handle profile.php?id= format
      const idParam = url.searchParams.get('id');
      if (idParam) {
        return idParam;
      }

      // Handle direct username format
      const usernameMatch = pathname.match(/\/([^\/]+)\/?$/);
      if (usernameMatch && usernameMatch[1] !== 'pages') {
        return usernameMatch[1];
      }

      throw new Error('Could not extract page identifier from URL');
    } catch (error) {
      throw new BadRequestException(`Invalid Facebook URL format: ${error.message}`);
    }
  }

  private mapPageDetails(rawData: Record<string, unknown>): PageDetails {
    // Extract data from rawData.results structure
    const results = rawData.results as Record<string, unknown> || {};

    return {
      id: String(results.page_id || results.id || rawData.id || ''),
      name: String(results.name || rawData.name || ''),
      category: results.categories && Array.isArray(results.categories)
        ? String(results.categories[0])
        : (rawData.category ? String(rawData.category) : undefined),
      followers: typeof results.followers === 'number' ? results.followers : undefined,
      likes: typeof results.followers === 'number' ? results.followers : undefined, // Use followers as likes for FB pages
      about: String(results.intro || results.about || rawData.about || ''),
      website: String(results.website || rawData.website || ''),
      location: String(results.address || results.location || rawData.location || ''),
      verified: typeof results.verified === 'boolean' ? results.verified : undefined,
      profilePicture: String(results.image || results.profile_picture || rawData.profile_picture || ''),
      coverPhoto: String(results.cover_image || results.cover_photo || rawData.cover_photo || ''),
      rawData: { ...rawData } // Keep for debugging if needed
    };
  }

  private async mapAndSavePosts(
    rawPosts: {
      post_id: string;
      type: string;
      url: string;
      message: string | null;
      timestamp: number;
      comments_count: number;
      reactions_count: number;
      reshare_count: number;
      image?: { uri: string; height: number; width: number; id: string };
      video?: string;
      external_url?: string;
      author: { id: string; name: string };
      reactions: Record<string, number>;
    }[],
    pageId: string,
    configId: string
  ): Promise<Post[]> {
    const mappedPosts: Post[] = [];

    for (const rawPost of rawPosts) {
      this.logger.log(`🔍 Raw post data: post_id=${rawPost.post_id}, url=${rawPost.url}`);
      // Map the post data from RapidAPI format to our format
      const mappedPost: Post = {
        id: rawPost.post_id,
        url: rawPost.url,
        content: {
          text: rawPost.message || undefined,
          type: this.determinePostTypeFromString(rawPost.type),
          images: rawPost.image?.uri ? [rawPost.image.uri] : undefined,
          videos: rawPost.video ? [rawPost.video] : undefined,
          links: rawPost.external_url ? [rawPost.external_url] : undefined,
          hashtags: undefined, // RapidAPI doesn't provide hashtags directly
          mentions: undefined, // RapidAPI doesn't provide mentions directly
        },
        publishedAt: this.parseTimestampNumber(rawPost.timestamp),
        engagement: {
          likes: rawPost.reactions_count,
          comments: rawPost.comments_count,
          shares: rawPost.reshare_count,
        },
        rawData: { ...rawPost }
      };

      // Save to MongoDB with upsert (update if exists, create if not)
      try {
        this.logger.log(`🔍 Upserting post - ID: ${mappedPost.id}, URL: ${mappedPost.url}`);

        // Use findOneAndUpdate with upsert to avoid duplicates and update engagement
        const result = await this.postModel.findOneAndUpdate(
          {
            facebookPostId: mappedPost.id,
            pageId: pageId
          },
          {
            $set: {
              // Always update these fields on every upsert
              engagement: mappedPost.engagement,
              extractedAt: new Date(),
              rawData: mappedPost.rawData
            },
            $setOnInsert: {
              // Only set these on insert (first time) - avoid conflicts
              facebookPostId: mappedPost.id,
              pageId: pageId,
              postUrl: mappedPost.url,
              content: mappedPost.content,
              publishedAt: mappedPost.publishedAt,
              processingStatus: 'raw'
            }
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );

        if (result.isNew) {
          this.logger.log(`✅ Post created in DB: ${mappedPost.id}`);
        } else {
          this.logger.log(`🔄 Post updated in DB: ${mappedPost.id} (engagement: likes=${mappedPost.engagement?.likes || 0}, comments=${mappedPost.engagement?.comments || 0}, shares=${mappedPost.engagement?.shares || 0})`);
        }

        mappedPosts.push(mappedPost);

      } catch (error) {
        this.logger.error(`❌ Error upserting post ${mappedPost.id} to DB:`, error);
        // Continue with other posts even if one fails
        mappedPosts.push(mappedPost);
      }
    }

    // 🔍 Emit event to trigger URL detection for newly saved posts
    if (mappedPosts.length > 0) {
      try {
        this.logger.log(`🔍 Emitting 'posts.saved' event for ${mappedPosts.length} posts from page ${pageId}`);

        // Emit event for noticias module to handle URL detection
        this.eventEmitter.emit('posts.saved', {
          pageId,
          postCount: mappedPosts.length,
          posts: mappedPosts.map(post => ({
            id: post.id,
            url: post.url,
            content: post.content
          }))
        });

        this.logger.log(`✅ Event 'posts.saved' emitted successfully for page ${pageId}`);

      } catch (error) {
        this.logger.error('❌ Error emitting posts.saved event:', error);
        // Don't throw error, just log it
      }
    }

    return mappedPosts;
  }

  private mapPosts(rawPosts: Record<string, string | number | boolean | string[]>[]): Post[] {
    return rawPosts.map(rawPost => ({
      id: String(rawPost.id || rawPost.post_id || ''),
      url: String(rawPost.url || rawPost.post_url || ''),
      content: {
        text: rawPost.text ? String(rawPost.text) : undefined,
        type: this.determinePostType(rawPost),
        images: Array.isArray(rawPost.images) ? rawPost.images.map(String) : undefined,
        videos: Array.isArray(rawPost.videos) ? rawPost.videos.map(String) : undefined,
        links: Array.isArray(rawPost.links) ? rawPost.links.map(String) : undefined,
        hashtags: Array.isArray(rawPost.hashtags) ? rawPost.hashtags.map(String) : undefined,
        mentions: Array.isArray(rawPost.mentions) ? rawPost.mentions.map(String) : undefined,
      },
      publishedAt: this.parseDate(rawPost.published_at || rawPost.created_time),
      engagement: {
        likes: typeof rawPost.likes === 'number' ? rawPost.likes : undefined,
        comments: typeof rawPost.comments === 'number' ? rawPost.comments : undefined,
        shares: typeof rawPost.shares === 'number' ? rawPost.shares : undefined,
      },
      rawData: { ...rawPost }
    }));
  }

  private determinePostTypeFromString(type: string): 'text' | 'photo' | 'video' | 'link' | 'event' {
    const normalizedType = type.toLowerCase();
    if (['text', 'photo', 'video', 'link', 'event'].includes(normalizedType)) {
      return normalizedType as 'text' | 'photo' | 'video' | 'link' | 'event';
    }
    // Default fallback
    return 'text';
  }

  private determinePostType(rawPost: Record<string, string | number | boolean | string[]>): 'text' | 'photo' | 'video' | 'link' | 'event' {
    if (rawPost.type && typeof rawPost.type === 'string') {
      const type = rawPost.type.toLowerCase();
      if (['text', 'photo', 'video', 'link', 'event'].includes(type)) {
        return type as 'text' | 'photo' | 'video' | 'link' | 'event';
      }
    }

    if (Array.isArray(rawPost.images) && rawPost.images.length > 0) return 'photo';
    if (Array.isArray(rawPost.videos) && rawPost.videos.length > 0) return 'video';
    if (Array.isArray(rawPost.links) && rawPost.links.length > 0) return 'link';

    return 'text';
  }

  private parseTimestampNumber(timestamp: number): Date {
    // RapidAPI returns Unix timestamps, convert to JS Date
    return new Date(timestamp * 1000);
  }

  private parseTimestamp(timestamp: string | number | boolean | string[] | undefined): Date {
    if (!timestamp) return new Date();

    // RapidAPI returns Unix timestamps
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000); // Convert from Unix timestamp to JS Date
    }

    if (typeof timestamp === 'string') {
      const numTimestamp = parseInt(timestamp);
      if (!isNaN(numTimestamp)) {
        return new Date(numTimestamp * 1000);
      }
      // Fallback to regular date parsing
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    return new Date();
  }

  private parseDate(dateValue: string | number | boolean | string[] | undefined): Date {
    if (!dateValue) return new Date();

    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    if (typeof dateValue === 'number') {
      return new Date(dateValue * 1000); // Assuming Unix timestamp
    }

    return new Date();
  }

  private async logExtraction(
    pageId: string | null,
    configId: string,
    endpoint: string,
    requestParams: Record<string, string | number | boolean>,
    status: 'success' | 'error' | 'partial',
    httpStatusCode: number,
    responseTime: number,
    itemsExtracted: number,
    rawRequest: Record<string, string | number | boolean>,
    rawResponse: Record<string, unknown>,
    error?: { message: string; code: string; details: Record<string, unknown> }
  ): Promise<void> {
    try {
      const log = new this.logModel({
        pageId,
        configId,
        endpoint,
        requestParams,
        status,
        httpStatusCode,
        responseTime,
        itemsExtracted,
        totalApiCreditsUsed: 1,
        rawRequest,
        rawResponse,
        error
      });

      await log.save();
    } catch (logError) {
      this.logger.error(`Failed to save extraction log: ${logError.message}`);
    }
  }

  /**
   * Save extracted posts to database with deduplication and transaction
   */
  async saveExtractedPosts(
    pageId: string,
    posts: Post[],
    configId?: string
  ): Promise<{ saved: number; updated: number; total: number }> {
    const session = await this.connection.startSession();

    try {
      let saved = 0;
      let updated = 0;

      await session.withTransaction(async () => {
        for (const post of posts) {
          // Prepare the data for upsert
          const postData = {
            pageId,
            facebookPostId: post.id,
            postUrl: post.url || `https://facebook.com/${post.id}`,
            content: {
              text: post.content?.text || '',
              type: post.content?.type || 'text',
              images: post.content?.images || [],
              videos: post.content?.videos || [],
              links: post.content?.links || [],
              hashtags: post.content?.hashtags || this.extractHashtags(post.content?.text || ''),
              mentions: post.content?.mentions || this.extractMentions(post.content?.text || '')
            },
            publishedAt: post.publishedAt || new Date(),
            extractedAt: new Date(),
            engagement: {
              likes: post.engagement?.likes || 0,
              comments: post.engagement?.comments || 0,
              shares: post.engagement?.shares || 0,
              reactions: {
                love: post.engagement?.reactions?.love || 0,
                wow: post.engagement?.reactions?.wow || 0,
                haha: post.engagement?.reactions?.haha || 0,
                sad: post.engagement?.reactions?.sad || 0,
                angry: post.engagement?.reactions?.angry || 0
              }
            },
            comments: [], // TODO: Map comments if available
            processingStatus: 'raw',
            rawData: post
          };

          // Use findOneAndUpdate with upsert
          const result = await this.postModel.findOneAndUpdate(
            {
              facebookPostId: post.id,
              pageId: pageId
            },
            {
              $set: {
                // Always update these fields
                engagement: postData.engagement,
                extractedAt: new Date(),
                rawData: postData.rawData
              },
              $setOnInsert: {
                // Only set these on insert (first time)
                pageId: postData.pageId,
                facebookPostId: postData.facebookPostId,
                postUrl: postData.postUrl,
                content: postData.content,
                publishedAt: postData.publishedAt,
                comments: postData.comments,
                processingStatus: postData.processingStatus
              }
            },
            {
              upsert: true,
              new: true,
              runValidators: true,
              session
            }
          );

          if (result.isNew) {
            saved++;
            this.logger.debug(`✅ Created post ${post.id}`);
          } else {
            updated++;
            this.logger.debug(`🔄 Updated post ${post.id} (engagement updated)`);
          }
        }
      });

      this.logger.log(`📊 Posts created: ${saved}, updated: ${updated}, total: ${posts.length}`);

      return {
        saved,
        updated,
        total: posts.length
      };

    } catch (error) {
      this.logger.error('❌ Error saving posts:', error);
      throw new BadRequestException(`Failed to save posts: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }


  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Extract mentions from text
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /@[a-zA-Z0-9_.]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  // 📄 Get stored posts from database
  async getStoredPosts(pageId: string, pagination: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const [posts, total] = await Promise.all([
        this.postModel
          .find({ pageId })
          .sort({ publishedAt: -1 }) // Newest first
          .skip(skip)
          .limit(limit)
          .lean(),
        this.postModel.countDocuments({ pageId })
      ]);

      return {
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error(`❌ Error getting stored posts for page ${pageId}:`, error);
      throw new BadRequestException(`Failed to get posts: ${error.message}`);
    }
  }

  // 📄 Get ALL stored posts from database (all pages)
  async getAllStoredPosts(pagination: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const [posts, total] = await Promise.all([
        this.postModel
          .find({})
          .sort({ publishedAt: -1 }) // Newest first
          .skip(skip)
          .limit(limit)
          .lean(),
        this.postModel.countDocuments({})
      ]);

      return {
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error(`❌ Error getting all stored posts:`, error);
      throw new BadRequestException(`Failed to get posts: ${error.message}`);
    }
  }

  private async emitAndWaitForResponse(eventName: string, payload: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const responseEventName = `${eventName}.response`;
      const timeout = setTimeout(() => {
        reject(new Error(`Event ${eventName} timeout`));
      }, 5000);

      this.eventEmitter.once(responseEventName, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      this.eventEmitter.emit(eventName, payload);
    });
  }
}