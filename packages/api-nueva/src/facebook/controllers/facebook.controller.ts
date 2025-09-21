import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CompetitorAnalysisService } from '../services/competitor-analysis.service';
import { PageContentService } from '../services/page-content.service';
import { FacebookService } from '../services/facebook.service';
import {
  CompetitorAnalysisDto,
  AddCompetitorDto,
  UpdateCompetitorDto,
  CompetitorListDto
} from '../dto/competitor-analysis.dto';
import {
  FacebookPageUrlDto,
  FacebookPageInfoDto
} from '../dto/facebook-url.dto';
import {
  PageContentAnalysisDto,
  PostingPatternAnalysisDto,
  HashtagAnalysisDto,
  ContentTypeAnalysisDto
} from '../dto/page-content.dto';
import {
  FacebookPageRequestDto,
  FacebookPagePostsRequestDto,
  PageInsightsRequestDto
} from '../dto/facebook-request.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 🎯 FACEBOOK CONTROLLER
 * Endpoints para análisis de competidores y contenido de Facebook
 * ✅ Sin any types - Todo tipado
 * ✅ Protegido con auth existente
 */

@ApiTags('Facebook Graph API')
@ApiBearerAuth()
@Controller('facebook')
@UseGuards(JwtAuthGuard) // ✅ Usar guard de auth existente
export class FacebookController {
  constructor(
    private readonly competitorService: CompetitorAnalysisService,
    private readonly pageContentService: PageContentService,
    private readonly facebookService: FacebookService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 🏢 COMPETITOR MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Post('competitors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add new competitor for monitoring' })
  @ApiResponse({ status: 201, description: 'Competitor added successfully' })
  async addCompetitor(@Body() dto: AddCompetitorDto) {
    return this.competitorService.addCompetitor(dto);
  }

  @Get('competitors')
  @ApiOperation({ summary: 'Get list of competitors with pagination' })
  @ApiResponse({ status: 200, description: 'Competitors retrieved successfully' })
  async getCompetitors(
    @Query() pagination: PaginationDto,
    @Query() filters: CompetitorListDto
  ) {
    return this.competitorService.getCompetitors(pagination, {
      isActive: filters.isActive,
      category: filters.category,
      search: filters.search
    });
  }

  @Get('competitors/:pageId')
  @ApiOperation({ summary: 'Get competitor details' })
  @ApiResponse({ status: 200, description: 'Competitor details retrieved' })
  async getCompetitor(@Param('pageId') pageId: string) {
    const paginationDto = new PaginationDto();
    paginationDto.page = 1;
    paginationDto.limit = 1;

    const competitors = await this.competitorService.getCompetitors(
      paginationDto,
      { search: pageId }
    );
    return competitors.data[0] || null;
  }

  @Post('competitors/:pageId')
  @ApiOperation({ summary: 'Update competitor configuration' })
  @ApiResponse({ status: 200, description: 'Competitor updated successfully' })
  async updateCompetitor(
    @Param('pageId') pageId: string,
    @Body() dto: UpdateCompetitorDto
  ) {
    return this.competitorService.updateCompetitor(pageId, dto);
  }

