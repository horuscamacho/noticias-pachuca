import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  // 🔥 CONFIGURACIÓN DE LA APP
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
    apiPrefix: process.env.API_PREFIX || 'api',
  },

  // 🔥 CONFIGURACIÓN MONGODB
  database: {
    host: process.env.DB_HOST || 'mongodb',
    port: parseInt(process.env.DB_PORT || '27017', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'noticias_pachuca_db',
    url:
      process.env.MONGODB_URL ||
      'mongodb://root:password123@mongodb:27017/noticias_pachuca_db?authSource=admin',
  },

  // 🔥 CONFIGURACIÓN REDIS - NUEVAS MEJORES PRÁCTICAS 2025
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    url: process.env.REDIS_URL || 'redis://redis:6379',
    // 🚀 OPCIONES AVANZADAS 2025
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
  },

  // 🔥 CONFIGURACIÓN DE CACHE
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '600', 10),
    defaultTtl: parseInt(process.env.DEFAULT_CACHE_TTL || '300', 10),
    max: 1000, // Máximo de elementos en cache
  },

  // 🔐 CONFIGURACIÓN DE AUTENTICACIÓN COMPLETA
  auth: {
    // JWT Access Tokens
    jwtAccessSecret:
      process.env.JWT_ACCESS_SECRET ||
      'noticias-pachuca-super-secret-access-key-2025-very-secure-min-32-chars',
    jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',

    // JWT Refresh Tokens
    jwtRefreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'noticias-pachuca-super-secret-refresh-key-2025-very-secure-min-32-chars',
    jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',

    // Password Reset Tokens
    resetTokenSecret:
      process.env.RESET_TOKEN_SECRET ||
      'noticias-pachuca-reset-token-secret-2025-very-secure-min-32-chars',
    resetTokenExpires: process.env.RESET_TOKEN_EXPIRES || '1h',

    // Sessions (Web)
    sessionSecret:
      process.env.SESSION_SECRET ||
      'noticias-pachuca-session-secret-2025-very-secure-min-32-chars',
    sessionExpires: parseInt(process.env.SESSION_EXPIRES || '86400000'), // 24h en ms

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),

    // Platform Detection
    mobileUserAgents: [
      'react-native',
      'expo',
      'flutter',
      'ionic',
      'cordova',
      'mobile-app',
    ],

    // Token Limits
    maxRefreshTokens: parseInt(process.env.MAX_REFRESH_TOKENS || '5'),
    maxSessions: parseInt(process.env.MAX_SESSIONS || '3'),
  },

  // 🔔 CONFIGURACIÓN NOTIFICACIONES
  notifications: {
    expo: {
      accessToken: process.env.EXPO_ACCESS_TOKEN || undefined, // Opcional
      useFcmV1: true,
    },
    socketIo: {
      corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
      ],
      transports: process.env.SOCKET_IO_TRANSPORTS?.split(',') || [
        'websocket',
        'polling',
      ],
    },
  },

  // 📊 CONFIGURACIÓN DE REPORTES
  reports: {
    expirationHours: parseInt(process.env.REPORT_EXPIRATION_HOURS || '24', 10),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    maxConcurrentJobs: parseInt(process.env.REPORTS_MAX_CONCURRENT_JOBS || '5', 10),
    defaultTimeout: parseInt(process.env.REPORTS_DEFAULT_TIMEOUT || '300000', 10),
    maxSyncRecords: {
      pdf: 1000,
      excel: 5000,
    },
    formats: ['pdf', 'excel'] as const,
    templates: ['default', 'professional', 'minimal', 'financial', 'corporate'] as const,
  },

  // 💳 CONFIGURACIÓN DE STRIPE
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2023-10-16' as const,
    maxNetworkRetries: parseInt(process.env.STRIPE_MAX_RETRIES || '3', 10),
    timeout: parseInt(process.env.STRIPE_TIMEOUT || '30000', 10),
    environment: process.env.STRIPE_ENVIRONMENT as 'test' | 'live' || 'test',
  },

  // 💰 CONFIGURACIÓN DE PAGOS
  payments: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'usd',
    supportedCurrencies: process.env.SUPPORTED_CURRENCIES?.split(',') || ['usd', 'mxn'],
    maxPaymentAmount: parseInt(process.env.MAX_PAYMENT_AMOUNT || '999999', 10), // $9,999.99
    minPaymentAmount: parseInt(process.env.MIN_PAYMENT_AMOUNT || '50', 10), // $0.50
    idempotencyTtl: parseInt(process.env.PAYMENT_IDEMPOTENCY_TTL || '86400', 10), // 24h
    rateLimitPerHour: parseInt(process.env.PAYMENT_RATE_LIMIT || '50', 10),
    enableTestMode: process.env.PAYMENT_TEST_MODE === 'true',
  },

  // ☁️ CONFIGURACIÓN DE AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },

  // 📦 CONFIGURACIÓN DE S3
  s3: {
    bucket: process.env.AWS_S3_BUCKET || '',
    customUrl: process.env.AWS_S3_CUSTOM_URL || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },

  // 🌐 CONFIGURACIÓN DE CLOUDFRONT
  cloudfront: {
    distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',
    customDomain: process.env.AWS_S3_CUSTOM_URL || '',
  },

  // 📰 CONFIGURACIÓN CDN ESPECÍFICO PARA PACHUCA NOTICIAS
  pachucaCdn: {
    bucket: process.env.PACHUCA_S3_BUCKET || 'noticiaspachuca-assets',
    region: process.env.PACHUCA_S3_REGION || 'mx-central-1',
    cdnUrl: process.env.PACHUCA_CDN_URL || 'https://cdn.noticiaspachuca.com',
    distributionId: process.env.PACHUCA_CLOUDFRONT_DISTRIBUTION_ID || 'E1EA8H3LZ4M4FN',
  },

  // 📁 CONFIGURACIÓN DE ARCHIVOS
  files: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image', 'video', 'document', 'audio'],
    tempUploadPath: process.env.TEMP_UPLOAD_PATH || 'temp/uploads',
    cleanupInterval: parseInt(process.env.UPLOAD_CLEANUP_INTERVAL || '3600', 10), // 1 hour
    enableImageOptimization: process.env.ENABLE_IMAGE_OPTIMIZATION === 'true',
    enableVideoTranscoding: process.env.ENABLE_VIDEO_TRANSCODING === 'true',
    imageQuality: parseInt(process.env.IMAGE_QUALITY || '85', 10),
    maxConcurrentUploads: parseInt(process.env.MAX_CONCURRENT_UPLOADS || '10', 10),
    enableVirusScanning: process.env.ENABLE_VIRUS_SCANNING === 'true',
    enableContentSanitization: process.env.ENABLE_CONTENT_SANITIZATION === 'true',
    presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600', 10), // 1 hour
  },

  // 📘 CONFIGURACIÓN FACEBOOK GRAPH API
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    apiVersion: process.env.FACEBOOK_API_VERSION || 'v22.0',
    webhookVerifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || '',
    rateLimitBuffer: parseInt(process.env.FACEBOOK_RATE_LIMIT_BUFFER || '75', 10),
    batchSize: parseInt(process.env.FACEBOOK_BATCH_SIZE || '50', 10),
    baseUrl: 'https://graph.facebook.com',
    defaultFields: ['id', 'name', 'category', 'fan_count', 'talking_about_count'],
    cachePrefix: 'facebook:',
    cacheTtl: 3600, // 1 hour cache for Facebook data
  },
}));
