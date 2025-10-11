# 📋 PLAN DE IMPLEMENTACIÓN - Crear Nuevo Outlet desde Mobile App

**Proyecto:** Mobile Expo Dashboard - Pachuca Noticias
**Fecha:** 2025-10-10
**Desarrollador:** Jarvis para Coyotito
**Feature:** Formulario para crear y testear nuevos sitios web (outlets) desde la app móvil

---

## 📊 ANÁLISIS: LO QUE TENEMOS VS LO QUE NECESITAMOS

### ✅ LO QUE YA TENEMOS

#### **Backend (api-nueva)**
- ✅ Endpoint `POST /generator-pro/websites` - Crear nuevo sitio
- ✅ Endpoint `POST /generator-pro/websites/test-listing-selectors` - Probar selectores de listado
- ✅ Endpoint `POST /generator-pro/websites/test-individual-content` - Probar selectores de contenido
- ✅ Modelo `WebsiteConfig` con todos los campos necesarios

#### **Mobile (mobile-expo)**
- ✅ Patrón establecido: Servicios → Hooks → Componentes
- ✅ ApiClient con auth automática
- ✅ UI Components: Card, Button, Input, Label, Text, ScrollView
- ✅ Navegación con Expo Router file-based
- ✅ NativeWind para estilos
- ✅ Tipos en `/src/types/outlet.types.ts` - CreateOutletDto, TestListingDto, TestContentDto, etc.
- ✅ Servicio `/src/services/outlets/outletApi.ts` - createOutlet(), testListingSelectors(), testContentSelectors()
- ✅ Tab "Sitios" en `/app/(protected)/(tabs)/extract.tsx` - Lista de outlets
- ✅ Carpeta `/app/(protected)/outlet/` - Para rutas de outlet

#### **Dash Web (dash-coyote) - Referencia**
- ✅ `SitiosWebTab.tsx` con formulario completo de creación
- ✅ Tres botones de prueba: Test Selectors, Test Listing, Test Content
- ✅ Dialog/Alert para mostrar resultados de pruebas

---

### ❌ LO QUE NECESITAMOS IMPLEMENTAR

#### **Mobile (mobile-expo)**
- ❌ Botón "Crear Sitio" en pantalla Extract integrado con el diseño
- ❌ Hooks React Query para crear outlet y testear
- ❌ Pantalla `/app/(protected)/outlet/create.tsx` - Formulario de creación
- ❌ Pantalla `/app/(protected)/outlet/test-listing-result.tsx` - Resultados de prueba de listado
- ❌ Pantalla `/app/(protected)/outlet/test-content-result.tsx` - Resultados de prueba de contenido
- ❌ Personalizar colores del tab bar iOS (gota/bubble effect)
- ❌ Mostrar contenido completo (no acotado) en detalles de post extraído

---

## 🎯 DIFERENCIAS CLAVE CON EL DASH WEB

| Característica | Dash Web | Mobile App |
|----------------|----------|------------|
| **Formulario** | Dialog modal | Pantalla completa dedicada |
| **Pruebas** | Resultados en Dialog modal | Navegación a pantalla de resultados |
| **Botón crear** | IconPlus en header de tabla | Botón flotante/sticky en lista de outlets |
| **Validación** | Inline en formulario | Visual con badges y borders rojos |
| **Navegación** | Modal → Close | Push → Back |

---

## 🏗️ ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────┐
│  EXTRACT SCREEN (Lista de Outlets)                         │
│  /app/(protected)/(tabs)/extract.tsx                        │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Outlet 1   │  │ Outlet 2   │  │ Outlet 3   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  [+ Crear Nuevo Sitio] ← Botón sticky/flotante            │
└─────────────────────────────────────────────────────────────┘
                        ↓ Navigation
┌─────────────────────────────────────────────────────────────┐
│  CREATE OUTLET SCREEN                                       │
│  /app/(protected)/outlet/create.tsx                         │
│                                                              │
│  1. [Header: Nuevo Sitio Web]                              │
│  2. [Sección: Información General]                         │
│     - Nombre                                                │
│     - URL base                                              │
│     - URL listado                                           │
│     - URL prueba (opcional)                                 │
│  3. [Sección: Selectores Listado]                          │
│     - articleLinks                                          │
│  4. [Sección: Selectores Contenido]                        │
│     - title, content, image, date, author, category        │
│  5. [Botones Sticky]                                        │
│     - [🧪 Probar Listado]                                  │
│     - [🔍 Probar Contenido]                                │
│     - [💾 Guardar Sitio]                                   │
└─────────────────────────────────────────────────────────────┘
                ↓ Navigation (al probar)
