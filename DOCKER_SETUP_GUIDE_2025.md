# 🐳 Guía Completa Docker Setup 2025 - NestJS + Yarn + MongoDB + Redis

## 📋 Resumen del Setup

Esta guía implementa las **mejores prácticas 2025** para desarrollo con:
- **NestJS** (API Backend)
- **Yarn** (Última versión estable)
- **MongoDB** + **MongoDB Compass** (GUI oficial)
- **Redis** + **RedisInsight** (GUI oficial)
- **Docker & Docker Compose**

---

## 🗂️ Estructura Final del Proyecto

```
noticias-pachuca/
├── api/                          # Aplicación NestJS
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.development
├── docker-compose.yml            # Orquestación de servicios
├── .dockerignore
└── DOCKER_SETUP_GUIDE_2025.md
```

---

## 🚀 Pasos de Implementación

### 1. ⚠️ REGLAS FUNDAMENTALES

**❌ NUNCA HACER:**
- Usar `npm` en NINGÚN lugar del proyecto
- Mezclar gestores de paquetes
- Instalar dependencias fuera del container
- Usar Yarn workspaces sin necesidad

**✅ SIEMPRE HACER:**
- Usar únicamente `yarn` (última versión)
- Instalar dependencias dentro del container
- Usar volúmenes para hot reload
- Seguir estructura de single app

### 2. 📁 Reorganización del Proyecto

Mover todo el código de NestJS a una carpeta `api/`:

```bash
# Crear nueva estructura
mkdir api
mv packages/api-nueva/* api/
rm -rf packages/
```

### 3. 🐋 Dockerfile para NestJS (Multistage)

**Archivo:** `api/Dockerfile`

```dockerfile
# ==========================================
# 🎯 STAGE 1: Base
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app

# Instalar yarn globalmente
RUN npm install -g yarn@latest

# Copiar archivos de dependencias
COPY package.json yarn.lock* ./

# ==========================================
# 🛠️ STAGE 2: Development
# ==========================================
FROM base AS development
ENV NODE_ENV=development

# Instalar todas las dependencias (incluyendo devDependencies)
RUN yarn install --frozen-lockfile

# Instalar NestJS CLI globalmente
RUN yarn global add @nestjs/cli

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de desarrollo con hot reload
CMD ["yarn", "start:dev"]

# ==========================================
# 🏗️ STAGE 3: Build
# ==========================================
FROM base AS build
ENV NODE_ENV=production

# Instalar todas las dependencias para build
RUN yarn install --frozen-lockfile

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN yarn build

# ==========================================
# 🚀 STAGE 4: Production
# ==========================================
FROM node:20-alpine AS production
WORKDIR /app

# Copiar package.json y yarn.lock
COPY package.json yarn.lock* ./

# Instalar yarn e instalar solo dependencias de producción
RUN npm install -g yarn@latest && \
    yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copiar aplicación compilada desde build stage
COPY --from=build /app/dist ./dist

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# Exponer puerto
EXPOSE 3000

# Comando de producción
CMD ["node", "dist/main"]
```

### 4. 🐳 Docker Compose Principal

**Archivo:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  # ==========================================
  # 🟢 NestJS API
  # ==========================================
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
      target: development
    container_name: noticias-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGODB_URI=mongodb://mongodb:27017/noticias_pachuca
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./api:/app:cached
      - /app/node_modules
      - /app/dist
    depends_on:
      - mongodb
      - redis
    networks:
      - noticias-network
    restart: unless-stopped

  # ==========================================
  # 🍃 MongoDB Database
  # ==========================================
  mongodb:
    image: mongo:7-jammy
    container_name: noticias-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: noticias_pachuca
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d:ro
    networks:
      - noticias-network
    restart: unless-stopped

  # ==========================================
  # 🔴 Redis Cache
  # ==========================================
  redis:
    image: redis:7-alpine
    container_name: noticias-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis123
    volumes:
      - redis_data:/data
    networks:
      - noticias-network
    restart: unless-stopped

  # ==========================================
  # 🍃 MongoDB Compass (GUI Oficial)
  # ==========================================
  mongo-express:
    image: mongo-express:latest
    container_name: noticias-mongo-gui
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password123
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin123
    depends_on:
      - mongodb
    networks:
      - noticias-network
    restart: unless-stopped

  # ==========================================
  # 🔴 RedisInsight (GUI Oficial)
  # ==========================================
  redis-insight:
    image: redislabs/redisinsight:latest
    container_name: noticias-redis-gui
    ports:
      - "8001:8001"
    volumes:
      - redis_insight_data:/db
    networks:
      - noticias-network
    restart: unless-stopped

