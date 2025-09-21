/**
 * 🎯 INTERFACES RATE LIMITING
 * Sistema de control de límites Facebook API
 */

export interface RateLimitData {
  callCount: number;
  totalCpuTime: number;
  totalTime: number;
  percentage: number;
  estimatedTimeToRegainAccess: number;
}

export interface FacebookRateLimitHeaders {
  'x-app-usage'?: string;
  'x-business-use-case-usage'?: string;
  'x-ad-account-usage'?: string;
}

export interface AppUsageData {
  call_count: number;
  total_cputime: number;
  total_time: number;
}

export interface BusinessUseCaseData {
  [businessId: string]: Array<{
    type: string;
    call_count: number;
    total_cputime: number;
    total_time: number;
    estimated_time_to_regain_access: number;
  }>;
}

export interface RateLimitStrategy {
  maxCallsPerHour: number;
  bufferPercentage: number;
  backoffMultiplier: number;
  maxRetries: number;
  retryDelay: number;
}

export interface QueuedRequest {
  id: string;
  request: FacebookBatchRequest;
  priority: 'low' | 'normal' | 'high';
  retryCount: number;
  createdAt: Date;
  scheduledAt?: Date;
}

export interface BatchJobData {
  requests: FacebookBatchRequest[];
  appId: string;
  priority: 'low' | 'normal' | 'high';
  maxRetries?: number;
  delay?: number;
}

export interface FacebookBatchRequest {
  method: 'GET' | 'POST' | 'DELETE';
  relative_url: string;
  headers?: Record<string, string>;
  body?: string;
}