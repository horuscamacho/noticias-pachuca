# 🎯 Sistema de Tipos Universal Socket.IO 2025
## Backend ↔ Frontend Type-Safe Communication

---

## 📋 Estructura del Sistema de Tipos

```
shared-types/
├── socket/
│   ├── events.ts           // Eventos Socket.IO unificados
│   ├── notifications.ts    // Tipos de notificaciones
│   ├── rooms.ts           // Tipos de salas/rooms
│   ├── auth.ts            // Tipos de autenticación
│   └── responses.ts       // Tipos de respuestas
├── backend/
│   ├── socket-server.ts   // Tipos específicos del servidor
│   └── gateway.ts         // Gateway types
├── frontend/
│   ├── socket-client.ts   // Tipos específicos del cliente
│   └── hooks.ts           // Hook types
└── utils/
    ├── validators.ts      // Validadores de tipos
    └── type-guards.ts     // Type guards
```

---

## 🎯 Eventos Socket.IO Unificados

### **📁 `shared-types/socket/events.ts`**

```typescript
/**
 * 🎯 EVENTOS UNIVERSALES SOCKET.IO
 *
 * Este archivo define TODOS los eventos que pueden ocurrir
 * entre frontend y backend. Mantén sincronizado entre proyectos.
 */

// ═══════════════════════════════════════════════════════════════
// 🔵 EVENTOS: SERVIDOR → CLIENTE
// ═══════════════════════════════════════════════════════════════

export interface ServerToClientEvents {
  // ✅ CONEXIÓN Y SESIÓN
  /**
   * Confirmación de conexión establecida
   */
  connected: (data: {
    sessionId: string;
    platform: 'web' | 'mobile' | 'api';
    timestamp: string;
    serverVersion: string;
    features: string[];
  }) => void;

  /**
   * Información de la sesión actualizada
   */
  'session:updated': (session: {
    id: string;
    userId: string;
    platform: 'web' | 'mobile' | 'api';
    deviceId: string;
    lastSeen: string;
    isActive: boolean;
  }) => void;

  // 🔔 NOTIFICACIONES
  /**
   * Nueva notificación recibida
   */
  notification: (notification: UniversalNotification) => void;

  /**
   * Lista de notificaciones pendientes
   */
  'notification:pending-list': (notifications: UniversalNotification[]) => void;

  /**
   * Confirmación de notificación marcada como leída
   */
  'notification:marked-read': (data: {
    notificationId: string;
    timestamp: string;
  }) => void;

  /**
   * Todas las notificaciones marcadas como leídas
   */
  'notification:all-marked-read': (data: {
    count: number;
    timestamp: string;
  }) => void;

  // 👤 USUARIO Y ESTADO
  /**
   * Estado de usuario actualizado
   */
  'user:status': (status: UserStatus) => void;

  /**
   * Usuario escribiendo en tiempo real
   */
  'user:typing': (data: TypingIndicator) => void;

  /**
   * Perfil de usuario actualizado
   */
  'user:profile-updated': (user: UserProfile) => void;

  /**
   * Preferencias de usuario actualizadas
   */
  'user:preferences-updated': (preferences: UserPreferences) => void;

  // 🏠 SALAS Y ROOMS
  /**
   * Usuario se unió a una sala
   */
  'room:user-joined': (data: RoomEvent) => void;

  /**
   * Usuario salió de una sala
   */
  'room:user-left': (data: RoomEvent) => void;

  /**
   * Mensaje en sala específica
   */
  'room:message': (message: RoomMessage) => void;

  /**
   * Lista de miembros de la sala
   */
  'room:members': (data: RoomMembersData) => void;

  /**
   * Configuración de sala actualizada
   */
  'room:config-updated': (config: RoomConfig) => void;

  // 📊 MÉTRICAS Y ANALYTICS
  /**
   * Métrica del dashboard actualizada
   */
  'metric:updated': (metric: DashboardMetric) => void;

  /**
   * Múltiples métricas actualizadas
   */
  'metrics:batch-update': (metrics: DashboardMetric[]) => void;

  /**
   * Datos de analytics actualizados
   */
  'analytics:updated': (data: AnalyticsData) => void;

  // ⚠️ SISTEMA Y ALERTAS
  /**
   * Alerta del sistema
   */
  'system:alert': (alert: SystemAlert) => void;

  /**
   * Mantenimiento programado
   */
  'system:maintenance': (maintenance: MaintenanceInfo) => void;

  /**
   * Configuración del sistema actualizada
   */
  'system:config-updated': (config: SystemConfig) => void;

  /**
   * Estado del servidor actualizado
   */
  'system:status': (status: ServerStatus) => void;

  // 📱 ESTADO DE APLICACIÓN
  /**
   * Confirmación de cambio de estado de app
   */
  'app-state-updated': (data: {
    success: boolean;
    appState: 'foreground' | 'background';
    deviceId: string;
    timestamp: string;
  }) => void;

  /**
   * Confirmación de token push actualizado
   */
  'push-token-updated': (data: {
    success: boolean;
    deviceId: string;
    timestamp: string;
  }) => void;

  // 🎮 EVENTOS DE COLABORACIÓN
  /**
   * Documento colaborativo actualizado
   */
  'collab:document-updated': (document: CollaborativeDocument) => void;

  /**
   * Cursor de usuario en documento colaborativo
   */
  'collab:cursor-moved': (cursor: CursorPosition) => void;

  /**
   * Selección de texto en documento colaborativo
   */
  'collab:selection-changed': (selection: TextSelection) => void;

  // ❌ ERRORES Y ESTADOS
  /**
   * Error del servidor
   */
  error: (error: SocketError) => void;

  /**
   * Información de ping/pong
   */
  pong: (data: {
    timestamp: number;
    serverTime: string;
  }) => void;

  /**
   * Evento genérico para extensibilidad
   */
  'custom:event': (data: CustomEventData) => void;
}

// ═══════════════════════════════════════════════════════════════
// 🔴 EVENTOS: CLIENTE → SERVIDOR
// ═══════════════════════════════════════════════════════════════

export interface ClientToServerEvents {
  // 🏠 MANEJO DE SALAS
  /**
   * Unirse a una sala
   */
  'room:join': (roomId: string, password?: string) => void;

  /**
   * Salir de una sala
   */
  'room:leave': (roomId: string) => void;

  /**
   * Enviar mensaje a sala
   */
  'room:send-message': (data: {
    roomId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, any>;
  }) => void;

  /**
   * Verificar acceso a sala
   */
  'room:check-access': (
    roomId: string,
    callback: (response: { hasAccess: boolean; reason?: string }) => void
  ) => void;

  /**
   * Obtener lista de salas disponibles
   */
  'room:list-available': (
    callback: (rooms: RoomInfo[]) => void
  ) => void;

  // 💬 COMUNICACIÓN EN TIEMPO REAL
  /**
   * Indicar que el usuario está escribiendo
   */
  'typing:start': (data: {
    roomId: string;
    context?: 'chat' | 'document' | 'comment';
  }) => void;

  /**
   * Indicar que el usuario dejó de escribir
   */
  'typing:stop': (data: {
    roomId: string;
    context?: 'chat' | 'document' | 'comment';
  }) => void;

  // 📱 ESTADO DE APLICACIÓN
  /**
   * Cambiar estado de la aplicación
   */
  'app-state:change': (data: {
    appState: 'foreground' | 'background';
    deviceId?: string;
    platform?: 'web' | 'mobile';
  }) => void;

  /**
   * Actualizar token de push notifications
   */
  'push-token:update': (data: {
    expoPushToken: string;
    deviceId?: string;
    platform?: 'mobile';
  }) => void;

  /**
   * Reportar posición geográfica (opcional)
   */
  'location:update': (location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  }) => void;

  // 🔔 NOTIFICACIONES
  /**
   * Marcar notificación como leída
   */
  'notification:mark-read': (notificationId: string) => void;

  /**
   * Marcar todas las notificaciones como leídas
   */
  'notification:mark-all-read': () => void;

  /**
   * Obtener notificaciones pendientes
   */
  'notification:get-pending': (
    filter?: {
      type?: string;
      limit?: number;
      since?: string;
    }
  ) => void;

  /**
   * Actualizar preferencias de notificación
   */
  'notification:update-preferences': (preferences: NotificationPreferences) => void;

  // 📊 TRACKING Y ANALYTICS
  /**
   * Rastrear evento personalizado
   */
  'analytics:track': (event: {
    name: string;
    properties?: Record<string, any>;
    timestamp?: string;
    sessionId?: string;
  }) => void;

  /**
   * Reportar tiempo en página
   */
  'analytics:page-time': (data: {
    page: string;
    timeSpent: number;
    interactions: number;
  }) => void;

  /**
   * Reportar error del frontend
   */
  'analytics:error': (error: {
    message: string;
    stack?: string;
    url: string;
    timestamp: string;
    userAgent: string;
  }) => void;

  // 🎮 COLABORACIÓN
  /**
   * Actualizar documento colaborativo
   */
  'collab:update-document': (update: {
    documentId: string;
    operations: DocumentOperation[];
    version: number;
  }) => void;

  /**
   * Mover cursor en documento
   */
  'collab:move-cursor': (cursor: {
    documentId: string;
    position: CursorPosition;
    userId: string;
  }) => void;

  /**
   * Cambiar selección de texto
   */
  'collab:change-selection': (selection: {
    documentId: string;
    range: TextSelection;
    userId: string;
  }) => void;

  // 🛠️ UTILIDADES
  /**
   * Ping manual para verificar latencia
   */
  ping: (timestamp?: number) => void;

  /**
   * Solicitar información del servidor
   */
  'server:info': (
    callback: (info: {
      version: string;
      uptime: number;
      connectedUsers: number;
      features: string[];
    }) => void
  ) => void;

  /**
   * Heartbeat para mantener conexión viva
   */
  heartbeat: () => void;

  /**
   * Evento personalizado genérico
   */
  'custom:emit': (data: {
    event: string;
    payload: any;
    target?: 'broadcast' | 'room' | 'user';
    targetId?: string;
  }) => void;
}

// ═══════════════════════════════════════════════════════════════
// 🟣 EVENTOS INTER-SERVIDOR (Scaling)
// ═══════════════════════════════════════════════════════════════

export interface InterServerEvents {
  /**
   * Broadcast a usuario específico en cualquier servidor
   */
  'user:broadcast': (data: {
    userId: string;
    event: keyof ServerToClientEvents;
    payload: any;
    excludeServerId?: string;
  }) => void;

  /**
   * Broadcast a sala específica en cualquier servidor
   */
  'room:broadcast': (data: {
    roomId: string;
    event: keyof ServerToClientEvents;
    payload: any;
    excludeUserId?: string;
    excludeServerId?: string;
  }) => void;

  /**
   * Sincronizar estado entre servidores
   */
  'server:sync-state': (state: {
    type: 'user' | 'room' | 'metric';
    id: string;
    data: any;
    version: number;
  }) => void;

  /**
   * Notificar servidor sobre eventos críticos
   */
  'server:critical-event': (event: {
    type: 'error' | 'maintenance' | 'overload';
    serverId: string;
    message: string;
    timestamp: string;
  }) => void;
}

// ═══════════════════════════════════════════════════════════════
// 📊 DATOS DEL SOCKET
// ═══════════════════════════════════════════════════════════════

export interface SocketData {
  userId: string;
  platform: 'web' | 'mobile' | 'api';
  deviceId: string;
  sessionId: string;
  rooms: string[];
  permissions: string[];
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: {
      country?: string;
      city?: string;
    };
    device?: {
      os?: string;
      version?: string;
      model?: string;
      brand?: string;
    };
  };
}
```

