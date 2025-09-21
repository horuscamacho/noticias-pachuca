import { Model } from 'mongoose';
import { FacebookPostDocument } from '../schemas/facebook-post.schema';
import { MonitoringConfigDocument } from '../schemas/monitoring-config.schema';

export interface FacebookPostModel extends Model<FacebookPostDocument> {
  findViralContent(pageId?: string): Promise<FacebookPostDocument[]>;
  findTopPerforming(pageId: string, limit?: number): Promise<FacebookPostDocument[]>;
  getEngagementStats(pageId: string, days?: number): Promise<Array<{
    _id: null;
    totalPosts: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    avgViralScore: number;
    viralPosts: number;
  }>>;
}

export interface MonitoringConfigModel extends Model<MonitoringConfigDocument> {
  getGlobalConfig(): Promise<MonitoringConfigDocument>;
  getRateLimitingConfig(): Promise<MonitoringConfigDocument>;
  getNotificationsConfig(): Promise<MonitoringConfigDocument>;
  getAnalysisConfig(): Promise<MonitoringConfigDocument>;
  updateConfig(
    configType: string,
    newSettings: Record<string, unknown>,
    updatedBy?: string
  ): Promise<MonitoringConfigDocument>;
  toggleConfig(
    configType: string,
    enabled: boolean,
    updatedBy?: string
  ): Promise<MonitoringConfigDocument>;
}