┌─────────────────────────────────────────────────────────────┐
│  TEST LISTING RESULT SCREEN                                │
│  /app/(protected)/outlet/test-listing-result.tsx            │
│                                                              │
│  ✅ Encontradas 15 URLs:                                   │
│  • https://example.com/noticia-1                           │
│  • https://example.com/noticia-2                           │
│  • ...                                                      │
│                                                              │
│  [< Volver al formulario]                                  │
└─────────────────────────────────────────────────────────────┘
                        O
┌─────────────────────────────────────────────────────────────┐
│  TEST CONTENT RESULT SCREEN                                 │
│  /app/(protected)/outlet/test-content-result.tsx            │
│                                                              │
│  ✅ Contenido extraído correctamente:                      │
│                                                              │
│  Título: "Título del artículo"                             │
│  Contenido: "Lorem ipsum..."                               │
│  Imágenes: 3 encontradas                                   │
│  Autor: "Juan Pérez"                                        │
│  Fecha: "2025-10-10"                                        │
│  Categoría: "Política"                                      │
│                                                              │
│  [< Volver al formulario]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 ESTRUCTURA DE DATOS

### **CreateOutletFormData (Estado Local del Formulario)**
```typescript
interface CreateOutletFormData {
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl: string; // opcional pero siempre presente en form
  listingSelectors: {
    articleLinks: string;
  };
  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    imageSelector: string;
    dateSelector: string;
    authorSelector: string;
    categorySelector: string;
  };
}
```

### **TestListingResponse (del backend)**
```typescript
interface TestListingResponse {
  success: boolean;
  urls: string[];
  count: number;
}
```

### **TestContentResponse (del backend)**
```typescript
interface TestContentResponse {
  success: boolean;
  title: string;
  content: string;
  images: string[];
  author?: string;
  publishedAt?: string;
  category?: string;
}
```

---

## 🎨 DISEÑO UX PROPUESTO

### **Pantalla: Extract con Botón Crear**
```
┌─────────────────────────────────────┐
│  Sitios Web                          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📰 El Sol de Pachuca            │ │
│ │ URLs: 50 | Contenidos: 45       │ │
│ │ [Ver Detalles] [Extraer Ahora] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📰 Milenio                       │ │
│ │ URLs: 30 | Contenidos: 28       │ │
│ │ [Ver Detalles] [Extraer Ahora] │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [+ Crear Nuevo Sitio]               │  ← Botón sticky
└─────────────────────────────────────┘
```

### **Pantalla: Formulario de Creación**
```
┌─────────────────────────────────────┐
│  < Volver    Nuevo Sitio Web        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ INFORMACIÓN GENERAL              │ │
│ │ ─────────────────────────────── │ │
│ │ Nombre del sitio *              │ │
│ │ [                              ] │ │
│ │                                  │ │
│ │ URL base *                      │ │
│ │ [https://                      ] │ │
│ │                                  │ │
│ │ URL de listado *                │ │
│ │ [https://                      ] │ │
│ │                                  │ │
│ │ URL de prueba                   │ │
│ │ [https://                      ] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ SELECTORES LISTADO               │ │
│ │ ─────────────────────────────── │ │
│ │ Selector de links *             │ │
│ │ [a.article-link                ] │ │
│ │ Helper: CSS selector para links │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ SELECTORES CONTENIDO             │ │
│ │ ─────────────────────────────── │ │
│ │ Título *                        │ │
│ │ [h1.title                      ] │ │
│ │                                  │ │
│ │ Contenido *                     │ │
│ │ [.article-body                 ] │ │
│ │                                  │ │
│ │ Imagen                          │ │
│ │ [img.main-image                ] │ │
│ │                                  │ │
│ │ Fecha                           │ │
│ │ [time[datetime]                ] │ │
│ │                                  │ │
│ │ Autor                           │ │
│ │ [.author-name                  ] │ │
│ │                                  │ │
│ │ Categoría                       │ │
│ │ [.category                     ] │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [🧪 Probar Listado]             │ │
│ │ [🔍 Probar Contenido]           │ │
│ │ [💾 Guardar Sitio]              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Mobile - Agregar Botón "Crear Sitio" en Extract**
**Objetivo:** Integrar botón para crear nuevo sitio en la pantalla Extract

#### Micro-tareas:
1. **Modificar pantalla Extract**
   - Archivo: `/app/(protected)/(tabs)/extract.tsx` 📝 MODIFICAR
   - Agregar botón sticky al final del ScrollView
   - Diseño: TouchableOpacity con bg-[#f1ef47], icono Plus
   - Texto: "Crear Nuevo Sitio"
   - onPress: `router.push('/outlet/create')`

2. **Diseño del botón**
   - Ubicación: Fuera del ScrollView, sticky en el footer
   - Color de fondo: `#f1ef47` (amarillo Coyote)
   - Texto: Negro, font-semibold
   - Icono: Plus de lucide-react-native
   - Altura mínima: 56px (touch target)
   - Padding horizontal: 16px
   - Border radius: rounded-lg

