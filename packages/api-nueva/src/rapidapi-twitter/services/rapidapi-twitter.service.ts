import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RapidAPITwitterConfig, RapidAPITwitterConfigDocument } from '../schemas/rapidapi-twitter-config.schema';
import { RapidAPITwitterExtractionLog, RapidAPITwitterExtractionLogDocument } from '../schemas/rapidapi-twitter-extraction-log.schema';
import { TwitterScraperProvider, TwitterUserDetails, TwitterPost, TwitterPostOptions, RapidAPITwitterRequestConfig } from '../interfaces/rapidapi-twitter.interfaces';

// Import xresponseinterfaces for mapping
import { Xpostsreponse } from '../../../xresponseinterfaces';

// Temporary interface for user profile response
interface TwitterUserProfileResponse {
  result: {
    data: {
      user: {
        result: {
          id: string;
          rest_id: string;
          core?: {
            name: string;
            screen_name: string;
          };
          legacy?: {
            description?: string;
            followers_count?: number;
            friends_count?: number;
            statuses_count?: number;
            verified?: boolean;
            location?: string;
            url?: string;
          };
          is_blue_verified?: boolean;
          avatar?: {
            image_url?: string;
          };
        };
      };
    };
  };
}

@Injectable()
export class RapidAPITwitterService implements TwitterScraperProvider {
  private readonly logger = new Logger(RapidAPITwitterService.name);

