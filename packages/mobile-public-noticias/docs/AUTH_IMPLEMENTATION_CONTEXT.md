# 🔐 CONTEXTO: Sistema de Autenticación Mobile - Implementación 2025

## 🎯 OBJETIVO PRINCIPAL
Implementar un sistema de autenticación robusto, seguro y moderno para la app mobile que integre:
- **Backend API NestJS** existente (11 endpoints disponibles)
- **TanStack Query** para estado del servidor
- **Zustand** para estado cliente
- **Almacenamiento seguro** con biometría
- **Auto-refresh** de tokens
- **Arquitectura escalable** siguiendo mejores prácticas 2025

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN COMPLETO

### 🔧 **FASE 1: CONFIGURACIÓN BASE**

#### 📦 **Dependencias y Configuración**
- [ ] **Instalar dependencias de seguridad**
  ```bash
  expo install expo-secure-store expo-local-authentication
  yarn add react-native-encrypted-storage
  ```
- [ ] **Instalar dependencias de estado**
  ```bash
  yarn add zustand @tanstack/react-query-persist-client
  ```
- [ ] **Configurar variables de entorno**
  - [ ] `API_BASE_URL` para desarrollo y producción
  - [ ] `JWT_SECRET_KEY` para validación local (opcional)
  - [ ] `ENABLE_BIOMETRICS` flag de feature

#### ⚙️ **Configuración Inicial**
- [ ] **Configurar TanStack Query Client**
  - [ ] QueryClient con configuración mobile optimizada
  - [ ] Persistencia de cache con AsyncStorage
  - [ ] Error handlers globales para 401/403
- [ ] **Configurar Expo SecureStore**
  - [ ] Configuración de biometría requerida
  - [ ] Fallback a PIN/contraseña
  - [ ] Validación de hardware disponible

---

### 🏗️ **FASE 2: ARQUITECTURA DE TIPOS**

#### 📝 **Tipos del Sistema de Auth**
- [ ] **Definir interfaces del API (namespace API)**
  ```typescript
  // API.User, API.LoginRequest, API.LoginResponse, etc.
  ```
- [ ] **Definir interfaces de la App (namespace App)**
  ```typescript
  // App.User, App.LoginCredentials, App.TokenPair, etc.
  ```
- [ ] **Crear tipos de configuración**
  ```typescript
  // AuthConfig, TokenConfig, BiometricConfig
  ```
- [ ] **Definir tipos de errores**
  ```typescript
  // AuthError, TokenError, BiometricError
  ```

#### 🔄 **Mappers Bidireccionales**
- [ ] **UserMapper**: API.User ↔ App.User
- [ ] **AuthMapper**: API auth responses ↔ App auth models
- [ ] **TokenMapper**: API tokens ↔ App token models
- [ ] **ErrorMapper**: API errors ↔ App friendly errors

---

### 🛡️ **FASE 3: SEGURIDAD Y ALMACENAMIENTO**

#### 🔐 **TokenManager Service**
- [ ] **Implementar almacenamiento seguro**
  - [ ] Access Token → EncryptedStorage (15 min TTL)
  - [ ] Refresh Token → SecureStore + biometría (7 días TTL)
  - [ ] Device ID → AsyncStorage (persistente)
- [ ] **Validación de tokens**
  - [ ] Verificar expiración JWT local
  - [ ] Validar formato y estructura
  - [ ] Auto-cleanup de tokens expirados
- [ ] **Rotación de tokens**
  - [ ] Lógica de refresh automático
  - [ ] Manejo de refresh token expirado
  - [ ] Invalidación en logout

#### 🔒 **BiometricManager Service**
- [ ] **Detección de capacidades**
  - [ ] Verificar hardware biométrico disponible
  - [ ] Detectar tipos soportados (Face ID, Touch ID, etc.)
  - [ ] Verificar enrollment del usuario
- [ ] **Autenticación biométrica**
  - [ ] Prompt personalizado por plataforma
  - [ ] Fallback a PIN/contraseña
  - [ ] Manejo de errores y cancelaciones
- [ ] **Configuración de usuario**
  - [ ] Habilitar/deshabilitar biometría
  - [ ] Preferencias de autenticación
  - [ ] Reset en cambio de biometría

---

### 🌐 **FASE 4: CLIENTE HTTP Y API**

