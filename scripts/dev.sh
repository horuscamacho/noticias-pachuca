#!/bin/bash

echo "🚀 Noticias Pachuca - Development Setup (Multi-Container)"
echo "========================================================"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar que Yarn esté instalado
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn no está instalado. Por favor instala Yarn primero."
    exit 1
fi

echo "🔨 Iniciando servicios con Docker Compose..."
echo ""
echo "🎯 Servicios disponibles:"
echo "   - Web (Expo): http://localhost:3000"
echo "   - API (NestJS): http://localhost:3001"
echo "   - Redis: localhost:6379"
echo "   - MongoDB: localhost:27017"
echo "   - Mongo Express: http://localhost:8081 (admin/admin123)"
echo "   - Redis Commander: http://localhost:8082"
echo ""
echo "Para parar todos los servicios: Ctrl+C o yarn dev:stop"
echo ""

# Ejecutar Docker Compose
docker-compose -f docker-compose.dev.yml up --build