import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  // MongoDB
  MONGODB_URL: Joi.string().required(),
  DB_HOST: Joi.string().default('mongodb'),
  DB_PORT: Joi.number().default(27017),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('redis'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),

  // Cache
  CACHE_TTL: Joi.number().default(600),
  DEFAULT_CACHE_TTL: Joi.number().default(300),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().pattern(/^sk_live_/).required(),
    otherwise: Joi.string().pattern(/^sk_test_/).optional(),
  }),
  STRIPE_PUBLISHABLE_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().pattern(/^pk_live_/).required(),
    otherwise: Joi.string().pattern(/^pk_test_/).optional(),
  }),
  STRIPE_WEBHOOK_SECRET: Joi.string().pattern(/^whsec_/).optional(),
  STRIPE_ENVIRONMENT: Joi.string().valid('test', 'live').default('test'),
  STRIPE_MAX_RETRIES: Joi.number().min(1).max(10).default(3),
  STRIPE_TIMEOUT: Joi.number().min(5000).max(60000).default(30000),

  // Payments
  DEFAULT_CURRENCY: Joi.string().length(3).default('usd'),
  SUPPORTED_CURRENCIES: Joi.string().default('usd,mxn'),
  MAX_PAYMENT_AMOUNT: Joi.number().min(1).default(999999),
  MIN_PAYMENT_AMOUNT: Joi.number().min(1).default(50),
  PAYMENT_IDEMPOTENCY_TTL: Joi.number().min(3600).default(86400),
  PAYMENT_RATE_LIMIT: Joi.number().min(1).max(1000).default(50),
  PAYMENT_TEST_MODE: Joi.boolean().default(true),

  // AWS Configuration
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_REGION: Joi.string().default('us-east-1'),

  // S3 Configuration
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_CUSTOM_URL: Joi.string().uri().optional(),

  // CloudFront Configuration
  AWS_CLOUDFRONT_DISTRIBUTION_ID: Joi.string().optional(),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().min(1024).max(1073741824).default(52428800), // Min 1KB, Max 1GB, Default 50MB
  ALLOWED_FILE_TYPES: Joi.string().default('image,video,document,audio'),
  TEMP_UPLOAD_PATH: Joi.string().default('temp/uploads'),
  UPLOAD_CLEANUP_INTERVAL: Joi.number().min(60).default(3600), // Min 1 minute, Default 1 hour
  ENABLE_IMAGE_OPTIMIZATION: Joi.boolean().default(true),
  ENABLE_VIDEO_TRANSCODING: Joi.boolean().default(false),
  IMAGE_QUALITY: Joi.number().min(1).max(100).default(85),
  MAX_CONCURRENT_UPLOADS: Joi.number().min(1).max(100).default(10),
  ENABLE_VIRUS_SCANNING: Joi.boolean().default(false),
  ENABLE_CONTENT_SANITIZATION: Joi.boolean().default(true),
  PRESIGNED_URL_EXPIRY: Joi.number().min(300).max(604800).default(3600), // Min 5 minutes, Max 7 days, Default 1 hour
});