---

## 🔔 Tipos de Notificaciones

### **📁 `shared-types/socket/notifications.ts`**

```typescript
/**
 * 🔔 SISTEMA UNIVERSAL DE NOTIFICACIONES
 */

export type NotificationType =
  | 'breaking_news'
  | 'new_article'
  | 'daily_digest'
  | 'subscription_expiry'
  | 'comment_reply'
  | 'mention'
  | 'like'
  | 'follow'
  | 'system_alert'
  | 'maintenance'
  | 'security'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryMethod = 'socket' | 'push' | 'email' | 'sms' | 'auto';

export interface UniversalNotification {
  // Identificación
  id: string;
  type: NotificationType;

  // Contenido
  title: string;
  body: string;
  summary?: string; // Para vista condensada

  // Metadatos
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  iconUrl?: string;

  // Configuración
  priority: NotificationPriority;
  category?: string;
  tags?: string[];

  // Estado
  read: boolean;
  delivered: boolean;
  deliveryMethod: DeliveryMethod;

  // Temporal
  timestamp: string;
  expiresAt?: string;
  scheduledFor?: string;

  // Origen
  senderId?: string;
  senderName?: string;
  source: 'system' | 'user' | 'automated' | 'external';

  // Tracking
  delivered_via: 'socket' | 'push' | 'email' | 'sms';
  clicks: number;

  // Localización
  locale?: string;
  timezone?: string;
}

export interface NotificationPreferences {
  // Global
  enabled: boolean;

  // Por tipo
  types: Record<NotificationType, {
    enabled: boolean;
    methods: DeliveryMethod[];
    sound: boolean;
    vibration: boolean;
    led: boolean;
  }>;

  // Por método
  delivery: {
    socket: {
      enabled: boolean;
      showToast: boolean;
      playSound: boolean;
    };
    push: {
      enabled: boolean;
      sound: boolean;
      badge: boolean;
      banner: boolean;
    };
    email: {
      enabled: boolean;
      digest: boolean;
      immediate: boolean;
    };
  };

  // Horarios
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
    timezone: string;
    exceptions: NotificationType[];
  };

  // Filtros
  filters: {
    keywords: string[];
    blockedSenders: string[];
    minimumPriority: NotificationPriority;
  };
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  title: string;
  body: string;
  variables: string[];
  defaultData?: Record<string, any>;
  locales: Record<string, {
    title: string;
    body: string;
  }>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  lastRead?: string;
  lastReceived?: string;
}
```

