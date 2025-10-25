# 🔍 Diagnóstico: Scroll Infinito No Funciona

## 📊 Análisis del Problema

### 🐛 Problema Principal
El scroll infinito no está cargando más páginas en la lista de contenidos extraídos.

---

## 🔎 Hallazgos

### 1. **Conflicto en el State de Filtros** ❌
**Ubicación**: `/app/(protected)/(tabs)/generate.tsx` líneas 136-144

```typescript
const [filters, setFilters] = useState<App.ExtractedContentFilters>({
  status: ['extracted'],
  tags: [],
  keywords: [],
  sortBy: 'extractedAt',
  sortOrder: 'desc',
  page: 1,        // ❌ PROBLEMA: No debería estar aquí
  limit: 20,      // ❌ PROBLEMA: No debería estar aquí
})
```

**Por qué es un problema:**
- El hook `useExtractedNews` usa `useInfiniteQuery` que maneja la paginación automáticamente
- El tipo del hook excluye explícitamente `page` y `limit`:
  ```typescript
  Omit<App.ExtractedContentFilters, 'page' | 'limit'>
  ```
- Pasar estos valores causa conflictos en el queryKey de React Query

---

### 2. **Reset Incorrecto de Paginación** ⚠️
**Ubicación**: Múltiples handlers

```typescript
// ❌ INCORRECTO
handleApplyFilters: setFilters({ ...newFilters, page: 1 })
handleSort: setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
handleSearch: setFilters((prev) => ({ ...prev, search: searchText, page: 1 }))
```

**Por qué es un problema:**
- Intentar resetear `page: 1` no tiene efecto en `useInfiniteQuery`
- La paginación se maneja con `initialPageParam` y `getNextPageParam`

---

### 3. **Hook Configurado Correctamente** ✅
**Ubicación**: `/src/hooks/useExtractedNewsFilters.ts` líneas 40-61

```typescript
export function useExtractedNews(filters?: Omit<App.ExtractedContentFilters, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: extractedNewsKeys.list(filters),
    queryFn: ({ pageParam }) =>
      extractedNewsApi.getExtractedNews({
        ...filters,
        page: pageParam,      // ✅ Usa pageParam del infinite query
        limit: 20,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1  // ✅ Calcula siguiente página
      }
      return undefined  // ✅ Sin más páginas
    },
    initialPageParam: 1,  // ✅ Siempre empieza en página 1
  })
}
```

**Esto está BIEN configurado** ✅

---

### 4. **FlatList onEndReached** ✅
**Ubicación**: `/app/(protected)/(tabs)/generate.tsx`

```typescript
<FlatList
  data={allNews}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  // ...
/>

const handleLoadMore = useCallback(() => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage()  // ✅ Esto está correcto
  }
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
```

**Esto está BIEN** ✅

---

## 🔧 Solución

### Cambios Necesarios en `/app/(protected)/(tabs)/generate.tsx`

#### 1. **Remover page y limit del state de filtros**

```typescript
// ❌ ANTES
const [filters, setFilters] = useState<App.ExtractedContentFilters>({
  status: ['extracted'],
  tags: [],
  keywords: [],
  sortBy: 'extractedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
})

// ✅ DESPUÉS
const [filters, setFilters] = useState<Omit<App.ExtractedContentFilters, 'page' | 'limit'>>({
  status: ['extracted'],
  tags: [],
  keywords: [],
  sortBy: 'extractedAt',
  sortOrder: 'desc',
})
```

#### 2. **Actualizar handlers para NO resetear page**

```typescript
// ❌ ANTES
const handleApplyFilters = useCallback((newFilters: App.ExtractedContentFilters) => {
  setFilters({ ...newFilters, page: 1 })
}, [])

// ✅ DESPUÉS
const handleApplyFilters = useCallback((newFilters: Omit<App.ExtractedContentFilters, 'page' | 'limit'>) => {
  setFilters(newFilters)
}, [])

// ❌ ANTES
const handleSort = useCallback((sortBy: App.SortBy, sortOrder: App.SortOrder) => {
  setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
}, [])

// ✅ DESPUÉS
const handleSort = useCallback((sortBy: App.SortBy, sortOrder: App.SortOrder) => {
  setFilters((prev) => ({ ...prev, sortBy, sortOrder }))
}, [])

// ❌ ANTES
const handleSearch = useCallback(() => {
  setFilters((prev) => ({ ...prev, search: searchText, page: 1 }))
}, [searchText])

// ✅ DESPUÉS
const handleSearch = useCallback(() => {
  setFilters((prev) => ({ ...prev, search: searchText }))
}, [searchText])

// ❌ ANTES
const handleClearSearch = useCallback(() => {
  setSearchText('')
  setFilters((prev) => {
    const { search, ...rest } = prev
    return { ...rest, page: 1 }
  })
}, [])

// ✅ DESPUÉS
const handleClearSearch = useCallback(() => {
  setSearchText('')
  setFilters((prev) => {
    const { search, ...rest } = prev
    return rest
  })
}, [])

// ❌ ANTES
const handleClearAllFilters = useCallback(() => {
  setFilters({
    status: ['extracted'],
    tags: [],
    keywords: [],
    sortBy: 'extractedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  })
  setSearchText('')
}, [])

// ✅ DESPUÉS
const handleClearAllFilters = useCallback(() => {
  setFilters({
    status: ['extracted'],
    tags: [],
    keywords: [],
    sortBy: 'extractedAt',
    sortOrder: 'desc',
  })
  setSearchText('')
}, [])
```

---

## 🎯 Por Qué Esto Arregla el Problema

1. **QueryKey Consistente**: Al eliminar `page` y `limit` de filters, el queryKey de React Query será consistente
2. **Paginación Automática**: `useInfiniteQuery` manejará completamente la paginación usando `pageParam`
3. **Reset Correcto**: Cuando cambien los filtros, el queryKey cambia → React Query automáticamente resetea a página 1
4. **Sin Conflictos**: No hay valores conflictivos entre el state y el hook

---

## 📈 Comportamiento Esperado Después del Fix

1. **Carga Inicial**: Muestra 20 items (página 1)
2. **Scroll Down**: Al llegar al 50% del final, automáticamente carga página 2 (siguientes 20 items)
3. **Cambio de Filtros**: Resetea automáticamente a página 1 con nuevos filtros
4. **Indicador de Carga**: Muestra "Cargando más..." mientras fetchea
5. **Sin Más Páginas**: Se detiene cuando `pagination.hasNext = false`

---

## 🧪 Verificación

Después de aplicar los cambios, verificar:

1. ✅ Scroll infinito carga más páginas
2. ✅ Cambiar filtros resetea la lista
3. ✅ Cambiar ordenamiento resetea la lista
4. ✅ Buscar resetea la lista
5. ✅ Pull to refresh funciona correctamente
6. ✅ No hay duplicados en la lista
7. ✅ El contador total es correcto

---

## 📝 Resumen

**Causa Raíz**: Pasar `page` y `limit` en el state de filtros cuando `useInfiniteQuery` los maneja internamente

**Solución**: Usar `Omit<App.ExtractedContentFilters, 'page' | 'limit'>` en el state y eliminar todas las referencias a `page: 1` en los handlers

**Impacto**: El scroll infinito funcionará correctamente sin intervención manual de paginación