# ==========================================
# 📦 Volúmenes Persistentes
# ==========================================
volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
  redis_insight_data:
    driver: local

# ==========================================
# 🌐 Red Personalizada
# ==========================================
networks:
  noticias-network:
    driver: bridge
```

### 5. 🚫 .dockerignore

**Archivo:** `.dockerignore`

```dockerignore
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage

# Compiled binary addons
build/Release

# Dependency directories
.npm
.yarn-cache/
.yarn/

# Optional npm cache directory
.npm

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.dockerignore

# Documentation
README.md
*.md

# Tests
test/
tests/
__tests__/
*.test.js
*.test.ts
*.spec.js
*.spec.ts

# Build artifacts
dist/
build/
out/
```

### 6. ⚙️ Configuración de Desarrollo

**Archivo:** `api/.env.development`

```env
# ==========================================
# 🚀 NestJS Configuration
# ==========================================
NODE_ENV=development
PORT=3000

# ==========================================
# 🍃 MongoDB Configuration
# ==========================================
MONGODB_URI=mongodb://admin:password123@mongodb:27017/noticias_pachuca?authSource=admin

# ==========================================
# 🔴 Redis Configuration
# ==========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0

# ==========================================
# 🔐 JWT Configuration
# ==========================================
JWT_SECRET=tu-jwt-secret-super-seguro-para-desarrollo
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=tu-refresh-secret-super-seguro
JWT_REFRESH_EXPIRES_IN=7d

# ==========================================
# 📧 Email Configuration (Opcional)
# ==========================================
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=

# ==========================================
# 🔧 Cache Configuration
# ==========================================
CACHE_TTL=300
CACHE_MAX_ITEMS=100
```

### 7. 📦 package.json Optimizado

**Archivo:** `api/package.json`

```json
{
  "name": "noticias-pachuca-api",
  "version": "1.0.0",
  "description": "NestJS API for Noticias Pachuca",
  "main": "dist/main.js",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/mongoose": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/cache-manager": "^2.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "mongoose": "^8.0.0",
    "cache-manager": "^5.0.0",
    "cache-manager-redis-store": "^3.0.0",
    "redis": "^4.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^4.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/supertest": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "rimraf": "^5.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "yarn": ">=1.22.0"
  }
}
```

---

## 🚀 Comandos de Uso

### Desarrollo
```bash
# Levantar todo el stack
docker-compose up

# Levantar con rebuild
docker-compose up --build

# Modo detached (background)
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar servicios
docker-compose down

# Limpiar todo
docker-compose down -v --rmi all
```

### Yarn en Container
```bash
# Instalar dependencia
docker-compose exec api yarn add nueva-dependencia

# Instalar dev dependency
docker-compose exec api yarn add -D nueva-dev-dependency

# Ejecutar tests
docker-compose exec api yarn test

# Ejecutar build
docker-compose exec api yarn build
```

---

## 🌐 URLs de Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **NestJS API** | http://localhost:3000 | - |
| **MongoDB GUI** | http://localhost:8081 | admin / admin123 |
| **RedisInsight** | http://localhost:8001 | - |

---

## ⚡ Hot Reload Configuration

El hot reload funciona automáticamente gracias a:

1. **Volumen bind mount**: `./api:/app:cached`
2. **node_modules excluido**: `/app/node_modules`
3. **NestJS watch mode**: `yarn start:dev`

---

## 🔧 Troubleshooting

### Problemas Comunes

1. **Puerto ocupado**: Cambiar puertos en docker-compose.yml
2. **Permisos**: Usar `sudo` en Linux
3. **Caché**: Usar `docker-compose build --no-cache`
4. **Yarn version**: Verificar que usa la última versión

### Logs útiles
```bash
# Ver logs específicos
docker-compose logs mongodb
docker-compose logs redis
docker-compose logs api

# Entrar al container
docker-compose exec api sh
```

---

## ✅ Checklist Final

- [ ] Estructura de proyecto reorganizada
- [ ] Dockerfile multistage creado
- [ ] Docker-compose configurado
- [ ] Variables de entorno definidas
- [ ] .dockerignore optimizado
- [ ] Hot reload funcionando
- [ ] GUIs de MongoDB y Redis accesibles
- [ ] Solo Yarn usado (nunca npm)

---

**🎯 Resultado:** Stack completo de desarrollo con NestJS, MongoDB, Redis y sus GUIs oficiales, siguiendo las mejores prácticas 2025.