#### ⚡ **ApiClient Service - ÚNICO CLIENTE HTTP**
- [ ] **Configuración base Axios (Cliente único para toda la app)**
  - [ ] Base URL dinámica (dev/prod)
  - [ ] Timeout configurables
  - [ ] Headers por defecto (`x-platform: mobile`)
  - [ ] **IMPORTANTE: Este será el ÚNICO cliente HTTP usado en toda la app**
- [ ] **Request Interceptors**
  - [ ] Agregar Bearer token automáticamente
  - [ ] Agregar device ID a requests
  - [ ] Logging de requests (solo desarrollo)
- [ ] **Response Interceptors**
  - [ ] Auto-refresh en 401 (solo una vez simultánea)
  - [ ] Manejo de errores de red
  - [ ] Logout automático en errores críticos
- [ ] **Retry Logic**
  - [ ] Exponential backoff
  - [ ] Máximo de reintentos por tipo de error
  - [ ] Evitar retry en errores 400/401/403
- [ ] **Helpers y utilidades para el cliente existente**
  - [ ] Helper para GET requests
  - [ ] Helper para POST requests
  - [ ] Helper para PUT/PATCH requests
  - [ ] Helper para DELETE requests
  - [ ] Helper para upload de archivos

#### 🔗 **AuthService**
- [ ] **Implementar todos los endpoints del backend**
  - [ ] `POST /auth/login` - Login con email/username
  - [ ] `POST /auth/register` - Registro completo
  - [ ] `POST /auth/refresh` - Renovar tokens
  - [ ] `POST /auth/logout` - Logout del dispositivo
  - [ ] `POST /auth/logout-all` - Logout todos los dispositivos
  - [ ] `GET /auth/me` - Perfil del usuario
  - [ ] `POST /auth/change-password` - Cambiar contraseña
  - [ ] `POST /auth/forgot-password` - Solicitar reset
  - [ ] `POST /auth/reset-password` - Reset con token
  - [ ] `POST /auth/verify-email` - Verificar email
- [ ] **Manejo de dispositivos**
  - [ ] Enviar deviceId en todas las requests
  - [ ] Recopilar device info (OS, modelo, etc.)
  - [ ] Platform detection automática
- [ ] **Validaciones locales**
  - [ ] Validar formato de email
  - [ ] Validar fortaleza de contraseña
  - [ ] Validar disponibilidad de username

---

### 📊 **FASE 5: GESTIÓN DE ESTADO**

#### 🏪 **AuthStore (Zustand)**
- [ ] **Estado del usuario autenticado**
  ```typescript
  interface AuthState {
    user: App.User | null
    isAuthenticated: boolean
    isInitialized: boolean
    authMethod: 'password' | 'biometric' | null
  }
  ```
- [ ] **Acciones de autenticación**
  - [ ] `setUser(user)` - Establecer usuario
  - [ ] `logout()` - Limpiar estado y tokens
  - [ ] `reset()` - Reset completo del estado
  - [ ] `setAuthMethod(method)` - Método usado
- [ ] **Persistencia del estado**
  - [ ] Persistir solo datos no sensibles
  - [ ] Hydratación desde storage al iniciar
  - [ ] Limpieza automática en logout

#### 🗃️ **AppStore (Zustand)**
- [ ] **Estado de la aplicación**
  ```typescript
  interface AppState {
    isFirstLaunch: boolean
    biometricsEnabled: boolean
    selectedLanguage: string
    theme: 'light' | 'dark' | 'auto'
    notificationsEnabled: boolean
  }
  ```
- [ ] **Configuraciones de usuario**
  - [ ] Preferencias de autenticación
  - [ ] Configuraciones de seguridad
  - [ ] Preferencias de UI/UX

---

### 🎣 **FASE 6: HOOKS PERSONALIZADOS**

#### 🔐 **useAuth Hook**
- [ ] **Funcionalidades principales**
  - [ ] `login(credentials)` - Login con credenciales
  - [ ] `loginWithBiometrics()` - Login biométrico
  - [ ] `register(userData)` - Registro completo
  - [ ] `logout(allDevices?)` - Logout con opciones
  - [ ] `changePassword(data)` - Cambio de contraseña
- [ ] **Estado reactivo**
  - [ ] `user` - Usuario actual
  - [ ] `isAuthenticated` - Estado de auth
  - [ ] `isLoading` - Estado de carga
  - [ ] `error` - Errores de autenticación
