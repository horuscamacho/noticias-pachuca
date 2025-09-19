# 📊 PLAN DETALLADO: IMPLEMENTACIÓN TELEMETRÍA MÓVIL 2025

## 🎯 OBJETIVO
Implementar sistema completo de telemetría para la app móvil de Noticias Pachuca, recolectando datos esenciales desde el primer arranque de la app, con patrones modernos de arquitectura y caching.

---

## 📋 CHECKLIST COMPLETO DE IMPLEMENTACIÓN

### **FASE 1: PREPARACIÓN BACKEND** (3-4 días)

#### 🔧 **Day 1: Setup Base Backend**
- [ ] **1.1** Crear módulo de Analytics en NestJS
  ```bash
  nest generate module analytics
  nest generate controller analytics
  nest generate service analytics
  ```

- [ ] **1.2** Crear esquemas MongoDB para telemetría
  ```typescript
  // src/schemas/telemetry.schema.ts
  // src/schemas/device-session.schema.ts
  // src/schemas/performance-metric.schema.ts
  ```

- [ ] **1.3** Implementar DTOs de validación
  ```typescript
  // src/analytics/dto/telemetry.dto.ts
  // src/analytics/dto/device-info.dto.ts
  // src/analytics/dto/performance.dto.ts
  ```

- [ ] **1.4** Configurar endpoints básicos
  ```typescript
  POST /analytics/telemetry        // Batch telemetry data
  POST /analytics/session         // Session start/end
  POST /analytics/performance     // Performance metrics
  GET  /analytics/health          // Health check
  ```

#### 🗄️ **Day 2: Database & Schemas**
- [ ] **2.1** Crear schema de Telemetría
  ```typescript
  interface TelemetryDocument {
    sessionId: string;
    deviceId: string;
    userId?: string;
    timestamp: Date;
    eventType: 'app_start' | 'screen_view' | 'performance' | 'error';
    data: Record<string, any>;
    metadata: {
      appVersion: string;
      platform: 'ios' | 'android';
      osVersion: string;
    };
  }
  ```

- [ ] **2.2** Crear schema de Device Session
  ```typescript
  interface DeviceSessionDocument {
    sessionId: string;
    deviceId: string;
    startTime: Date;
    endTime?: Date;
    deviceInfo: DeviceInfo;
    networkInfo: NetworkInfo;
    performanceMetrics: PerformanceMetrics;
    isActive: boolean;
  }
  ```

- [ ] **2.3** Crear índices optimizados
  ```typescript
  // Índices por sessionId, deviceId, timestamp
  // Índices TTL para auto-limpieza de datos antiguos
  ```

- [ ] **2.4** Setup Redis para caching de analytics
  ```typescript
  // Cache keys: analytics:summary:daily, analytics:devices:active
  ```

#### ⚡ **Day 3: Servicios y Lógica de Negocio**
- [ ] **3.1** Implementar TelemetryService
  ```typescript
  // Métodos: storeTelemetry(), getSessionSummary(), getDeviceMetrics()
  ```

- [ ] **3.2** Implementar PaginationService (reutilizable)
  ```typescript
  // src/common/services/pagination.service.ts
  // PaginationDto con defaults: page=1, limit=10
  ```

- [ ] **3.3** Implementar caching patterns
  ```typescript
  // Cache interceptors para analytics endpoints
  // TTL diferenciado: summaries (1h), raw data (10min)
  ```

- [ ] **3.4** Validaciones y middlewares
  ```typescript
  // Rate limiting para endpoints de telemetría
  // Validación de deviceId y sessionId
  ```

#### 🔒 **Day 4: Seguridad y Testing**
- [ ] **4.1** Implementar rate limiting
  ```typescript
  // Máximo 100 eventos por minuto por deviceId
  ```

- [ ] **4.2** Anonimización automática
  ```typescript
  // Remover PII automáticamente
  // Hash de IPs y device identifiers
  ```

- [ ] **4.3** Testing de endpoints
  ```bash
  # Test con curl de todos los endpoints
  # Validar respuestas y error handling
  ```

- [ ] **4.4** Configurar logs estructurados
  ```typescript
  // Logs de telemetría en formato JSON
  // Métricas de performance del sistema
  ```

---

### **FASE 2: SETUP MOBILE BASE** (3-4 días)

#### 📱 **Day 5: Estructura Mobile**
- [ ] **5.1** Crear estructura de directorios
  ```
  packages/mobile-expo/src/
  ├── features/analytics/
  ├── shared/services/
  ├── shared/hooks/
  ├── mappers/
  └── types/
  ```

- [ ] **5.2** Instalar dependencias Expo
  ```bash
  expo install expo-device expo-constants expo-application
  expo install expo-network expo-battery expo-screen-orientation
  expo install expo-tracking-transparency
  expo install @tanstack/react-query axios
  ```

