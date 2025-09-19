# Production Dockerfile for Expo Web
FROM node:20-alpine AS base
WORKDIR /app

# Install Expo CLI globally
RUN yarn global add @expo/cli

# Copy package.json files
COPY package.json yarn.lock ./
COPY packages/mobile-expo/package.json ./packages/mobile-expo/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY packages/mobile-expo ./packages/mobile-expo
COPY packages/shared ./packages/shared

# Build shared package first
RUN yarn workspace @noticias/shared build

# Set working directory to mobile package
WORKDIR /app/packages/mobile-expo

# Build for web
RUN yarn expo export --platform web

# Production stage with nginx
FROM nginx:alpine AS production
COPY --from=base /app/packages/mobile-expo/dist /usr/share/nginx/html

EXPOSE 3000

# Custom nginx config for SPA
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]