---

## 🏠 Tipos de Salas/Rooms

### **📁 `shared-types/socket/rooms.ts`**

```typescript
/**
 * 🏠 SISTEMA UNIVERSAL DE SALAS
 */

export type RoomType =
  | 'public'
  | 'private'
  | 'direct_message'
  | 'group_chat'
  | 'announcement'
  | 'collaboration'
  | 'support'
  | 'system';

export type RoomPermission =
  | 'read'
  | 'write'
  | 'moderate'
  | 'admin'
  | 'invite'
  | 'kick'
  | 'ban';

export interface RoomInfo {
  id: string;
  name: string;
  description?: string;
  type: RoomType;

  // Configuración
  isPublic: boolean;
  requiresPassword: boolean;
  maxMembers?: number;

  // Estado
  memberCount: number;
  isActive: boolean;
  lastActivity: string;

  // Metadatos
  tags?: string[];
  category?: string;
  language?: string;

  // Permisos
  defaultPermissions: RoomPermission[];

  // Temporal
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface RoomConfig {
  // Configuración básica
  name: string;
  description?: string;
  topic?: string;

  // Acceso
  isPublic: boolean;
  password?: string;
  inviteOnly: boolean;

  // Límites
  maxMembers?: number;
  messageLimit?: number;
  fileSizeLimit?: number;

  // Moderación
  moderationEnabled: boolean;
  autoModeration: boolean;
  bannedWords: string[];

  // Características
  features: {
    fileSharing: boolean;
    videoCall: boolean;
    screenShare: boolean;
    polls: boolean;
    reactions: boolean;
    threading: boolean;
  };

  // Retención
  messageRetention?: number; // días
  fileRetention?: number;    // días
}

export interface RoomMember {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;

  // Estado
  isOnline: boolean;
  lastSeen: string;
  joinedAt: string;

  // Permisos
  permissions: RoomPermission[];
  role?: string;

  // Actividad
  messageCount: number;
  lastMessage?: string;

  // Estado temporal
  isTyping: boolean;
  currentActivity?: 'typing' | 'recording' | 'uploading';
}

export interface RoomMembersData {
  roomId: string;
  members: RoomMember[];
  totalCount: number;
  onlineCount: number;
  moderators: string[];
  admins: string[];
}

export interface RoomMessage {
  id: string;
  roomId: string;

  // Autor
  userId: string;
  username: string;
  userAvatar?: string;

  // Contenido
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'poll' | 'call';

  // Archivos adjuntos
  attachments?: MessageAttachment[];

  // Metadatos
  edited: boolean;
  editedAt?: string;

  // Interacciones
  reactions: MessageReaction[];
  replies: RoomMessage[];
  mentions: string[];

  // Temporal
  timestamp: string;

  // Threading
  threadId?: string;
  parentId?: string;

  // Moderación
  flagged: boolean;
  hidden: boolean;
  deletedBy?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  filename: string;
  size: number;
  mimeType?: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  timestamp: string;
}

export interface RoomEvent {
  roomId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  action: 'joined' | 'left' | 'invited' | 'kicked' | 'banned' | 'promoted' | 'demoted';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
  context?: 'chat' | 'document' | 'comment';
  timestamp: string;
}

export interface RoomInvitation {
  id: string;
  roomId: string;
  roomName: string;

  // Invitación
  invitedBy: string;
  invitedUser?: string; // null para invitaciones por enlace

  // Estado
  status: 'pending' | 'accepted' | 'declined' | 'expired';

  // Configuración
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;

  // Metadatos
  message?: string;
  permissions?: RoomPermission[];

  // Temporal
  createdAt: string;
  usedAt?: string;
}
```

