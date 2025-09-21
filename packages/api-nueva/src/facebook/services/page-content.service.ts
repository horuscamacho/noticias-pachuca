import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FacebookService } from './facebook.service';
import { FacebookPost, FacebookPostDocument } from '../schemas/facebook-post.schema';
import {
  PageContentAnalysis,
  PostingPattern,
  EngagementMetrics,
  ContentAnalysisSummary,
  FacebookPageData,
  FacebookPost as IFacebookPost
} from '../interfaces/facebook-api.interface';
import {
  PageContentAnalysisDto,
  PostingPatternAnalysisDto,
  HashtagAnalysisDto,
  ContentTypeAnalysisDto,
  ContentRecommendationsDto
} from '../dto/page-content.dto';

/**
 * 🎯 PAGE CONTENT SERVICE
 * Análisis detallado de contenido de páginas de Facebook
 * ✅ Sin any types - Todo tipado
 * ✅ Integrado con servicios existentes
 */

@Injectable()
export class PageContentService {
  private readonly logger = new Logger(PageContentService.name);

  constructor(
    @InjectModel(FacebookPost.name) private readonly facebookPostModel: Model<FacebookPostDocument>,
    private readonly facebookService: FacebookService
  ) {
    this.logger.log('PageContentService initialized');
  }

  /**
   * Análisis completo de contenido de una página
   */
  async analyzePageContent(dto: PageContentAnalysisDto): Promise<PageContentAnalysis> {
    this.logger.log(`Starting page content analysis for page ${dto.pageId}`);

    try {
      // Obtener información básica de la página
      const pageInfo = await this.facebookService.getPageData(dto.pageId);

      // Obtener posts recientes de Facebook y guardar en BD
      const recentPosts = await this.fetchAndStorePosts(dto);

      // Realizar análisis según las opciones seleccionadas
      const analysis: PageContentAnalysis = {
        pageInfo,
        recentPosts: recentPosts.slice(0, 10), // Mostrar solo los 10 más recientes en respuesta
        engagement: { likes: 0, comments: 0, shares: 0, reactions: 0, engagementRate: 0 },
        postingPatterns: [],
        topHashtags: [],
        contentTypes: {},
        summary: {
          totalPosts: recentPosts.length,
          avgLikesPerPost: 0,
          avgCommentsPerPost: 0,
          avgSharesPerPost: 0,
          mostEngagedPostType: 'status',
          recommendedPostingHours: [],
          contentScore: 0
        }
      };

      // Análisis de engagement
      if (dto.includeEngagement !== false) {
        analysis.engagement = await this.calculateEngagementMetrics(dto.pageId, dto.startDate, dto.endDate);
      }

      // Análisis de patrones de posting
      if (dto.includePostingPatterns !== false) {
        analysis.postingPatterns = await this.analyzePostingPatterns({
          pageId: dto.pageId,
          periodDays: 30
        });
      }

      // Análisis de hashtags
      if (dto.includeHashtags !== false) {
        analysis.topHashtags = await this.analyzeHashtags({
          pageId: dto.pageId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          limit: 20
        });
      }

      // Análisis de tipos de contenido
      if (dto.includeContentTypes !== false) {
        analysis.contentTypes = await this.analyzeContentTypes({
          pageId: dto.pageId,
          startDate: dto.startDate,
          endDate: dto.endDate
        });
      }

      // Generar resumen
      analysis.summary = await this.generateContentSummary(dto.pageId, analysis);

      // Generar recomendaciones si se solicita
      if (dto.generateRecommendations) {
        // Las recomendaciones se pueden agregar al summary o como campo separado
        analysis.summary.contentScore = this.calculateContentScore(analysis);
      }

      this.logger.log(`Page content analysis completed for page ${dto.pageId}`);
      return analysis;

    } catch (error) {
      this.logger.error(`Error analyzing page content for ${dto.pageId}:`, error);
      throw error;
    }
  }

  /**
   * Análisis de patrones de posting
   */
  async analyzePostingPatterns(dto: PostingPatternAnalysisDto): Promise<PostingPattern[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (dto.periodDays || 30));

    const posts = await this.facebookPostModel.find({
      pageId: dto.pageId,
      publishedAt: { $gte: startDate }
    }).sort({ publishedAt: 1 });

    if (posts.length === 0) {
      return [];
    }

    const patterns: Map<string, PostingPattern> = new Map();