- [ ] **Integraciones**
  - [ ] TanStack Query para mutations
  - [ ] Zustand para estado local
  - [ ] Biometric service integrado

#### 🔒 **useBiometric Hook**
- [ ] **Capacidades biométricas**
  - [ ] `isSupported` - Hardware disponible
  - [ ] `isEnrolled` - Usuario configurado
  - [ ] `canUseBiometrics` - Listo para usar
  - [ ] `biometricType` - Tipo disponible
- [ ] **Autenticación**
  - [ ] `authenticate()` - Trigger biométrico
  - [ ] `enableBiometrics()` - Configurar por primera vez
  - [ ] `disableBiometrics()` - Deshabilitar feature

#### 🎯 **useAuthQueries Hook**
- [ ] **Queries relacionadas**
  - [ ] `useUserProfile()` - Perfil completo
  - [ ] `useUserSessions()` - Sesiones activas
  - [ ] `useSecuritySettings()` - Configuraciones
- [ ] **Invalidaciones inteligentes**
  - [ ] Refresh automático post-login
  - [ ] Limpieza post-logout
  - [ ] Sincronización cross-tabs (si aplica)

---

### 🎨 **FASE 7: COMPONENTES DE UI**

#### 📱 **Pantallas de Autenticación**
- [ ] **LoginScreen**
  - [ ] Formulario email/password
  - [ ] Botón biométrico (si disponible)
  - [ ] Link a registro y forgot password
  - [ ] Manejo de errores inline
- [ ] **RegisterScreen**
  - [ ] Formulario completo con validaciones
  - [ ] Verificación de email/username disponible
  - [ ] Términos y condiciones
  - [ ] Confirmación de password
- [ ] **ForgotPasswordScreen**
  - [ ] Input de email
  - [ ] Envío de código/link
  - [ ] Estados de loading y éxito
- [ ] **BiometricSetupScreen**
  - [ ] Explicación de beneficios
  - [ ] Configuración inicial
  - [ ] Testing de funcionalidad

#### 🧩 **Componentes Reutilizables**
- [ ] **BiometricButton**
  - [ ] Icono dinámico según tipo
  - [ ] Estados loading/disabled
  - [ ] Animaciones de feedback
- [ ] **AuthForm**
  - [ ] Validaciones en tiempo real
  - [ ] Accessibility completo
  - [ ] Responsive design
- [ ] **SecureInput**
  - [ ] Toggle password visibility
  - [ ] Strength indicator
  - [ ] Copy/paste protections
- [ ] **AuthGuard**
  - [ ] HOC para proteger rutas
  - [ ] Redirección inteligente
  - [ ] Loading states

---

### 🔄 **FASE 8: FLUJOS DE AUTENTICACIÓN**

#### 🚀 **Inicialización de la App**
- [ ] **App startup sequence**
  1. [ ] Verificar tokens en storage
  2. [ ] Validar access token
  3. [ ] Auto-refresh si es necesario
  4. [ ] Cargar usuario si auth válida
  5. [ ] Decidir pantalla inicial
- [ ] **Hydratación de estado**
  - [ ] Sincronizar Zustand stores
  - [ ] Inicializar TanStack Query
  - [ ] Configurar biometric availability

#### 🔐 **Flujo de Login**
- [ ] **Login tradicional**
  1. [ ] Validar credenciales localmente
  2. [ ] Enviar request al backend
  3. [ ] Almacenar tokens securely
  4. [ ] Actualizar estado global
  5. [ ] Invalidar queries relacionadas
  6. [ ] Navegar a pantalla principal
- [ ] **Login biométrico**
  1. [ ] Verificar disponibilidad biométrica
  2. [ ] Trigger autenticación biométrica
  3. [ ] Recuperar tokens de SecureStore
  4. [ ] Validar tokens recuperados
  5. [ ] Auto-refresh si es necesario
  6. [ ] Actualizar estado y navegar

#### 📝 **Flujo de Registro**
- [ ] **Registro completo**
  1. [ ] Validaciones progresivas
  2. [ ] Verificar disponibilidad email/username
  3. [ ] Crear cuenta en backend
  4. [ ] Auto-login post-registro
  5. [ ] Configurar biometría (opcional)
  6. [ ] Onboarding inicial

#### 🚪 **Flujo de Logout**
- [ ] **Logout local**
  1. [ ] Notificar al backend
  2. [ ] Limpiar tokens de storage
  3. [ ] Reset estado global
  4. [ ] Limpiar cache de queries
  5. [ ] Navegar a login