---

## 🔐 Tipos de Autenticación

### **📁 `shared-types/socket/auth.ts`**

```typescript
/**
 * 🔐 SISTEMA UNIVERSAL DE AUTENTICACIÓN
 */

export type Platform = 'web' | 'mobile' | 'api' | 'desktop';

export type UserRole = 'guest' | 'user' | 'moderator' | 'admin' | 'system';

export type AppState = 'foreground' | 'background' | 'inactive';

export interface AuthSession {
  id: string;
  userId: string;

  // Dispositivo
  deviceId: string;
  platform: Platform;
  userAgent?: string;

  // Ubicación
  ipAddress: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };

  // Estado
  isActive: boolean;
  appState: AppState;
  lastSeen: string;

  // Socket
  socketId?: string;

  // Push notifications
  expoPushToken?: string;
  fcmToken?: string;
  apnsToken?: string;

  // Metadatos
  deviceInfo?: DeviceInfo;
  browserInfo?: BrowserInfo;

  // Seguridad
  permissions: string[];
  scopes: string[];

  // Temporal
  createdAt: string;
  expiresAt: string;
}

export interface DeviceInfo {
  os?: string;
  osVersion?: string;
  model?: string;
  brand?: string;
  manufacturer?: string;
  isTablet?: boolean;

  // Capacidades
  hasCamera?: boolean;
  hasBiometric?: boolean;
  hasNFC?: boolean;

  // Configuración
  language?: string;
  timezone?: string;
  isDarkMode?: boolean;
}

export interface BrowserInfo {
  name?: string;
  version?: string;
  engine?: string;

  // Capacidades
  cookiesEnabled?: boolean;
  javaEnabled?: boolean;
  onlineStatus?: boolean;

  // Pantalla
  screenWidth?: number;
  screenHeight?: number;
  colorDepth?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;

  // Información personal
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;

  // Estado
  isOnline: boolean;
  lastSeen: string;
  status?: 'available' | 'busy' | 'away' | 'invisible';
  statusMessage?: string;

  // Configuración
  role: UserRole;
  permissions: string[];

  // Preferencias
  preferences: UserPreferences;

  // Estadísticas
  stats: UserStats;

  // Temporal
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserPreferences {
  // Idioma y región
  language: string;
  timezone: string;
  dateFormat: string;

  // Tema
  theme: 'light' | 'dark' | 'auto';

  // Notificaciones
  notifications: NotificationPreferences;

  // Privacidad
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
    allowMentions: boolean;
  };

  // Chat
  chat: {
    enterToSend: boolean;
    showTypingIndicator: boolean;
    groupMessagesBy: 'user' | 'time' | 'none';
    fontSize: 'small' | 'medium' | 'large';
  };

  // Colaboración
  collaboration: {
    showCursors: boolean;
    showSelections: boolean;
    autoSave: boolean;
    conflictResolution: 'manual' | 'auto';
  };
}

export interface UserStats {
  // Actividad
  totalSessions: number;
  totalOnlineTime: number; // minutos
  messagesCount: number;
  roomsJoined: number;

  // Métricas
  averageSessionDuration: number;
  lastActiveRooms: string[];

  // Engagement
  reactionsGiven: number;
  reactionsReceived: number;
  mentionsCount: number;

  // Colaboración
  documentsEdited: number;
  collaborationTime: number;
}

export interface UserStatus {
  userId: string;
  username: string;

  // Estado actual
  isOnline: boolean;
  status: 'available' | 'busy' | 'away' | 'invisible';
  statusMessage?: string;

  // Actividad
  lastSeen: string;
  currentActivity?: string;
  currentRoom?: string;

  // Dispositivos
  activeDevices: number;
  platforms: Platform[];

  // Ubicación (si permitido)
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface AuthToken {
  // JWT
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';

  // Scope y permisos
  scope: string[];
  permissions: string[];

  // Temporal
  expiresIn: number;
  expiresAt: string;
  issuedAt: string;

  // Metadatos
  issuer: string;
  audience: string;
  subject: string; // userId
}
```

