import { IsString, IsBoolean, IsOptional, IsNumber, IsDateString, IsIn, IsMongoId, IsUrl } from 'class-validator';

export class ExtractPostsDto {
  @IsMongoId()
  pageId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsBoolean()
  includeComments?: boolean;

  @IsOptional()
  @IsBoolean()
  includeReactions?: boolean;
}

export class CreateRapidAPIFacebookPostDto {
  @IsMongoId()
  pageId: string;

  @IsString()
  facebookPostId: string;

  @IsUrl()
  postUrl: string;

  @IsString()
  text?: string;

  @IsIn(['text', 'photo', 'video', 'link', 'event'])
  contentType: 'text' | 'photo' | 'video' | 'link' | 'event';

  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsString({ each: true })
  links?: string[];

  @IsOptional()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsString({ each: true })
  mentions?: string[];

  @IsDateString()
  publishedAt: string;

  @IsOptional()
  @IsNumber()
  likes?: number;

  @IsOptional()
  @IsNumber()
  comments?: number;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsIn(['raw', 'processed', 'error'])
  processingStatus?: 'raw' | 'processed' | 'error';

  rawData: Record<string, string | number | boolean | string[] | number[]>;
}

export class UpdateRapidAPIFacebookPostDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsIn(['text', 'photo', 'video', 'link', 'event'])
  contentType?: 'text' | 'photo' | 'video' | 'link' | 'event';

  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsString({ each: true })
  links?: string[];

  @IsOptional()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsNumber()
  likes?: number;

  @IsOptional()
  @IsNumber()
  comments?: number;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsIn(['raw', 'processed', 'error'])
  processingStatus?: 'raw' | 'processed' | 'error';
}