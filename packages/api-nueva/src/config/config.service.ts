import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // App Config
  get port(): number {
    return this.configService.get<number>('config.app.port')!;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('config.app.nodeEnv')!;
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // MongoDB Config
  get mongoUrl(): string {
    return this.configService.get<string>('config.database.url')!;
  }

  get dbHost(): string {
    return this.configService.get<string>('config.database.host')!;
  }

  get dbPort(): number {
    return this.configService.get<number>('config.database.port')!;
  }

  // Redis Config
  get redisHost(): string {
    return this.configService.get<string>('config.redis.host')!;
  }

  get redisPort(): number {
    return this.configService.get<number>('config.redis.port')!;
  }

  get redisUrl(): string {
    return this.configService.get<string>('config.redis.url')!;
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('config.redis.password');
  }

  get redisConfig() {
    return {
      host: this.redisHost,
      port: this.redisPort,
      password: this.redisPassword,
      db: this.configService.get<number>('config.redis.db'),
      retryDelayOnFailover: this.configService.get<number>(
        'config.redis.retryDelayOnFailover',
      ),
      enableReadyCheck: this.configService.get<boolean>(
        'config.redis.enableReadyCheck',
      ),
      maxRetriesPerRequest: this.configService.get<number>(
        'config.redis.maxRetriesPerRequest',
      ),
      lazyConnect: this.configService.get<boolean>('config.redis.lazyConnect'),
      keepAlive: this.configService.get<number>('config.redis.keepAlive'),
    };
  }

  // Cache Config
  get cacheTtl(): number {
    return this.configService.get<number>('config.cache.ttl')!;
  }

  get defaultCacheTtl(): number {
    return this.configService.get<number>('config.cache.defaultTtl')!;
  }

  // JWT Config
  get jwtSecret(): string {
    return this.configService.get<string>('config.jwt.secret')!;
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('config.jwt.expiresIn')!;
  }

  // 💳 Stripe Config
  get stripeSecretKey(): string {
    return this.configService.get<string>('config.stripe.secretKey')!;
  }

  get stripePublishableKey(): string {
    return this.configService.get<string>('config.stripe.publishableKey')!;
  }

  get stripeWebhookSecret(): string {
    return this.configService.get<string>('config.stripe.webhookSecret')!;
  }

  get stripeApiVersion(): string {
    return this.configService.get<string>('config.stripe.apiVersion')!;
  }

  get stripeMaxRetries(): number {
    return this.configService.get<number>('config.stripe.maxNetworkRetries')!;
  }

  get stripeTimeout(): number {
    return this.configService.get<number>('config.stripe.timeout')!;
  }

  get stripeEnvironment(): 'test' | 'live' {
    return this.configService.get<'test' | 'live'>('config.stripe.environment')!;
  }

  get stripeConfig() {
    return {
      secretKey: this.stripeSecretKey,
      publishableKey: this.stripePublishableKey,
      webhookSecret: this.stripeWebhookSecret,
      apiVersion: this.stripeApiVersion,
      maxNetworkRetries: this.stripeMaxRetries,
      timeout: this.stripeTimeout,
      environment: this.stripeEnvironment,
    };
  }

  // 💰 Payments Config
  get defaultCurrency(): string {
    return this.configService.get<string>('config.payments.defaultCurrency')!;
  }

  get supportedCurrencies(): string[] {
    return this.configService.get<string[]>('config.payments.supportedCurrencies')!;
  }

  get maxPaymentAmount(): number {
    return this.configService.get<number>('config.payments.maxPaymentAmount')!;
  }

  get minPaymentAmount(): number {
    return this.configService.get<number>('config.payments.minPaymentAmount')!;
  }

  get paymentIdempotencyTtl(): number {
    return this.configService.get<number>('config.payments.idempotencyTtl')!;
  }

  get paymentRateLimit(): number {
    return this.configService.get<number>('config.payments.rateLimitPerHour')!;
  }

  get isPaymentTestMode(): boolean {
    return this.configService.get<boolean>('config.payments.enableTestMode')!;
  }

  get paymentsConfig() {
    return {
      defaultCurrency: this.defaultCurrency,
      supportedCurrencies: this.supportedCurrencies,
      maxAmount: this.maxPaymentAmount,
      minAmount: this.minPaymentAmount,
      idempotencyTtl: this.paymentIdempotencyTtl,
      rateLimit: this.paymentRateLimit,
      testMode: this.isPaymentTestMode,
    };
  }

  // ☁️ AWS Config
  get awsAccessKeyId(): string {
    return this.configService.get<string>('config.aws.accessKeyId')!;
  }

  get awsSecretAccessKey(): string {
    return this.configService.get<string>('config.aws.secretAccessKey')!;
  }

  get awsRegion(): string {
    return this.configService.get<string>('config.aws.region')!;
  }

  get awsConfig() {
    return {
      accessKeyId: this.awsAccessKeyId,
      secretAccessKey: this.awsSecretAccessKey,
      region: this.awsRegion,
    };
  }

  // 📦 S3 Config
  get s3Bucket(): string {
    return this.configService.get<string>('config.s3.bucket')!;
  }

  get s3CustomUrl(): string {
    return this.configService.get<string>('config.s3.customUrl')!;
  }

  get s3Region(): string {
    return this.configService.get<string>('config.s3.region')!;
  }

  get s3Config() {
    return {
      bucket: this.s3Bucket,
      customUrl: this.s3CustomUrl,
      region: this.s3Region,
    };
  }

  // 🌐 CloudFront Config
  get cloudfrontDistributionId(): string {
    return this.configService.get<string>('config.cloudfront.distributionId')!;
  }

  get cloudfrontCustomDomain(): string {
    return this.configService.get<string>('config.cloudfront.customDomain')!;
  }

  get cloudfrontConfig() {
    return {
      distributionId: this.cloudfrontDistributionId,
      customDomain: this.cloudfrontCustomDomain,
    };
  }

  // 📰 Pachuca CDN Config (específico para Noticias Pachuca)
  get pachucaS3Bucket(): string {
    return this.configService.get<string>('config.pachucaCdn.bucket')!;
  }

  get pachucaS3Region(): string {
    return this.configService.get<string>('config.pachucaCdn.region')!;
  }

  get pachucaCdnUrl(): string {
    return this.configService.get<string>('config.pachucaCdn.cdnUrl')!;
  }

  get pachucaDistributionId(): string {
    return this.configService.get<string>('config.pachucaCdn.distributionId')!;
  }

  get pachucaCdnConfig() {
    return {
      bucket: this.pachucaS3Bucket,
      region: this.pachucaS3Region,
      cdnUrl: this.pachucaCdnUrl,
      distributionId: this.pachucaDistributionId,
    };
  }

  // 📁 Files Config
  get maxFileSize(): number {
    return this.configService.get<number>('config.files.maxFileSize')!;
  }

  get allowedFileTypes(): string[] {
    return this.configService.get<string[]>('config.files.allowedTypes')!;
  }

  get tempUploadPath(): string {
    return this.configService.get<string>('config.files.tempUploadPath')!;
  }

  get uploadCleanupInterval(): number {
    return this.configService.get<number>('config.files.cleanupInterval')!;
  }

  get enableImageOptimization(): boolean {
    return this.configService.get<boolean>('config.files.enableImageOptimization')!;
  }

  get enableVideoTranscoding(): boolean {
    return this.configService.get<boolean>('config.files.enableVideoTranscoding')!;
  }

  get imageQuality(): number {
    return this.configService.get<number>('config.files.imageQuality')!;
  }

  get maxConcurrentUploads(): number {
    return this.configService.get<number>('config.files.maxConcurrentUploads')!;
  }

  get enableVirusScanning(): boolean {
    return this.configService.get<boolean>('config.files.enableVirusScanning')!;
  }

  get enableContentSanitization(): boolean {
    return this.configService.get<boolean>('config.files.enableContentSanitization')!;
  }

  get presignedUrlExpiry(): number {
    return this.configService.get<number>('config.files.presignedUrlExpiry')!;
  }

  get filesConfig() {
    return {
      maxFileSize: this.maxFileSize,
      allowedTypes: this.allowedFileTypes,
      allowedMimeTypes: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        document: ['application/pdf', 'application/msword', 'text/plain'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        archive: ['application/zip', 'application/x-tar', 'application/gzip']
      },
      tempUploadPath: this.tempUploadPath,
      cleanupInterval: this.uploadCleanupInterval,
      enableImageOptimization: this.enableImageOptimization,
      enableVideoTranscoding: this.enableVideoTranscoding,
      imageQuality: this.imageQuality,
      maxConcurrentUploads: this.maxConcurrentUploads,
      enableVirusScanning: this.enableVirusScanning,
      enableContentSanitization: this.enableContentSanitization,
      presignedUrlExpiry: this.presignedUrlExpiry,
      allowDuplicates: false,
      deleteFromStorage: true,
      maxTotalSize: 10 * 1024 * 1024 * 1024, // 10GB
      minChunkSize: 1024 * 1024, // 1MB
      maxChunkSize: 100 * 1024 * 1024, // 100MB
      maxChunks: 1000,
    };
  }

  // 🤖 OpenAI Config
  get openAIApiKey(): string {
    return this.configService.get<string>('OPENAI_API_KEY')!;
  }

  get openAIOrganizationId(): string | undefined {
    return this.configService.get<string>('OPENAI_ORGANIZATION_ID') || undefined;
  }

  get openAIProjectId(): string | undefined {
    return this.configService.get<string>('OPENAI_PROJECT_ID') || undefined;
  }

  get openAIModel(): string {
    return this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  get openAIMaxTokens(): number {
    return parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '4000', 10);
  }

  get openAITemperature(): number {
    return parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7');
  }

  get openAITimeout(): number {
    return parseInt(this.configService.get<string>('OPENAI_TIMEOUT') || '30000', 10);
  }

  get openAIMaxRetries(): number {
    return parseInt(this.configService.get<string>('OPENAI_MAX_RETRIES') || '3', 10);
  }

  get openAIConfig() {
    return {
      apiKey: this.openAIApiKey,
      organizationId: this.openAIOrganizationId,
      projectId: this.openAIProjectId,
      model: this.openAIModel,
      maxTokens: this.openAIMaxTokens,
      temperature: this.openAITemperature,
      timeout: this.openAITimeout,
      maxRetries: this.openAIMaxRetries,
    };
  }
}
