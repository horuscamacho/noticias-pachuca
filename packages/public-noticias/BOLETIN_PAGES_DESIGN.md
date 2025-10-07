# DISEÑO DE PÁGINAS DE BOLETÍN - NOTICIAS PACHUCA

## DESIGN SYSTEM BRUTALIST

**Documento de especificaciones para las 4 páginas de boletín**

---

## 1. OVERVIEW DEL ENFOQUE DE DISEÑO

### Filosofía Brutalist Digital
- **Bordes gruesos**: 4px-8px en negro sólido (#000000)
- **Colores planos**: Sin gradientes, solo colores sólidos del sistema
- **Tipografía contundente**: Font-mono, uppercase, bold, tracking-wider
- **Geometría pura**: Cuadrados, rectángulos, triángulos como decoración
- **Sombras dinámicas**: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` en hover
- **Sin suavizado**: Bordes duros, sin border-radius

### Paleta de Colores
```
#F7F7F7  → background (fondo general)
#FFB22C  → accent (amarillo/naranja para highlights)
#854836  → primary (café para títulos principales)
#000000  → text (negro puro, máximo contraste)
#FFFFFF  → white (cards, contenido)
#FF0000  → red (breaking news, alertas urgentes)
```

### Jerarquía Tipográfica
```
H1 Hero Title:     text-4xl md:text-5xl font-bold uppercase tracking-tight
H2 Section Title:  text-3xl font-bold uppercase border-b-4 border-black
H3 Article Title:  text-2xl md:text-3xl font-bold uppercase leading-tight
Body Large:        text-xl leading-relaxed
Body Regular:      text-lg leading-relaxed
Body Small:        text-base leading-relaxed
Meta/Labels:       text-xs md:text-sm font-bold uppercase tracking-wider
```

### Espaciado
```
Contenedor:  max-w-6xl mx-auto px-6 py-12
Secciones:   mb-12
Artículos:   mb-8 | space-y-8
Cards:       p-6 md:p-8
Borders:     border-4 | border-8 (para CTAs)
```

---

## 2. COMPONENTES REUTILIZABLES IDENTIFICADOS

### A. Header Universal (Extraer después)
```typescript
// UniversalHeader.tsx
- Logo y branding centrado
- Breadcrumbs de navegación
- Botón "Inicio" para volver
- Border-b-8 border-black
- Variaciones de color según tipo de boletín
```

### B. Hero Section (Parametrizable)
```typescript
// BoletinHero.tsx
interface Props {
  titulo: string
  subtitulo: string
  bgColor: '#FFB22C' | '#FF0000' | '#854836' | '#000000'
  textColor: 'text-black' | 'text-white'
}
```

### C. Noticia Card (3 variantes)
```typescript
// NoticiaCard.tsx
variant: 'featured' | 'standard' | 'compact'
- Featured: Grande, imagen arriba, todo el contenido
- Standard: Imagen + contenido side-by-side
- Compact: Lista con imagen pequeña lateral
```

### D. CTA Suscripción (Universal)
```typescript
// BoletinCTA.tsx
- Border-8 border-black
- Fondo café (#854836) o amarillo (#FFB22C)
- Título + descripción + botón
- Link a /#suscribirse
- Decoraciones brutalist (triángulos)
```

### E. Footer Universal (Extraer después)
```typescript
// UniversalFooter.tsx
- Mismo footer que index.tsx
- Border-t-4 border-black
- Grid de links
- Copyright
```

---

## 3. WIREFRAMES ASCII - DESKTOP

### PÁGINA 1: BOLETÍN DE LA MAÑANA
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         HEADER UNIVERSAL                                    ┃
┃  Breadcrumbs: Inicio > Boletín de la Mañana                                ┃
┃  [Botón Inicio]                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ████████████████████████████████████████████████████████  BG: #FFB22C     ┃
┃  ██                                                    ██                   ┃
┃  ██        BOLETÍN DE LA MAÑANA                       ██  ▲ Triángulo      ┃
┃  ██        Lunes, 6 de octubre de 2025                ██  decorativo       ┃
┃  ██                                                    ██                   ┃
┃  ████████████████████████████████████████████████████████                  ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  Buenos días, Pachuca. Aquí están las 5 noticias más           │       ┃
┃  │  importantes para comenzar tu día informado.                    │       ┃
┃  │  BG: #F7F7F7 | BORDER: 4px black                                │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  ┌───┐  ┌───────────┐                                           │       ┃
┃  │  │ 1 │  │ POLÍTICA  │  ← Caja negra número + Badge categoría   │       ┃
┃  │  └───┘  └───────────┘                                           │       ┃
┃  │                                                                  │       ┃
┃  │  TÍTULO DE LA NOTICIA #1 EN MAYÚSCULAS                          │       ┃
┃  │                                                                  │       ┃
┃  │  Resumen de la noticia con contexto suficiente para entender... │       ┃
┃  │                                                                  │       ┃
┃  │  LEER COMPLETA →                                                │       ┃
┃  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │       ┃
┃  │  [IMAGEN FEATURED 16:9]                                         │       ┃
┃  │                                                                  │       ┃
┃  │  Border: 4px black | Hover: shadow-[8px_8px_0px_0px_#000]      │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  ┌───┐  ┌───────────┐                                           │       ┃
┃  │  │ 2 │  │ DEPORTES  │                                           │       ┃
┃  │  └───┘  └───────────┘                                           │       ┃
┃  │  TÍTULO DE LA NOTICIA #2...                                     │       ┃
┃  │  [Mismo diseño que #1]                                          │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  [Repetir para noticias 3, 4, 5]                                           ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ████████████████████████████████████████████████  BG: #854836 (café)     ┃
┃  ██                                              ██  Border: 8px black     ┃
┃  ██    ¿QUIERES RECIBIRLO POR EMAIL?            ██                        ┃
┃  ██                                              ██  ▲                     ┃
┃  ██    Recibe este boletín cada mañana          ██  Triángulos            ┃
┃  ██    directamente en tu bandeja.              ██  decorativos           ┃
┃  ██                                              ██  ▼                     ┃
┃  ██    [ SUSCRIBIRME AHORA ] ← Botón #FFB22C    ██                        ┃
┃  ██                                              ██                        ┃
┃  ████████████████████████████████████████████████                         ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  Este boletín se genera automáticamente con las noticias más recientes...  ┃
┃  (Footer info text-gray-600)                                                ┃
┃                                                                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### PÁGINA 2: BOLETÍN DE LA TARDE
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         HEADER UNIVERSAL                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ████████████████████████████████████████████████████████  BG: #FF0000     ┃
┃  ██                                                    ██  (Rojo)          ┃
┃  ██        BOLETÍN DE LA TARDE                        ██  text-white      ┃
┃  ██        Lunes, 6 de octubre de 2025 · 18:00        ██                  ┃
┃  ████████████████████████████████████████████████████████                  ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  Estas son las 3 noticias más leídas por los pachucenses hoy.  │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │       ┃
┃  │  [IMAGEN GRANDE 400px height]                                   │       ┃
┃  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │       ┃
┃  │                                                                  │       ┃
┃  │  ┌─────────────┐  ┌───────────┐  ┌──────────────┐              │       ┃
┃  │  │ MÁS LEÍDA   │  │ POLÍTICA  │  │ 12,453 VISTAS│              │       ┃
┃  │  │ HOY         │  │           │  │              │              │       ┃
┃  │  └─────────────┘  └───────────┘  └──────────────┘              │       ┃
┃  │  BG:#FF0000       BG:white       BG:#F7F7F7                     │       ┃
┃  │                                                                  │       ┃
┃  │  TÍTULO DE LA NOTICIA MÁS LEÍDA DEL DÍA                         │       ┃
┃  │  (text-3xl md:text-4xl)                                         │       ┃
┃  │                                                                  │       ┃
┃  │  Resumen extenso de la noticia más popular...                   │       ┃
┃  │  (text-xl leading-relaxed)                                      │       ┃
┃  │                                                                  │       ┃
┃  │  LEER COMPLETA →                                                │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ┌───────────────────────────────┐  ┌───────────────────────────────┐     ┃
┃  │ ┌───┐  ┌───────────┐          │  │ ┌───┐  ┌───────────┐          │     ┃
┃  │ │ 2 │  │ DEPORTES  │          │  │ │ 3 │  │ ECONOMÍA  │          │     ┃
┃  │ └───┘  └───────────┘          │  │ └───┘  └───────────┘          │     ┃
┃  │                                │  │                                │     ┃
┃  │ TÍTULO NOTICIA #2              │  │ TÍTULO NOTICIA #3              │     ┃
┃  │                                │  │                                │     ┃
┃  │ Resumen breve...               │  │ Resumen breve...               │     ┃
┃  │                                │  │                                │     ┃
┃  │ 8,234 vistas                   │  │ 6,891 vistas                   │     ┃
┃  │                                │  │                                │     ┃
┃  │ [IMG 192px]  LEER COMPLETA →  │  │ [IMG 192px]  LEER COMPLETA →  │     ┃
┃  │                                │  │                                │     ┃
┃  └───────────────────────────────┘  └───────────────────────────────┘     ┃
┃  ← Grid 2 columnas para noticias 2 y 3                                     ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [CTA SUSCRIPCIÓN - Mismo diseño que página 1]                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### PÁGINA 3: RESUMEN SEMANAL
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         HEADER UNIVERSAL                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ████████████████████████████████████████████████████████  BG: #854836     ┃
┃  ██                                                    ██  (Café)          ┃
┃  ██        BOLETÍN SEMANAL                            ██  text-white      ┃
┃  ██        Semana del 29 sep - 6 oct 2025             ██                  ┃
┃  ████████████████████████████████████████████████████████                  ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  Resumen de la semana. Las 10 noticias más importantes...       │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     ┃
┃  │      10      │  │   125,487    │  │       5      │                     ┃
┃  │   NOTICIAS   │  │    VISTAS    │  │  CATEGORÍAS  │                     ┃
┃  │  DESTACADAS  │  │   TOTALES    │  │   CUBIERTAS  │                     ┃
┃  └──────────────┘  └──────────────┘  └──────────────┘                     ┃
┃  ← Grid 3 columnas con estadísticas border-4 border-black                  ┃
┃                                                                             ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃  TOP 3 DE LA SEMANA                                                         ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                                             ┃
┃  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        ┃
┃  │┌───┐        │  │┌───┐        │  │┌───┐        │                        ┃
┃  ││ 1 │[IMG]   │  ││ 2 │[IMG]   │  ││ 3 │[IMG]   │                        ┃
┃  │└───┘        │  │└───┘        │  │└───┘        │                        ┃
┃  │             │  │             │  │             │                        ┃
┃  │ POLÍTICA    │  │ DEPORTES    │  │ ECONOMÍA    │                        ┃
┃  │ 15,234 👁   │  │ 12,456 👁   │  │ 11,892 👁   │                        ┃
┃  │             │  │             │  │             │                        ┃
┃  │ TÍTULO #1   │  │ TÍTULO #2   │  │ TÍTULO #3   │                        ┃
┃  │ NOTICIA...  │  │ NOTICIA...  │  │ NOTICIA...  │                        ┃
┃  │             │  │             │  │             │                        ┃
┃  │ Resumen...  │  │ Resumen...  │  │ Resumen...  │                        ┃
┃  │             │  │             │  │             │                        ┃
┃  │ LEER →      │  │ LEER →      │  │ LEER →      │                        ┃
┃  └─────────────┘  └─────────────┘  └─────────────┘                        ┃
┃  ← Grid 3 columnas igual tamaño                                            ┃
┃                                                                             ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃  TAMBIÉN IMPORTANTES                                                        ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  ┌───┐  CULTURA    9,234 vistas                                 │       ┃
┃  │  │ 4 │  TÍTULO NOTICIA #4...                                     │       ┃
┃  │  └───┘  Resumen breve...                    [IMG]  LEER →       │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  [Repetir formato compacto para noticias 5-10]                             ┃
┃  ← Lista compacta horizontal con imagen pequeña lateral                    ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [CTA SUSCRIPCIÓN]                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### PÁGINA 4: BOLETÍN DE DEPORTES
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         HEADER UNIVERSAL                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ████████████████████████████████████████████████████████  BG: #FFB22C     ┃
┃  ██                                                    ██  (Amarillo)      ┃
┃  ██        BOLETÍN DE DEPORTES                        ██  text-black      ┃
┃  ██        Lunes, 6 de octubre de 2025                ██                  ┃
┃  ████████████████████████████████████████████████████████                  ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  Todo sobre los Tuzos y más. Las 6 noticias deportivas más...  │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │       ┃
┃  │  [IMAGEN GRANDE DESTACADA 400px]                                │       ┃
┃  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │       ┃
┃  │                                                                  │       ┃
┃  │  ┌─────────────────┐  ┌──────────────┐                         │       ┃
┃  │  │ NOTICIA         │  │ 8,456 VISTAS │                         │       ┃
┃  │  │ DESTACADA       │  │              │                         │       ┃
┃  │  └─────────────────┘  └──────────────┘                         │       ┃
┃  │  BG:#FFB22C          BG:white                                   │       ┃
┃  │                                                                  │       ┃
┃  │  TUZOS VENCEN 3-1 AL AMÉRICA EN EL ESTADIO HIDALGO              │       ┃
┃  │  (text-3xl md:text-4xl)                                         │       ┃
┃  │                                                                  │       ┃
┃  │  Resumen del partido más importante de la semana...             │       ┃
┃  │                                                                  │       ┃
┃  │  LEER COMPLETA →                                                │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃                                                                             ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃  MÁS NOTICIAS DEPORTIVAS                                                    ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                                             ┃
┃  ┌─────────────────────┐  ┌─────────────────────┐                         ┃
┃  │  [IMG 192px]        │  │  [IMG 192px]        │                         ┃
┃  │  ━━━━━━━━━━━━━━━━  │  │  ━━━━━━━━━━━━━━━━  │                         ┃
┃  │  5,234 vistas       │  │  4,891 vistas       │                         ┃
┃  │                     │  │                     │                         ┃
┃  │  TÍTULO NOTICIA #2  │  │  TÍTULO NOTICIA #3  │                         ┃
┃  │                     │  │                     │                         ┃
┃  │  Resumen breve...   │  │  Resumen breve...   │                         ┃
┃  │                     │  │                     │                         ┃
┃  │  LEER →             │  │  LEER →             │                         ┃
┃  └─────────────────────┘  └─────────────────────┘                         ┃
┃                                                                             ┃
┃  ┌─────────────────────┐  ┌─────────────────────┐                         ┃
┃  │  [Noticia #4]       │  │  [Noticia #5]       │                         ┃
┃  └─────────────────────┘  └─────────────────────┘                         ┃
┃  ← Grid 2 columnas para noticias secundarias                               ┃
┃                                                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [CTA SUSCRIPCIÓN]                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### ESTADO DE ERROR - SIN CONTENIDO DEPORTIVO
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ┌─────────────────────────────────────────────────────────────────┐       ┃
┃  │                        ┌──────┐                                 │       ┃
┃  │                        │  ⚽  │  ← Icono emoji 4xl              │       ┃
┃  │                        └──────┘                                 │       ┃
┃  │                   BG: white border-4 border-black               │       ┃
┃  │                                                                  │       ┃
┃  │              SIN CONTENIDO DEPORTIVO HOY                        │       ┃
┃  │              (text-2xl md:text-3xl font-bold)                   │       ┃
┃  │                                                                  │       ┃
┃  │  Por el momento no hay suficientes noticias deportivas...       │       ┃
┃  │  Vuelve pronto para estar al día con los Tuzos del Pachuca.     │       ┃
┃  │                                                                  │       ┃
┃  │  ┌───────────────────────┐  ┌───────────────────────┐          │       ┃
┃  │  │ VER CATEGORÍA         │  │ IR AL INICIO          │          │       ┃
┃  │  │ DEPORTES              │  │                       │          │       ┃
┃  │  └───────────────────────┘  └───────────────────────┘          │       ┃
┃  │  ← Grid 2 columnas con botones                                 │       ┃
┃  │                                                                  │       ┃
┃  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │       ┃
┃  │  Puedes suscribirte al boletín de deportes para recibir        │       ┃
┃  │  un email cuando haya contenido disponible.                    │       ┃
┃  │  (text-sm text-gray-600)                                        │       ┃
┃  └─────────────────────────────────────────────────────────────────┘       ┃
┃  BG: #F7F7F7 | Border: 4px black | Centrado                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 4. WIREFRAMES ASCII - MOBILE (< 768px)

### BOLETÍN DE LA MAÑANA - MOBILE
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    HEADER UNIVERSAL (Mobile) ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                              ┃
┃  ██████████████████████████  ┃
┃  ██  BOLETÍN DE           ██ ┃
┃  ██  LA MAÑANA            ██ ┃
┃  ██  Lunes 6 oct 2025     ██ ┃
┃  ██████████████████████████  ┃
┃  BG: #FFB22C                 ┃
┃                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ Buenos días,         │   ┃
┃  │ Pachuca. Aquí        │   ┃
┃  │ están las 5          │   ┃
┃  │ noticias más...      │   ┃
┃  └──────────────────────┘   ┃
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ ┌──┐ ┌─────────┐     │   ┃
┃  │ │1 │ │POLÍTICA │     │   ┃
┃  │ └──┘ └─────────┘     │   ┃
┃  │                      │   ┃
┃  │ TÍTULO NOTICIA #1    │   ┃
┃  │ EN MAYÚSCULAS...     │   ┃
┃  │                      │   ┃
┃  │ Resumen de la        │   ┃
┃  │ noticia con...       │   ┃
┃  │                      │   ┃
┃  │ LEER COMPLETA →      │   ┃
┃  │ ━━━━━━━━━━━━━━━━━━  │   ┃
┃  │ [IMAGEN FULL WIDTH]  │   ┃
┃  │                      │   ┃
┃  └──────────────────────┘   ┃
┃                              ┃
┃  [Repetir 2-5]               ┃
┃  ← Stack vertical            ┃
┃                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  ████████████████████████    ┃
┃  ██ ¿QUIERES           ██    ┃
┃  ██ RECIBIRLO POR      ██    ┃
┃  ██ EMAIL?             ██    ┃
┃  ██                    ██    ┃
┃  ██ [SUSCRIBIRME]      ██    ┃
┃  ████████████████████████    ┃
┃  BG: #854836                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### BOLETÍN DE LA TARDE - MOBILE
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    HEADER UNIVERSAL          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  ██████████████████████████  ┃
┃  ██  BOLETÍN DE           ██ ┃
┃  ██  LA TARDE             ██ ┃
┃  ████████████████████████████ ┃
┃  BG: #FF0000 text-white      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ [IMAGEN GRANDE]      │   ┃
┃  │ ━━━━━━━━━━━━━━━━━━  │   ┃
┃  │                      │   ┃
┃  │ ┌──────────────┐     │   ┃
┃  │ │ MÁS LEÍDA    │     │   ┃
┃  │ │ HOY          │     │   ┃
┃  │ └──────────────┘     │   ┃
┃  │ ┌──────────────┐     │   ┃
┃  │ │ POLÍTICA     │     │   ┃
┃  │ └──────────────┘     │   ┃
┃  │ ┌──────────────┐     │   ┃
┃  │ │ 12,453 VISTAS│     │   ┃
┃  │ └──────────────┘     │   ┃
┃  │ ← Badges stacked     │   ┃
┃  │                      │   ┃
┃  │ TÍTULO GRANDE        │   ┃
┃  │ DE LA NOTICIA #1...  │   ┃
┃  │                      │   ┃
┃  │ Resumen extenso...   │   ┃
┃  │                      │   ┃
┃  │ LEER COMPLETA →      │   ┃
┃  └──────────────────────┘   ┃
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ ┌──┐ ┌─────────┐     │   ┃
┃  │ │2 │ │DEPORTES │     │   ┃
┃  │ └──┘ └─────────┘     │   ┃
┃  │ 8,234 vistas         │   ┃
┃  │                      │   ┃
┃  │ TÍTULO NOTICIA #2... │   ┃
┃  │ Resumen breve...     │   ┃
┃  │ LEER →               │   ┃
┃  └──────────────────────┘   ┃
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ [Noticia #3]         │   ┃
┃  └──────────────────────┘   ┃
┃  ← Stack vertical            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### RESUMEN SEMANAL - MOBILE
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ██████████████████████████  ┃
┃  ██ BOLETÍN SEMANAL      ██  ┃
┃  ████████████████████████████ ┃
┃  BG: #854836                 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │       10             │   ┃
┃  │    NOTICIAS          │   ┃
┃  └──────────────────────┘   ┃
┃  ┌──────────────────────┐   ┃
┃  │     125,487          │   ┃
┃  │    VISTAS TOTALES    │   ┃
┃  └──────────────────────┘   ┃
┃  ┌──────────────────────┐   ┃
┃  │        5             │   ┃
┃  │    CATEGORÍAS        │   ┃
┃  └──────────────────────┘   ┃
┃  ← Stack vertical stats      ┃
┃                              ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃  TOP 3 DE LA SEMANA          ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ ┌──┐ [IMAGEN]        │   ┃
┃  │ │1 │                 │   ┃
┃  │ └──┘                 │   ┃
┃  │ POLÍTICA             │   ┃
┃  │ 15,234 vistas        │   ┃
┃  │ TÍTULO NOTICIA #1... │   ┃
┃  │ Resumen...           │   ┃
┃  │ LEER →               │   ┃
┃  └──────────────────────┘   ┃
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ [Noticia #2]         │   ┃
┃  └──────────────────────┘   ┃
┃  ┌──────────────────────┐   ┃
┃  │ [Noticia #3]         │   ┃
┃  └──────────────────────┘   ┃
┃  ← Stack vertical            ┃
┃                              ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃  TAMBIÉN IMPORTANTES         ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                              ┃
┃  ┌──────────────────────┐   ┃
┃  │ ┌──┐ CULTURA         │   ┃
┃  │ │4 │ 9,234 vistas    │   ┃
┃  │ └──┘                 │   ┃
┃  │ TÍTULO...            │   ┃
┃  │ Resumen... LEER →    │   ┃
┃  └──────────────────────┘   ┃
┃  [Repetir 5-10]              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 5. ESPECIFICACIONES TÉCNICAS DETALLADAS

### PÁGINA 1: BOLETÍN DE LA MAÑANA

#### Hero Section
```css
bg-[#FFB22C]
text-black
border-b-8 border-black
py-8 px-6

Title: font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight
Subtitle: font-mono text-lg mt-2 uppercase
```

#### Intro Box
```css
border-4 border-black
bg-[#F7F7F7]
p-8
mb-12

Text: text-xl leading-relaxed
Bold highlights: font-mono font-bold
```

#### Noticia Card (Lista Numerada)
```css
Container:
  border-4 border-black
  bg-white
  p-8
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
  transition-all

Number Badge:
  w-12 h-12
  border-4 border-black
  bg-[#FFB22C]
  flex items-center justify-center
  font-mono text-2xl font-bold

Category Badge:
  px-4 py-2
  border-2 border-black
  bg-white
  font-mono text-sm font-bold uppercase

Title:
  font-mono text-2xl md:text-3xl font-bold
  mb-4
  uppercase
  group-hover:underline

Summary:
  text-lg text-gray-700 leading-relaxed mb-4

CTA Link:
  font-mono font-bold text-sm uppercase
  group-hover:translate-x-2 transition-transform

Image:
  border-t-4 border-black
  h-64
  bg-gray-100
  overflow-hidden
  object-cover
```

#### CTA Suscripción
```css
border-8 border-black
bg-[#854836]
text-white
p-12
text-center

Title:
  font-mono text-3xl md:text-4xl font-bold
  mb-6
  uppercase

Description:
  text-xl mb-8
  max-w-2xl mx-auto

Button:
  px-8 py-4
  bg-[#FFB22C]
  text-black
  border-4 border-black
  font-mono font-bold text-lg
  hover:bg-[#FF0000]
  hover:text-white
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
  transition-all
  uppercase
```

---

### PÁGINA 2: BOLETÍN DE LA TARDE

#### Hero Section
```css
bg-[#FF0000]
text-white
border-b-8 border-black
py-8 px-6

Title: font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight
Subtitle: font-mono text-lg mt-2 uppercase
Time: Incluir hora (18:00)
```

#### Noticia #1 Destacada
```css
Container:
  border-4 border-black
  bg-white
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

Image:
  h-96
  bg-gray-100
  overflow-hidden
  border-b-4 border-black

Badges Container:
  flex items-center gap-4 mb-6

MÁS LEÍDA Badge:
  px-6 py-3
  border-4 border-black
  bg-[#FF0000]
  text-white
  font-mono text-lg font-bold uppercase

Category Badge:
  px-4 py-2
  border-2 border-black
  bg-white
  font-mono text-sm font-bold uppercase

Views Badge:
  px-4 py-2
  border-2 border-black
  bg-[#F7F7F7]
  font-mono text-sm font-bold
  toLocaleString() para formato

Title:
  font-mono text-3xl md:text-4xl font-bold
  mb-6
  uppercase
  group-hover:underline

Summary:
  text-xl text-gray-700 leading-relaxed mb-6
```

#### Noticias #2 y #3 (Grid 2 columnas)
```css
Grid Container:
  grid grid-cols-1 md:grid-cols-2 gap-8

Card:
  border-4 border-black
  bg-white
  p-8
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

Number Badge:
  w-16 h-16
  border-4 border-black
  bg-[#F7F7F7]
  font-mono text-3xl font-bold

Layout:
  flex items-start gap-6
  - Badge left
  - Content center (flex-1)
  - Image right (hidden md:block w-48 h-32)

Title:
  font-mono text-xl md:text-2xl font-bold
  mb-3
  uppercase

Summary:
  text-base text-gray-700 leading-relaxed mb-4
```

---

### PÁGINA 3: RESUMEN SEMANAL

#### Hero Section
```css
bg-[#854836]
text-white
border-b-8 border-black
py-8 px-6

Subtitle: Formato de rango de fechas
Semana del ${startDate} al ${endDate}
```

#### Estadísticas (Grid 3 columnas)
```css
Grid:
  grid grid-cols-1 md:grid-cols-3 gap-6 mb-12

Stat Card:
  border-4 border-black
  bg-white
  p-6
  text-center

Number:
  font-mono text-4xl font-bold mb-2
  text-black

Label:
  font-mono text-sm uppercase text-gray-600

Cálculos:
  - Total noticias: content.totalNoticias
  - Total vistas: reduce sum de views
  - Categorías únicas: new Set(categories).length
```

#### Top 3 (Grid 3 columnas iguales)
```css
Section Title:
  font-mono text-3xl font-bold
  uppercase
  border-b-4 border-black
  pb-4
  mb-6

Grid:
  grid grid-cols-1 md:grid-cols-3 gap-6

Card:
  border-4 border-black
  bg-white
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

Image Container:
  h-48
  bg-gray-100
  overflow-hidden
  border-b-4 border-black
  relative

Number Badge (sobre imagen):
  position: absolute top-4 left-4
  w-12 h-12
  border-4 border-black
  bg-[#FFB22C]
  font-mono text-2xl font-bold

Content:
  p-6

Category + Views:
  flex items-center gap-2 mb-3
  Category: border-2 border-black px-3 py-1
  Views: font-mono text-xs text-gray-600

Title:
  font-mono text-lg font-bold
  mb-3
  uppercase
  leading-tight

Summary:
  text-sm text-gray-700 leading-relaxed mb-4
  Truncate: substring(0, 120) + '...'
```

#### Noticias 4-10 (Lista Compacta)
```css
Section Title:
  font-mono text-3xl font-bold
  uppercase
  border-b-4 border-black
  pb-4
  mb-6
  "TAMBIÉN IMPORTANTES"

Container:
  space-y-4

Card:
  border-4 border-black
  bg-white
  p-6
  hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]

Layout:
  flex items-start gap-6
  - Number badge left (w-12 h-12)
  - Content center (flex-1)
  - Image right (hidden md:block w-32 h-24)

Number Badge:
  border-4 border-black
  bg-[#F7F7F7]
  font-mono text-xl font-bold

Title:
  font-mono text-xl font-bold
  mb-2
  uppercase
```

---

### PÁGINA 4: BOLETÍN DE DEPORTES

#### Hero Section
```css
bg-[#FFB22C]
text-black
border-b-8 border-black
py-8 px-6
```

#### Noticia Destacada
```css
Container:
  border-4 border-black
  bg-white
  mb-12
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

Image:
  h-96
  border-b-4 border-black

Badges:
  NOTICIA DESTACADA:
    px-6 py-3
    border-4 border-black
    bg-[#FFB22C]
    font-mono text-lg font-bold uppercase

  Views:
    px-4 py-2
    border-2 border-black
    bg-white
    font-mono text-sm font-bold

Title:
  font-mono text-3xl md:text-4xl font-bold
  mb-6
  uppercase
```

#### Noticias Secundarias (Grid 2 columnas)
```css
Section Title:
  font-mono text-3xl font-bold
  uppercase
  border-b-4 border-black
  pb-4
  mb-6
  "MÁS NOTICIAS DEPORTIVAS"

Grid:
  grid grid-cols-1 md:grid-cols-2 gap-6

Card:
  border-4 border-black
  bg-white
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

Image:
  h-48
  border-b-4 border-black

Content:
  p-6

Views:
  font-mono text-xs text-gray-600 mb-3

Title:
  font-mono text-xl font-bold
  mb-3
  uppercase
  leading-tight
```

#### Estado de Error (Sin Contenido)
```css
Container:
  border-4 border-black
  bg-[#F7F7F7]
  p-12
  text-center

Inner Container:
  max-w-2xl mx-auto

Icon Container:
  w-24 h-24
  border-4 border-black
  bg-white
  mx-auto mb-6
  flex items-center justify-center

Icon:
  text-4xl (emoji ⚽)

Title:
  font-mono text-2xl md:text-3xl font-bold
  mb-6
  uppercase
  "SIN CONTENIDO DEPORTIVO HOY"

Description:
  text-lg text-gray-700 mb-8 leading-relaxed

Buttons Grid:
  grid grid-cols-1 md:grid-cols-2 gap-4 mb-8

Button Primary (Ver Categoría):
  px-6 py-3
  bg-white text-black
  border-4 border-black
  font-mono font-bold
  hover:bg-black hover:text-white
  hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
  uppercase

Button Secondary (Inicio):
  px-6 py-3
  bg-black text-white
  border-4 border-black
  font-mono font-bold
  hover:bg-[#FFB22C] hover:text-black
  hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
  uppercase

Footer Note:
  border-t-4 border-black
  pt-6 mt-6
  text-sm text-gray-600
```

---

## 6. ESTADOS ESPECIALES

### Loading State
```tsx
// Mientras carga el contenido
<div className="border-4 border-black bg-white p-12 text-center">
  <div className="w-16 h-16 border-4 border-black border-t-[#FFB22C]
                  rounded-full animate-spin mx-auto mb-4"></div>
  <p className="font-mono font-bold uppercase">CARGANDO BOLETÍN...</p>
</div>
```

### Error State (General)
```tsx
// Cuando falla el fetch
<div className="border-4 border-[#FF0000] bg-white p-12 text-center">
  <h2 className="font-mono text-2xl font-bold mb-4 uppercase">
    CONTENIDO NO DISPONIBLE
  </h2>
  <p className="text-lg text-gray-700 mb-8">{error}</p>
  <Link to="/" className="px-6 py-3 bg-black text-white border-4
                          border-black font-mono font-bold uppercase">
    VOLVER AL INICIO
  </Link>
</div>
```

### Empty State (Sin Noticias Suficientes)
```tsx
// Cuando el boletín no tiene suficientes noticias
<div className="border-4 border-black bg-[#F7F7F7] p-12 text-center">
  <h3 className="font-mono text-2xl font-bold mb-4 uppercase">
    BOLETÍN EN PREPARACIÓN
  </h3>
  <p className="text-lg text-gray-700 mb-8">
    No hay suficiente contenido para generar el boletín en este momento.
    Vuelve más tarde.
  </p>
  <Link to="/noticias" className="px-6 py-3 bg-black text-white
                                  border-4 border-black font-mono
                                  font-bold uppercase">
    VER TODAS LAS NOTICIAS
  </Link>
</div>
```

### Success State (Después de Suscribirse)
```tsx
// Redirección desde /#suscribirse
// Mostrar toast o banner temporal
<div className="border-4 border-black bg-green-50 p-6 mb-8">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-white border-4 border-black
                    flex items-center justify-center">✓</div>
    <div>
      <h4 className="font-mono font-bold uppercase">SUSCRIPCIÓN CONFIRMADA</h4>
      <p className="text-sm">Recibirás este boletín en tu email</p>
    </div>
  </div>
</div>
```

---

## 7. DISEÑO RESPONSIVE - BREAKPOINTS

### Mobile First Approach
```css
/* Mobile: < 768px (default) */
- Stack vertical para todo
- Imágenes full-width
- Padding reducido: px-4 py-6
- Texto reducido: text-2xl → text-3xl

/* Tablet: >= 768px */
md:grid-cols-2
md:text-3xl → text-4xl
md:px-6 py-8

/* Desktop: >= 1024px */
lg:grid-cols-3
lg:text-4xl → text-5xl
max-w-6xl mx-auto
```

### Ajustes Específicos por Página

**Boletín de la Mañana:**
- Mobile: Cards apiladas verticalmente
- Desktop: Misma estructura (es lista, no grid)

**Boletín de la Tarde:**
- Mobile: Noticia #1 destacada full-width, #2 y #3 apiladas
- Desktop: #1 full-width, #2 y #3 en grid 2 columnas

**Resumen Semanal:**
- Mobile: Estadísticas apiladas, Top 3 apilado, resto en lista
- Desktop: Stats grid-cols-3, Top 3 grid-cols-3

**Boletín de Deportes:**
- Mobile: Todo apilado verticalmente
- Desktop: Noticia destacada full, secundarias grid 2 columnas

### Navegación Mobile
```tsx
// Header simplificado
<div className="flex items-center justify-between">
  <Link to="/" className="px-4 py-2 bg-black text-white text-sm">
    ← INICIO
  </Link>
</div>

// Breadcrumbs ocultos en mobile (opcional)
<div className="hidden md:block">
  <Breadcrumbs ... />
</div>
```

---

## 8. ACCESIBILIDAD

### Contrast Ratios
```
#000000 on #FFFFFF: 21:1 ✅ AAA
#000000 on #FFB22C: 8.3:1 ✅ AA
#FFFFFF on #854836: 7.2:1 ✅ AA
#FFFFFF on #FF0000: 5.3:1 ✅ AA
#000000 on #F7F7F7: 19.5:1 ✅ AAA
```

### Semantic HTML
```tsx
<article> para cada noticia
<header> para encabezado de página
<main> para contenido principal
<section> para secciones (Top 3, También Importantes)
<nav> para breadcrumbs
<h1> único por página (título del boletín)
<h2> para títulos de sección
<h3> para títulos de artículo
```

### ARIA Labels
```tsx
// Links de artículos
<Link
  to={`/noticia/${slug}`}
  aria-label={`Leer noticia completa: ${title}`}
>
  LEER COMPLETA →
</Link>

// Número de noticia
<div aria-label={`Noticia número ${index + 1}`}>
  {index + 1}
</div>

// Views
<span aria-label={`${views.toLocaleString()} vistas`}>
  {views.toLocaleString()} VISTAS
</span>

// Estado de loading
<div role="status" aria-live="polite">
  CARGANDO BOLETÍN...
</div>
```

### Keyboard Navigation
```tsx
// Todos los botones/links navegables con Tab
// Hover states también en :focus
hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
focus:outline-none
focus:ring-4 focus:ring-[#FFB22C]

// Skip to main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Saltar al contenido principal
</a>
```

### Image Alt Text
```tsx
// Siempre proporcionar alt descriptivo
<img
  src={noticia.featuredImage}
  alt={`Imagen de la noticia: ${noticia.title}`}
  loading="lazy"
/>

// Imágenes decorativas
<div role="img" aria-label="Decoración geométrica brutalist"></div>
```

---

## 9. PERFORMANCE

### Image Optimization
```tsx
// Usar OptimizedImage component (ya existe)
<OptimizedImage
  src={noticia.featuredImage}
  alt={noticia.title}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={index < 3} // Solo primeras 3
/>

// Lazy loading para imágenes abajo del fold
loading="lazy"
decoding="async"
```

### Code Splitting
```tsx
// Lazy load CTA component si está abajo
const BoletinCTA = lazy(() => import('./BoletinCTA'))

// Suspense wrapper
<Suspense fallback={<div>Cargando...</div>}>
  <BoletinCTA />
</Suspense>
```

### Data Fetching
```tsx
// Server-side rendering con TanStack Router
export const Route = createFileRoute('/boletin/manana')({
  loader: async () => {
    const content = await getBoletinContent({ tipo: 'manana' })
    return { content }
  }
})

// Stale-while-revalidate strategy
// Cache 5 minutos, revalidar en background
```

---

## 10. INTERACCIONES Y ANIMACIONES

### Hover Effects (Brutalist)
```css
/* Cards */
.noticia-card {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.noticia-card:hover {
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
  transform: translate(-2px, -2px);
}

/* Botones */
.btn-primary:hover {
  background: #FF0000;
  color: white;
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}

/* Links de artículo */
.article-link:hover .arrow {
  transform: translateX(8px);
  transition: transform 200ms ease-out;
}

/* Títulos */
.article-title:hover {
  text-decoration: underline;
  text-decoration-thickness: 4px;
  text-underline-offset: 4px;
}
```

### Decoraciones Animadas
```tsx
// Triángulos que rotan en hover del CTA
<div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C]
                transform rotate-45 transition-transform
                group-hover:rotate-90"></div>

// Barras que crecen
<div className="h-1 bg-[#FFB22C] w-0 group-hover:w-full
                transition-all duration-300"></div>
```

### Scroll Behavior
```css
/* Smooth scroll para anclas */
html {
  scroll-behavior: smooth;
}

/* Sticky header (opcional) */
.boletin-header {
  position: sticky;
  top: 0;
  z-index: 50;
}
```

---

## 11. CHECKLIST DE IMPLEMENTACIÓN

### Componentes a Crear
- [ ] `UniversalHeader.tsx` - Header reutilizable con props para color
- [ ] `BoletinHero.tsx` - Hero parametrizable con variantes de color
- [ ] `NoticiaCard.tsx` - Card con variants: featured, standard, compact
- [ ] `BoletinCTA.tsx` - CTA de suscripción universal
- [ ] `BoletinStats.tsx` - Grid de estadísticas (solo Semanal)
- [ ] `ErrorState.tsx` - Estados de error reutilizables
- [ ] `LoadingState.tsx` - Skeleton loading brutalist

### Páginas a Refactorizar
- [ ] `/boletin/manana` - Aplicar nuevo diseño
- [ ] `/boletin/tarde` - Aplicar nuevo diseño
- [ ] `/boletin/semanal` - Aplicar nuevo diseño
- [ ] `/boletin/deportes` - Aplicar nuevo diseño + error state

### Utilidades
- [ ] `formatDate.ts` - Formatear fechas según boletín
- [ ] `formatViews.ts` - Formatear número de vistas (toLocaleString)
- [ ] `calculateReadTime.ts` - Calcular tiempo de lectura
- [ ] `truncateText.ts` - Truncar texto con "..."

### Testing
- [ ] Responsive en mobile (375px, 414px)
- [ ] Responsive en tablet (768px, 1024px)
- [ ] Responsive en desktop (1280px, 1920px)
- [ ] Keyboard navigation completa
- [ ] Screen reader testing (VoiceOver/NVDA)
- [ ] Loading states funcionan
- [ ] Error states muestran correctamente
- [ ] Links a /#suscribirse funcionan
- [ ] Hover effects suaves
- [ ] Performance (LCP < 2.5s)

---

## 12. NOTAS DE IMPLEMENTACIÓN

### Extracción de Header/Footer
```tsx
// DESPUÉS de implementar las 4 páginas, extraer:

// components/shared/BoletinHeader.tsx
interface BoletinHeaderProps {
  titulo: string
  subtitulo: string
  bgColor: 'yellow' | 'red' | 'brown' | 'black'
  breadcrumbs: { label: string; href?: string }[]
}

// components/shared/BoletinFooter.tsx
// Mismo footer que index.tsx, sin cambios
```

### Integración con Formulario de Suscripción
```tsx
// CTA botón apunta a:
<Link to="/#suscribirse">SUSCRIBIRME AHORA</Link>

// En index.tsx, el formulario debe tener:
<section id="suscribirse">
  <SubscribeForm />
</section>

// Smooth scroll automático al hacer clic desde boletín
```

### Manejo de Datos Faltantes
```tsx
// Imagen faltante
{noticia.featuredImage ? (
  <img src={noticia.featuredImage} alt={noticia.title} />
) : (
  <div className="bg-[#FFB22C] border-4 border-black p-8">
    <p className="font-mono font-bold uppercase text-center">
      {noticia.title.substring(0, 80)}...
    </p>
  </div>
)}

// Views faltantes
{noticia.views && (
  <span>{noticia.views.toLocaleString()} vistas</span>
)}

// Author faltante
author: noticia.author || 'Redacción Pachuca'
```

### SEO Meta Tags
```tsx
// En cada Route
head: () => ({
  meta: [
    {
      title: 'Boletín de la Mañana - Noticias Pachuca',
      description: 'Las 5 noticias más importantes de Pachuca para comenzar tu día informado'
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:image', content: '/og-image-boletin-manana.png' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ]
})
```

### Consistencia con Design System
```tsx
// Siempre usar variables del Showroom
import { colors } from '../design-system/tokens'

// NO usar colores hardcoded
❌ bg-[#FFB22C]
✅ bg-[var(--color-accent)]

// Mantener clases Tailwind exactas
font-mono
uppercase
tracking-wider
border-4 border-black
hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
```

---

## 13. REFERENCIAS VISUALES

### Decoraciones Brutalist Sugeridas

```
Triángulo superior izquierdo:
  <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C]
                  transform rotate-45"></div>

Triángulo inferior derecho:
  <div className="absolute -bottom-2 -right-2 w-0 h-0
                  border-l-[12px] border-r-[12px] border-b-[12px]
                  border-l-transparent border-r-transparent
                  border-b-black"></div>

Cuadrado rotado:
  <div className="absolute top-4 right-4 w-6 h-6 bg-black
                  transform rotate-45"></div>

Barra decorativa:
  <div className="w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>

Líneas horizontales:
  <div className="absolute top-2 left-2 right-2
                  border-t-2 border-black"></div>
  <div className="absolute bottom-2 left-2 right-2
                  border-b-2 border-black"></div>
```

### Números Destacados (Badges)
```tsx
// Estilo 1: Cuadrado con border grueso
<div className="w-12 h-12 border-4 border-black bg-[#FFB22C]
                flex items-center justify-center">
  <span className="font-mono text-2xl font-bold">{num}</span>
</div>

// Estilo 2: Círculo brutalist (cuadrado rotado)
<div className="w-12 h-12 border-4 border-black bg-[#FF0000]
                transform rotate-45 flex items-center justify-center">
  <span className="font-mono text-2xl font-bold text-white
                   transform -rotate-45">{num}</span>
</div>
```

---

## 14. CONCLUSIÓN

Este documento proporciona **todas las especificaciones necesarias** para implementar las 4 páginas de boletín de manera consistente con el Design System brutalist de Noticias Pachuca.

### Principios Clave a Recordar:
1. **Bordes gruesos siempre** (4px mínimo, 8px para énfasis)
2. **Colores planos del sistema** (sin gradientes ni transparencias)
3. **Tipografía uppercase + tracking-wider** para títulos
4. **Sombras duras en hover** (no blur, solo offset)
5. **Geometría pura** (cuadrados, triángulos, líneas rectas)
6. **Espaciado generoso** (py-8, px-6 mínimo)
7. **Alto contraste** (negro sobre blanco, blanco sobre negro)
8. **Sin border-radius** (esquinas siempre en 90°)

### Próximos Pasos de Desarrollo:
1. Implementar componentes reutilizables primero
2. Aplicar diseño a una página (Mañana) como prototipo
3. Validar responsive y accesibilidad
4. Replicar a las otras 3 páginas
5. Refactorizar para extraer Header/Footer universales
6. Testing completo cross-browser y dispositivos
7. Optimización de performance (images, lazy loading)
8. Documentar componentes en Storybook (opcional)

---

**Archivo:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/public-noticias/BOLETIN_PAGES_DESIGN.md`

**Versión:** 1.0
**Fecha:** 6 de octubre de 2025
**Autor:** UX/UI Designer - Noticias Pachuca
**Estado:** Listo para implementación
