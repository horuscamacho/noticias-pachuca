import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 🎯 SCHEMA MONITORING CONFIG
 * Configuración global del sistema de monitoreo Facebook
 */

export type MonitoringConfigDocument = MonitoringConfig & Document;

@Schema({
  timestamps: true,
  collection: 'monitoring_configs',
  versionKey: false
})
export class MonitoringConfig {
  @Prop({
    required: true,
    unique: true,
    enum: ['global', 'rate_limiting', 'notifications', 'analysis'],
    index: true
  })
  configType: 'global' | 'rate_limiting' | 'notifications' | 'analysis';

  @Prop({
    required: true,
    default: true
  })
  enabled: boolean;

  @Prop({
    type: Object,
    default: {}
  })
  settings: Record<string, unknown>;

  @Prop({
    type: String,
    maxlength: 500
  })
  description?: string;

  @Prop({
    type: String,
    maxlength: 100
  })
  lastUpdatedBy?: string;

  // Timestamps automáticos de Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const MonitoringConfigSchema = SchemaFactory.createForClass(MonitoringConfig);

// Índices
MonitoringConfigSchema.index({ configType: 1 }, { unique: true });
MonitoringConfigSchema.index({ enabled: 1 });

// Middleware pre-save para validaciones
MonitoringConfigSchema.pre('save', function(next) {
  // Validar configuraciones específicas según el tipo
  try {
    switch (this.configType) {
      case 'global':
        validateGlobalConfig(this);
        break;
      case 'rate_limiting':
        validateRateLimitingConfig(this);
        break;
      case 'notifications':
        validateNotificationsConfig(this);
        break;
      case 'analysis':
        validateAnalysisConfig(this);
        break;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Funciones de validación
function validateGlobalConfig(doc: MonitoringConfigDocument) {
  const requiredFields = ['monitoringInterval', 'maxConcurrentJobs', 'dataRetentionDays'];
  for (const field of requiredFields) {
    if (!(field in doc.settings)) {
      throw new Error(`Global config missing required field: ${field}`);
    }
  }

  const settings = doc.settings as Record<string, number>;

  if (settings.monitoringInterval < 15 || settings.monitoringInterval > 1440) {
    throw new Error('Monitoring interval must be between 15 and 1440 minutes');
  }

  if (settings.maxConcurrentJobs < 1 || settings.maxConcurrentJobs > 20) {
    throw new Error('Max concurrent jobs must be between 1 and 20');
  }

  if (settings.dataRetentionDays < 7 || settings.dataRetentionDays > 365) {
    throw new Error('Data retention must be between 7 and 365 days');
  }
}

function validateRateLimitingConfig(doc: MonitoringConfigDocument) {
  const requiredFields = ['bufferPercentage', 'maxRetries', 'backoffMultiplier'];
  for (const field of requiredFields) {
    if (!(field in doc.settings)) {
      throw new Error(`Rate limiting config missing required field: ${field}`);
    }
  }

  const settings = doc.settings as Record<string, number>;

  if (settings.bufferPercentage < 50 || settings.bufferPercentage > 95) {
    throw new Error('Buffer percentage must be between 50 and 95');
  }
}

function validateNotificationsConfig(doc: MonitoringConfigDocument) {
  const requiredFields = ['enableWebhooks', 'enableSocketNotifications', 'alertThresholds'];
  for (const field of requiredFields) {
    if (!(field in doc.settings)) {
      throw new Error(`Notifications config missing required field: ${field}`);
    }
  }
}

function validateAnalysisConfig(doc: MonitoringConfigDocument) {
  const requiredFields = ['enableViralDetection', 'viralScoreThreshold', 'analysisDepth'];
  for (const field of requiredFields) {
    if (!(field in doc.settings)) {
      throw new Error(`Analysis config missing required field: ${field}`);
    }
  }

  const settings = doc.settings as Record<string, unknown>;
  const threshold = settings.viralScoreThreshold as number;

  if (threshold < 50 || threshold > 100) {
    throw new Error('Viral score threshold must be between 50 and 100');
  }
}

// Métodos de validación
MonitoringConfigSchema.methods.validateGlobalConfig = function() {
  const requiredFields = ['monitoringInterval', 'maxConcurrentJobs', 'dataRetentionDays'];
  for (const field of requiredFields) {
    if (!(field in this.settings)) {
      throw new Error(`Global config missing required field: ${field}`);
    }
  }

  const settings = this.settings as Record<string, number>;

  if (settings.monitoringInterval < 15 || settings.monitoringInterval > 1440) {
    throw new Error('Monitoring interval must be between 15 and 1440 minutes');
  }

  if (settings.maxConcurrentJobs < 1 || settings.maxConcurrentJobs > 20) {
    throw new Error('Max concurrent jobs must be between 1 and 20');
  }

  if (settings.dataRetentionDays < 7 || settings.dataRetentionDays > 365) {
    throw new Error('Data retention must be between 7 and 365 days');
  }
};

MonitoringConfigSchema.methods.validateRateLimitingConfig = function() {
  const requiredFields = ['bufferPercentage', 'maxRetries', 'backoffMultiplier'];
  for (const field of requiredFields) {
    if (!(field in this.settings)) {
      throw new Error(`Rate limiting config missing required field: ${field}`);
    }
  }

  const settings = this.settings as Record<string, number>;

  if (settings.bufferPercentage < 50 || settings.bufferPercentage > 95) {
    throw new Error('Buffer percentage must be between 50 and 95');
  }
};

MonitoringConfigSchema.methods.validateNotificationsConfig = function() {
  const requiredFields = ['enableWebhooks', 'enableSocketNotifications', 'alertThresholds'];
  for (const field of requiredFields) {
    if (!(field in this.settings)) {
      throw new Error(`Notifications config missing required field: ${field}`);
    }
  }
};

MonitoringConfigSchema.methods.validateAnalysisConfig = function() {
  const requiredFields = ['enableViralDetection', 'viralScoreThreshold', 'analysisDepth'];
  for (const field of requiredFields) {
    if (!(field in this.settings)) {
      throw new Error(`Analysis config missing required field: ${field}`);
    }
  }

  const settings = this.settings as Record<string, unknown>;
  const threshold = settings.viralScoreThreshold as number;

  if (threshold < 50 || threshold > 100) {
    throw new Error('Viral score threshold must be between 50 and 100');
  }
};

// Métodos estáticos para obtener configuraciones
MonitoringConfigSchema.statics.getGlobalConfig = async function() {
  let config = await this.findOne({ configType: 'global' });

  if (!config) {
    // Crear configuración por defecto
    config = await this.create({
      configType: 'global',
      enabled: true,
      settings: {
        monitoringInterval: 60, // 1 hour
        maxConcurrentJobs: 5,
        dataRetentionDays: 90,
        enableAutoAnalysis: true,
        enableViralDetection: true,
        enableCompetitorAlerts: true,
      },
      description: 'Global monitoring configuration'
    });
  }

  return config;
};

MonitoringConfigSchema.statics.getRateLimitingConfig = async function() {
  let config = await this.findOne({ configType: 'rate_limiting' });

  if (!config) {
    config = await this.create({
      configType: 'rate_limiting',
      enabled: true,
      settings: {
        bufferPercentage: 75,
        maxRetries: 3,
        backoffMultiplier: 2,
        initialRetryDelay: 1000,
        maxRetryDelay: 30000,
        enableAdaptiveRateLimiting: true,
      },
      description: 'Facebook API rate limiting configuration'
    });
  }

  return config;
};

MonitoringConfigSchema.statics.getNotificationsConfig = async function() {
  let config = await this.findOne({ configType: 'notifications' });

  if (!config) {
    config = await this.create({
      configType: 'notifications',
      enabled: true,
      settings: {
        enableWebhooks: true,
        enableSocketNotifications: true,
        enablePushNotifications: false,
        alertThresholds: {
          viralContent: 80,
          highEngagement: 60,
          growthSpike: 25,
          engagementDrop: 50,
        },
        notificationChannels: {
          dashboard: true,
          email: false,
          slack: false,
        },
        quietHours: {
          enabled: false,
          startHour: 22,
          endHour: 8,
        },
      },
      description: 'Notification system configuration'
    });
  }

  return config;
};

MonitoringConfigSchema.statics.getAnalysisConfig = async function() {
  let config = await this.findOne({ configType: 'analysis' });

  if (!config) {
    config = await this.create({
      configType: 'analysis',
      enabled: true,
      settings: {
        enableViralDetection: true,
        viralScoreThreshold: 80,
        analysisDepth: 'detailed', // 'basic', 'detailed', 'comprehensive'
        enableSentimentAnalysis: false,
        enableHashtagAnalysis: true,
        enableCompetitiveAnalysis: true,
        analysisSchedule: {
          hourly: false,
          daily: true,
          weekly: true,
        },
        reportGeneration: {
          autoGenerate: false,
          formats: ['json'],
          schedules: ['weekly'],
        },
      },
      description: 'Content analysis configuration'
    });
  }

  return config;
};

// Método para actualizar configuración
MonitoringConfigSchema.statics.updateConfig = async function(
  configType: string,
  newSettings: Record<string, unknown>,
  updatedBy?: string
) {
  const config = await this.findOne({ configType });

  if (!config) {
    throw new Error(`Configuration type '${configType}' not found`);
  }

  // Merge settings
  config.settings = { ...config.settings, ...newSettings };
  config.lastUpdatedBy = updatedBy;

  await config.save();
  return config;
};

// Método para habilitar/deshabilitar configuración
MonitoringConfigSchema.statics.toggleConfig = async function(
  configType: string,
  enabled: boolean,
  updatedBy?: string
) {
  const config = await this.findOne({ configType });

  if (!config) {
    throw new Error(`Configuration type '${configType}' not found`);
  }

  config.enabled = enabled;
  config.lastUpdatedBy = updatedBy;

  await config.save();
  return config;
};