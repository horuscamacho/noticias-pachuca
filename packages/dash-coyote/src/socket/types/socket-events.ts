/**
 * 🎯 EVENTOS UNIVERSALES SOCKET.IO
 * Tipos unificados entre backend y frontend
 */

// ═══════════════════════════════════════════════════════════════
// 🔵 EVENTOS: SERVIDOR → CLIENTE
// ═══════════════════════════════════════════════════════════════

export interface ServerToClientEvents {
  // ✅ CONEXIÓN Y SESIÓN
  connected: (data: {
    sessionId: string;
    platform: 'web' | 'mobile' | 'api';
    timestamp: string;
    serverVersion: string;
    features: string[];
  }) => void;

  'session:updated': (session: {
    id: string;
    userId: string;
    platform: 'web' | 'mobile' | 'api';
    deviceId: string;
    lastSeen: string;
    isActive: boolean;
  }) => void;

  // 🔔 NOTIFICACIONES
  notification: (notification: {
    id: string;
    type: 'breaking_news' | 'new_article' | 'system_alert' | 'custom';
    title: string;
    body: string;
    data?: Record<string, any>;
    actionUrl?: string;
    imageUrl?: string;
    timestamp: string;
    read: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    delivered_via: 'socket' | 'push';
  }) => void;

  'notification:pending-list': (notifications: any[]) => void;

  'notification:marked-read': (data: {
    notificationId: string;
    timestamp: string;
  }) => void;

  'notification:all-marked-read': (data: {
    count: number;
    timestamp: string;
  }) => void;

  // 👤 USUARIO Y ESTADO
  'user:status': (status: {
    userId: string;
    isOnline: boolean;
    lastSeen: string;
  }) => void;

  'user:typing': (data: {
    userId: string;
    roomId: string;
    isTyping: boolean;
  }) => void;

  'user:profile-updated': (user: any) => void;

  // 🏠 SALAS/ROOMS
  'room:user-joined': (data: {
    roomId: string;
    userId: string;
    username: string;
    timestamp: string;
  }) => void;

  'room:user-left': (data: {
    roomId: string;
    userId: string;
    username: string;
    timestamp: string;
  }) => void;

  'room:message': (message: {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    timestamp: string;
  }) => void;

  'room:members': (data: {
    roomId: string;
    members: string[];
    count: number;
  }) => void;

  // 📊 MÉTRICAS Y ANALYTICS
  'metric:updated': (metric: {
    key: string;
    value: number | string;
    timestamp: string;
    category: 'dashboard' | 'analytics' | 'system';
  }) => void;

  'metrics:batch-update': (metrics: any[]) => void;

  'analytics:updated': (data: any) => void;

  // 🤖 GENERACIÓN DE CONTENIDO CON IA
  'content:generation-started': (data: {
    extractedContentId: string;
    agentId: string;
    agentName: string;
    timestamp: string;
  }) => void;

  'content:generation-progress': (data: {
    extractedContentId: string;
    step: 'extracting' | 'generating' | 'validating' | 'saving';
    progress: number;
    message: string;
    timestamp: string;
  }) => void;

  'content:generation-completed': (data: {
    extractedContentId: string;
    generatedContentId: string;
    agentId: string;
    agentName: string;
    hasSocialCopies: boolean;
    validationWarnings: string[];
    metadata: {
      processingTime: number;
      totalTokens: number;
      cost: number;
    };
    timestamp: string;
  }) => void;

  'content:generation-failed': (data: {
    extractedContentId: string;
    agentId: string;
    error: string;
    reason: string;
    timestamp: string;
  }) => void;

  // ⚠️ SISTEMA
  'system:alert': (alert: {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: string;
  }) => void;

  'system:maintenance': (data: {
    scheduled: boolean;
    startTime: string;
    endTime: string;
    message: string;
  }) => void;

  'system:config-updated': (config: any) => void;

  // 📱 ESTADO DE APLICACIÓN
  'app-state-updated': (data: {
    success: boolean;
    appState: 'foreground' | 'background';
    timestamp: string;
  }) => void;

  'push-token-updated': (data: {
    success: boolean;
    timestamp: string;
  }) => void;

  // ❌ ERRORES
  error: (error: {
    code: string;
    message: string;
    timestamp: string;
  }) => void;

  // 📡 PING/PONG
  pong: (data: {
    timestamp: number;
    serverTime: string;
  }) => void;
}

// ═══════════════════════════════════════════════════════════════
// 🔴 EVENTOS: CLIENTE → SERVIDOR
// ═══════════════════════════════════════════════════════════════

export interface ClientToServerEvents {
  // 🏠 MANEJO DE SALAS
  'room:join': (roomId: string, password?: string) => void;
  'room:leave': (roomId: string) => void;
  'room:send-message': (data: {
    roomId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    metadata?: Record<string, any>;
  }) => void;

  'room:check-access': (
    roomId: string,
    callback: (response: { hasAccess: boolean; reason?: string }) => void
  ) => void;

  // 💬 COMUNICACIÓN
  'typing:start': (data: {
    roomId: string;
    context?: 'chat' | 'document';
  }) => void;

  'typing:stop': (data: {
    roomId: string;
    context?: 'chat' | 'document';
  }) => void;

  // 📱 ESTADO DE APLICACIÓN
  'app-state:change': (data: {
    appState: 'foreground' | 'background';
    deviceId?: string;
  }) => void;

  'push-token:update': (data: {
    expoPushToken: string;
    deviceId?: string;
  }) => void;

  // 🔔 NOTIFICACIONES
  'notification:mark-read': (notificationId: string) => void;
  'notification:mark-all-read': () => void;
  'notification:get-pending': (filter?: {
    type?: string;
    limit?: number;
    since?: string;
  }) => void;

  // 📊 ANALYTICS
  'analytics:track': (event: {
    name: string;
    properties?: Record<string, any>;
    timestamp?: string;
  }) => void;

  'analytics:page-time': (data: {
    page: string;
    timeSpent: number;
    interactions: number;
  }) => void;

  // 🔄 UTILIDADES
  ping: (timestamp?: number) => void;
  heartbeat: () => void;

  // 🛠️ INFORMACIÓN DEL SERVIDOR
  'server:info': (
    callback: (info: {
      version: string;
      uptime: number;
      connectedUsers: number;
      features: string[];
    }) => void
  ) => void;
}

// ═══════════════════════════════════════════════════════════════
// 🟣 EVENTOS INTER-SERVIDOR (para scaling)
// ═══════════════════════════════════════════════════════════════

export interface InterServerEvents {
  'user:broadcast': (data: {
    userId: string;
    event: keyof ServerToClientEvents;
    payload: any;
  }) => void;

  'room:broadcast': (data: {
    roomId: string;
    event: keyof ServerToClientEvents;
    payload: any;
    excludeUserId?: string;
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
    device?: {
      os?: string;
      version?: string;
      model?: string;
    };
  };
}