---

## 📊 Tipos de Métricas y Analytics

### **📁 `shared-types/socket/metrics.ts`**

```typescript
/**
 * 📊 SISTEMA UNIVERSAL DE MÉTRICAS
 */

export type MetricType =
  | 'counter'
  | 'gauge'
  | 'histogram'
  | 'summary'
  | 'rate';

export type MetricCategory =
  | 'dashboard'
  | 'analytics'
  | 'system'
  | 'business'
  | 'user'
  | 'performance';

export interface DashboardMetric {
  // Identificación
  key: string;
  name: string;
  description?: string;

  // Datos
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changePercent?: number;

  // Configuración
  type: MetricType;
  category: MetricCategory;
  unit?: string;

  // Visualización
  format?: 'number' | 'percentage' | 'currency' | 'bytes' | 'duration';
  precision?: number;

  // Estado
  status?: 'normal' | 'warning' | 'critical' | 'unknown';
  threshold?: {
    warning?: number;
    critical?: number;
  };

  // Temporal
  timestamp: string;
  period?: string; // '1h', '24h', '7d', '30d'

  // Metadatos
  tags?: Record<string, string>;
  source?: string;

  // Tendencia
  trend?: 'up' | 'down' | 'stable';
  sparkline?: number[];
}

export interface AnalyticsData {
  // Tráfico
  traffic: {
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: number;
  };

  // Usuarios
  users: {
    active: number;
    new: number;
    returning: number;
    online: number;

    // Demografía
    byCountry: Record<string, number>;
    byDevice: Record<string, number>;
    byBrowser: Record<string, number>;
  };

  // Contenido
  content: {
    totalArticles: number;
    publishedToday: number;
    totalViews: number;
    avgReadTime: number;

    // Popular
    topArticles: Array<{
      id: string;
      title: string;
      views: number;
      shares: number;
    }>;
  };

  // Engagement
  engagement: {
    comments: number;
    likes: number;
    shares: number;
    subscriptions: number;

    // Social
    socialShares: Record<string, number>;
    commentEngagement: number;
  };

  // Performance
  performance: {
    avgLoadTime: number;
    errorRate: number;
    uptime: number;

    // Core Web Vitals
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };

  // Temporal
  timestamp: string;
  period: string;
}

export interface SystemAlert {
  id: string;

  // Clasificación
  level: 'info' | 'warning' | 'error' | 'critical';
  type: 'system' | 'security' | 'performance' | 'business';

  // Contenido
  title: string;
  message: string;
  details?: string;

  // Origen
  source: string;
  component?: string;

  // Estado
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';

  // Acciones
  actions?: Array<{
    label: string;
    action: string;
    type: 'button' | 'link' | 'api';
  }>;

  // Temporal
  timestamp: string;
  expiresAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;

  // Metadatos
  tags?: string[];
  affectedUsers?: number;
  estimatedImpact?: string;
}

export interface ServerStatus {
  // Básico
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  uptime: number;

  // Conexiones
  connectedUsers: number;
  activeRooms: number;
  totalConnections: number;

  // Performance
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };

  // Base de datos
  database: {
    status: 'connected' | 'disconnected' | 'slow';
    responseTime: number;
    connections: number;
  };

  // Redis
  redis: {
    status: 'connected' | 'disconnected';
    memory: number;
    keys: number;
    operations: number;
  };

  // Servicios externos
  externalServices: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: string;
  }>;

  // Timestamp
  timestamp: string;
}

export interface MaintenanceInfo {
  id: string;

  // Tipo
  type: 'scheduled' | 'emergency' | 'rolling';

  // Contenido
  title: string;
  description: string;
  impact: 'none' | 'minor' | 'major' | 'severe';

  // Tiempo
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;

  // Estado
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Afectación
  affectedServices: string[];
  affectedRegions?: string[];

  // Comunicación
  updates: Array<{
    timestamp: string;
    message: string;
    status: string;
  }>;

  // Contacto
  contactInfo?: {
    email?: string;
    phone?: string;
    url?: string;
  };
}
```

---

## 🎮 Tipos de Colaboración

### **📁 `shared-types/socket/collaboration.ts`**

