# Sistema de Filtrado y Ordenamiento - Diseño UX
**Proyecto:** Mobile Expo - Noticias Pachuca
**Fecha:** 2025-10-10
**Versión:** 1.0

---

## 1. ANÁLISIS DEL DISEÑO ACTUAL

### Sistema de Colores Identificado
```css
/* Colores Primarios (desde global.css) */
--primary: hsl(70 100% 80%)          /* #f1ef47 - Amarillo característico */
--primary-foreground: hsl(70 10% 15%) /* Texto sobre amarillo */

/* Colores de Fondo */
--background: hsl(0 0% 100%)          /* #FFFFFF - Blanco */
--card: hsl(0 0% 100%)                /* #FFFFFF - Cards */
--muted: hsl(220 7% 97%)              /* #F3F4F6 - Gris claro */

/* Colores de Texto */
--foreground: hsl(220 13% 9%)         /* #111827 - Texto principal */
--muted-foreground: hsl(220 9% 46%)   /* #6B7280 - Texto secundario */

/* Colores Funcionales */
--destructive: hsl(0 72% 51%)         /* Rojo para eliminar */
--border: hsl(220 13% 91%)            /* #E5E7EB - Bordes */
--input: hsl(220 13% 91%)             /* Inputs */
```

### Patrones de UI Existentes
- **Layout:** SafeAreaView + ScrollView con padding de 24px
- **Cards:** Sombra suave, border-radius 16px, padding 24px
- **Tipografía:** Familia Aleo (18 variantes disponibles)
- **Componentes:** react-native-reusables con TailwindCSS
- **Espaciado:** Sistema de 8px (gap-2, gap-4, gap-6)
- **Responsive:** Soporte para tablet con maxWidth 1000px

---

## 2. PROPUESTA DE UX PARA FILTROS

### 2.1 Arquitectura de Filtros

#### Tipos de Filtros Identificados
1. **Ordenamiento:** Fecha de publicación → Fecha de extracción
2. **Outlet/Fuente:** Multiselección de medios
3. **Estado:** Borrador, Publicado, Archivado, Pendiente
4. **Rango de Fechas:** Desde - Hasta
5. **Agente de Contenido:** Tipo de agente (reportero, columnista, etc.)

#### Ubicación Propuesta: **Sticky Header + Bottom Sheet**

**Rationale:**
- **Sticky Header:** Mantiene los filtros siempre visibles sin ocupar espacio vertical crítico
- **Bottom Sheet:** Permite expandir opciones avanzadas manteniendo contexto
- **Chips de Filtros Activos:** Feedback visual inmediato bajo el header

---

### 2.2 Wireframe Textual

```
┌─────────────────────────────────────────┐
│ [≡] Contenidos Generados        [🔔] [⚙] │ ← Navigation Header
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐   │
│ │ 🔍 Buscar contenido...       [≣]  │   │ ← Sticky Search + Filter Button
│ └───────────────────────────────────┘   │
│                                         │
│ ┌─ Chips de Filtros Activos ─────────┐ │
│ │ [Publicado ×] [El Sol ×] [↓ Fecha] │ │ ← Active Filters (scrollable)
│ │ [Limpiar todo]                      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📄 Título del contenido             │ │
│ │ El Sol • Hace 2 horas • Publicado   │ │ ← Content Card
│ │ Por: Agente Reportero               │ │
│ │ Lorem ipsum dolor sit amet...       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📄 Otro contenido...                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cargar más] ← Loading/Pagination      │
└─────────────────────────────────────────┘

┌─── BOTTOM SHEET (al tocar [≣]) ────────┐
│ ╔═══════════════════════════════════╗   │
│ ║ Filtros                      [×]  ║   │
│ ╠═══════════════════════════════════╣   │
│ ║                                   ║   │
│ ║ Ordenar por                       ║   │
│ ║ ○ Fecha de publicación (más rec.) ║   │
│ ║ ● Fecha de extracción (más rec.)  ║   │
│ ║ ○ Título (A-Z)                    ║   │
│ ║                                   ║   │
│ ║ ─────────────────────────────     ║   │
│ ║                                   ║   │
│ ║ Estado                            ║   │
│ ║ [✓] Publicado  [✓] Borrador      ║   │
│ ║ [ ] Archivado  [ ] Pendiente      ║   │
│ ║                                   ║   │
│ ║ ─────────────────────────────     ║   │
│ ║                                   ║   │
│ ║ Outlet / Fuente                   ║   │
│ ║ [Select ▼] Selecciona outlets...  ║   │
│ ║                                   ║   │
│ ║ ─────────────────────────────     ║   │
│ ║                                   ║   │
│ ║ Rango de fechas                   ║   │
│ ║ [Desde: 01/01/2025 📅]            ║   │
│ ║ [Hasta: 10/10/2025 📅]            ║   │
│ ║                                   ║   │
│ ║ ─────────────────────────────     ║   │
│ ║                                   ║   │
│ ║ Tipo de Agente                    ║   │
│ ║ [Todos ▼]                         ║   │
│ ║                                   ║   │
│ ╠═══════════════════════════════════╣   │
│ ║ [Limpiar]      [Aplicar Filtros] ║   │
│ ╚═══════════════════════════════════╝   │
└─────────────────────────────────────────┘
```

