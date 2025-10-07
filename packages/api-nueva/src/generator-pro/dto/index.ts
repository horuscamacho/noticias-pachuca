// 🤖 Generator Pro DTOs - Exportaciones centralizadas

// Website Configuration DTOs
export { CreateWebsiteConfigDto, ListingSelectorsDto, ContentSelectorsDto, ExtractionSettingsDto, ContentSettingsDto } from './create-website-config.dto';
export { UpdateWebsiteConfigDto } from './update-website-config.dto';

// Facebook Configuration DTOs
export { CreateFacebookConfigDto, OptimizationSettingsDto, MediaSettingsDto, AdvancedSettingsDto, ContentFilteringDto } from './create-facebook-config.dto';
export { UpdateFacebookConfigDto } from './update-facebook-config.dto';

// Job Management DTOs
export { CreateJobDto, JobFiltersDto } from './job-management.dto';

// System Control DTOs
export { SystemControlDto, GeneratorProTestSelectorsDto } from './system-control.dto';

// Response DTOs
export {
  WebsiteConfigResponseDto,
  FacebookConfigResponseDto,
  JobStatsResponseDto,
  SystemStatusResponseDto,
  ExtractedNoticiaResponseDto,
  ExtractedContentResponseDto,
  GeneratedContentResponseDto,
  FacebookPostResponseDto
} from './response.dto';

// Advanced Testing DTOs
export {
  TestIndividualContentDto,
  TestListingSelectorsDto,
  ExtractedUrlDto,
  ExtractedContentDto,
  TestListingResponseDto,
  TestContentResponseDto
} from './test-selectors-advanced.dto';

// Facebook Page DTOs
export { FacebookPageDto, FacebookPagesResponseDto } from './facebook-page.dto';

// Content Agent DTOs
export {
  CreateContentAgentDto,
  UpdateContentAgentDto,
  ContentAgentResponseDto,
  AgentStatisticsDto,
  WritingStyleDto,
  AgentConfigurationDto,
  AgentConstraintsDto,
  AgentWorkflowDto,
  PerformanceMetricsDto,
  AgentType,
  EditorialLean,
  WritingTone,
  VocabularyLevel,
  ContentLength,
  ContentStructure,
  TargetAudience
} from './content-agent.dto';