  constructor(
    @InjectModel(RapidAPITwitterConfig.name)
    private configModel: Model<RapidAPITwitterConfigDocument>,
    @InjectModel(RapidAPITwitterExtractionLog.name)
    private logModel: Model<RapidAPITwitterExtractionLogDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🎯 MICRO-TAREA 3.3: getUserProfile - Obtener perfil de usuario Twitter
   * Implementa el endpoint: GET /user?username=${username}
   */
  async getUserProfile(username: string, configId?: string): Promise<TwitterUserDetails> {
    this.logger.log(`🐦 Starting getUserProfile for username: @${username}`);

    // 1. Get active config
    const config = await this.getActiveConfig(configId);
    this.logger.log(`✅ Using config: ${config.name} (${config.host})`);

    // 2. Check quota with EventEmitter2
    const quotaCheck = await this.checkQuota((config._id as string).toString(), 1);
    if (!quotaCheck.canProceed) {
      throw new BadRequestException(`Quota exceeded: ${quotaCheck.warnings.join(', ')}`);
    }

    // 3. Make request to /user?username=${username}
    const requestConfig: RapidAPITwitterRequestConfig = {
      host: config.host,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      endpoint: '/user',
      params: { username },
      timeout: 15000
    };

    const startTime = Date.now();
    let rawResponse: TwitterUserProfileResponse;

    try {
      rawResponse = await this.makeRapidAPIRequest<TwitterUserProfileResponse>(requestConfig);
      const responseTime = Date.now() - startTime;

      // 4. Map response using our mapping function
      const userDetails = this.mapUserDetails(rawResponse);

      // 5. Log extraction
      await this.logExtraction(
        config._id,
        username,
        requestConfig.endpoint,
        requestConfig.params || {},
        'success',
        200,
        responseTime,
        1, // 1 user extracted
        requestConfig,
        rawResponse as unknown as Record<string, unknown>
      );

      // 6. Increment quota
      this.eventEmitter.emit('twitter.quota.increment', {
        configId: (config._id as string).toString(),
        requestCount: 1
      });

      this.logger.log(`✅ Successfully extracted user profile: @${userDetails.username} (${userDetails.followers} followers)`);
      return userDetails;

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const err = error as { message?: string; response?: { status?: number; data?: unknown } };

      // Log failed extraction
      await this.logExtraction(
        config._id,
        username,
        requestConfig.endpoint,
        requestConfig.params || {},
        'error',
        err.response?.status || 0,
        responseTime,
        0,
        requestConfig,
        (err.response?.data || {}) as Record<string, unknown>,
        {
          message: err.message || 'Unknown error',
          code: 'TWITTER_API_ERROR',
          details: { error: err }
        }
      );

      this.logger.error(`❌ Failed to get user profile for @${username}: ${err.message}`);
      throw new BadRequestException(`Failed to get Twitter user profile: ${err.message}`);
    }
  }

  /**
   * 🎯 MICRO-TAREA 3.4: getUserTweets - Obtener tweets de usuario
   * Implementa el endpoint: GET /user-tweets?user=${userId}&count=${count}
   */
  async getUserTweets(userId: string, options: TwitterPostOptions, configId?: string): Promise<TwitterPost[]> {
    this.logger.log(`🐦 Starting getUserTweets for userId: ${userId}, count: ${options.count || 20}`);

    // 1. Get active config
    const config = await this.getActiveConfig(configId);
    this.logger.log(`✅ Using config: ${config.name} (${config.host})`);

    // 2. Check quota with EventEmitter2
    const quotaCheck = await this.checkQuota((config._id as string).toString(), 1);
    if (!quotaCheck.canProceed) {
      throw new BadRequestException(`Quota exceeded: ${quotaCheck.warnings.join(', ')}`);
    }

    // 3. Make request to /user-tweets?user=${userId}&count=${count}
    const requestConfig: RapidAPITwitterRequestConfig = {
      host: config.host,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      endpoint: '/user-tweets',
      params: {
        user: userId,
        count: options.count || 20
      },
      timeout: 20000 // Tweets endpoint can be slower
    };

    const startTime = Date.now();
    let rawResponse: Xpostsreponse;

    try {
      rawResponse = await this.makeRapidAPIRequest<Xpostsreponse>(requestConfig);
      const responseTime = Date.now() - startTime;

      // 4. Parse complex Xpostsreponse structure and map to TwitterPost[]
      const tweets = await this.mapAndSaveTweets(rawResponse, userId, (config._id as string).toString());

      // 5. Log extraction
      await this.logExtraction(
        config._id,
        userId,
        requestConfig.endpoint,
        requestConfig.params || {},
        'success',
        200,
        responseTime,
        tweets.length,
        requestConfig,
        rawResponse as unknown as Record<string, unknown>
      );

      // 6. Increment quota
      this.eventEmitter.emit('twitter.quota.increment', {
        configId: (config._id as string).toString(),
        requestCount: 1
      });

      // 7. Emit 'tweets.saved' event for noticias module
      this.eventEmitter.emit('tweets.saved', {
        userId,
        configId: (config._id as string).toString(),
        tweetsCount: tweets.length,
        tweets: tweets.slice(0, 5) // Send only first 5 for event
      });

      this.logger.log(`✅ Successfully extracted ${tweets.length} tweets for user ${userId}`);
      return tweets;

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const err = error as { message?: string; response?: { status?: number; data?: unknown } };

      // Log failed extraction
      await this.logExtraction(
        config._id,
        userId,
        requestConfig.endpoint,
        requestConfig.params || {},
        'error',
        err.response?.status || 0,
        responseTime,
        0,
        requestConfig,
        (err.response?.data || {}) as Record<string, unknown>,
        {
          message: err.message || 'Unknown error',
          code: 'TWITTER_TWEETS_API_ERROR',
          details: { error: err }
        }
      );

      this.logger.error(`❌ Failed to get tweets for user ${userId}: ${err.message}`);
      throw new BadRequestException(`Failed to get Twitter user tweets: ${err.message}`);
    }
  }

  /**
   * 🔧 HELPER METHOD: Map Twitter API response to our TwitterUserDetails
   * Maps result.data.user.result to TwitterUserDetails format
   */
  private mapUserDetails(rawData: TwitterUserProfileResponse): TwitterUserDetails {
    const userResult = rawData.result?.data?.user?.result;

    if (!userResult) {
      throw new BadRequestException('Invalid Twitter API response - missing user result');
    }

    const userDetails: TwitterUserDetails = {
      id: userResult.rest_id || userResult.id,
      username: userResult.core?.screen_name || '',
      displayName: userResult.core?.name || '',
      bio: userResult.legacy?.description,
      followers: userResult.legacy?.followers_count,
      following: userResult.legacy?.friends_count,
      tweetsCount: userResult.legacy?.statuses_count,
      verified: userResult.legacy?.verified,
      isBlueVerified: userResult.is_blue_verified,
      profilePicture: userResult.avatar?.image_url,
      location: userResult.legacy?.location,
      website: userResult.legacy?.url,
      rawData: userResult
    };

    this.logger.log(`🎯 Mapped user: @${userDetails.username} → ${userDetails.displayName} (${userDetails.followers} followers)`);
    return userDetails;
  }

  /**
   * 🔧 HELPER METHOD: Parse complex Xpostsreponse and map to TwitterPost[]
   * Navigate: result.timeline.instructions[].entries[] → TwitterPost[]
   */
  private async mapAndSaveTweets(rawTweets: Xpostsreponse, userId: string, configId: string): Promise<TwitterPost[]> {
    const tweets: TwitterPost[] = [];

    try {
      // Navigate the complex structure: result.timeline.instructions[].entries[]
      const instructions = rawTweets.result?.timeline?.instructions || [];

      this.logger.log(`📊 Processing ${instructions.length} instructions from Twitter API`);

      for (const instruction of instructions) {
        // Check if instruction has entries
        if (instruction.entries && Array.isArray(instruction.entries)) {
          for (const entry of instruction.entries) {
            // Check if entry has tweet content
            if (entry.content?.itemContent?.tweet_results?.result) {
              const tweetResult = entry.content.itemContent.tweet_results.result;

              // Map individual tweet
              const mappedTweet = this.mapSingleTweet(tweetResult as unknown as Record<string, unknown>, userId);
              if (mappedTweet) {
                tweets.push(mappedTweet);
              }
            }

            // Check for module items (timeline modules with multiple tweets)
            if (entry.content?.items && Array.isArray(entry.content.items)) {
              for (const item of entry.content.items) {
                if (item.item?.itemContent?.tweet_results?.result) {
                  const tweetResult = item.item.itemContent.tweet_results.result;

                  const mappedTweet = this.mapSingleTweet(tweetResult as unknown as Record<string, unknown>, userId);
                  if (mappedTweet) {
                    tweets.push(mappedTweet);
                  }
                }
              }
            }
          }
        }

        // Check if instruction has a single entry (alternative structure)
        if (instruction.entry?.content?.itemContent?.tweet_results?.result) {
          const tweetResult = instruction.entry.content.itemContent.tweet_results.result;

          const mappedTweet = this.mapSingleTweet(tweetResult as unknown as Record<string, unknown>, userId);
          if (mappedTweet) {
            tweets.push(mappedTweet);
          }
        }
      }

      this.logger.log(`✅ Successfully mapped ${tweets.length} tweets`);
      return tweets;

    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(`❌ Error mapping tweets: ${err.message}`);
      // Return empty array instead of throwing to prevent complete failure
      return [];
    }
  }

  /**
   * 🔧 HELPER METHOD: Map single tweet from complex structure
   */
  private mapSingleTweet(tweetResult: Record<string, unknown>, userId: string): TwitterPost | null {
    try {
      if (!tweetResult.rest_id || !tweetResult.legacy) {
        return null;
      }

      const legacy = tweetResult.legacy as Record<string, unknown>;
      const tweetId = tweetResult.rest_id as string;

      // Parse Twitter date format: "Mon Dec 18 15:30:00 +0000 2023"
      const publishedAt = this.parseTwitterDate(legacy.created_at as string);

      // Extract content type
      let contentType: 'text' | 'photo' | 'video' | 'link' | 'retweet' = 'text';
      const images: string[] = [];
      const videos: string[] = [];
      const links: string[] = [];

      // Check for media
      const extendedEntities = legacy.extended_entities as { media?: Array<{ type: string; media_url_https: string }> };
      if (extendedEntities?.media) {
        for (const media of extendedEntities.media) {
          if (media.type === 'photo') {
            contentType = 'photo';
            images.push(media.media_url_https);
          } else if (media.type === 'video') {
            contentType = 'video';
            videos.push(media.media_url_https);
          }
        }
      }

      // Check for URLs
      const entities = legacy.entities as { urls?: Array<{ expanded_url: string }>; hashtags?: Array<{ text: string }>; user_mentions?: Array<{ screen_name: string }> };
      if (entities?.urls && entities.urls.length > 0) {
        contentType = 'link';
        for (const urlEntity of entities.urls) {
          links.push(urlEntity.expanded_url);
        }
      }

      // Extract hashtags and mentions
      const hashtags = entities?.hashtags?.map(h => h.text) || [];
      const mentions = entities?.user_mentions?.map(m => m.screen_name) || [];

      // Construct tweet URL
      const core = tweetResult.core as { user_results?: { result?: { legacy?: { screen_name?: string } } } };
      const username = core?.user_results?.result?.legacy?.screen_name || 'unknown';
      const tweetUrl = `https://twitter.com/${username}/status/${tweetId}`;

      const twitterPost: TwitterPost = {
        id: tweetId,
        url: tweetUrl,
        content: {
          text: legacy.full_text as string,
          type: contentType,
          images,
          videos,
          links,
          hashtags,
          mentions
        },
        publishedAt,
        engagement: {
          likes: (legacy.favorite_count as number) || 0,
          retweets: (legacy.retweet_count as number) || 0,
          replies: (legacy.reply_count as number) || 0,
          quotes: (legacy.quote_count as number) || 0
        },
        isRetweet: (legacy.full_text as string)?.startsWith('RT @') || false,
        inReplyTo: legacy.in_reply_to_status_id_str as string,
        rawData: tweetResult
      };

      return twitterPost;

    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(`⚠️ Failed to map single tweet: ${err.message}`);
      return null;
    }
  }

  /**
   * 🔧 HELPER METHOD: Parse Twitter date format
   * Format: "Mon Dec 18 15:30:00 +0000 2023" → Date
   */
  private parseTwitterDate(twitterDate: string): Date {
    try {
      return new Date(twitterDate);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to parse Twitter date: ${twitterDate}`);
      return new Date();
    }
  }

  /**
   * 🔧 HELPER METHOD: Get active configuration
   */
  private async getActiveConfig(configId?: string): Promise<RapidAPITwitterConfigDocument> {
    if (configId) {
      const config = await this.configModel.findById(configId).exec();
      if (!config) {
        throw new BadRequestException(`Configuration with ID '${configId}' not found`);
      }
      return config;
    }

    const activeConfig = await this.configModel.findOne({ isActive: true }).exec();
    if (!activeConfig) {
      throw new BadRequestException('No active Twitter configuration found');
    }

    return activeConfig;
  }

  /**
   * 🔧 HELPER METHOD: Check quota via EventEmitter2
   */
  private async checkQuota(configId: string, requestCount: number): Promise<{
    canProceed: boolean;
    warnings: string[];
  }> {
    return new Promise((resolve) => {
      // Listen for response
      const responseHandler = (response: { canProceed: boolean; warnings: string[] }) => {
        this.eventEmitter.off('twitter.quota.check.response', responseHandler);
        resolve(response);
      };

      this.eventEmitter.on('twitter.quota.check.response', responseHandler);

      // Emit check request
      this.eventEmitter.emit('twitter.quota.check', {
        configId,
        requestCount
      });

      // Timeout fallback
      setTimeout(() => {
        this.eventEmitter.off('twitter.quota.check.response', responseHandler);
        resolve({ canProceed: false, warnings: ['Quota check timeout'] });
      }, 5000);
    });
  }

  /**
   * 🔧 HELPER METHOD: Make request to RapidAPI
   */
  private async makeRapidAPIRequest<T>(config: RapidAPITwitterRequestConfig): Promise<T> {
    // Import axios dynamically to avoid circular dependencies
    const axios = await import('axios');

    const url = `${config.baseUrl}${config.endpoint}`;
    const headers = {
      'x-rapidapi-host': config.host,
      'x-rapidapi-key': config.apiKey,
      'User-Agent': 'Pachuca-Noticias/1.0',
      'Accept': 'application/json'
    };

    this.logger.log(`🔗 Making request to: ${url}`);
    this.logger.log(`📋 Params: ${JSON.stringify(config.params)}`);

    const response = await axios.default.get<T>(url, {
      headers,
      params: config.params,
      timeout: config.timeout || 15000,
      validateStatus: (status) => status === 200 // Only 200 is success for Twitter API
    });

    return response.data;
  }

  /**
   * 🔧 HELPER METHOD: Log extraction to database
   */
  private async logExtraction(
    configId: unknown,
    identifier: string,
    endpoint: string,
    requestParams: Record<string, string | number | boolean>,
    status: 'success' | 'error' | 'partial',
    httpStatusCode: number,
    responseTime: number,
    itemsExtracted: number,
    rawRequest: RapidAPITwitterRequestConfig,
    rawResponse: Record<string, unknown>,
    error?: {
      message: string;
      code: string;
      details: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const log = new this.logModel({
        userId: configId, // Will be user ObjectId when available
        configId,
        endpoint,
        requestParams,
        status,
        httpStatusCode,
        responseTime,
        itemsExtracted,
        totalApiCreditsUsed: 1,
        rawRequest: {
          host: rawRequest.host,
          endpoint: rawRequest.endpoint,
          params: rawRequest.params || {}
        },
        rawResponse,
        error
      });

      await log.save();
      this.logger.log(`📝 Logged extraction: ${status} - ${itemsExtracted} items - ${responseTime}ms`);
    } catch (logError) {
      const err = logError as { message?: string };
      this.logger.error(`❌ Failed to log extraction: ${err.message}`);
    }
  }
}