---

### **FASE 2: Mobile - Hooks React Query para Outlet**
**Objetivo:** Crear hooks para crear outlet y testear selectores

#### Micro-tareas:
1. **Crear hooks en useOutlets**
   - Archivo: `/src/hooks/useOutlets.ts` 📝 MODIFICAR (ya existe)
   - Agregar hooks:
     - `useCreateOutlet()` - Mutation para crear outlet
       ```typescript
       useMutation({
         mutationFn: (data: CreateOutletDto) => outletApi.createOutlet(data),
         onSuccess: () => {
           queryClient.invalidateQueries({ queryKey: outletKeys.all });
           router.back(); // Volver a lista
         }
       })
       ```
     - `useTestListingSelectors()` - Mutation para probar selectores de listado
       ```typescript
       useMutation({
         mutationFn: (data: TestListingDto) => outletApi.testListingSelectors(data),
         onSuccess: (result) => {
           // Navegar a pantalla de resultados
           router.push({
             pathname: '/outlet/test-listing-result',
             params: { result: JSON.stringify(result) }
           });
         }
       })
       ```
     - `useTestContentSelectors()` - Mutation para probar selectores de contenido
       ```typescript
       useMutation({
         mutationFn: (data: TestContentDto) => outletApi.testContentSelectors(data),
         onSuccess: (result) => {
           router.push({
             pathname: '/outlet/test-content-result',
             params: { result: JSON.stringify(result) }
           });
         }
       })
       ```

2. **Verificar servicios API existen**
   - Archivo: `/src/services/outlets/outletApi.ts` ✅ YA EXISTE
   - Métodos ya implementados:
     - `createOutlet(data)` ✅
     - `testListingSelectors(data)` ✅
     - `testContentSelectors(data)` ✅

---

### **FASE 3: Mobile - Pantalla Create Outlet**
**Objetivo:** Implementar `/app/(protected)/outlet/create.tsx`

#### Micro-tareas:
1. **Crear estructura base del formulario**
   - Archivo: `/app/(protected)/outlet/create.tsx` ✨ NUEVO
   - Layout: SafeAreaView + ScrollView + Sticky Footer
   - Stack.Screen con header "Nuevo Sitio Web"
   - Estado local para formData:
     ```typescript
     const [formData, setFormData] = useState<CreateOutletFormData>({
       name: '',
       baseUrl: '',
       listingUrl: '',
       testUrl: '',
       listingSelectors: { articleLinks: 'a[href]' },
       contentSelectors: {
         titleSelector: '',
         contentSelector: '',
         imageSelector: '',
         dateSelector: '',
         authorSelector: '',
         categorySelector: ''
       }
     });
     ```

2. **Sección 1: Información General (Card)**
   - Card con CardHeader "Información General"
   - Input para `name` (requerido)
   - Input para `baseUrl` (requerido)
   - Input para `listingUrl` (requerido)
   - Input para `testUrl` (opcional)
   - Labels y placeholders claros
   - Helper text debajo de cada input

3. **Sección 2: Selectores Listado (Card)**
   - Card con CardHeader "Selectores de Listado"
   - Input para `articleLinks` (requerido)
   - Placeholder: "a.article-link, .news-item a"
   - Helper text: "Selector CSS para extraer links de artículos"

4. **Sección 3: Selectores Contenido (Card)**
   - Card con CardHeader "Selectores de Contenido"
   - Input para `titleSelector` (requerido)
   - Input para `contentSelector` (requerido)
   - Input para `imageSelector` (opcional)
   - Input para `dateSelector` (opcional)
   - Input para `authorSelector` (opcional)
   - Input para `categorySelector` (opcional)
   - Helper text para cada uno

5. **Validación de campos**
   - Estado de validación local
   - Campos requeridos marcados con asterisco (*)
   - Border rojo en inputs vacíos al intentar submit
   - Badge "Requerido" cuando vacío