```typescript
/**
 * 🎮 SISTEMA UNIVERSAL DE COLABORACIÓN
 */

export interface CollaborativeDocument {
  id: string;
  title: string;
  type: 'text' | 'code' | 'markdown' | 'rich_text';

  // Contenido
  content: string;
  version: number;

  // Metadatos
  language?: string;
  encoding?: string;

  // Colaboradores
  collaborators: DocumentCollaborator[];
  activeUsers: string[];

  // Permisos
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };

  // Estado
  isLocked: boolean;
  lockedBy?: string;
  lockReason?: string;

  // Temporal
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string;

  // Configuración
  settings: {
    autoSave: boolean;
    saveInterval: number;
    maxHistory: number;
    conflictResolution: 'manual' | 'auto' | 'last_write_wins';
  };
}

export interface DocumentCollaborator {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  color?: string; // Color asignado para cursor/selecciones

  // Estado
  isOnline: boolean;
  lastSeen: string;

  // Permisos
  permissions: Array<'read' | 'write' | 'comment' | 'suggest'>;

  // Actividad
  cursor?: CursorPosition;
  selection?: TextSelection;
  isTyping: boolean;
  currentActivity?: 'typing' | 'selecting' | 'idle';
}

export interface CursorPosition {
  documentId: string;
  userId: string;

  // Posición
  line: number;
  column: number;
  offset?: number; // Posición absoluta en el texto

  // Metadatos
  timestamp: string;

  // Visualización
  visible: boolean;
  color?: string;
  label?: string;
}

export interface TextSelection {
  documentId: string;
  userId: string;

  // Rango
  start: {
    line: number;
    column: number;
    offset?: number;
  };
  end: {
    line: number;
    column: number;
    offset?: number;
  };

  // Contenido
  selectedText?: string;

  // Metadatos
  timestamp: string;

  // Visualización
  color?: string;
  type?: 'selection' | 'highlight' | 'comment';
}

export interface DocumentOperation {
  id: string;
  documentId: string;
  userId: string;

  // Operación
  type: 'insert' | 'delete' | 'replace' | 'format' | 'comment';

  // Posición
  position: {
    line: number;
    column: number;
    offset?: number;
  };

  // Datos
  content?: string;
  length?: number; // Para deletes

  // Formato (para rich text)
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    fontSize?: number;
  };

  // Metadatos
  timestamp: string;
  version: number;

  // Transformación (para conflict resolution)
  transformed?: boolean;
  originalPosition?: any;
}

export interface DocumentComment {
  id: string;
  documentId: string;

  // Autor
  userId: string;
  username: string;
  avatar?: string;

  // Contenido
  content: string;
  type: 'comment' | 'suggestion' | 'question' | 'approval';

  // Posición en documento
  anchor: {
    line: number;
    column: number;
    length?: number;
  };

  // Hilo
  parentId?: string;
  replies: DocumentComment[];

  // Estado
  status: 'open' | 'resolved' | 'rejected';

  // Temporal
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface DocumentHistory {
  documentId: string;
  operations: DocumentOperation[];
  snapshots: Array<{
    version: number;
    content: string;
    timestamp: string;
    userId: string;
  }>;

  // Estadísticas
  stats: {
    totalOperations: number;
    collaborators: number;
    createdAt: string;
    lastModified: string;
  };
}

export interface CollaborationSession {
  id: string;
  documentId: string;

  // Participantes
  participants: DocumentCollaborator[];
  host: string;

  // Estado
  isActive: boolean;

  // Configuración
  settings: {
    allowEdit: boolean;
    allowComment: boolean;
    autoFollow: boolean;
    showCursors: boolean;
    showSelections: boolean;
  };

  // Temporal
  startedAt: string;
  endedAt?: string;
}
```

---

## 🛡️ Tipos de Respuestas y Errores

### **📁 `shared-types/socket/responses.ts`**

```typescript
/**
 * 🛡️ TIPOS UNIVERSALES DE RESPUESTAS
 */

export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: SocketError;
  timestamp: string;
  requestId?: string;
}

export interface SocketError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;

  // Contexto
  source?: 'client' | 'server' | 'network';
  category?: 'auth' | 'validation' | 'permission' | 'network' | 'internal';

  // Retry info
  retryable?: boolean;
  retryAfter?: number;

  // Help
  helpUrl?: string;
  suggestion?: string;
}

export interface CustomEventData {
  type: string;
  payload: any;
  metadata?: {
    source?: string;
    version?: string;
    priority?: 'low' | 'normal' | 'high';
    tags?: string[];
  };
  timestamp: string;
}

export interface SystemConfig {
  // Características habilitadas
  features: {
    notifications: boolean;
    collaboration: boolean;
    rooms: boolean;
    fileSharing: boolean;
    voiceChat: boolean;
    videoChat: boolean;
  };

  // Límites
  limits: {
    maxRoomsPerUser: number;
    maxMembersPerRoom: number;
    maxFileSize: number;
    messageRateLimit: number;
  };

  // URLs
  urls: {
    api: string;
    cdn: string;
    websocket: string;
    help: string;
  };

  // Versiones
  versions: {
    api: string;
    client: string;
    protocol: string;
  };

  // Temporal
  serverTime: string;
  timezone: string;
}

// ═══════════════════════════════════════════════════════════════
// 🎯 TIPOS COMBINADOS PARA USO
// ═══════════════════════════════════════════════════════════════

import type { Socket as BaseSocket, Server as BaseServer } from 'socket.io';

// Cliente tipado
export type TypedClientSocket = BaseSocket<
  ServerToClientEvents,
  ClientToServerEvents
>;

// Servidor tipado
export type TypedServerSocket = BaseSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedServer = BaseServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Helper types para eventos
export type ServerEventNames = keyof ServerToClientEvents;
export type ClientEventNames = keyof ClientToServerEvents;

export type ServerEventData<T extends ServerEventNames> =
  Parameters<ServerToClientEvents[T]>[0];

export type ClientEventData<T extends ClientEventNames> =
  Parameters<ClientToServerEvents[T]>[0];

// Handler types
export type ServerEventHandler<T extends ServerEventNames> =
  (data: ServerEventData<T>) => void;

export type ClientEventHandler<T extends ClientEventNames> =
  (data: ClientEventData<T>) => void;
```

