# 🎯 CONTEXTO: ThemedList Universal - Legend App Integration

## 📋 OBJETIVO
Crear un componente `ThemedList` universal y reutilizable basado en `@legendapp/list` que soporte:
- Pull-to-refresh
- Scroll infinito
- Modo chat
- Theming consistente
- TypeScript completo
- Máxima reutilización

---

## 🔬 DOCUMENTACIÓN LEGEND APP

### Instalación
```bash
npm install @legendapp/list
# o
yarn add @legendapp/list
```

### Props Principales (TypeScript)

```typescript
interface LegendListProps<T> {
  // REQUERIDAS
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement

  // RECOMENDADAS
  keyExtractor: (item: T, index: number) => string
  recycleItems?: boolean // Reutiliza componentes para performance

  // CONFIGURACIÓN
  horizontal?: boolean
  numColumns?: number
  estimatedItemSize?: number
  drawDistance?: number // Buffer de renderizado (default: 250px)

  // SCROLL & POSICIÓN
  maintainVisibleContentPosition?: {
    minIndexForVisible: number
    autoscrollToTopThreshold?: number
  }
  initialScrollIndex?: number

  // EVENTOS INFINITOS
  onEndReached?: () => void
  onEndReachedThreshold?: number // Porcentaje desde el final

  // REFRESH (Integración manual con RefreshControl)
  refreshControl?: React.ReactElement<RefreshControlProps>
}
```

### Métodos Ref Disponibles
```typescript
interface LegendListRef {
  scrollToIndex: (index: number, animated?: boolean) => void
  scrollToOffset: (offset: number, animated?: boolean) => void
  scrollToItem: (item: any, animated?: boolean) => void
  scrollToEnd: (animated?: boolean) => void
}
```

### Hooks Especiales
```typescript
// Para manejar estado durante reciclaje
const [state, setState] = useRecyclingState(initialState)

// Para trackear visibilidad
const isVisible = useViewability(index)

// Para métricas detalladas de visibilidad
const visibilityAmount = useViewabilityAmount(index)
```

---

## 🎨 ARQUITECTURA DEL THEMEDLIST

### Estructura de Props
```typescript
interface ThemedListProps<T> {
  // DATOS
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement
  keyExtractor?: (item: T, index: number) => string

  // CARACTERÍSTICAS PRINCIPALES
  mode?: 'default' | 'chat' | 'infinite' | 'chat-infinite'

  // PULL TO REFRESH
  onRefresh?: () => Promise<void>
  refreshing?: boolean

  // INFINITE SCROLL
  onLoadMore?: () => Promise<void>
  hasNextPage?: boolean
  loading?: boolean

  // CHAT ESPECÍFICO
  maintainScrollPosition?: boolean
  alignToBottom?: boolean

  // THEMING
  theme?: 'light' | 'dark' | 'auto'
  backgroundColor?: string

  // PERFORMANCE
  estimatedItemSize?: number
  recycleItems?: boolean

  // LAYOUT
  horizontal?: boolean
  numColumns?: number

  // EVENTOS
  onEndReached?: () => void
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void

  // CONTENIDO VACÍO
  ListEmptyComponent?: React.ComponentType | React.ReactElement
  ListHeaderComponent?: React.ComponentType | React.ReactElement
  ListFooterComponent?: React.ComponentType | React.ReactElement

  // LOADING STATES
  LoadingComponent?: React.ComponentType
  LoadMoreComponent?: React.ComponentType

  // ACCESIBILIDAD
  accessibilityLabel?: string
}
```

### Modos de Funcionamiento

#### 1. **MODO DEFAULT**
- Lista básica con theming
- Sin funcionalidades especiales

#### 2. **MODO CHAT**
- `maintainVisibleContentPosition` activado
- Alineación al fondo
- Óptimo para mensajes

#### 3. **MODO INFINITE**
- Pull-to-refresh habilitado
- Carga automática al llegar al final
- Loading states

#### 4. **MODO CHAT-INFINITE**
- Combina chat + infinite scroll
- Carga hacia arriba (mensajes anteriores)
- Mantiene posición durante cargas

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### RefreshControl Integration
```typescript
const refreshControl = onRefresh ? (
  <RefreshControl
    refreshing={refreshing ?? false}
    onRefresh={onRefresh}
    tintColor={theme === 'dark' ? '#fff' : '#000'}
    title="Actualizando..."
    titleColor={theme === 'dark' ? '#fff' : '#000'}
  />
) : undefined
```

### Infinite Scroll Logic
```typescript
const handleEndReached = useCallback(() => {
  if (mode?.includes('infinite') && hasNextPage && !loading && onLoadMore) {
    onLoadMore()
  }
}, [mode, hasNextPage, loading, onLoadMore])
```

