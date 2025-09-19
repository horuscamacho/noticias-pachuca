# ==========================================
# 🎯 STAGE 1: Base
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app

# Verificar que yarn esté disponible (ya viene en node:20-alpine)
RUN yarn --version

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

# Instalar solo dependencias de producción
RUN yarn install --frozen-lockfile --production && \
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