---

## 🔧 Validadores y Type Guards

### **📁 `shared-types/utils/validators.ts`**

```typescript
/**
 * 🔧 VALIDADORES UNIVERSALES
 */

import type {
  UniversalNotification,
  NotificationType,
  RoomMessage,
  UserProfile,
  DashboardMetric
} from '../socket';

// ═══════════════════════════════════════════════════════════════
// 🔍 TYPE GUARDS
// ═══════════════════════════════════════════════════════════════

export function isNotificationType(value: any): value is NotificationType {
  const validTypes = [
    'breaking_news', 'new_article', 'daily_digest',
    'subscription_expiry', 'comment_reply', 'mention',
    'like', 'follow', 'system_alert', 'maintenance',
    'security', 'custom'
  ];
  return typeof value === 'string' && validTypes.includes(value);
}

export function isUniversalNotification(value: any): value is UniversalNotification {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    isNotificationType(value.type) &&
    typeof value.timestamp === 'string' &&
    typeof value.read === 'boolean'
  );
}

export function isRoomMessage(value: any): value is RoomMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.roomId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.content === 'string' &&
    ['text', 'image', 'file', 'system', 'poll', 'call'].includes(value.type) &&
    typeof value.timestamp === 'string'
  );
}

export function isDashboardMetric(value: any): value is DashboardMetric {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.key === 'string' &&
    typeof value.name === 'string' &&
    (typeof value.value === 'number' || typeof value.value === 'string') &&
    ['counter', 'gauge', 'histogram', 'summary', 'rate'].includes(value.type) &&
    typeof value.timestamp === 'string'
  );
}

// ═══════════════════════════════════════════════════════════════
// ✅ VALIDADORES FUNCIONALES
// ═══════════════════════════════════════════════════════════════

export function validateSocketEvent(eventName: string, data: any): boolean {
  // Validación básica de eventos
  if (typeof eventName !== 'string' || eventName.length === 0) {
    return false;
  }

  // Validaciones específicas por evento
  switch (eventName) {
    case 'notification':
      return isUniversalNotification(data);

    case 'room:message':
      return isRoomMessage(data);

    case 'metric:updated':
      return isDashboardMetric(data);

    case 'user:typing':
      return (
        typeof data === 'object' &&
        typeof data.roomId === 'string' &&
        typeof data.userId === 'string' &&
        typeof data.isTyping === 'boolean'
      );

    default:
      // Para eventos no conocidos, validación básica
      return data !== undefined;
  }
}

export function validateUserId(userId: any): userId is string {
  return (
    typeof userId === 'string' &&
    userId.length > 0 &&
    userId.length <= 100 &&
    /^[a-zA-Z0-9_-]+$/.test(userId)
  );
}

export function validateRoomId(roomId: any): roomId is string {
  return (
    typeof roomId === 'string' &&
    roomId.length > 0 &&
    roomId.length <= 100 &&
    /^[a-zA-Z0-9_-]+$/.test(roomId)
  );
}

export function validateDeviceId(deviceId: any): deviceId is string {
  return (
    typeof deviceId === 'string' &&
    deviceId.length > 0 &&
    deviceId.length <= 255
  );
}

// ═══════════════════════════════════════════════════════════════
// 🧹 SANITIZADORES
// ═══════════════════════════════════════════════════════════════

export function sanitizeMessage(content: string): string {
  // Remover scripts y HTML peligroso
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim()
    .slice(0, 5000); // Límite de caracteres
}

export function sanitizeNotification(notification: any): UniversalNotification | null {
  try {
    const sanitized = {
      ...notification,
      title: sanitizeMessage(notification.title || ''),
      body: sanitizeMessage(notification.body || ''),
      summary: notification.summary ? sanitizeMessage(notification.summary) : undefined
    };

    return isUniversalNotification(sanitized) ? sanitized : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 📊 VALIDADORES DE ESTRUCTURA
// ═══════════════════════════════════════════════════════════════

export function validateEventStructure<T>(
  data: any,
  requiredFields: (keyof T)[]
): data is T {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  return requiredFields.every(field =>
    data.hasOwnProperty(field) && data[field] !== undefined
  );
}

export function validateTimestamp(timestamp: any): timestamp is string {
  if (typeof timestamp !== 'string') return false;

  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

export function validateUrl(url: any): url is string {
  if (typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎯 HELPERS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

export class SocketValidator {
  private static errors: string[] = [];

  static validate<T>(
    data: any,
    validator: (data: any) => data is T
  ): { isValid: boolean; data?: T; errors: string[] } {
    this.errors = [];

    if (validator(data)) {
      return {
        isValid: true,
        data: data as T,
        errors: []
      };
    }

    return {
      isValid: false,
      errors: this.errors.length > 0 ? this.errors : ['Validation failed']
    };
  }

  static addError(error: string): void {
    this.errors.push(error);
  }

  static clearErrors(): void {
    this.errors = [];
  }
}

// Wrapper para validación con errores detallados
export function createValidator<T>(
  validator: (data: any) => boolean,
  errorMessage: string
) {
  return (data: any): data is T => {
    const isValid = validator(data);
    if (!isValid) {
      SocketValidator.addError(errorMessage);
    }
    return isValid;
  };
}

// Exportar validadores compuestos
export const validators = {
  notification: createValidator<UniversalNotification>(
    isUniversalNotification,
    'Invalid notification structure'
  ),
  roomMessage: createValidator<RoomMessage>(
    isRoomMessage,
    'Invalid room message structure'
  ),
  metric: createValidator<DashboardMetric>(
    isDashboardMetric,
    'Invalid metric structure'
  ),
  userId: createValidator<string>(
    validateUserId,
    'Invalid user ID format'
  ),
  roomId: createValidator<string>(
    validateRoomId,
    'Invalid room ID format'
  ),
  deviceId: createValidator<string>(
    validateDeviceId,
    'Invalid device ID format'
  )
};
```