    posts.forEach(post => {
      const date = new Date(post.publishedAt);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;

      const engagement = post.engagementData.likes + post.engagementData.comments + post.engagementData.shares;

      if (!patterns.has(key)) {
        patterns.set(key, {
          dayOfWeek,
          hour,
          postCount: 0,
          avgEngagement: 0,
          bestPerformingType: post.postType
        });
      }

      const pattern = patterns.get(key)!;
      pattern.postCount += 1;
      pattern.avgEngagement = (pattern.avgEngagement + engagement) / pattern.postCount;

      // Determinar el tipo de post con mejor performance
      if (engagement > pattern.avgEngagement) {
        pattern.bestPerformingType = post.postType;
      }
    });

    return Array.from(patterns.values())
      .filter(pattern => pattern.postCount > 0)
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  /**
   * Análisis de hashtags más utilizados
   */
  async analyzeHashtags(dto: HashtagAnalysisDto): Promise<string[]> {
    const filter: Record<string, unknown> = { pageId: dto.pageId };

    if (dto.startDate || dto.endDate) {
      filter.publishedAt = {};
      if (dto.startDate) (filter.publishedAt as Record<string, Date>)['$gte'] = new Date(dto.startDate);
      if (dto.endDate) (filter.publishedAt as Record<string, Date>)['$lte'] = new Date(dto.endDate);
    }

    const posts = await this.facebookPostModel.find(filter, { hashtags: 1, engagementData: 1 });

    const hashtagStats: Map<string, { count: number; totalEngagement: number }> = new Map();

    posts.forEach(post => {
      const engagement = post.engagementData.likes + post.engagementData.comments + post.engagementData.shares;

      post.hashtags.forEach(hashtag => {
        if (!hashtagStats.has(hashtag)) {
          hashtagStats.set(hashtag, { count: 0, totalEngagement: 0 });
        }

        const stats = hashtagStats.get(hashtag)!;
        stats.count += 1;
        stats.totalEngagement += engagement;
      });
    });

    // Filtrar por frecuencia mínima
    const minFrequency = dto.minFrequency || 2;
    const filteredHashtags = Array.from(hashtagStats.entries())
      .filter(([_, stats]) => stats.count >= minFrequency)
      .sort((a, b) => {
        if (dto.includeEngagementCorrelation) {
          // Ordenar por engagement promedio
          const avgEngagementA = a[1].totalEngagement / a[1].count;
          const avgEngagementB = b[1].totalEngagement / b[1].count;
          return avgEngagementB - avgEngagementA;
        } else {
          // Ordenar por frecuencia
          return b[1].count - a[1].count;
        }
      })
      .slice(0, dto.limit || 50)
      .map(([hashtag]) => hashtag);

    return filteredHashtags;
  }