6. **Botones sticky en footer**
   - Tres botones en View fuera del ScrollView
   - Botón 1: "Probar Listado" (bg-blue-600)
     - onPress: Validar campos de listado → Ejecutar testListingSelectors
     - Disabled si falta listingUrl o articleLinks
   - Botón 2: "Probar Contenido" (bg-purple-600)
     - onPress: Validar campos de contenido → Ejecutar testContentSelectors
     - Disabled si falta testUrl o selectors requeridos
   - Botón 3: "Guardar Sitio" (bg-[#f1ef47])
     - onPress: Validar todos los campos → Ejecutar createOutlet
     - Disabled si faltan campos requeridos

7. **Estados de loading en botones**
   - ActivityIndicator cuando mutation isPending
   - Texto cambia a "Probando..." o "Guardando..."
   - Deshabilitar todos los botones durante loading

---

### **FASE 4: Mobile - Pantallas de Resultados de Pruebas**
**Objetivo:** Implementar pantallas para mostrar resultados

#### Micro-tareas:
1. **Crear pantalla Test Listing Result**
   - Archivo: `/app/(protected)/outlet/test-listing-result.tsx` ✨ NUEVO
   - Obtener result de params: `useLocalSearchParams()`
   - Parse JSON del result
   - Mostrar:
     - ✅ Badge "Éxito" o ❌ "Error"
     - Número de URLs encontradas
     - Lista de URLs (ScrollView con maxHeight)
   - Botón "Volver al formulario": `router.back()`

2. **Crear pantalla Test Content Result**
   - Archivo: `/app/(protected)/outlet/test-content-result.tsx` ✨ NUEVO
   - Obtener result de params
   - Parse JSON del result
   - Mostrar en Cards separadas:
     - Card "Título": Valor extraído
     - Card "Contenido": Preview (primeros 500 chars)
     - Card "Imágenes": Número de imágenes + lista de URLs
     - Card "Autor": Valor extraído (si existe)
     - Card "Fecha": Valor extraído (si existe)
     - Card "Categoría": Valor extraído (si existe)
   - Botón "Volver al formulario": `router.back()`

3. **Manejo de errores en pruebas**
   - Mostrar Card de error si success === false
   - Mensaje de error del backend
   - Botón de retry o volver

---

### **FASE 5: Mobile - Personalizar Tab Bar iOS**
**Objetivo:** Cambiar colores del tab bar (gota/bubble)

#### Micro-tareas:
1. **Investigar documentación de NativeTabs**
   - Buscar en docs de expo-router
   - Buscar props para personalizar colores
   - Ejemplo: `tintColor`, `accentColor`, `indicatorColor`

2. **Aplicar personalización**
   - Archivo: `/app/(protected)/(tabs)/_layout.tsx` 📝 MODIFICAR
   - Agregar props de estilo a `<NativeTabs>`
   - Color activo: `#f1ef47` (amarillo Coyote)
   - Color inactivo: gris (#6B7280)
   - Color de la "gota" (bubble): `#f1ef47`

3. **Verificar en iOS**
   - Probar en simulador iOS
   - Verificar que los colores se apliquen correctamente

---

### **FASE 6: Mobile - Mostrar Contenido Completo (No Acotado)**
**Objetivo:** Modificar pantalla de detalle de post para mostrar contenido completo

#### Micro-tareas:
1. **Identificar dónde se muestra contenido acotado**
   - Buscar en: `/app/(protected)/extracted/[id].tsx`
   - Verificar si hay limitación de caracteres (`.substring()`, `.slice()`)

2. **Quitar limitación**
   - Mostrar `content` completo sin acortar
   - Usar ScrollView con contenido expandible
   - Agregar "Leer más" si el contenido es muy largo (opcional)

3. **Mejorar legibilidad**
   - Usar Text con `numberOfLines` removido
   - Line height adecuado
   - Padding para separar del contenedor

---

### **FASE 7: Testing y Refinamiento**
**Objetivo:** Probar flujo completo y ajustar detalles

#### Micro-tareas:
1. **Probar flujo de creación completo**
   - Navegar desde Extract → Create
   - Llenar formulario
   - Probar Listado → Ver resultados → Volver
   - Probar Contenido → Ver resultados → Volver
   - Guardar Sitio → Verificar que aparece en lista

2. **Probar validaciones**
   - Intentar guardar con campos vacíos
   - Verificar mensajes de error
   - Verificar que botones se deshabilitan correctamente

3. **Probar estados de loading**
   - Verificar ActivityIndicator en botones
   - Verificar que UI se actualiza después de crear

4. **Probar navegación**
   - Back button funciona en todas las pantallas
   - Params se pasan correctamente entre pantallas

5. **Probar personalización de tab bar**
   - Verificar colores en iOS
   - Verificar que la "gota" es del color correcto

6. **Probar contenido completo**
   - Verificar que se muestra todo el texto
   - Verificar scroll funciona correctamente

---

## 📂 ESTRUCTURA DE ARCHIVOS A CREAR/MODIFICAR

### **Mobile (mobile-expo)**
```
mobile-expo/
├── app/
│   └── (protected)/
│       ├── (tabs)/
│       │   ├── extract.tsx                      📝 MODIFICAR (agregar botón crear)
│       │   └── _layout.tsx                      📝 MODIFICAR (personalizar tab bar)
│       ├── outlet/
│       │   ├── create.tsx                       ✨ NUEVO (formulario)
│       │   ├── test-listing-result.tsx          ✨ NUEVO (resultados listado)
│       │   └── test-content-result.tsx          ✨ NUEVO (resultados contenido)
│       └── extracted/
│           └── [id].tsx                         📝 MODIFICAR (contenido completo)
└── src/
    └── hooks/
        └── useOutlets.ts                        📝 MODIFICAR (agregar 3 hooks)
```

---

## 🚨 RESTRICCIONES Y CONSIDERACIONES

### **TypeScript**
- ❌ **PROHIBIDO usar `any`**
- ✅ Interfaces explícitas para todos los DTOs
- ✅ Tipos ya existen en `/src/types/outlet.types.ts`

### **Backend (api-nueva)**
- ❌ **PROHIBIDO levantar servidor**
- ✅ Solo hacer build si se modifica: `yarn build`
- ✅ Endpoints ya existen y funcionan

### **Mobile**
- ✅ Seguir patrón: Servicios → Hooks → Componentes
- ✅ Usar ApiClient.getRawClient() para peticiones
- ✅ Servicios API ya existen en `outletApi.ts`
- ✅ Validación en frontend antes de enviar al backend
- ✅ Cache invalidation después de crear outlet

### **Navegación**
- ✅ Usar Expo Router file-based
- ✅ Pasar params con `router.push({ pathname, params })`
- ✅ Usar `useLocalSearchParams()` para obtener params

### **UX**
- ✅ Loading states con ActivityIndicator
- ✅ Validación visual de campos requeridos
- ✅ Helper text debajo de inputs
- ✅ Botones deshabilitados cuando faltan campos
- ✅ Navegación clara (volver funciona)

---

## 📊 DECISIONES TOMADAS

### **1. Navegación para Resultados de Pruebas**
✅ **DECISIÓN:** Usar rutas dedicadas en lugar de modales

**Razón:** Mejor UX en mobile, permite guardar estado en history, volver atrás funciona naturalmente

**Implementación:**
- `/outlet/test-listing-result` - Muestra URLs encontradas
- `/outlet/test-content-result` - Muestra contenido extraído
- Pasar result via params: `{ result: JSON.stringify(result) }`

---

### **2. Ubicación del Botón "Crear Sitio"**
✅ **DECISIÓN:** Botón sticky en el footer de la pantalla Extract

**Razón:** Siempre visible, fácil acceso, integrado con el diseño

**Diseño:** Botón full-width con bg-[#f1ef47], icono Plus, texto "Crear Nuevo Sitio"

---

### **3. Validación de Formulario**
✅ **DECISIÓN:** Validación visual en el cliente antes de enviar

**Razón:** Mejor UX, feedback inmediato, menos requests fallidos

**Implementación:**
- Campos requeridos marcados con (*)
- Border rojo en campos vacíos
- Badge "Requerido" cuando falta dato
- Botones deshabilitados si faltan campos

---

### **4. Personalización de Tab Bar**
✅ **DECISIÓN:** Investigar primero la API de NativeTabs

**Razón:** Expo Router v3+ tiene API específica para personalización, necesitamos encontrar la prop correcta

**Tareas:**
1. Leer docs de expo-router
2. Buscar ejemplos de personalización
3. Aplicar colores: activo `#f1ef47`, inactivo `#6B7280`

---

## 📈 MÉTRICAS DE ÉXITO

- ✅ Botón "Crear Sitio" visible en pantalla Extract
- ✅ Navegación fluida Extract → Create → Results → Back
- ✅ Formulario completo con todas las secciones
- ✅ Validación de campos requeridos funcional
- ✅ Tres botones de acción funcionan correctamente
- ✅ Prueba de listado muestra URLs encontradas
- ✅ Prueba de contenido muestra datos extraídos
- ✅ Guardar outlet crea el registro y actualiza la lista
- ✅ Tab bar con colores personalizados (iOS)
- ✅ Contenido de posts se muestra completo (no acotado)
- ✅ Sin errores de TypeScript (no `any`)
- ✅ Loading states implementados
- ✅ Error handling implementado

---

**FIN DEL PLAN DE IMPLEMENTACIÓN**
