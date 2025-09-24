# NOTICIAS PACHUCA - PRINCIPIOS DE DISEÑO BRUTALIST

## Filosofía del Design System

El design system de Noticias Pachuca está basado en la estética brutalist adaptada específicamente para medios digitales. Prioriza la **funcionalidad sobre la ornamentación**, el **contraste máximo para legibilidad** y la **arquitectura visual clara** para navegación eficiente de contenido noticioso.

---

## 🎯 PRINCIPIOS FUNDAMENTALES

### 1. CONTRASTE MÁXIMO
- **Negro puro (#000000) sobre blanco puro (#FFFFFF)** para texto principal
- Sin grises intermedios en elementos críticos
- Color usado únicamente para jerarquía y alertas

### 2. TIPOGRAFÍA ARQUITECTÓNICA
- **UPPERCASE para títulos y labels** (transmite autoridad y urgencia)
- **Letter-spacing amplio** para legibilidad en pantallas
- **Font-weights extremos** (400 y 700+) sin términos medios

### 3. GEOMETRÍA BRUTAL
- **Bordes duros de 2px-4px** en negro
- **Sombras geométricas** (shadow offset sin blur)
- **Formas rectangulares** sin border-radius

### 4. JERARQUÍA VISUAL AGRESIVA
- Tamaños de tipografía con **saltos pronunciados** (16px → 24px → 40px)
- **Espaciado generoso** entre elementos
- **Uso estratégico del color** para breaking news y CTAs

---

## 🔴 SISTEMA DE ALERTAS Y URGENCIA

### Breaking News
```css
background: #FF0000 (rojo puro)
color: #FFFFFF
border: 4px solid #000000
typography: UPPERCASE, BOLD, LETTER-SPACED
```

### Destacados
```css
background: #FFB22C (accent amarillo)
color: #000000
border: 2px solid #000000
typography: UPPERCASE, BOLD
```

### Contenido Regular
```css
background: #FFFFFF
color: #000000
border: 2px solid #000000
typography: Mixed case permitido en body text
```

---

## 📱 RESPONSIVE DESIGN BRUTALIST

### Mobile First (320px+)
- **Stack vertical** de todos los elementos
- **Touch targets mínimos de 44px**
- **Tipografía escalada proporcionalmente**

### Tablet (768px+)
- **Grid de 2 columnas** para artículos
- **Sidebar fijo** para navegación
- **Mantenimiento de proporciones brutalist**

### Desktop (1024px+)
- **Grid de 3-4 columnas** para contenido
- **Sidebar expandido** con widgets
- **Espaciado generoso** para breathing room

---

## 🎨 GUÍA DE IMPLEMENTACIÓN POR COMPONENTE

### HEADERS DE ARTÍCULO
```typescript
// Estructura jerárquica clara
<header>
  <CategoryLabel />     // Color de acento
  <Headline />          // Negro, UPPERCASE, bold
  <Byline />           // Gris, metadata
  <Timestamp />        // Gris, caption size
</header>
```

### CARDS DE ARTÍCULO
```typescript
// Variantes por importancia
Featured: border-4px, accent background
Standard: border-2px, white background
Compact: border-2px, minimal padding
```

### NAVEGACIÓN
```typescript
// Header principal
background: #000000
color: #FFFFFF
height: 64px
typography: UPPERCASE, BOLD

// Navegación de categorías
background: #F7F7F7
border: 2px solid #000000
buttons: Individual borders, hover states
```

### FORMULARIOS
```typescript
// Inputs consistentes
border: 2px solid #000000
padding: 12px 16px
typography: UPPERCASE placeholder
no border-radius
```

---

## ⚡ PERFORMANCE Y ACCESIBILIDAD

### Contraste
- **WCAG AAA compliance** con negro sobre blanco
- **4.5:1 mínimo** para todos los textos
- **Color nunca como único indicador**

### Tipografía
- **Font-size mínimo 16px** en móvil
- **Line-height 1.5+** para body text
- **Letter-spacing optimizado** para pantallas

### Interactividad
- **Focus states brutalist** (outline grueso negro)
- **Hover states sutiles** (cambio de background)
- **Touch targets 44px+** en móvil

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Tailwind CSS 4 Configuration
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'news-bg': '#F7F7F7',
        'news-accent': '#FFB22C',
        'news-primary': '#854836',
        'news-text': '#000000',
        'news-white': '#FFFFFF',
        'news-red': '#FF0000'
      },
      fontFamily: {
        'primary': ['Inter', 'system-ui', 'sans-serif']
      },
      spacing: {
        // Sistema de 8px
      },
      boxShadow: {
        'brutalist': '4px 4px 0 0 #000000',
        'brutalist-lg': '8px 8px 0 0 #000000'
      }
    }
  }
}
```

### Clases Utilitarias Personalizadas
```css
@layer utilities {
  .headline-1 {
    @apply text-6xl font-black uppercase tracking-wider leading-none;
  }

  .news-card {
    @apply bg-white border-2 border-black;
  }

  .btn-primary {
    @apply bg-black text-white px-6 py-3 font-bold uppercase tracking-wide border-2 border-black;
  }

  .brutalist-shadow {
    box-shadow: 4px 4px 0 0 #000000;
  }
}
```

---

## 📐 GRID SYSTEM ESPECÍFICO

### Homepage Layout
```
┌─────────────────┬─────────┐
│                 │ BREAK   │
│    FEATURED     │ NEWS    │
│    ARTICLE      │─────────│
│                 │ SIDEBAR │
│                 │         │
├─────┬─────┬─────┼─────────┤
│ ART │ ART │ ART │ WIDGETS │
│  2  │  3  │  4  │         │
└─────┴─────┴─────┴─────────┘
```

### Article Detail Layout
```
┌─────────────────┬─────────┐
│                 │ RELATED │
│    ARTICLE      │ STORIES │
│    CONTENT      │─────────│
│                 │ ADS     │
│                 │─────────│
│                 │ MORE    │
│                 │ NEWS    │
└─────────────────┴─────────┘
```

---

## 🔍 TESTING Y VALIDACIÓN

### Checklist Visual
- [ ] Contraste mínimo 4.5:1 en todos los textos
- [ ] Bordes consistentes (2px/4px) en negro
- [ ] Tipografía UPPERCASE en títulos y labels
- [ ] Espaciado múltiplo de 8px
- [ ] Sin border-radius en elementos

### Checklist Funcional
- [ ] Touch targets 44px+ en móvil
- [ ] Focus states visibles
- [ ] Loading states para contenido dinámico
- [ ] Error states claramente diferenciados
- [ ] Responsive comportamiento correcto

### Checklist de Contenido
- [ ] Jerarquía clara: Breaking > Featured > Standard
- [ ] Metadata consistente: Categoría, Autor, Fecha
- [ ] CTAs diferenciados por importancia
- [ ] Navegación intuitiva entre secciones

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Performance
- **Critical CSS inline** para above-the-fold
- **Font loading optimizado** (font-display: swap)
- **Lazy loading** para imágenes below-the-fold

### SEO
- **Estructura semántica** con HTML5 tags apropiados
- **Schema markup** para artículos de noticias
- **Meta tags optimizados** para social sharing

### Analytics
- **Event tracking** en CTAs principales
- **Reading time tracking** en artículos
- **Engagement metrics** por sección

---

*Esta guía debe ser el punto de referencia para cualquier implementación de UI en el sitio de Noticias Pachuca. Mantener la consistencia brutalist es crítico para la identidad de marca.*