  /**
   * Análisis de tipos de contenido
   */
  async analyzeContentTypes(dto: ContentTypeAnalysisDto): Promise<Record<string, number>> {
    const filter: Record<string, unknown> = { pageId: dto.pageId };

    if (dto.startDate || dto.endDate) {
      filter.publishedAt = {};
      if (dto.startDate) (filter.publishedAt as Record<string, Date>)['$gte'] = new Date(dto.startDate);
      if (dto.endDate) (filter.publishedAt as Record<string, Date>)['$lte'] = new Date(dto.endDate);
    }

    const contentTypeStats = await this.facebookPostModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$postType',
          count: { $sum: 1 },
          totalEngagement: {
            $sum: {
              $add: ['$engagementData.likes', '$engagementData.comments', '$engagementData.shares']
            }
          },
          avgEngagement: {
            $avg: {
              $add: ['$engagementData.likes', '$engagementData.comments', '$engagementData.shares']
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result: Record<string, number> = {};
    contentTypeStats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  }

  /**
   * Generar recomendaciones de contenido
   */
  async generateContentRecommendations(dto: ContentRecommendationsDto): Promise<{
    timingRecommendations: string[];
    contentTypeRecommendations: string[];
    hashtagRecommendations: string[];
    frequencyRecommendations: string[];
  }> {
    const recommendations = {
      timingRecommendations: [] as string[],
      contentTypeRecommendations: [] as string[],
      hashtagRecommendations: [] as string[],
      frequencyRecommendations: [] as string[]
    };

    // Recomendaciones de timing
    if (dto.includeTimingRecommendations !== false) {
      const patterns = await this.analyzePostingPatterns({
        pageId: dto.pageId,
        periodDays: dto.analysisPeriodDays || 30
      });

      const bestTimes = patterns
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 3);

      bestTimes.forEach(pattern => {
        const dayName = this.getDayName(pattern.dayOfWeek);
        recommendations.timingRecommendations.push(
          `Post on ${dayName}s at ${pattern.hour}:00 for better engagement (avg: ${Math.round(pattern.avgEngagement)} interactions)`
        );
      });
    }

    // Recomendaciones de tipo de contenido
    if (dto.includeContentTypeRecommendations !== false) {
      const contentTypes = await this.analyzeContentTypes({
        pageId: dto.pageId,
        includePerformanceMetrics: true
      });

      const sortedTypes = Object.entries(contentTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

      sortedTypes.forEach(([type, count]) => {
        recommendations.contentTypeRecommendations.push(
          `Increase ${type} content - it performs well with your audience (${count} posts analyzed)`
        );
      });
    }

    // Recomendaciones de hashtags
    if (dto.includeHashtagRecommendations !== false) {
      const topHashtags = await this.analyzeHashtags({
        pageId: dto.pageId,
        includeEngagementCorrelation: true,
        limit: 10
      });

      recommendations.hashtagRecommendations = [
        `Use these high-performing hashtags: ${topHashtags.slice(0, 5).join(', ')}`,
        `Consider trending hashtags: ${topHashtags.slice(5, 10).join(', ')}`
      ];
    }

    // Recomendaciones de frecuencia
    if (dto.includeFrequencyRecommendations !== false) {
      const postFrequency = await this.calculatePostFrequency(dto.pageId, dto.analysisPeriodDays || 30);
      recommendations.frequencyRecommendations = [
        `Current posting frequency: ${postFrequency.postsPerDay.toFixed(1)} posts/day`,
        postFrequency.postsPerDay < 1
          ? 'Consider posting more frequently (1-2 posts per day) to maintain audience engagement'
          : postFrequency.postsPerDay > 3
          ? 'Consider reducing post frequency to avoid overwhelming your audience'
          : 'Your posting frequency is optimal'
      ];
    }

    return recommendations;
  }

  /**
   * Métodos privados de utilidad
   */
  private async fetchAndStorePosts(dto: PageContentAnalysisDto): Promise<IFacebookPost[]> {
    try {
      const posts = await this.facebookService.getPagePosts(dto.pageId, {
        fields: ['id', 'created_time', 'message', 'story', 'type', 'likes.summary(true)', 'comments.summary(true)', 'shares'],
        limit: dto.maxPosts || 100,
        since: dto.startDate,
        until: dto.endDate
      });

      // Guardar posts en la base de datos
      for (const post of posts) {
        await this.savePostToDatabase(dto.pageId, post);
      }

      return posts;
    } catch (error) {
      this.logger.warn(`Error fetching posts for ${dto.pageId}, using stored data:`, error);

      // Fallback a datos almacenados
      const filter: Record<string, unknown> = { pageId: dto.pageId };
      if (dto.startDate || dto.endDate) {
        const publishedAtFilter: Record<string, Date> = {};
        if (dto.startDate) publishedAtFilter['$gte'] = new Date(dto.startDate);
        if (dto.endDate) publishedAtFilter['$lte'] = new Date(dto.endDate);
        filter.publishedAt = publishedAtFilter;
      }

      const storedPosts = await this.facebookPostModel
        .find(filter)
        .sort({ publishedAt: -1 })
        .limit(dto.maxPosts || 100);

      return storedPosts.map(post => ({
        id: post.postId,
        created_time: post.publishedAt.toISOString(),
        message: post.content,
        type: post.postType,
        likes: { summary: { total_count: post.engagementData.likes } },
        comments: { summary: { total_count: post.engagementData.comments } },
        shares: { count: post.engagementData.shares }
      })) as IFacebookPost[];
    }
  }

  private async savePostToDatabase(pageId: string, post: IFacebookPost): Promise<void> {
    try {
      const existingPost = await this.facebookPostModel.findOne({ postId: post.id });
      if (existingPost) {
        // Actualizar engagement data
        existingPost.engagementData = {
          likes: post.likes?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
          shares: post.shares?.count || 0,
          reactions: (post.likes?.summary?.total_count || 0) + (post.comments?.summary?.total_count || 0) + (post.shares?.count || 0),
          engagementRate: 0 // Se calculará en el pre-save hook
        };
        await existingPost.save();
      } else {
        // Crear nuevo post
        const newPost = new this.facebookPostModel({
          postId: post.id,
          pageId: pageId,
          pageName: 'Unknown', // Se actualizará con datos de la página
          publishedAt: new Date(post.created_time),
          postType: post.type || 'status',
          content: post.message || post.story || '',
          engagementData: {
            likes: post.likes?.summary?.total_count || 0,
            comments: post.comments?.summary?.total_count || 0,
            shares: post.shares?.count || 0,
            reactions: (post.likes?.summary?.total_count || 0) + (post.comments?.summary?.total_count || 0) + (post.shares?.count || 0),
            engagementRate: 0
          }
        });
        await newPost.save();
      }
    } catch (error) {
      this.logger.warn(`Error saving post ${post.id}:`, error);
    }
  }

  private async calculateEngagementMetrics(pageId: string, startDate?: string, endDate?: string): Promise<EngagementMetrics> {
    const filter: Record<string, unknown> = { pageId };

    if (startDate || endDate) {
      const publishedAtFilter: Record<string, Date> = {};
      if (startDate) publishedAtFilter['$gte'] = new Date(startDate);
      if (endDate) publishedAtFilter['$lte'] = new Date(endDate);
      filter.publishedAt = publishedAtFilter;
    }

    const stats = await this.facebookPostModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$engagementData.likes' },
          totalComments: { $sum: '$engagementData.comments' },
          totalShares: { $sum: '$engagementData.shares' },
          avgLikes: { $avg: '$engagementData.likes' },
          avgComments: { $avg: '$engagementData.comments' },
          avgShares: { $avg: '$engagementData.shares' },
          avgEngagementRate: { $avg: '$engagementData.engagementRate' },
          postCount: { $sum: 1 }
        }
      }
    ]);

    if (!stats || stats.length === 0) {
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        reactions: 0,
        engagementRate: 0
      };
    }

    const data = stats[0];
    return {
      likes: Math.round(data.avgLikes || 0),
      comments: Math.round(data.avgComments || 0),
      shares: Math.round(data.avgShares || 0),
      reactions: Math.round((data.avgLikes || 0) + (data.avgComments || 0) + (data.avgShares || 0)),
      engagementRate: Math.round((data.avgEngagementRate || 0) * 100) / 100
    };
  }

  private async generateContentSummary(pageId: string, analysis: PageContentAnalysis): Promise<ContentAnalysisSummary> {
    const posts = await this.facebookPostModel.find({ pageId }).sort({ publishedAt: -1 }).limit(100);

    const totalEngagement = posts.reduce((sum, post) =>
      sum + post.engagementData.likes + post.engagementData.comments + post.engagementData.shares, 0
    );

    const avgLikesPerPost = posts.length > 0 ? posts.reduce((sum, post) => sum + post.engagementData.likes, 0) / posts.length : 0;
    const avgCommentsPerPost = posts.length > 0 ? posts.reduce((sum, post) => sum + post.engagementData.comments, 0) / posts.length : 0;
    const avgSharesPerPost = posts.length > 0 ? posts.reduce((sum, post) => sum + post.engagementData.shares, 0) / posts.length : 0;

    // Determinar el tipo de post con mejor engagement
    const typeEngagement: Record<string, { total: number; count: number }> = {};
    posts.forEach(post => {
      const engagement = post.engagementData.likes + post.engagementData.comments + post.engagementData.shares;
      if (!typeEngagement[post.postType]) {
        typeEngagement[post.postType] = { total: 0, count: 0 };
      }
      typeEngagement[post.postType].total += engagement;
      typeEngagement[post.postType].count += 1;
    });

    const mostEngagedPostType = Object.entries(typeEngagement)
      .map(([type, data]) => ({ type, avgEngagement: data.total / data.count }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)[0]?.type || 'status';

    // Horas recomendadas basadas en patrones
    const recommendedPostingHours = analysis.postingPatterns
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(pattern => pattern.hour);

    return {
      totalPosts: posts.length,
      avgLikesPerPost: Math.round(avgLikesPerPost),
      avgCommentsPerPost: Math.round(avgCommentsPerPost),
      avgSharesPerPost: Math.round(avgSharesPerPost),
      mostEngagedPostType,
      recommendedPostingHours,
      contentScore: this.calculateContentScore(analysis)
    };
  }

  private calculateContentScore(analysis: PageContentAnalysis): number {
    let score = 50; // Base score

    // Bonus por engagement rate
    if (analysis.engagement.engagementRate > 5) score += 20;
    else if (analysis.engagement.engagementRate > 2) score += 10;

    // Bonus por consistencia en posting
    if (analysis.postingPatterns.length > 5) score += 10;

    // Bonus por diversidad de contenido
    const contentTypesCount = Object.keys(analysis.contentTypes).length;
    if (contentTypesCount > 3) score += 10;
    else if (contentTypesCount > 1) score += 5;

    // Bonus por uso de hashtags
    if (analysis.topHashtags.length > 10) score += 10;
    else if (analysis.topHashtags.length > 5) score += 5;

    return Math.min(score, 100);
  }

  private async calculatePostFrequency(pageId: string, days: number): Promise<{ postsPerDay: number; totalPosts: number }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const postCount = await this.facebookPostModel.countDocuments({
      pageId,
      publishedAt: { $gte: startDate }
    });

    return {
      totalPosts: postCount,
      postsPerDay: postCount / days
    };
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }
}