### Chat Mode Configuration
```typescript
const chatModeConfig = mode?.includes('chat') ? {
  maintainVisibleContentPosition: {
    minIndexForVisible: 1,
    autoscrollToTopThreshold: 100
  },
  // Invertir para chat si es necesario
} : {}
```

### Theme Integration
```typescript
const getThemeColors = () => {
  const isDark = theme === 'dark' || (theme === 'auto' && colorScheme === 'dark')
  return {
    background: backgroundColor ?? (isDark ? '#000' : '#fff'),
    text: isDark ? '#fff' : '#000',
    border: isDark ? '#333' : '#e0e0e0'
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### 🔧 SETUP INICIAL
- [ ] Instalar `@legendapp/list`
- [ ] Crear estructura de carpetas `src/components/ThemedList/`
- [ ] Configurar tipos TypeScript
- [ ] Importar dependencias necesarias

### 🎨 COMPONENTE BASE
- [ ] Crear `ThemedList.tsx` con props interface completa
- [ ] Implementar theming system
- [ ] Configurar ref forwarding
- [ ] Añadir propiedades de accesibilidad

### 🔄 PULL-TO-REFRESH
- [ ] Integrar `RefreshControl` componente
- [ ] Manejar estados `refreshing`
- [ ] Implementar callback `onRefresh`
- [ ] Configurar colores según tema

### ♾️ INFINITE SCROLL
- [ ] Implementar `onEndReached` logic
- [ ] Crear componente de loading al final
- [ ] Manejar estados `hasNextPage` y `loading`
- [ ] Configurar `onEndReachedThreshold`

### 💬 MODO CHAT
- [ ] Configurar `maintainVisibleContentPosition`
- [ ] Implementar alineación al fondo
- [ ] Manejar scroll automático
- [ ] Optimizar para nuevos mensajes

### 🎭 MODO HÍBRIDO (CHAT-INFINITE)
- [ ] Combinar configuraciones chat + infinite
- [ ] Manejar carga bidireccional
- [ ] Mantener posición durante actualizaciones
- [ ] Implementar loading states específicos

### 🎨 THEMING COMPLETO
- [ ] Sistema de colores light/dark/auto
- [ ] Props de customización visual
- [ ] Integración con tema global
- [ ] Componentes de estado (empty, error, loading)

### 🔧 COMPONENTES AUXILIARES
- [ ] `LoadingComponent` personalizable
- [ ] `ListEmptyComponent` con theming
- [ ] `ListHeaderComponent` y `ListFooterComponent`
- [ ] `LoadMoreComponent` para infinite scroll

### 📱 PERFORMANCE
- [ ] Configurar `recycleItems` por defecto
- [ ] Optimizar `estimatedItemSize`
- [ ] Implementar `drawDistance` apropiado
- [ ] Usar `useCallback` y `useMemo` donde corresponda

### 🧪 TESTING & VALIDATION
- [ ] Crear casos de prueba básicos
- [ ] Testear todos los modos
- [ ] Validar performance en listas grandes
- [ ] Testear theming en ambos modos

### 📚 DOCUMENTACIÓN
- [ ] Crear ejemplos de uso para cada modo
- [ ] Documentar props TypeScript
- [ ] Crear guía de migración desde FlatList
- [ ] Ejemplos de integración con estado global

### 🚀 INTEGRACIÓN
- [ ] Exportar desde index
- [ ] Crear ejemplos en Storybook (opcional)
- [ ] Integrar con sistema de theming existente
- [ ] Crear utils helpers si es necesario

---

## 📖 CASOS DE USO PRINCIPALES

### 1. Lista de Noticias (Infinite)
```typescript
<ThemedList
  mode="infinite"
  data={articles}
  renderItem={({ item }) => <ArticleCard article={item} />}
  onRefresh={refetchArticles}
  onLoadMore={loadMoreArticles}
  hasNextPage={hasMore}
  loading={isLoading}
/>
```

### 2. Chat de Mensajes
```typescript
<ThemedList
  mode="chat"
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  maintainScrollPosition
  alignToBottom
/>
```

### 3. Chat con Historial Infinito
```typescript
<ThemedList
  mode="chat-infinite"
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  onLoadMore={loadOlderMessages}
  hasNextPage={hasOlderMessages}
/>
```

---

## 🎯 PRÓXIMOS PASOS

1. **Inicializar estructura básica** del componente
2. **Implementar modo default** con theming
3. **Añadir pull-to-refresh** functionality
4. **Desarrollar infinite scroll**
5. **Crear modo chat** específico
6. **Combinar en modo híbrido**
7. **Testing y optimización**
8. **Documentación final**

---

*🎯 CONTEXTO: ThemedList Universal | Listo, Coyotito. ¿Qué micro-tarea hacemos?*