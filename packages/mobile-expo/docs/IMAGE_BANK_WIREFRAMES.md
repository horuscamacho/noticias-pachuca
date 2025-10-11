# Image Bank - Visual Wireframes

**Companion Document to:** IMAGE_BANK_UX_SPECIFICATION.md
**Platform:** React Native (Mobile-First)

---

## SCREEN 1: Image List (Normal Mode)

```
┌─────────────────────────────────────────────┐
│  ⟨System Status Bar⟩                        │
├─────────────────────────────────────────────┤
│                                             │
│  Banco de Imágenes                    28px  │  ← Title (Aleo-Bold)
│  120 imágenes disponibles             14px  │  ← Subtitle (gray)
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ 🔽 Filtrar   │  │ 🔽 Ordenar   │        │  ← Outline buttons
│  └──────────────┘  └──────────────┘        │
│                                             │
│  ┌─────────────────────────────────────┐   │  ← Active filter chip
│  │ Deportes ✕                          │   │     (yellow tint)
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤ ← Divider
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │        │ │        │ │        │         │
│  │ IMG 1  │ │ IMG 2  │ │ IMG 3  │         │  ← 3-column grid
│  │        │ │        │ │        │         │     Square cards (1:1)
│  │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│         │     8px gaps
│  │Keyword │ │Keyword │ │Keyword │         │  ← Overlay gradient
│  └────────┘ └────────┘ └────────┘         │     Bottom 30%
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │        │ │        │ │        │         │
│  │ IMG 4  │ │ IMG 5  │ │ IMG 6  │         │
│  │        │ │        │ │        │         │
│  │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│         │
│  │Keyword │ │Keyword │ │Keyword │         │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │        │ │        │ │        │         │
│  │ IMG 7  │ │ IMG 8  │ │ IMG 9  │         │
│  │        │ │        │ │        │         │
│  │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│         │
│  │Keyword │ │Keyword │ │Keyword │         │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│             ⟲ Cargando más...              │  ← Infinite scroll
│                                             │
└─────────────────────────────────────────────┘
│ Inicio  Sitios  Contenidos [Imagenes] Stats│ ← Bottom tabs
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Tap card:** Navigate to detail screen
- **Long-press card (600ms):** Enter multi-select mode
- **Pull down:** Refresh images
- **Scroll up:** Sticky header becomes visible with shadow

---

## SCREEN 2: Image List (Multi-Select Mode)

```
┌─────────────────────────────────────────────┐
│  ⟨System Status Bar⟩                        │
├─────────────────────────────────────────────┤
│                                             │
│  ✕  3 seleccionados        [Selec. Todo]   │  ← Mode header
│      (gray text)            (text button)   │     Yellow accent
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │   ✓    │ │        │ │   ✓    │         │  ← Checkmarks visible
│  │  ▓▓▓   │ │  IMG2  │ │  ▓▓▓   │         │     Selected: yellow border
│  │  ▓▓▓   │ │        │ │  ▓▓▓   │         │     + checkmark (3px)
│  │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│         │
│  │Keyword │ │Keyword │ │Keyword │         │
│  └────────┘ └────────┘ └────────┘         │
│   SELECTED   NORMAL    SELECTED            │
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │   ○    │ │   ✓    │ │   ○    │         │  ← ○ = unchecked
│  │  IMG4  │ │  ▓▓▓   │ │  IMG6  │         │     ✓ = checked (#f1ef47)
│  │        │ │  ▓▓▓   │ │        │         │
│  │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│ │▼▼▼▼▼▼▼│         │
│  │Keyword │ │Keyword │ │Keyword │         │
│  └────────┘ └────────┘ └────────┘         │
│   NORMAL    SELECTED   NORMAL              │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│                                             │  ← Bottom action bar
│  ┌───────────────────┐  ┌─────────────────┐│     (slides up)
│  │    Cancelar       │  │ Almacenar (3)   ││     Shadow elevation 8
│  │                   │  │     ████        ││  ← Yellow button (#f1ef47)
│  └───────────────────┘  └─────────────────┘│     Black text
│   (Outline button)        (Disabled if 0)   │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Tap any card:** Toggle selection (haptic feedback)
- **Tap ✕:** Exit multi-select mode (confirmation if 5+ selected)
- **Tap "Selec. Todo":** Select all visible images
- **Tap "Almacenar":** Save selected images → Success toast → Exit mode

---

## SCREEN 3: Filter Modal (Bottom Sheet)

```
┌─────────────────────────────────────────────┐
│  ⟨Darkened Background - 50% opacity⟩        │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  ═════════════════════════════════════      │  ← Drag handle
│                                             │
│  Filtrar Imágenes                    ✕     │  ← Modal header
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📁 FUENTE                                  │  ← Section label
│  ○ Todas las fuentes                       │     (gray, 12px uppercase)
│  ◉ El Universal                             │  ← Radio buttons
│  ○ Reforma                                  │     Selected: yellow
│  ○ Milenio                                  │
│                                             │
│  🏷️ KEYWORDS                                │
│  ☑ Deportes             ☑ Política         │  ← Checkboxes
│  ☐ Espectáculos         ☐ Economía         │     (wrap if needed)
│  ☐ Cultura              ☐ Tecnología       │     Checked: yellow
│                                             │
│  📅 FECHA                                   │
│  ┌──────────────────┐                      │
│  │  10/10/2025  🗓️  │                      │  ← Date picker trigger
│  └──────────────────┘                      │
│  a                                          │
│  ┌──────────────────┐                      │
│  │  10/10/2025  🗓️  │                      │
│  └──────────────────┘                      │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────┐  ┌─────────────────┐│  ← Footer buttons
│  │    Limpiar        │  │  Aplicar (3)    ││
│  │                   │  │     ████        ││  ← Yellow button
│  └───────────────────┘  └─────────────────┘│     (Badge shows count)
│   (Outline button)        (Primary)         │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe down:** Close modal (if dragged > 30%)
- **Tap ✕:** Close without applying
- **Tap "Limpiar":** Clear all selections
- **Tap "Aplicar":** Apply filters → Close modal → Update grid

---

## SCREEN 4: Sort Modal (Bottom Sheet)

```
┌─────────────────────────────────────────────┐
│  ⟨Darkened Background - 50% opacity⟩        │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  ═════════════════════════════════════      │  ← Drag handle
│                                             │
│  Ordenar por                          ✕     │  ← Modal header
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ◉  📅  Más recientes                │   │  ← Selected (yellow)
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ○  📅  Más antiguos                 │   │  ← Radio options
│  └─────────────────────────────────────┘   │     Icon + Label
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ○  ⭐  Más relevantes               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ○  🔤  Por fuente (A-Z)             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
   (Auto-closes on selection)
```

**Interactions:**
- **Tap any option:** Select → Apply immediately → Close modal
- **Tap ✕:** Close without changing sort
- **Swipe down:** Close modal

---

## SCREEN 5: Image Detail Screen

```
┌─────────────────────────────────────────────┐
│  ⟨System Status Bar - Overlay⟩              │
│  ⟨  Back                              ⋮  ⟩  │  ← Header (overlay)
│                                             │     Semi-transparent
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│          ┌─────────────────────┐           │
│          │                     │           │
│          │                     │           │
│          │    HERO IMAGE       │           │  ← Full-width hero
│          │                     │           │     60vh max
│          │   (pinch to zoom)   │           │     Aspect ratio: original
│          │                     │           │
│          │                     │           │
│          └─────────────────────┘           │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  ⟨Scrollable Metadata Section⟩              │
│                                             │
│  📰 Fuente                                  │  ← Icon + Label (gray)
│  El Universal - Puebla                      │  ← Value (black, bold)
│  ─────────────────────────────────────      │  ← Divider
│                                             │
│  📅 Fecha de Extracción                     │
│  10 de octubre, 2025 - 14:30                │
│  ─────────────────────────────────────      │
│                                             │
│  🏷️ Keywords                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │  ← Chips (wrap)
│  │ Deportes │ │ Fútbol   │ │ Pachuca  │   │     Yellow tint
│  └──────────┘ └──────────┘ └──────────┘   │
│  ─────────────────────────────────────      │
│                                             │
│  🔗 URL Original                            │
│  https://www.eluniversal.com.mx/...         │  ← Blue link (truncated)
│  ─────────────────────────────────────      │
│                                             │
│  IMÁGENES RELACIONADAS                      │  ← Section header
│  ─────────────────────────────────────      │
│                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│  │  IMG  │ │  IMG  │ │  IMG  │ │  IMG  │→ │  ← Horizontal scroll
│  │       │ │       │ │       │ │       │  │     120x120px cards
│  └───────┘ └───────┘ └───────┘ └───────┘  │     12px gaps
│                                             │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│                                             │  ← Sticky footer
│  ┌──────────────────────┐  ┌──────────────┐│     (always visible)
│  │  Almacenar en Banco  │  │  Compartir   ││
│  │        ████          │  │      ↗       ││  ← Yellow + Outline
│  └──────────────────────┘  └──────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe right (edge):** Go back to list
- **Tap ⟨ Back:** Go back
- **Pinch hero image:** Zoom in/out
- **Double-tap hero:** Toggle zoom (2x)
- **Tap related image:** Navigate to that image's detail
- **Tap "Almacenar":** Save to bank → Success toast
- **Tap "Compartir":** Open native share sheet

---

## SCREEN 6: Loading States

### 6A: Initial Load Skeleton
```
┌─────────────────────────────────────────────┐
│  ████ ██████████████                        │  ← Header skeleton
│  ████ ████████                              │     (shimmer animation)
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │░░░░░░░░░░│  │░░░░░░░░░░│                │  ← Button skeletons
│  └──────────┘  └──────────┘                │
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │  ← Card skeletons
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │     (shimmer left-right)
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │
│  │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│         │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

### 6B: Infinite Scroll Loading
```
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │ IMG 25 │ │ IMG 26 │ │ IMG 27 │         │  ← Last loaded row
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│              ⟳  Cargando más...            │  ← Spinner (yellow)
│              (ActivityIndicator)            │     + Text (gray)
│                                             │
└─────────────────────────────────────────────┘
```

### 6C: Image Loading Placeholder
```
┌────────┐
│        │
│   📷   │  ← Centered icon (gray)
│        │     Background: #F3F4F6
│        │     Shimmer animation
└────────┘
```

---

## SCREEN 7: Empty & Error States

### 7A: Empty State (No Images)
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                  🖼️                          │  ← Large icon (64px)
│             (ImageOff icon)                 │     Color: #9CA3AF
│                                             │
│          No hay imágenes                    │  ← Title (20px, bold)
│                                             │
│   Las imágenes extraídas aparecerán aquí   │  ← Body (14px, gray)
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### 7B: No Results (Filtered)
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                  🔍                          │  ← Search icon
│                                             │
│   No hay imágenes que coincidan             │  ← Title
│       con tus filtros                       │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │       Limpiar Filtros                 │  │  ← Yellow button
│  │            ████                       │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 7C: Error State
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                  ⚠️                          │  ← Alert icon (red)
│                                             │
│      Error al cargar imágenes               │  ← Title (16px, bold)
│                                             │
│   No se pudieron cargar las imágenes.       │  ← Body (14px, gray)
│   Por favor, intenta nuevamente.            │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │          Reintentar                   │  │  ← Yellow button
│  │            ████                       │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 7D: Individual Image Error
```
┌────────┐
│╭╌╌╌╌╌╌╮│  ← Dashed red border (2px)
││  ⚠️  ││     Background: rgba(239,68,68,0.05)
││      ││
││ Error││  ← Text (12px, red)
│╰╌╌╌╌╌╌╯│
└────────┘
   (Tap to retry)
```

---

## SCREEN 8: Success Toast

```
┌─────────────────────────────────────────────┐
│  ⟨System Status Bar⟩                        │
│                                             │
│  ┌─────────────────────────────────────┐   │  ← Toast (slide down)
│  │ ✓  3 imágenes almacenadas           │   │     Green tint bg
│  │    correctamente                     │   │     Auto-dismiss 3s
│  └─────────────────────────────────────┘   │
│                                             │
│  (Main content below)                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## USER FLOW DIAGRAM

```
START
  │
  ▼
[Image List - Normal Mode]
  │
  ├─→ Tap Image ──→ [Image Detail Screen]
  │                       │
  │                       ├─→ Swipe Back ──→ [Back to List]
  │                       ├─→ Tap Almacenar ──→ [Success Toast] ──→ [Stay on Detail]
  │                       └─→ Tap Compartir ──→ [Native Share Sheet]
  │
  ├─→ Long Press (600ms) ──→ [Multi-Select Mode]
  │                               │
  │                               ├─→ Tap Cards ──→ [Toggle Selection]
  │                               ├─→ Tap Select All ──→ [All Selected]
  │                               ├─→ Tap X ──→ [Exit to Normal Mode]
  │                               └─→ Tap Almacenar ──→ [Save Action]
  │                                                           │
  │                                                           ▼
  │                                                    [Success Toast]
  │                                                           │
  │                                                           ▼
  │                                                    [Exit to Normal Mode]
  │
  ├─→ Tap Filter ──→ [Filter Modal]
  │                       │
  │                       ├─→ Apply ──→ [Update Grid]
  │                       └─→ Close ──→ [Back to List]
  │
  ├─→ Tap Sort ──→ [Sort Modal]
  │                     │
  │                     └─→ Select Option ──→ [Re-order Grid]
  │
  ├─→ Pull Down ──→ [Refresh]
  │
  └─→ Scroll Down ──→ [Infinite Load]

END
```

---

## RESPONSIVE BEHAVIOR (Tablet)

### Tablet Layout (iPad)
```
┌─────────────────────────────────────────────────────────────┐
│  ⟨System Status Bar⟩                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Banco de Imágenes                                       │
│     120 imágenes disponibles                                │
│                                                             │
│     ┌──────────────┐  ┌──────────────┐                     │
│     │ 🔽 Filtrar   │  │ 🔽 Ordenar   │                     │
│     └──────────────┘  └──────────────┘                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⟨     Max Width: 1000px, Centered with 80px padding     ⟩ │
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │IMG1│ │IMG2│ │IMG3│ │IMG4│ │IMG5│ │IMG6│               │  ← 6 columns
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘               │     on tablet
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │     12px gaps
│  │IMG7│ │IMG8│ │IMG9│ │ ... │ │ ... │ │ ... │               │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Breakpoints:**
- Phone (< 768px): 3 columns, 16px padding
- Tablet (≥ 768px): 4-6 columns, 80px padding, max-width 1000px

---

## ANIMATION SEQUENCES

### Sequence 1: Enter Multi-Select Mode
```
Time: 0ms
┌────────┐         ┌────────┐
│ IMG 1  │   Tap   │ IMG 2  │
└────────┘  (hold) └────────┘

Time: 500ms - Haptic Warning (Medium)

Time: 600ms - Mode Activated
┌────────┐         ┌────────┐
│   ○    │         │   ✓    │  ← Checkmarks appear
│ IMG 1  │         │  ▓▓▓   │     (0 → 40% opacity for unselected)
└────────┘         └────────┘     (100% + yellow border for pressed)
   ↓                   ↓
 Scale               Scale
 0.98               0.95 (selected)

Time: 600ms - Bottom Bar Slides Up
┌─────────────────────────────────┐
│  [Cancel]    [Almacenar (1)]   │  ← Slides from bottom
└─────────────────────────────────┘     (300ms spring animation)
```

### Sequence 2: Toggle Selection
```
Unselected → Selected (200ms)
┌────────┐         ┌────────┐
│   ○    │         │   ✓    │
│ IMG 1  │  ──→    │  ▓▓▓   │
└────────┘         └────────┘
                   │
                   └─→ Border: 0px → 3px yellow
                   └─→ Checkmark: scale 0.8 → 1.0
                   └─→ Light haptic feedback
```

### Sequence 3: Save Success
```
Time: 0ms - User taps "Almacenar"
[Button shows spinner]

Time: 500ms - API responds
[Success haptic (notification type)]

Time: 600ms - Toast slides down
┌─────────────────────────────────┐
│ ✓  3 imágenes almacenadas       │  ← Slides from top
└─────────────────────────────────┘     (200ms ease-out)

Time: 800ms - Exit multi-select
[Bottom bar slides down]
[Checkmarks fade out]
[Cards return to normal scale]

Time: 3600ms - Toast auto-dismiss
[Toast fades out]
```

---

## COLOR REFERENCE (Quick Lookup)

```
PRIMARY YELLOW (#f1ef47)
■■■■■ - Buttons, borders, selection, chips

BLACK (#000000)
■■■■■ - Text on yellow, primary text

GRAY 900 (#111827)
■■■■■ - Primary text on white

GRAY 500 (#6B7280)
■■■■■ - Secondary text, icons

GRAY 200 (#E5E7EB)
■■■■■ - Borders, dividers

GRAY 100 (#F3F4F6)
■■■■■ - Background, placeholders

WHITE (#FFFFFF)
■■■■■ - Cards, modals

SUCCESS GREEN (#22c55e)
■■■■■ - Success states

ERROR RED (#ef4444)
■■■■■ - Error states
```

---

## SPACING REFERENCE (Quick Lookup)

```
4px  (xs)  │•│        Chip padding, tight spacing
8px  (sm)  │••│       Grid gaps, icon margins
12px (md)  │•••│      Button groups, card padding
16px (lg)  │••••│     Screen padding (mobile)
20px (xl)  │•••••│    Section spacing
24px (2xl) │••••••│   Major sections, card padding
32px (3xl) │••••••••│ Large spacing
80px       │••••••••••••••••••••│ Tablet padding
```

---

## TOUCH TARGETS (Accessibility)

```
Minimum Touch Target: 44x44pt

✅ CORRECT
┌──────────────┐
│              │  ← 44pt height
│   Button     │     (meets standard)
│              │
└──────────────┘

❌ INCORRECT
┌──────────────┐
│   Button     │  ← 32pt height
└──────────────┘     (too small)

Solution: Add transparent padding to meet 44pt
```

---

## ICON REFERENCE

**Icons Used (lucide-react-native):**
- Filter: `Filter`
- Sort: `ArrowUpDown`
- Image: `Image`, `ImageOff`
- Check: `Check`, `CheckCircle2`
- Close: `X`
- Download: `Download`
- Share: `Share2`
- Calendar: `Calendar`
- Newspaper: `Newspaper`
- Tag: `Tag`
- Link: `Link`
- Alert: `AlertCircle`
- Spinner: `Loader2` (rotating)

**Icon Sizes:**
- Small: 16px (labels, metadata)
- Medium: 24px (buttons, checkmarks)
- Large: 32px (empty states)
- XL: 64px (error states)

---

## FINAL NOTES FOR DEVELOPERS

1. **Use FlashList for Grid:** Better performance than FlatList for large datasets
2. **Image URLs:** Use thumbnail URLs (300x300) for grid, full-res for detail
3. **Caching:** expo-image handles caching automatically
4. **Haptics:** Import from `expo-haptics`, wrap in try-catch
5. **Animations:** Use `react-native-reanimated` for smooth 60fps
6. **Accessibility:** Test with VoiceOver (iOS) / TalkBack (Android)
7. **Safe Areas:** Use `react-native-safe-area-context`
8. **Skeleton:** Create reusable Skeleton component with shimmer
9. **Toasts:** Consider using `react-native-toast-message` or custom
10. **Testing:** Write unit tests for selection logic, E2E for flows

---

**Document Version:** 1.0
**Companion to:** IMAGE_BANK_UX_SPECIFICATION.md
**Status:** Ready for Development
