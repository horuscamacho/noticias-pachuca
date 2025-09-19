# 🚀 MANUAL COMPLETO: YARN WORKSPACES + DOCKER 2025

## 📋 GUÍA DEFINITIVA PARA CREAR WORKSPACE CON API, REDIS Y MONGO

### **Investigación actualizada:** Enero 2025
**Fuente:** DEV Community, Stack Overflow, Yarn Docs, Docker Best Practices

---

## 🎯 **ESTRUCTURA COMPLETA DEL PROYECTO**

```
mi-proyecto/
├── package.json                 # ROOT - Configuración del workspace
├── yarn.lock                    # Lockfile compartido
├── .yarnrc.yml                  # Configuración de Yarn v4
├── docker-compose.yml           # Configuración multi-container
├── .env                         # Variables de entorno
├── packages/
│   └── api/                     # NestJS API
│       ├── package.json
│       ├── Dockerfile
│       └── src/
└── docs/
    └── README.md
```

---

## 🔧 **PASO 1: CONFIGURACIÓN DEL WORKSPACE ROOT**

### **1.1 Crear el directorio del proyecto**
```bash
mkdir mi-proyecto
cd mi-proyecto
```

### **1.2 Inicializar yarn workspace**
```bash
yarn init -p
```

### **1.3 Configurar package.json ROOT**
```json
{
  "name": "mi-proyecto-workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "packageManager": "yarn@4.9.4",
  "scripts": {
    "dev": "docker-compose up",
    "dev:build": "docker-compose up --build",
    "stop": "docker-compose down"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

### **1.4 Configurar .yarnrc.yml**
```yaml
nodeLinker: node-modules
enableGlobalCache: false
```

---

## 🚀 **PASO 2: CREAR LA API NESTJS**

### **2.1 Crear estructura de la API**
```bash
mkdir -p packages/api/src
cd packages/api
```

### **2.2 Configurar package.json de la API**
```json
{
  "name": "@mi-proyecto/api",
  "version": "1.0.0",
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/mongoose": "^11.0.3",
    "@nestjs/swagger": "^11.2.0",
    "mongoose": "^8.18.1",
    "class-validator": "^0.14.2",
    "class-transformer": "^0.5.1",
    "joi": "^18.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@types/node": "^22.10.7",
    "typescript": "^5.7.3"
  }
}
```

### **2.3 Crear Dockerfile para la API**
```dockerfile
# packages/api/Dockerfile
FROM node:20-alpine
WORKDIR /app

# Instalar NestJS CLI globalmente
RUN npm install -g @nestjs/cli

# Copiar archivos del workspace ROOT
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/api/package.json ./packages/api/

# Instalar dependencias desde el root
RUN yarn install

# Copiar código fuente
COPY packages/api ./packages/api

# Cambiar al directorio de la API
WORKDIR /app/packages/api

EXPOSE 3001

# Comando de desarrollo
CMD ["nest", "start", "--watch"]
```

---

## 🐳 **PASO 3: CONFIGURAR DOCKER COMPOSE**

### **3.1 Crear docker-compose.yml**
```yaml
version: '3.8'

services:
  # Redis
  redis:
    image: redis:7-alpine
    container_name: mi-proyecto-redis
    ports:
      - "6379:6379"
    networks:
      - mi-proyecto-network

  # MongoDB
  mongodb:
    image: mongo:7
    container_name: mi-proyecto-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: mi_proyecto_db
    volumes:
      - mongo_data:/data/db
    networks:
      - mi-proyecto-network

  # API NestJS
  api:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    container_name: mi-proyecto-api
    ports:
      - "3001:3001"
    depends_on:
      - redis
      - mongodb
    environment:
      NODE_ENV: development
      MONGODB_URL: mongodb://root:password123@mongodb:27017/mi_proyecto_db?authSource=admin
      REDIS_URL: redis://redis:6379
    volumes:
      - ./packages/api/src:/app/packages/api/src
    networks:
      - mi-proyecto-network

  # Mongo Express (Visor web de MongoDB)
  mongo-express:
    image: mongo-express:latest
    container_name: mi-proyecto-mongo-express
    ports:
      - "8081:8081"
    depends_on:
      - mongodb
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: root
      ME_CONFIG_MONGODB_ADMINPASSWORD: password123
      ME_CONFIG_MONGODB_URL: mongodb://root:password123@mongodb:27017/
    networks:
      - mi-proyecto-network

  # Redis Commander (Visor web de Redis)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: mi-proyecto-redis-commander
    ports:
      - "8082:8081"
    depends_on:
      - redis
    environment:
      REDIS_HOSTS: local:redis:6379
    networks:
      - mi-proyecto-network