- [ ] **Logout de todos los dispositivos**
  1. [ ] Request al endpoint logout-all
  2. [ ] Manejo de errors gracefully
  3. [ ] Limpieza local completa

---

### 🛡️ **FASE 9: SEGURIDAD AVANZADA**

#### 🔒 **Protecciones adicionales**
- [ ] **Detección de root/jailbreak**
  - [ ] Verificar integridad del dispositivo
  - [ ] Warning al usuario si detectado
  - [ ] Restricciones opcionales
- [ ] **Certificate pinning**
  - [ ] Validar certificados SSL
  - [ ] Prevenir man-in-the-middle
- [ ] **Ofuscación de código**
  - [ ] Proteger lógica sensible
  - [ ] Evitar reverse engineering
- [ ] **Rate limiting local**
  - [ ] Límites de intentos de login
  - [ ] Backoff exponencial
  - [ ] Bloqueo temporal

#### 📊 **Logging y monitoreo**
- [ ] **Logs de autenticación**
  - [ ] Login attempts (success/failure)
  - [ ] Token refresh events
  - [ ] Biometric usage
  - [ ] Security events
- [ ] **Métricas para analytics**
  - [ ] Tiempo de login
  - [ ] Métodos de auth preferidos
  - [ ] Errores frecuentes
  - [ ] Dispositivos únicos

---

### 🚀 **FASE 10: OPTIMIZACIÓN Y PERFORMANCE**

#### ⚡ **Optimizaciones de rendimiento**
- [ ] **Lazy loading**
  - [ ] Componentes de auth bajo demanda
  - [ ] Screens de auth code-splitting
- [ ] **Memoización estratégica**
  - [ ] Hooks computados costosos
  - [ ] Componentes con re-renders frecuentes
- [ ] **Cache inteligente**
  - [ ] User profile cache
  - [ ] Device info cache
  - [ ] Biometric availability cache

#### 📦 **Bundle optimization**
- [ ] **Tree shaking**
  - [ ] Eliminar código no usado
  - [ ] Optimizar imports
- [ ] **Compression**
  - [ ] Optimizar assets
  - [ ] Minimizar bundle size

---

### 📚 **FASE 11: DOCUMENTACIÓN**

#### 📖 **Documentación técnica**
- [ ] **API documentation**
  - [ ] Interfaces y tipos
  - [ ] Ejemplos de uso
  - [ ] Error codes
- [ ] **Architecture decision records**
  - [ ] Decisiones de diseño
  - [ ] Trade-offs considerados
  - [ ] Alternativas evaluadas
- [ ] **Security documentation**
  - [ ] Threat model
  - [ ] Security measures
  - [ ] Best practices

#### 👥 **Documentación para desarrolladores**
- [ ] **Setup guide**
  - [ ] Configuración inicial
  - [ ] Variables de entorno
  - [ ] Dependencias
- [ ] **Usage examples**
  - [ ] Patrones comunes
  - [ ] Casos de uso típicos
  - [ ] Troubleshooting

---

## 🎯 **RESULTADO ESPERADO**

### ✅ **Sistema Completo que Incluye:**
1. **🔐 Autenticación robusta** con 11 endpoints integrados
2. **🛡️ Almacenamiento ultra-seguro** con biometría
3. **⚡ Performance optimizada** con TanStack Query + Zustand
4. **🎨 UI/UX moderna** siguiendo mejores prácticas
5. **🧪 Testing comprehensivo** con cobertura alta
6. **📱 Compatibilidad total** iOS/Android
7. **🔄 Auto-refresh inteligente** de tokens
8. **📊 Logging y analytics** integrados
9. **🎯 TypeScript estricto** sin `any`
10. **📚 Documentación completa** para mantenimiento

### 🚀 **Beneficios Clave:**
- **Seguridad de grado empresarial** con múltiples capas
- **Experiencia de usuario fluida** con biometría
- **Arquitectura escalable** para crecimiento futuro
- **Mantenibilidad alta** con código bien estructurado
- **Performance óptima** para dispositivos móviles
- **Compliance** con estándares de seguridad 2025

---

*🎯 CONTEXTO: Sistema de Auth Mobile 2025 | Listo, Coyotito. ¿Empezamos con la Fase 1?*