  @Post('competitors/:pageId/remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove competitor from monitoring' })
  @ApiResponse({ status: 204, description: 'Competitor removed successfully' })
  async removeCompetitor(@Param('pageId') pageId: string) {
    await this.competitorService.removeCompetitor(pageId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 COMPETITOR ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  @Post('analyze-competitors')
  @ApiOperation({ summary: 'Start comprehensive competitor analysis' })
  @ApiResponse({ status: 202, description: 'Analysis job started' })
  async analyzeCompetitors(@Body() dto: CompetitorAnalysisDto) {
    return this.competitorService.analyzeCompetitors(dto);
  }

  @Post('compare-competitors')
  @ApiOperation({ summary: 'Compare multiple competitors' })
  @ApiResponse({ status: 200, description: 'Comparison completed' })
  async compareCompetitors(@Body() dto: { pageIds: string[] }) {
    return this.competitorService.compareCompetitors(dto.pageIds);
  }

  @Get('competitors/:pageId/engagement')
  @ApiOperation({ summary: 'Get competitor engagement metrics' })
  @ApiResponse({ status: 200, description: 'Engagement metrics retrieved' })
  async getCompetitorEngagement(
    @Param('pageId') pageId: string,
    @Query('days') days?: string
  ) {
    const daysParsed = days ? parseInt(days, 10) : 30;
    return this.competitorService.getCompetitorEngagement(pageId, daysParsed);
  }

  @Get('competitors/:pageId/top-posts')
  @ApiOperation({ summary: 'Get top performing posts from competitor' })
  @ApiResponse({ status: 200, description: 'Top posts retrieved' })
  async getTopPerformingPosts(
    @Param('pageId') pageId: string,
    @Query('limit') limit?: string
  ) {
    const limitParsed = limit ? parseInt(limit, 10) : 10;
    return this.competitorService.getTopPerformingPosts(pageId, limitParsed);
  }

  @Get('competitors/:pageId/benchmarks')
  @ApiOperation({ summary: 'Get competitor benchmarks vs industry averages' })
  @ApiResponse({ status: 200, description: 'Benchmarks retrieved' })
  async getCompetitorBenchmarks(@Param('pageId') pageId: string) {
    return this.competitorService.getCompetitorBenchmarks(pageId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📝 PAGE CONTENT ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  @Post('page/:pageId/analyze-content')
  @ApiOperation({ summary: 'Analyze page content comprehensively' })
  @ApiResponse({ status: 200, description: 'Content analysis completed' })
  async analyzePageContent(
    @Param('pageId') pageId: string,
    @Body() dto: Omit<PageContentAnalysisDto, 'pageId'>
  ) {
    return this.pageContentService.analyzePageContent({ ...dto, pageId });
  }

  @Post('page/:pageId/posting-patterns')
  @ApiOperation({ summary: 'Analyze posting patterns and optimal times' })
  @ApiResponse({ status: 200, description: 'Posting patterns analyzed' })
  async analyzePostingPatterns(
    @Param('pageId') pageId: string,
    @Body() dto: Omit<PostingPatternAnalysisDto, 'pageId'>
  ) {
    return this.pageContentService.analyzePostingPatterns({ ...dto, pageId });
  }

  @Post('page/:pageId/hashtags')
  @ApiOperation({ summary: 'Analyze hashtag usage and performance' })
  @ApiResponse({ status: 200, description: 'Hashtag analysis completed' })
  async analyzeHashtags(
    @Param('pageId') pageId: string,
    @Body() dto: Omit<HashtagAnalysisDto, 'pageId'>
  ) {
    return this.pageContentService.analyzeHashtags({ ...dto, pageId });
  }

  @Post('page/:pageId/content-types')
  @ApiOperation({ summary: 'Analyze content types and their performance' })
  @ApiResponse({ status: 200, description: 'Content types analyzed' })
  async analyzeContentTypes(
    @Param('pageId') pageId: string,
    @Body() dto: Omit<ContentTypeAnalysisDto, 'pageId'>
  ) {
    return this.pageContentService.analyzeContentTypes({ ...dto, pageId });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 FACEBOOK API DIRECT ACCESS
  // ═══════════════════════════════════════════════════════════════

  @Post('page-data')
  @ApiOperation({ summary: 'Get Facebook page data directly from API' })
  @ApiResponse({ status: 200, description: 'Page data retrieved' })
  async getPageData(@Body() dto: FacebookPageRequestDto) {
    return this.facebookService.getPageData(dto.pageId, dto.fields);
  }

  @Post('page-posts')
  @ApiOperation({ summary: 'Get Facebook page posts with pagination' })
  @ApiResponse({ status: 200, description: 'Page posts retrieved' })
  async getPagePosts(@Body() dto: FacebookPagePostsRequestDto) {
    const { pageId, fields, since, until, sortBy, order, ...pagination } = dto;

    const paginationDto = pagination ? Object.assign(new PaginationDto(), pagination) : undefined;

    return this.facebookService.getPagePosts(
      pageId,
      { fields, since, until, sortBy, order },
      paginationDto
    );
  }

  @Post('page-insights')
  @ApiOperation({ summary: 'Get Facebook page insights' })
  @ApiResponse({ status: 200, description: 'Page insights retrieved' })
  async getPageInsights(@Body() dto: PageInsightsRequestDto) {
    return this.facebookService.getPageInsights(
      dto.pageId,
      dto.metrics,
      dto.period,
      dto.since,
      dto.until
    );
  }

  @Post('verify-page-access')
  @ApiOperation({ summary: 'Verify if a Facebook page is accessible' })
  @ApiResponse({ status: 200, description: 'Page access verified' })
  async verifyPageAccess(@Body() dto: { pageId: string }) {
    const isAccessible = await this.facebookService.verifyPageAccess(dto.pageId);
    return { pageId: dto.pageId, accessible: isAccessible };
  }

  @Post('multiple-pages')
  @ApiOperation({ summary: 'Get data for multiple Facebook pages in batch' })
  @ApiResponse({ status: 200, description: 'Multiple pages data retrieved' })
  async getMultiplePages(@Body() dto: { pageIds: string[]; fields?: string[] }) {
    return this.facebookService.getMultiplePages(dto.pageIds, dto.fields);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🛠️ UTILITY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  @Post('clear-page-cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cache for a specific page' })
  @ApiResponse({ status: 204, description: 'Page cache cleared' })
  async clearPageCache(@Body() dto: { pageId: string }) {
    await this.facebookService.clearPageCache(dto.pageId);
  }

  /**
   * 🔗 OBTENER INFORMACIÓN DE PÁGINA DESDE URL
   */
  @Post('page-info-from-url')
  @ApiOperation({
    summary: 'Get Facebook page information from URL',
    description: 'Extract page ID and detailed information from a Facebook page URL'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page information retrieved successfully',
    type: FacebookPageInfoDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Facebook URL or page not accessible'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facebook page not found'
  })
  async getPageInfoFromUrl(@Body() dto: FacebookPageUrlDto): Promise<FacebookPageInfoDto> {
    const pageInfo = await this.facebookService.getPageIdFromUrl(dto.pageUrl);

    return {
      pageId: pageInfo.pageId,
      pageName: pageInfo.pageName,
      category: pageInfo.category,
      verified: pageInfo.verified,
      isAccessible: pageInfo.isAccessible,
      followerCount: pageInfo.followerCount,
      about: pageInfo.about
    };
  }
}