volumes:
  mongo_data:

networks:
  mi-proyecto-network:
    driver: bridge
```

### **3.2 Crear archivo .env**
```bash
# Base de datos
MONGODB_URL=mongodb://root:password123@mongodb:27017/mi_proyecto_db?authSource=admin
DB_HOST=mongodb
DB_PORT=27017
DB_USERNAME=root
DB_PASSWORD=password123
DB_NAME=mi_proyecto_db

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# API
PORT=3001
NODE_ENV=development
API_PREFIX=api

# JWT
JWT_SECRET=super-secret-development-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
```

---

## 🎯 **PASO 4: INSTALAR DEPENDENCIAS Y EJECUTAR**

### **4.1 Desde el directorio ROOT del proyecto**
```bash
# Instalar todas las dependencias del workspace
yarn install

# Verificar que el workspace está configurado correctamente
yarn workspaces list

# Levantar todos los servicios
yarn dev
```

### **4.2 Verificar que todo funciona**

**Servicios disponibles:**
- **API NestJS**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Mongo Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082

---

## 🔧 **COMANDOS ÚTILES**

### **Gestión del workspace**
```bash
# Añadir dependencia a un workspace específico
yarn workspace @mi-proyecto/api add express

# Ejecutar script en workspace específico
yarn workspace @mi-proyecto/api run build

# Ejecutar comando en todos los workspaces
yarn workspaces foreach run build

# Limpiar node_modules de todos los workspaces
yarn workspaces foreach run clean
```

### **Gestión de Docker**
```bash
# Levantar servicios en background
docker-compose up -d

# Ver logs de un servicio específico
docker-compose logs -f api

# Reconstruir un servicio específico
docker-compose build --no-cache api

# Parar todos los servicios
docker-compose down

# Limpiar volúmenes (CUIDADO: borra datos)
docker-compose down -v
```

---

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

### **1. Error: "This package doesn't seem to be present in your lockfile"**
**Causa:** Yarn workspace no sincronizado con container Docker
**Solución:**
```bash
# Borrar lockfile y reinstalar
rm yarn.lock
yarn install

# Reconstruir container
docker-compose build --no-cache api
```

### **2. Error: "Cannot find module '@nestjs/common'"**
**Causa:** Dependencias no instaladas correctamente en el container
**Solución:**
```bash
# Verificar que package.json está correcto
cat packages/api/package.json

# Reconstruir completamente
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### **3. Error: "nest: command not found"**
**Causa:** NestJS CLI no instalado globalmente en container
**Solución:** Ya está solucionado en el Dockerfile con `RUN npm install -g @nestjs/cli`

---

## ✅ **CHECKLIST DE VERIFICACIÓN**

- [ ] Yarn v4 configurado correctamente
- [ ] Workspace con packages/* funcionando
- [ ] API NestJS compila sin errores
- [ ] MongoDB conecta correctamente
- [ ] Redis conecta correctamente
- [ ] Mongo Express accesible en puerto 8081
- [ ] Redis Commander accesible en puerto 8082
- [ ] Hot reload funciona (cambios en src/ se reflejan)

---

## 🎯 **SIGUIENTES PASOS**

1. **Configurar NestJS con Mongoose** siguiendo `NESTJS_MONGOOSE_GUIDE_2025.md`
2. **Configurar Swagger** para documentación de API
3. **Añadir tests** con Jest
4. **Configurar CI/CD** con GitHub Actions
5. **Deploy a AWS** usando ECS + ECR

---

**Resultado:** Workspace completo con yarn v4, Docker multi-container, API NestJS, MongoDB, Redis y herramientas de administración visual funcionando correctamente.