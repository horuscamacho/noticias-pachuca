# 🚀 GUÍA DEFINITIVA: NestJS ConfigModule 2025

## 📋 MEJORES PRÁCTICAS PARA VARIABLES DE ENTORNO TIPADAS

### **Investigación actualizada:** Enero 2025
**Fuente:** Documentación oficial NestJS + mejores prácticas de la comunidad

---

## 🎯 **CONFIGURACIÓN BÁSICA**

### **1. Instalación**

```bash
# Paquetes necesarios
yarn add @nestjs/config
yarn add joi  # Para validación
yarn add -D @types/joi
```

### **2. Configuración en AppModule**

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // 🔥 IMPORTANTE: Disponible en toda la app
      load: [configuration],  // Archivos de configuración personalizados
      envFilePath: getEnvFilePath(),  // Diferentes .env por ambiente
      validationSchema: validationSchema,  // Validación con Joi
      validationOptions: {
        allowUnknown: false,  // Solo variables definidas
        abortEarly: true,     // Falla al primer error
      },
    }),
    // ✅ ConfigModule DEBE ser el primer import
  ],
  // ... resto de imports
})
export class AppModule {}

// Función para seleccionar .env por ambiente
function getEnvFilePath() {
  const ENV = process.env.NODE_ENV;
  return !ENV ? '.env' : `.env.${ENV}`;
}
```

---

## 🔧 **ESTRUCTURA DE CONFIGURACIÓN TIPADA**

### **3. Archivo de Configuración Principal**

```typescript
// src/config/configuration.ts
import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  apiPrefix: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  url: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

// 🎯 CONFIGURACIÓN TIPADA
export default registerAs('config', () => ({
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
    apiPrefix: process.env.API_PREFIX || 'api',
  } as AppConfig,

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '27017', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'noticias_pachuca',
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/noticias_pachuca',
  } as DatabaseConfig,

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  } as RedisConfig,

  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as JwtConfig,
}));
```

### **4. Validación con Joi (Recomendado 2025)**

```typescript
// src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Aplicación
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api'),

  // Base de datos
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().default(27017),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  MONGODB_URL: Joi.string().uri().required(),

  // Redis
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_URL: Joi.string().uri().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // AWS (opcional)
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
});
```

---

## 🏗️ **USO EN SERVICIOS Y MÓDULOS**

### **5. Servicio de Configuración Tipado**

```typescript
// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig, DatabaseConfig, RedisConfig, JwtConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // 🎯 MÉTODOS TIPADOS
  get app(): AppConfig {
    return this.configService.get<AppConfig>('config.app')!;
  }

  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('config.database')!;
  }

  get redis(): RedisConfig {
    return this.configService.get<RedisConfig>('config.redis')!;
  }

  get jwt(): JwtConfig {
    return this.configService.get<JwtConfig>('config.jwt')!;
  }

  // Métodos específicos con validación
  get port(): number {
    return this.app.port;
  }

  get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }

  get mongoUrl(): string {
    return this.database.url;
  }

  get redisUrl(): string {
    return this.redis.url;
  }
}
```

### **6. Uso en Módulos de Base de Datos**

```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '../config/config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => ({
        uri: configService.mongoUrl,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class DatabaseModule {}
```

### **7. Uso en Controladores y Servicios**

```typescript
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: AppConfigService,  // ✅ Inyección tipada
  ) {}

  async generateTokens(payload: any) {
    const jwtConfig = this.configService.jwt;  // 🎯 Acceso tipado

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.refreshSecret,
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }
}
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS .ENV**

### **8. Diferentes Ambientes**

```bash
# .env (desarrollo local)
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Base de datos
DB_HOST=localhost
DB_PORT=27017
DB_USERNAME=root
DB_PASSWORD=development123
DB_NAME=noticias_pachuca_dev
MONGODB_URL=mongodb://root:development123@localhost:27017/noticias_pachuca_dev?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=super-secret-development-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super-secret-development-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

```bash
# .env.production (producción)
NODE_ENV=production
PORT=3001
API_PREFIX=api

# Base de datos (usar secrets manager en prod)
MONGODB_URL=${AWS_SECRET_MONGODB_URL}

# Redis
REDIS_URL=${AWS_SECRET_REDIS_URL}

# JWT
JWT_SECRET=${AWS_SECRET_JWT_SECRET}
JWT_REFRESH_SECRET=${AWS_SECRET_JWT_REFRESH_SECRET}

# AWS
AWS_REGION=us-east-1
```

---

## ⚡ **MEJORES PRÁCTICAS 2025**

### **✅ DO (Hacer)**

1. **ConfigModule como primer import** en AppModule
2. **Usar `isGlobal: true`** para disponibilidad global
3. **Validar TODAS las variables** con Joi
4. **Crear interfaces TypeScript** para tipado fuerte
5. **Usar `registerAs()`** para configuraciones organizadas
6. **Servicio de configuración dedicado** con métodos tipados
7. **Diferentes .env por ambiente** (.env.development, .env.production)
8. **Secrets manager en producción** (AWS Secrets Manager)
9. **Validar en startup** con `abortEarly: true`
10. **Agregar .env a .gitignore**

### **❌ DON'T (No hacer)**

1. **NO usar `process.env` directamente** en servicios
2. **NO hardcodear valores** sensibles
3. **NO commitear archivos .env** reales
4. **NO usar ConfigService sin tipado**
5. **NO permitir variables unknown** sin validación
6. **NO mezclar configuración** con lógica de negocio
7. **NO usar strings mágicos** para keys de configuración

---

## 🧪 **TESTING**

### **9. Configuración para Tests**

```typescript
// test/config/test-config.ts
export const testConfig = {
  app: {
    port: 3333,
    nodeEnv: 'test' as const,
    apiPrefix: 'api',
  },
  database: {
    url: 'mongodb://localhost:27017/noticias_pachuca_test',
  },
  redis: {
    url: 'redis://localhost:6379/1', // DB diferente para tests
  },
  jwt: {
    secret: 'test-secret-min-32-characters-long',
    expiresIn: '1h',
  },
};
```

---

## 🎯 **RESULTADO FINAL**

Con esta configuración tendrás:

✅ **Tipado fuerte** en toda la aplicación
✅ **Validación automática** al inicio
✅ **Ambientes separados** (.env por ambiente)
✅ **Autocompletado** en IDEs
✅ **Detección de errores** en compilación
✅ **Configuración centralizada** y mantenible
✅ **Compatible con Docker** y deployments

**Esta guía está basada en las mejores prácticas de 2025 y documentación oficial de NestJS.**