- [ ] **5.3** Configurar tipos compartidos
  ```typescript
  // Actualizar @noticias/shared con tipos de telemetría
  // Sincronizar con schemas del backend
  ```

- [ ] **5.4** Setup constantes de configuración
  ```typescript
  // src/shared/constants/api.ts
  // src/shared/constants/telemetry.ts
  ```

#### 🌐 **Day 6: API Client Setup**
- [ ] **6.1** Crear ApiService con Axios
  ```typescript
  // src/shared/services/api.service.ts
  // Interceptors para auth automático
  // Error handling y retry logic
  ```

- [ ] **6.2** Implementar auth middleware
  ```typescript
  // Auto-injection de Bearer token
  // Refresh token automático en 401
  // Device headers automáticos
  ```

- [ ] **6.3** Crear hooks de TanStack Query
  ```typescript
  // useApiQuery, useApiMutation
  // useTelemetryMutation, useSessionMutation
  ```

- [ ] **6.4** Setup de mappers
  ```typescript
  // src/mappers/telemetry.mapper.ts
  // Backend Response -> App State mapping
  ```

#### 📊 **Day 7: Collectors de Datos**
- [ ] **7.1** DeviceInfoCollector
  ```typescript
  // src/features/analytics/collectors/device.collector.ts
  // Recolectar: brand, model, OS, app version
  ```

- [ ] **7.2** NetworkInfoCollector
  ```typescript
  // src/features/analytics/collectors/network.collector.ts
  // Recolectar: connection type, carrier, latency
  ```

- [ ] **7.3** PerformanceCollector
  ```typescript
  // src/features/analytics/collectors/performance.collector.ts
  // Recolectar: memory, battery, app start time
  ```

- [ ] **7.4** SessionManager
  ```typescript
  // src/features/analytics/services/session.manager.ts
  // Generar sessionId, track session lifecycle
  ```

#### 🗄️ **Day 8: Storage y Queue**
- [ ] **8.1** Implementar StorageService
  ```typescript
  // src/shared/services/storage.service.ts
  // AsyncStorage wrapper con TypeScript
  ```

- [ ] **8.2** Implementar QueueManager
  ```typescript
  // src/features/analytics/services/queue.manager.ts
  // Offline queue con retry exponential backoff
  ```

- [ ] **8.3** TelemetryService principal
  ```typescript
  // src/features/analytics/services/telemetry.service.ts
  // Coordinar collectors, queue, y API calls
  ```

- [ ] **8.4** Testing de recolección
  ```typescript
  // Probar recolección de datos en desarrollo
  // Validar formato y completitud de datos
  ```

---

### **FASE 3: INTEGRACIÓN Y OPTIMIZACIÓN** (3-4 días)

#### 🔗 **Day 9: Integración Backend-Mobile**
- [ ] **9.1** Conectar mobile con backend
  ```typescript
  // Primera prueba de envío de telemetría
  // Validar endpoints y respuestas
  ```

- [ ] **9.2** Implementar batch sending
  ```typescript
  // Enviar eventos cada 30 segundos o 50 eventos
  // Comprimir JSON con gzip si es necesario
  ```

- [ ] **9.3** Testing de autenticación
  ```typescript
  // Probar flow completo: login -> telemetry -> logout
  // Validar headers y tokens
  ```

- [ ] **9.4** Error handling robusto
  ```typescript
  // Manejar errores de red, 401, 429, 500
  // Fallback strategies y logging
  ```

#### ⚡ **Day 10: Performance & Caching**
- [ ] **10.1** Optimizar Redis caching
  ```typescript
  // Implementar cache patterns en analytics endpoints
  // TTL strategy para diferentes tipos de datos
  ```

- [ ] **10.2** Background tasks mobile
  ```typescript
  // Usar background tasks para envío de datos
  // No bloquear UI principal
  ```

- [ ] **10.3** Memory optimization
  ```typescript
  // Limpiar queue después de envío exitoso
  // Límites de memoria para datos pendientes
  ```

- [ ] **10.4** Battery optimization
  ```typescript
  // Reducir frequency en low battery mode
  // Usar wifi preferentemente para uploads
  ```

#### 🔒 **Day 11: Privacidad y Compliance**
- [ ] **11.1** Implementar opt-in/opt-out
  ```typescript
  // UI para configuración de privacidad
  // Respetar tracking transparency iOS
  ```

- [ ] **11.2** Anonimización de datos
  ```typescript
  // Hash de device IDs
  // Remover datos personales automáticamente
  ```

- [ ] **11.3** GDPR compliance
  ```typescript
  // Data retention policies (30 días por defecto)
  // Endpoints para data deletion
  ```

- [ ] **11.4** Auditoría de seguridad
  ```typescript
  // Review de todos los datos recolectados
  // Validar que no hay PII en telemetría
  ```