---

## 3. ESPECIFICACIÓN DE COMPONENTES

### 3.1 Header con Search y Filter Button

**Componente:** `FilterHeader.tsx`

```typescript
interface FilterHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress: () => void;
  activeFiltersCount: number;
}
```

**Elementos:**
- **Search Input:**
  - Altura: 44px (touch target mínimo)
  - Border radius: 12px
  - Background: `bg-muted` (#F3F4F6)
  - Placeholder: "Buscar por título, outlet..."
  - Icon: Lucide `Search` (16px)

- **Filter Button:**
  - Tamaño: 44x44px (touch target)
  - Variant: `outline` con badge
  - Badge: Contador de filtros activos (bg-primary)
  - Icon: Lucide `SlidersHorizontal`

**Ubicación:** Sticky position, top: 0, z-index: 10

---

### 3.2 Active Filters Chips

**Componente:** `ActiveFiltersBar.tsx`

```typescript
interface Filter {
  id: string;
  label: string;
  value: any;
  type: 'outlet' | 'status' | 'date' | 'sort' | 'agent';
}

interface ActiveFiltersBarProps {
  filters: Filter[];
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
}
```

**Elementos:**
- **Chip (Badge):**
  - Variant: `secondary`
  - Size: height 32px
  - Gap: 8px entre chips
  - Icon: Lucide `X` (14px) para remover
  - Scroll horizontal con `showsHorizontalScrollIndicator={false}`

- **Clear All Button:**
  - Variant: `ghost`
  - Size: `sm`
  - Color: `destructive`
  - Text: "Limpiar todo"

**Comportamiento:**
- Aparece solo si hay filtros activos
- Animación fade in/out
- Scroll horizontal si excede ancho

---

### 3.3 Filter Bottom Sheet

**Componente:** `FilterBottomSheet.tsx`

```typescript
interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  outlets: Outlet[];
  agentTypes: string[];
}
```

**Secciones del Sheet:**

#### A. Ordenamiento (Sort)
- **Componente:** Radio Group
- **Opciones:**
  ```typescript
  const sortOptions = [
    { label: 'Fecha de publicación (más reciente)', value: 'publishDate:desc' },
    { label: 'Fecha de publicación (más antigua)', value: 'publishDate:asc' },
    { label: 'Fecha de extracción (más reciente)', value: 'extractDate:desc' },
    { label: 'Fecha de extracción (más antigua)', value: 'extractDate:asc' },
    { label: 'Título (A-Z)', value: 'title:asc' },
    { label: 'Título (Z-A)', value: 'title:desc' },
  ];
  ```
- **UI:** Custom Radio con `Switch` de rn-primitives
- **Touch Target:** 48px de altura cada opción

#### B. Estado (Status)
- **Componente:** Multiple Checkbox
- **Opciones:**
  ```typescript
  const statusOptions = [
    { label: 'Publicado', value: 'published', color: 'success' },
    { label: 'Borrador', value: 'draft', color: 'warning' },
    { label: 'Archivado', value: 'archived', color: 'muted' },
    { label: 'Pendiente', value: 'pending', color: 'info' },
  ];
  ```
- **UI:** `Checkbox` de rn-primitives + `Label`
- **Layout:** Grid 2 columnas
- **Touch Target:** 44x44px por checkbox

#### C. Outlet / Fuente (Multi-Select)
- **Componente:** Custom Dropdown con modal
- **Comportamiento:**
  - Tap abre modal full-screen con lista searchable
  - Checkboxes para multi-selección
  - Badge con contador de seleccionados
  - Search interno para outlets (si > 10)
- **UI:**
  ```
  ┌──────────────────────────────┐
  │ [✓] El Sol de Hidalgo        │
  │ [✓] Milenio Hidalgo          │
  │ [ ] Criterio Hidalgo         │
  │ [ ] La Silla Rota            │
  │ ...                          │
  └──────────────────────────────┘
  ```

#### D. Rango de Fechas
- **Componente:** Date Picker (Expo)
- **UI:** 2 botones con íconos de calendario
- **Format:** DD/MM/YYYY
- **Validación:**
  - Fecha inicio <= Fecha fin
  - Máximo 1 año de rango
  - Color destructive si inválido

#### E. Tipo de Agente
- **Componente:** Single Select Dropdown
- **Opciones:**
  ```typescript
  const agentTypes = [
    { label: 'Todos', value: null },
    { label: 'Reportero', value: 'reportero' },
    { label: 'Columnista', value: 'columnista' },
    { label: 'Trascendido', value: 'trascendido' },
    { label: 'SEO Specialist', value: 'seo-specialist' },
  ];
  ```

**Footer Buttons:**
- **Limpiar:**
  - Variant: `ghost`
  - Action: Reset todos los filtros
  - Disabled si no hay filtros
- **Aplicar Filtros:**
  - Variant: `default` (bg-primary)
  - Action: Cerrar sheet y aplicar
  - Haptic feedback al tocar

---

### 3.4 Content Card

**Componente:** `ContentCard.tsx`

```typescript
interface ContentCardProps {
  id: string;
  title: string;
  outlet: string;
  publishDate: Date;
  extractDate: Date;
  status: 'published' | 'draft' | 'archived' | 'pending';
  agentName: string;
  excerpt: string;
  onPress: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│ 📄 Título del contenido             │ ← Title (2 lines max)
│ El Sol • Hace 2 horas • [Publicado] │ ← Meta (Badge status)
│ Por: Agente Reportero               │ ← Agent name
│ Lorem ipsum dolor sit amet...       │ ← Excerpt (3 lines max)
└─────────────────────────────────────┘
```

**Elementos:**
- **Card:** Component `Card` de rn-reusables
- **Title:** Text 16px, font-semibold, line-clamp 2
- **Badge Status:** Variant según estado
  - Published: `default` (verde)
  - Draft: `secondary` (gris)
  - Pending: `outline` (amarillo)
  - Archived: `destructive` (rojo)
- **Meta:** Text 12px, color muted-foreground
- **Spacing:** gap-3 (12px) entre elementos

---

## 4. FLUJO DE INTERACCIÓN

### 4.1 Aplicar Filtros

```
Usuario toca [≣] Filter Button
    ↓
Bottom Sheet aparece con animación slide-up
    ↓
Usuario selecciona filtros (múltiples secciones)
    ↓
Usuario toca [Aplicar Filtros]
    ↓
Sheet se cierra con animación
    ↓
Lista muestra loading state (skeleton cards)
    ↓
Chips de filtros activos aparecen
    ↓
Contenido filtrado se muestra con fade-in
    ↓
Badge en Filter Button actualiza contador
```

**Tiempos:**
- Animación sheet: 300ms ease-out
- Loading skeleton: mínimo 200ms (evitar flicker)
- Fade-in contenido: 200ms

---

### 4.2 Remover Filtro Individual

```
Usuario toca [×] en Chip
    ↓
Haptic feedback (light impact)
    ↓
Chip desaparece con fade-out (150ms)
    ↓
Lista se actualiza automáticamente
    ↓
Si era el último filtro, barra de chips desaparece
```

---

### 4.3 Limpiar Todos los Filtros

```
Usuario toca [Limpiar todo]
    ↓
Alert dialog de confirmación (opcional)
    ↓
Todos los chips desaparecen
    ↓
Lista vuelve al estado inicial
    ↓
Badge en Filter Button vuelve a 0
```

---

## 5. ESTADOS DE UI

### 5.1 Loading State

**Durante carga inicial o cambio de filtros:**

```
┌─────────────────────────────────────┐
│ [Skeleton Card con shimmer effect]  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│ ░░░░ • ░░░░ • ░░░░                  │
│ ░░░░░░░░░░░░░░░                     │
└─────────────────────────────────────┘
```

**Componente:** `ContentCardSkeleton.tsx`
- Background: muted (gris claro)
- Animación: Shimmer de izquierda a derecha
- Cantidad: 3-5 skeleton cards

---

### 5.2 Empty State - Sin Resultados

**Cuando filtros no encuentran contenidos:**

```
┌─────────────────────────────────────┐
│                                     │
│              🔍                      │
│                                     │
│     No se encontraron resultados    │
│                                     │
│  Intenta ajustar los filtros o      │
│  cambia los criterios de búsqueda   │
│                                     │
│     [Limpiar filtros]               │
│                                     │
└─────────────────────────────────────┘
```

**Elementos:**
- Icon: Lucide `SearchX` (48px)
- Title: Text 18px, font-semibold
- Description: Text 14px, muted-foreground
- Button: Variant `outline`, abre sheet de filtros

---

### 5.3 Empty State - Sin Contenidos

**Cuando no hay contenidos en el sistema:**

```
┌─────────────────────────────────────┐
│                                     │
│              📝                      │
│                                     │
│     Aún no hay contenido generado   │
│                                     │
│  Los contenidos generados por       │
│  los agentes aparecerán aquí        │
│                                     │
│     [Ir a generador]                │
│                                     │
└─────────────────────────────────────┘
```

---

### 5.4 Error State

**Cuando falla la carga de datos:**

```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                      │
│                                     │
│     Error al cargar contenidos      │
│                                     │
│  Por favor, intenta nuevamente      │
│  o verifica tu conexión             │
│                                     │
│     [Reintentar]                    │
│                                     │
└─────────────────────────────────────┘
```

**Elementos:**
- Icon: Lucide `AlertTriangle` (48px), color destructive
- Button: Variant `default`, reintenta la petición

---

### 5.5 Filtered State

**Indicador visual de filtros activos:**

- Badge en Filter Button con contador (1-9+)
- Chips bar visible con scroll horizontal
- Color primary en chips activos
- Count total de resultados: "Mostrando 15 de 245 contenidos"

---

## 6. SISTEMA DE COLORES Y ESPACIADOS

### 6.1 Color Palette

```typescript
const filterColors = {
  // Filtros Activos
  activeChip: 'bg-primary text-primary-foreground',

  // Estados de contenido
  status: {
    published: 'bg-green-500/10 text-green-700 border-green-300',
    draft: 'bg-secondary text-secondary-foreground',
    pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
    archived: 'bg-destructive/10 text-destructive border-destructive/30',
  },

  // Botones
  filterButton: 'bg-background border-border',
  applyButton: 'bg-primary text-primary-foreground',
  clearButton: 'text-destructive',

  // Estados especiales
  disabled: 'opacity-50',
  hover: 'active:bg-accent', // para mobile
};
```

---

### 6.2 Espaciados (Spacing Scale)

```typescript
const spacing = {
  xs: 4,   // gap-1
  sm: 8,   // gap-2
  md: 12,  // gap-3
  lg: 16,  // gap-4
  xl: 24,  // gap-6
  xxl: 32, // gap-8
};

// Aplicaciones específicas
const componentSpacing = {
  cardPadding: 24,
  screenPadding: 24,
  sectionGap: 16,
  chipGap: 8,
  filterItemGap: 12,
  buttonGap: 12,
};
```

---

### 6.3 Tipografía

```typescript
const typography = {
  // Headers
  screenTitle: { fontSize: 28, fontFamily: 'Aleo-Bold', lineHeight: 36 },
  sectionTitle: { fontSize: 16, fontFamily: 'Aleo-SemiBold', lineHeight: 24 },

  // Content
  cardTitle: { fontSize: 16, fontFamily: 'Aleo-SemiBold', lineHeight: 22 },
  cardMeta: { fontSize: 12, fontFamily: 'Aleo-Regular', lineHeight: 18 },
  cardExcerpt: { fontSize: 14, fontFamily: 'Aleo-Regular', lineHeight: 20 },

  // Filters
  filterLabel: { fontSize: 14, fontFamily: 'Aleo-Medium', lineHeight: 20 },
  filterOption: { fontSize: 14, fontFamily: 'Aleo-Regular', lineHeight: 20 },
  chipText: { fontSize: 12, fontFamily: 'Aleo-Medium', lineHeight: 16 },

  // Buttons
  buttonText: { fontSize: 14, fontFamily: 'Aleo-SemiBold', lineHeight: 20 },
};
```

---

## 7. ACCESIBILIDAD

### 7.1 Touch Targets

**Mínimo 44x44px para todos los elementos interactivos:**

- ✅ Filter button: 44x44px
- ✅ Search input height: 44px
- ✅ Checkbox/Radio: 44x44px (área tappable, visual 20px)
- ✅ Chips "X" button: 32px chip height con 24px tap area
- ✅ Bottom sheet options: 48px altura

---

### 7.2 Contraste de Colores

**Cumplimiento WCAG 2.1 AA:**

| Elemento | Fondo | Texto | Ratio | Status |
|----------|-------|-------|-------|--------|
| Primary Button | #f1ef47 | #1a1a1a | 9.5:1 | ✅ AAA |
| Card Text | #FFFFFF | #111827 | 16.6:1 | ✅ AAA |
| Muted Text | #F3F4F6 | #6B7280 | 4.8:1 | ✅ AA |
| Status Badge | varies | varies | >4.5:1 | ✅ AA |

**Testeo recomendado:** Contrast Checker de WebAIM

---

### 7.3 Labels y Roles

```typescript
// Ejemplos de implementación accesible
<Pressable
  role="button"
  accessibilityLabel="Abrir filtros de contenido"
  accessibilityHint="Toca para ver opciones de filtrado"
>

<Checkbox
  accessibilityLabel="Filtrar por contenido publicado"
  accessibilityRole="checkbox"
  accessibilityState={{ checked: isPublishedChecked }}
/>

<View
  accessibilityRole="list"
  accessibilityLabel="Lista de contenidos generados"
>
```

---

### 7.4 Focus y Navegación

- **Orden lógico de tabulación** (para teclados externos)
- **Skip links** para saltar a contenido principal
- **Focus visible** en elementos interactivos
- **Anuncios de cambios** con `accessibilityLiveRegion`

```typescript
<View
  accessibilityLiveRegion="polite"
  accessibilityLabel={`${filteredCount} resultados encontrados`}
/>
```

---

## 8. CONSIDERACIONES DE PERFORMANCE

### 8.1 Paginación Eficiente

**Estrategia:** Infinite Scroll con Windowing

```typescript
interface PaginationConfig {
  pageSize: 20,           // Items por página
  prefetchPages: 1,       // Páginas a pre-cargar
  windowSize: 60,         // Items en memoria (3 páginas)
  loadThreshold: 0.8,     // Cargar al 80% del scroll
}
```

**Implementación sugerida:**
- `@tanstack/react-query` con `useInfiniteQuery`
- `@legendapp/list` para virtualización (ya instalado)
- Debounce de búsqueda: 300ms

---

### 8.2 Optimización de Filtros

**Cache de resultados:**
```typescript
const queryKey = ['contents', sortBy, status, outlets, dateRange, agentType];
// React Query cachea automáticamente por key
```

**Debouncing:**
- Search input: 300ms
- Date pickers: 500ms (permiten ajustar)
- Checkboxes: Aplicar inmediatamente (cambio final)

---

### 8.3 Animaciones Performantes

**Usar Reanimated para:**
- Bottom sheet slide up/down
- Chip fade in/out
- Skeleton shimmer

**Evitar:**
- Re-renders innecesarios con `React.memo`
- Cálculos pesados en el render
- Imágenes sin optimizar (usar `expo-image`)

---

## 9. IMPLEMENTACIÓN TÉCNICA

### 9.1 Stack Recomendado

```typescript
// Componentes UI
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';

// Bottom Sheet
import { BottomSheet } from '@gorhom/bottom-sheet'; // Agregar si no existe

// Date Picker
import DateTimePicker from '@react-native-community/datetimepicker';

// Icons
import { Search, SlidersHorizontal, X, Calendar, ChevronDown } from 'lucide-react-native';

// Data Fetching
import { useInfiniteQuery } from '@tanstack/react-query';

// Virtualization
import { FlashList } from '@shopify/flash-list'; // O @legendapp/list
```

---

### 9.2 Estructura de Archivos Propuesta

```
/src/features/generated-content/
├── components/
│   ├── FilterHeader.tsx
│   ├── ActiveFiltersBar.tsx
│   ├── FilterBottomSheet.tsx
│   ├── ContentCard.tsx
│   ├── ContentCardSkeleton.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   └── filters/
│       ├── SortSection.tsx
│       ├── StatusSection.tsx
│       ├── OutletSection.tsx
│       ├── DateRangeSection.tsx
│       └── AgentTypeSection.tsx
├── hooks/
│   ├── useContentFilters.ts
│   ├── useContentQuery.ts
│   └── useFilterPersistence.ts
├── types/
│   └── filters.types.ts
└── utils/
    └── filterHelpers.ts

/app/(protected)/(tabs)/
└── generated-content.tsx  ← Screen principal
```

---

### 9.3 Type Definitions

```typescript
// filters.types.ts
export type SortField = 'publishDate' | 'extractDate' | 'title';
export type SortOrder = 'asc' | 'desc';
export type ContentStatus = 'published' | 'draft' | 'archived' | 'pending';

export interface FilterState {
  search: string;
  sortBy: {
    field: SortField;
    order: SortOrder;
  };
  status: ContentStatus[];
  outlets: string[]; // IDs de outlets
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  agentType: string | null;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: any;
  type: 'search' | 'sort' | 'status' | 'outlet' | 'date' | 'agent';
}

export interface ContentItem {
  id: string;
  title: string;
  excerpt: string;
  outlet: {
    id: string;
    name: string;
    logo?: string;
  };
  publishDate: Date;
  extractDate: Date;
  status: ContentStatus;
  agent: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ContentQueryParams extends FilterState {
  page: number;
  pageSize: number;
}
```

---

### 9.4 Custom Hook Ejemplo

```typescript
// useContentFilters.ts
import { useState, useCallback, useMemo } from 'react';
import type { FilterState, ActiveFilter } from '../types/filters.types';

const initialFilters: FilterState = {
  search: '',
  sortBy: { field: 'publishDate', order: 'desc' },
  status: [],
  outlets: [],
  dateRange: { from: null, to: null },
  agentType: null,
};

export function useContentFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const active: ActiveFilter[] = [];

    if (filters.search) {
      active.push({
        id: 'search',
        label: `Búsqueda: ${filters.search}`,
        value: filters.search,
        type: 'search',
      });
    }

    filters.status.forEach((status) => {
      active.push({
        id: `status-${status}`,
        label: status,
        value: status,
        type: 'status',
      });
    });

    // ... más lógica para otros filtros

    return active;
  }, [filters]);

  const removeFilter = useCallback((id: string) => {
    // Lógica para remover filtro específico
  }, []);

  const clearAll = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    filters,
    activeFilters,
    activeFiltersCount: activeFilters.length,
    updateFilters,
    removeFilter,
    clearAll,
  };
}
```

---

## 10. MÉTRICAS DE ÉXITO

### 10.1 KPIs de UX

| Métrica | Target | Herramienta |
|---------|--------|-------------|
| Tiempo para aplicar filtro | < 3 segundos | Analytics |
| Claridad de filtros activos | 90% usuarios identifican | User Testing |
| Tasa de uso de filtros | > 60% sesiones | Analytics |
| Errores en rango fechas | < 5% intentos | Error Tracking |
| Satisfacción general | > 4.2/5.0 | In-app Survey |

---

### 10.2 Performance Targets

| Métrica | Target | Herramienta |
|---------|--------|-------------|
| Time to Interactive | < 2s | React DevTools |
| First Contentful Paint | < 1.5s | Performance API |
| Scroll FPS | > 55 fps | React Native Perf |
| Memory Usage | < 150 MB | Xcode/Android Studio |
| API Response Time | < 500ms | Network Inspector |

---

## 11. PLAN DE TESTING

### 11.1 Unit Testing

```typescript
// __tests__/useContentFilters.test.ts
describe('useContentFilters', () => {
  it('should initialize with default filters', () => {});
  it('should add status filter correctly', () => {});
  it('should remove individual filter', () => {});
  it('should clear all filters', () => {});
  it('should calculate active filters count', () => {});
});
```

---

### 11.2 Integration Testing

```typescript
// __tests__/FilterBottomSheet.test.tsx
describe('FilterBottomSheet', () => {
  it('should open and close smoothly', () => {});
  it('should apply filters on submit', () => {});
  it('should validate date range', () => {});
  it('should show error for invalid dates', () => {});
});
```

---

### 11.3 Usability Testing

**Script de Test con Usuarios:**

1. **Tarea 1:** "Encuentra todos los contenidos publicados del outlet 'El Sol'"
   - Métrica: Tiempo para completar, errores cometidos

2. **Tarea 2:** "Ordena los contenidos por fecha de extracción más antigua"
   - Métrica: ¿Encuentra la opción correcta?

3. **Tarea 3:** "Filtra contenidos del último mes"
   - Métrica: ¿Usa correctamente el date picker?

4. **Tarea 4:** "Elimina todos los filtros activos"
   - Métrica: ¿Identifica el botón "Limpiar todo"?

**Criterio de éxito:** 80% de usuarios completan todas las tareas sin ayuda

---

## 12. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: MVP (Sprint 1-2)
- [ ] Componente FilterHeader básico
- [ ] Lógica de filtros con hook personalizado
- [ ] Bottom Sheet con secciones Sort y Status
- [ ] Content Card con información básica
- [ ] Loading y Empty states

### Fase 2: Funcionalidad Completa (Sprint 3)
- [ ] Outlet multi-select con modal
- [ ] Date Range Picker integrado
- [ ] Agent Type filter
- [ ] Active Filters Bar con chips
- [ ] Persistencia de filtros en AsyncStorage

### Fase 3: Optimización (Sprint 4)
- [ ] Infinite scroll con virtualización
- [ ] Skeleton loaders optimizados
- [ ] Animaciones con Reanimated
- [ ] Caché de queries inteligente
- [ ] Prefetching de páginas

### Fase 4: Polish (Sprint 5)
- [ ] Testing completo (unit + integration)
- [ ] Usability testing con usuarios
- [ ] Ajustes de accesibilidad
- [ ] Performance profiling
- [ ] Documentación técnica

---

## 13. NOTAS FINALES

### Consideraciones Adicionales

1. **Dark Mode:** El sistema de colores HSL en `global.css` ya soporta dark mode. Asegurar que todos los componentes de filtro funcionen correctamente en ambos temas.

2. **Tablets:** La app ya tiene soporte responsivo. Los filtros deben adaptarse:
   - Tablets: Bottom Sheet puede ser lateral (drawer)
   - Active Filters: Más chips visibles sin scroll

3. **Offline:** Usar React Query con persistencia para:
   - Cachear últimos resultados
   - Mostrar contenido offline
   - Sincronizar al reconectar

4. **i18n:** Preparar strings para internacionalización:
   ```typescript
   const strings = {
     filters: {
       title: 'Filtros',
       apply: 'Aplicar Filtros',
       clear: 'Limpiar',
       // ...
     }
   };
   ```

5. **Analytics:** Trackear eventos clave:
   - `filter_opened`
   - `filter_applied` (con tipos de filtros)
   - `filter_cleared`
   - `search_performed`

---

## ARCHIVOS DE REFERENCIA

**Rutas absolutas importantes:**

- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/global.css` - Sistema de colores
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/tailwind.config.js` - Config Tailwind
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/components/ui/` - Componentes UI base
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/(tabs)/home.tsx` - Referencia de pantalla
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/schemas/content-agent.schema.ts` - Schema de datos

---

**Fin del documento de diseño UX v1.0**