---

## 🚀 Configuración de Tipos en package.json

### **Para Backend (NestJS)**

```json
{
  "dependencies": {
    "@nestjs/websockets": "^11.0.0",
    "@nestjs/platform-socket.io": "^11.0.0",
    "socket.io": "^4.8.0"
  },
  "devDependencies": {
    "@types/socket.io": "^3.0.0"
  }
}
```

### **Para Frontend (React/Vite)**

```json
{
  "dependencies": {
    "socket.io-client": "^4.8.0",
    "@tanstack/router": "^1.65.0",
    "@tanstack/react-query": "^5.40.0"
  },
  "devDependencies": {
    "@types/socket.io-client": "^3.0.0"
  }
}
```

---

## 🎯 Uso en Backend (NestJS)

```typescript
// gateway/socket.gateway.ts
import { TypedServerSocket } from '../shared-types/socket/events';

@WebSocketGateway()
export class SocketGateway {
  @WebSocketServer() server: TypedServer;

  handleConnection(client: TypedServerSocket) {
    // Auto-completion completo
    client.emit('connected', {
      sessionId: client.id,
      platform: 'web',
      timestamp: new Date().toISOString(),
      serverVersion: '1.0.0',
      features: ['notifications', 'rooms']
    });
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(
    @ConnectedSocket() client: TypedServerSocket,
    @MessageBody() roomId: string
  ) {
    // Validación automática de tipos
    if (!validators.roomId(roomId)) {
      client.emit('error', {
        code: 'INVALID_ROOM_ID',
        message: 'Invalid room ID format',
        timestamp: new Date().toISOString()
      });
      return;
    }

    client.join(roomId);

    // Emisión tipada
    client.to(roomId).emit('room:user-joined', {
      roomId,
      userId: client.data.userId,
      username: client.data.username,
      userAvatar: client.data.avatar,
      action: 'joined',
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## 🎯 Uso en Frontend (React)

```typescript
// hooks/useTypedSocket.ts
import { useSocket } from '../context/SocketContext';
import type { TypedClientSocket } from '../shared-types/socket/events';

export const useTypedSocket = () => {
  const { socket } = useSocket();

  return socket as TypedClientSocket;
};

// components/NotificationHandler.tsx
export const NotificationHandler = () => {
  const socket = useTypedSocket();

  useEffect(() => {
    if (!socket) return;

    // Auto-completion completo para eventos
    socket.on('notification', (notification) => {
      // notification es tipo UniversalNotification automáticamente
      console.log('Nueva notificación:', notification.title);

      // Validación de tipos en runtime
      if (!validators.notification(notification)) {
        console.error('Notificación inválida recibida');
        return;
      }

      // Procesar notificación válida
      handleNotification(notification);
    });

    socket.on('user:typing', (data) => {
      // data tiene tipos automáticos
      updateTypingIndicator(data.roomId, data.userId, data.isTyping);
    });

    return () => {
      socket.off('notification');
      socket.off('user:typing');
    };
  }, [socket]);

  const sendTyping = (roomId: string, isTyping: boolean) => {
    if (!socket) return;

    // Emisión tipada al servidor
    socket.emit('typing:start', {
      roomId,
      context: 'chat'
    });
  };

  return null;
};
```

---

## ✅ Checklist de Implementación

- [ ] ✅ Tipos de eventos definidos (ServerToClient, ClientToServer)
- [ ] ✅ Tipos de notificaciones universales
- [ ] ✅ Tipos de salas y colaboración
- [ ] ✅ Tipos de autenticación y sesiones
- [ ] ✅ Tipos de métricas y analytics
- [ ] ✅ Validadores y type guards implementados
- [ ] ✅ Sanitizadores de datos configurados
- [ ] ✅ Integración con backend NestJS
- [ ] ✅ Integración con frontend React
- [ ] ✅ Auto-completion completo
- [ ] ✅ Validación en runtime
- [ ] ✅ Estructura extensible

---

**🎯 ¡Sistema de tipos universal completo, Coyotito! Este archivo garantiza type-safety completo entre tu backend y frontend, con auto-completion, validación y extensibilidad para todos tus proyectos!**