#### 📊 **Day 12: Dashboard y Monitoring**
- [ ] **12.1** Crear endpoints de analytics admin
  ```typescript
  GET /admin/analytics/summary    // Resumen diario/semanal
  GET /admin/analytics/devices    // Dispositivos activos
  GET /admin/analytics/performance // Métricas de performance
  ```

- [ ] **12.2** Implementar métricas clave
  ```typescript
  // DAU/MAU calculation
  // Session duration averages
  // App start time percentiles
  // Crash rate por versión
  ```

- [ ] **12.3** Sistema de alertas
  ```typescript
  // Alertas por crash rate elevado
  // Alertas por performance degradation
  // Alertas por errores de conectividad
  ```

- [ ] **12.4** Logs estructurados
  ```typescript
  // Logs JSON para análisis posterior
  // Integration con herramientas de monitoring
  ```

---

### **FASE 4: TESTING Y PRODUCCIÓN** (2-3 días)

#### 🧪 **Day 13: Testing Integral**
- [ ] **13.1** Testing E2E mobile
  ```typescript
  // Scenario: Install -> First Launch -> Usage -> Background
  // Validar recolección completa de datos
  ```

- [ ] **13.2** Load testing backend
  ```bash
  # Simular 1000+ dispositivos enviando datos
  # Validar performance de MongoDB y Redis
  ```

- [ ] **13.3** Network failure testing
  ```typescript
  // Probar offline scenarios
  // Validar queue persistence y retry logic
  ```

- [ ] **13.4** Edge cases testing
  ```typescript
  // Low battery, low memory, slow network
  // App kills, force closes, crashes
  ```

#### 🚀 **Day 14-15: Deployment y Monitoring**
- [ ] **14.1** Deploy backend endpoints
  ```bash
  # Verificar que Redis y MongoDB estén optimizados
  # Configurar rate limiting en production
  ```

- [ ] **14.2** Mobile build testing
  ```bash
  # Build para iOS y Android
  # Probar en dispositivos reales
  ```

- [ ] **14.3** Monitoring setup
  ```typescript
  // Dashboard de métricas en tiempo real
  // Alertas automáticas
  ```

- [ ] **14.4** Documentación final
  ```typescript
  // Documentar APIs y flows
  // Guía de troubleshooting
  // Runbook para operaciones
  ```

---

## 🎯 MÉTRICAS DE ÉXITO

### **Performance Targets**
- [ ] **Backend**: < 100ms response time para endpoints de telemetría
- [ ] **Mobile**: < 5MB memoria adicional por telemetría
- [ ] **Redis**: > 95% cache hit rate para analytics
- [ ] **Queue**: < 1% data loss en network failures

### **Data Quality Targets**
- [ ] **Completitud**: > 95% de campos obligatorios completos
- [ ] **Accuracy**: < 1% de datos incorrectos o malformados
- [ ] **Timeliness**: < 30 segundos delay promedio para eventos
- [ ] **Consistency**: Schemas consistentes entre mobile y backend

### **Privacy & Security**
- [ ] **PII**: 0% datos personales en telemetría
- [ ] **Encryption**: 100% de datos transmitidos encriptados
- [ ] **Retention**: Auto-delete después de 30 días
- [ ] **Compliance**: 100% GDPR/CCPA compliant

---

## 🛠️ HERRAMIENTAS Y COMANDOS

### **Desarrollo**
```bash
# Backend development
cd packages/api-nueva
yarn start:dev

# Mobile development
cd packages/mobile-expo
expo start --tunnel

# Redis monitoring
redis-cli monitor

# MongoDB logs
docker logs noticias-mongodb
```

### **Testing**
```bash
# Backend testing
curl -X POST http://localhost:3000/analytics/telemetry \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test", "events": []}'

# Mobile build
expo build:android
expo build:ios
```

### **Monitoring**
```bash
# Redis stats
redis-cli info stats

# MongoDB performance
db.telemetry.getIndexes()
db.telemetry.stats()

# API performance
curl -w "@curl-format.txt" http://localhost:3000/analytics/health
```

---

## 📚 RECURSOS Y REFERENCIAS

### **Documentación**
- [Expo Device](https://docs.expo.dev/versions/latest/sdk/device/)
- [TanStack Query](https://tanstack.com/query/latest)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)

### **Best Practices**
- [Mobile Analytics Privacy](https://www.apple.com/privacy/docs/)
- [GDPR Compliance](https://gdpr.eu/compliance/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Redis Performance](https://redis.io/topics/benchmarks)

---

**📅 Plan creado:** 16 Sept 2025
**🔄 Duración estimada:** 14-15 días
**👤 Para:** Coyotito - Noticias Pachuca Project

**🎯 Resultado esperado:** Sistema completo de telemetría mobile con backend robusto, caching inteligente, y compliance total con privacidad.