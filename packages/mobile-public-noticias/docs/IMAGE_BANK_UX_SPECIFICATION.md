# Image Bank Feature - Complete UX Specification

**Project:** Pachuca Noticias Mobile App
**Feature:** Image Bank (Banco de Imágenes)
**Platform:** React Native (Expo) with NativeWind
**Primary Color:** #f1ef47 (Coyote Yellow)
**Date:** 2025-10-10

---

## 1. INFORMATION ARCHITECTURE

### 1.1 Navigation Flow

```
Tab Navigation (Bottom Tabs)
├── Inicio (Home)
├── Sitios (Extract)
├── Contenidos (Generate)
├── Imagenes (Images) ← NEW (renamed from "Publicar")
└── Stats

Image Bank Flow:
Imagenes Tab
├── Image List Screen (Default View)
│   ├── Filter & Sort Controls (Sticky Header)
│   ├── Image Grid (3 columns, infinite scroll)
│   ├── Tap Image → Image Detail Screen
│   └── Long Press → Multi-Selection Mode
│
├── Multi-Selection Mode
│   ├── Selection Action Bar (Bottom Sheet)
│   ├── Tap to Toggle Selection
│   └── "Almacenar" Action → Save to Bank
│
└── Image Detail Screen
    ├── Hero Image Display
    ├── Metadata Section
    ├── Related Images Carousel
    └── Actions (Share, Save, Close)
```

### 1.2 Screen Hierarchy

**Level 1:** Tab Navigation (Native iOS/Android Tabs)
**Level 2:** Image List Screen (Main View)
**Level 3:** Detail Screen / Multi-Selection Mode (Modal/Overlay)

---

## 2. IMAGE CARD DESIGN

### 2.1 Card Layout Specifications

**Grid Configuration:**
- 3 columns per row
- Column gap: 8px
- Row gap: 8px
- Container padding: 16px horizontal, 8px vertical
- Card aspect ratio: 1:1 (square)

**Card Anatomy:**

```
┌─────────────────────────────────┐
│                                 │
│        [IMAGE CONTENT]          │ ← Image fills entire card
│         AspectRatio 1:1         │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Overlay Gradient         │  │ ← Dark gradient (bottom 30%)
│  │ [Keywords chips visible] │  │ ← Max 2 keywords shown
│  └──────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
   ^Selection indicator (border/check)
```

**Visual States:**

1. **Normal State:**
   - Border: None or 1px solid #E5E7EB
   - Border radius: 8px
   - Shadow: subtle (elevation 1)
   - Image: Full bleed with subtle overlay

2. **Selected State:**
   - Border: 3px solid #f1ef47
   - Checkmark: Top-right corner (16x16 circle, #f1ef47 bg, black check)
   - Shadow: Elevated (elevation 4)
   - Scale: 0.95 (slight inward scale for tactile feedback)

3. **Pressed State:**
   - Opacity: 0.7
   - Duration: 100ms

### 2.2 Card Content

**Image Display:**
- Crop: Cover (maintains aspect ratio, crops overflow)
- Background: #F3F4F6 (light gray) while loading
- Loading: Skeleton shimmer animation

**Metadata Overlay (Bottom 30%):**
- Gradient: linear-gradient(transparent → rgba(0,0,0,0.7))
- Content: Max 2 keyword chips
- Chip style:
  - Background: rgba(241, 239, 71, 0.2)
  - Border: 1px solid rgba(241, 239, 71, 0.6)
  - Text: #FFFFFF, 10px, semibold
  - Padding: 4px 8px
  - Border radius: 12px

### 2.3 Touch Targets

**Minimum Touch Target:** 44x44pt (iOS HIG / Android Material)
**Card minimum height:** Card width (square) ≥ 100px
**Gap between cards:** 8px (provides sufficient separation)

---

## 3. MULTI-SELECTION UX

### 3.1 Activation

**Entry Point:**
- **Long Press (600ms)** on any image card
- **Haptic Feedback:** Medium impact vibration
- **Visual Transition:** All cards simultaneously:
  - Show checkmark circles (unchecked, 40% opacity)
  - Scale animation: cards slightly shrink (0.98)
  - Selection bar slides up from bottom

### 3.2 Multi-Selection Mode UI

**Top Bar Changes:**
```
┌─────────────────────────────────────────┐
│ [X] 3 seleccionados  [Seleccionar Todo] │
│     Secondary text    Text button        │
└─────────────────────────────────────────┘
```

**Elements:**
- Close button (X): Exit multi-select mode
- Selection count: Dynamic counter "X seleccionados"
- Select All button: Toggles to "Deseleccionar Todo" when all selected

### 3.3 Selection Indicator Design

**Checkmark Circle:**
- Position: Top-right corner, 8px inset
- Size: 24x24px outer circle
- Unchecked State:
  - Border: 2px solid rgba(255,255,255,0.8)
  - Background: rgba(0,0,0,0.3)
  - Inner checkmark: Hidden
- Checked State:
  - Background: #f1ef47
  - Border: 2px solid #000
  - Inner checkmark: Black, 16x16px
  - Animation: Scale from 0.8 → 1.0 (200ms ease-out)

### 3.4 Bottom Action Bar

**Design:**
```
┌───────────────────────────────────────────────┐
│                                               │
│  [Cancel]              [Almacenar (X)]        │
│   Outline              Primary Yellow         │
│   Button               Button                 │
│                                               │
└───────────────────────────────────────────────┘
```

**Specifications:**
- Background: #FFFFFF
- Border top: 1px solid #E5E7EB
- Padding: 12px 16px + safe area insets
- Shadow: elevation 8 (prominent shadow)
- Height: 80px + safe area

**Button Layout:**
- Flex direction: row
- Gap: 12px
- Cancel button: flex 1, outline variant
- Almacenar button: flex 2, custom yellow background

**Almacenar Button:**
- Background: #f1ef47
- Text: Black, 16px, semibold
- Disabled state: opacity 0.4 (when 0 selected)
- Icon: Download or Save icon (lucide-react-native)
- Badge: Shows count "(3)" next to text

### 3.5 Interaction States

**Tap Behavior in Multi-Select:**
1. User taps unselected image → Add to selection
2. User taps selected image → Remove from selection
3. Haptic feedback: Light impact on each toggle
4. Animation: Checkmark scale + card border transition (200ms)

**Deselect All:**
- Removes all selections
- Returns cards to normal state
- Updates counter to "0 seleccionados"
- Disables Almacenar button

---

## 4. FILTER & SORT UI

### 4.1 Sticky Header Layout

**Structure:**
```
┌─────────────────────────────────────────────┐
│  Banco de Imágenes                          │ ← Title
│  X imágenes disponibles                     │ ← Subtitle
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ [Filter] 🔽 │  │ [Sort] 🔽    │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
│  [Active Filter: "Keyword X"] ✕            │ ← Active filters
└─────────────────────────────────────────────┘
```

**Sticky Behavior:**
- Sticks to top on scroll
- Background: #FFFFFF with slight blur (iOS) or solid (Android)
- Shadow: elevation 2 when scrolled
- Padding: 16px horizontal, 12px vertical

### 4.2 Filter Button Design

**Button Specs:**
- Variant: Outline
- Size: Medium (h-10)
- Icon: Filter icon (lucide) + text
- Active state: Border changes to #f1ef47, bold text

**Filter Modal:**
- Appears as bottom sheet (80% screen height)
- Rounded top corners (24px)
- Sections:
  1. Keywords (checkbox list, scrollable)
  2. Date Range (calendar picker)
  3. Source Outlet (radio group)
- Footer: "Aplicar Filtros" (yellow) + "Limpiar" (outline)

### 4.3 Sort Button Design

**Sort Options:**
1. Más Recientes (default)
2. Más Antiguos
3. Más Relevantes
4. Por Fuente (A-Z)

**Sort Modal:**
- Bottom sheet (auto-height, max 60%)
- Radio group with lucide icons
- Each option: Radio + Label + Icon
- Auto-closes on selection
- Selection persists until changed

### 4.4 Active Filter Chips

**Chip Design:**
- Background: rgba(241, 239, 71, 0.15)
- Border: 1px solid #f1ef47
- Text: Black, 12px, medium
- Close icon: 16x16, black X
- Padding: 6px 12px
- Border radius: 16px
- Max width: 200px, ellipsis overflow

**Layout:**
- Horizontal scroll when many filters active
- Gap: 8px between chips
- Shows below filter/sort buttons

---

## 5. DETAIL SCREEN LAYOUT

### 5.1 Screen Structure

**Full-Screen Modal (slides from right/bottom):**

```
┌─────────────────────────────────────────────┐
│ [← Back]                        [⋮ More]    │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│           [HERO IMAGE]                      │ ← Full width, 60% height
│           AspectRatio: original             │
│                                             │
├─────────────────────────────────────────────┤
│  METADATA SECTION                           │
│  ────────────────                           │
│                                             │
│  📰 Fuente                                  │
│  El Universal - Puebla                      │
│                                             │
│  📅 Fecha de Extracción                     │
│  10 de octubre, 2025 - 14:30                │
│                                             │
│  🏷️ Keywords                                │
│  [Chip] [Chip] [Chip] [Chip]               │
│                                             │
│  🔗 URL Original                            │
│  https://example.com/noticia...             │
│                                             │
│  ────────────────                           │
│  IMÁGENES RELACIONADAS                      │
│  ────────────────                           │
│                                             │
│  [Image] [Image] [Image] →                  │ ← Horizontal scroll
│                                             │
└─────────────────────────────────────────────┘
│ [Almacenar en Banco]  [Compartir]          │ ← Sticky footer
└─────────────────────────────────────────────┘
```

### 5.2 Hero Image Section

**Specifications:**
- Height: 60vh or aspect ratio (whichever is smaller)
- Max height: 500px
- Background: #000
- Image fit: Contain (shows full image)
- Pinch to zoom: Enabled
- Double tap to zoom: Enabled
- Loading: Centered spinner on gray background

### 5.3 Metadata Section

**Layout:**
- Padding: 24px horizontal, 20px vertical
- Background: #FFFFFF
- Gap between items: 20px

**Metadata Item Design:**
```
┌─────────────────────────────┐
│ [Icon] Label                │ ← Icon (16px) + Label (12px, gray)
│ Value Text                  │ ← Value (16px, black, semibold)
│                             │
│ [Divider line, subtle]      │
└─────────────────────────────┘
```

**Icons:**
- Fuente: Newspaper icon
- Fecha: Calendar icon
- Keywords: Tag icon
- URL: Link icon

**Keywords Section:**
- Chip style: Same as filter chips
- Wrap: Multiple rows if needed
- Tappable: Optional - filter by keyword

**URL Section:**
- Text: Truncated with ellipsis
- Color: Primary blue (#3b82f6)
- Action: Tap to open in browser (confirmation alert)

### 5.4 Related Images Carousel

**Design:**
- Horizontal ScrollView
- Item size: 120x120px
- Gap: 12px
- Padding: 16px horizontal
- Indicator: None (scroll naturally)
- Tap behavior: Navigate to that image's detail

**Empty State:**
- Shows placeholder text: "No hay imágenes relacionadas"
- Icon: Image icon (gray, 32px)

### 5.5 Sticky Footer Actions

**Layout:**
- 2 equal-width buttons
- Gap: 12px
- Padding: 16px + safe area
- Background: #FFFFFF
- Border top: 1px solid #E5E7EB

**Buttons:**
1. **Almacenar en Banco:**
   - Background: #f1ef47
   - Text: Black, semibold
   - Icon: Download
   - Success state: Checkmark + "Almacenado"

2. **Compartir:**
   - Variant: Outline
   - Icon: Share icon
   - Action: Native share sheet

---

## 6. LOADING STATES

### 6.1 Initial Load (First Time)

**Full-Screen Skeleton:**
```
┌─────────────────────────────────────────────┐
│  ████ ██████████                            │ ← Header skeleton
│  ████ ████                                  │
│                                             │
│  ┌──────┐ ┌──────┐                         │ ← Filter buttons
│  └──────┘ └──────┘                         │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐                      │
│  │████│ │████│ │████│                      │ ← Image grid skeleton
│  └────┘ └────┘ └────┘                      │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐                      │
│  │████│ │████│ │████│                      │
│  └────┘ └────┘ └────┘                      │
└─────────────────────────────────────────────┘
```

**Skeleton Animation:**
- Shimmer effect (left to right)
- Duration: 1.5s loop
- Colors: #E5E7EB → #F3F4F6 → #E5E7EB

### 6.2 Infinite Scroll Loading

**Footer Indicator:**
- Centered ActivityIndicator
- Color: #f1ef47
- Size: Medium (32px)
- Padding: 20px vertical
- Text below: "Cargando más imágenes..."

### 6.3 Individual Image Loading

**Card Placeholder:**
- Background: #F3F4F6
- Shimmer animation: Same as skeleton
- Aspect ratio: 1:1 maintained
- Centered icon: Image icon (24px, #9CA3AF)

**Progressive Loading:**
1. Show placeholder immediately
2. Blur-up: Show low-res thumbnail (blurred)
3. Transition to full-res (fade, 300ms)

### 6.4 Pull-to-Refresh

**Specifications:**
- Native RefreshControl
- Tint color: #f1ef47
- Trigger distance: 80px
- Haptic: Light impact on trigger
- Resets to top on refresh

### 6.5 Empty State (No Images)

**Design:**
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│              [Large Icon]                   │ ← Image icon, 64px, gray
│                                             │
│         No hay imágenes                     │ ← Title, 20px, bold
│                                             │
│   Las imágenes extraídas aparecerán aquí   │ ← Body, 14px, gray
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Centered Vertically:**
- Icon: lucide ImageOff (64px, #9CA3AF)
- Title: 20px, semibold, #111827
- Description: 14px, regular, #6B7280
- Padding: 40px horizontal

### 6.6 Error State (Failed to Load)

**Design:**
```
┌─────────────────────────────────────────────┐
│                                             │
│           [Alert Circle Icon]               │ ← Red alert, 64px
│                                             │
│        Error al cargar imágenes             │ ← Title
│                                             │
│    No se pudieron cargar las imágenes.      │ ← Message
│    Por favor, intenta nuevamente.           │
│                                             │
│          [Reintentar Button]                │ ← Yellow button
│                                             │
└─────────────────────────────────────────────┘
```

**Error Card (Individual Image):**
- Red border: 2px dashed #ef4444
- Background: rgba(239, 68, 68, 0.05)
- Icon: AlertCircle (24px, red)
- Text: "Error"

---

## 7. INTERACTION PATTERNS

### 7.1 Gesture Map

**Normal Mode:**
| Gesture | Target | Action | Feedback |
|---------|--------|--------|----------|
| Tap | Image Card | Navigate to Detail Screen | Opacity 0.7 (100ms) |
| Long Press (600ms) | Image Card | Enter Multi-Selection Mode | Haptic (medium) + Visual transition |
| Scroll | Grid | Vertical scroll, infinite load | Native scroll physics |
| Pull Down | Top of Grid | Refresh data | RefreshControl animation |

**Multi-Selection Mode:**
| Gesture | Target | Action | Feedback |
|---------|--------|--------|----------|
| Tap | Image Card | Toggle Selection | Haptic (light) + Checkmark animation |
| Tap | X (Top Bar) | Exit Multi-Select | All cards return to normal |
| Tap | Select All | Select/Deselect All | Haptic (medium) + Batch animation |
| Tap | Almacenar | Save Selected Images | Success modal + Haptic (success) |

**Detail Screen:**
| Gesture | Target | Action | Feedback |
|---------|--------|--------|----------|
| Swipe Right | Screen Edge | Go Back | Native edge swipe (iOS) |
| Tap | Back Button | Go Back | Opacity feedback |
| Pinch | Hero Image | Zoom In/Out | Interactive zoom |
| Double Tap | Hero Image | Toggle Zoom | Animated zoom to 2x |
| Tap | Related Image | Navigate to Detail | Opacity feedback |

### 7.2 Animation Specifications

**Card Selection Animation:**
```typescript
// Pseudo-code for animation
{
  duration: 200,
  easing: 'ease-out',
  properties: {
    scale: [1, 0.95], // Slight inward
    borderWidth: [0, 3],
    borderColor: ['transparent', '#f1ef47'],
    checkmarkOpacity: [0, 1],
    checkmarkScale: [0.8, 1]
  }
}
```

**Bottom Sheet Slide:**
```typescript
{
  duration: 300,
  easing: 'ease-in-out',
  translateY: [100%, 0], // Slide from bottom
  spring: { damping: 0.8, stiffness: 100 }
}
```

**Shimmer Skeleton:**
```typescript
{
  duration: 1500,
  loop: true,
  easing: 'linear',
  translateX: [-100%, 100%],
  gradient: ['#E5E7EB', '#F3F4F6', '#E5E7EB']
}
```

### 7.3 Haptic Feedback Map

| Event | Intensity | Platform |
|-------|-----------|----------|
| Enter Multi-Select | Medium | iOS + Android |
| Toggle Selection | Light | iOS + Android |
| Select All | Medium | iOS + Android |
| Save Success | Success | iOS (Notification) + Android (Medium) |
| Error | Warning | iOS (Warning) + Android (Heavy) |
| Pull to Refresh Trigger | Light | iOS + Android |

**Implementation:** Use `expo-haptics`
```typescript
import * as Haptics from 'expo-haptics';

Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

## 8. VISUAL HIERARCHY

### 8.1 Information Hierarchy (Z-Index Layers)

**Layer Stack (Bottom to Top):**
1. **Background Layer (z-0):** Screen background #F3F4F6
2. **Content Layer (z-1):** Image grid, cards
3. **Floating UI (z-10):** Sticky header, floating filter badges
4. **Selection Mode (z-20):** Checkmarks, selection borders
5. **Action Bar (z-30):** Bottom action bar in multi-select
6. **Modals (z-40):** Filter modal, sort modal
7. **Detail Screen (z-50):** Full-screen detail view
8. **System (z-100):** Alerts, toasts, native system UI

### 8.2 Visual Weight & Focal Points

**Primary Focal Points:**
1. **First Attention:** Image grid (3-column mosaic)
2. **Secondary:** Sticky header with filter/sort
3. **Tertiary:** Active filter chips (when present)

**Color Usage Hierarchy:**
```
Primary (#f1ef47 Yellow) - Use sparingly for:
  - Primary action buttons (Almacenar)
  - Selection borders
  - Active filter chips
  - Tab bar selection indicator
  - Success states

Secondary (#000 Black) - Use for:
  - Primary text
  - Icons
  - Button text on yellow background

Tertiary (#6B7280 Gray) - Use for:
  - Secondary text
  - Placeholders
  - Disabled states
  - Subtle borders
```

### 8.3 Typography Hierarchy

**Font Family:** Aleo (loaded in app)

**Scale:**
```
Title Large:   28px / Aleo-Bold      / #111827  (Screen titles)
Title Medium:  20px / Aleo-SemiBold  / #111827  (Section headers)
Body Large:    16px / Aleo-Medium    / #111827  (Primary content)
Body Medium:   14px / Aleo-Regular   / #111827  (Body text)
Body Small:    12px / Aleo-Regular   / #6B7280  (Captions)
Label:         10px / Aleo-SemiBold  / Various  (Chips, badges)
```

**Line Heights:**
- Titles: 1.2x font size
- Body: 1.5x font size
- Labels: 1.3x font size

---

## 9. SPACING & LAYOUT

### 9.1 Grid System

**Base Unit:** 4px
**Spacing Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

**Common Spacing:**
```
xs:  4px   - Tight spacing (chip padding)
sm:  8px   - Grid gaps
md:  12px  - Button groups
lg:  16px  - Screen padding
xl:  24px  - Section spacing
2xl: 32px  - Major sections
3xl: 40px  - Screen margins (tablet)
```

### 9.2 Image Grid Layout

**Mobile (Phone):**
```
Screen Width: 100%
Container Padding: 16px (left/right)
Available Width: Screen Width - 32px
Column Count: 3
Gap: 8px
Card Width: (Available Width - (2 × 8px)) / 3
Card Height: Card Width (1:1)
```

**Example (iPhone 14 Pro - 393px width):**
- Available: 393 - 32 = 361px
- Card: (361 - 16) / 3 = 115px
- Grid: 115px × 115px cards, 8px gaps

**Tablet (iPad):**
```
Screen Width: 100%
Container Padding: 80px (left/right)
Max Width: 1000px (centered)
Column Count: 4-6 (responsive)
Gap: 12px
Card Width: Dynamic based on container
```

### 9.3 Safe Areas

**Respect Safe Areas:**
- Top: System status bar
- Bottom: Home indicator (iOS), navigation bar (Android)
- Sides: Display cutouts (notches, camera holes)

**Implementation:**
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView edges={['top', 'left', 'right']}>
  {/* Content */}
</SafeAreaView>
```

**Sticky Footer:**
```tsx
<View style={{
  paddingBottom: insets.bottom + 16 // Safe area + padding
}}>
  {/* Action buttons */}
</View>
```

---

## 10. COLOR USAGE

### 10.1 Color Palette

**Primary:**
```css
--primary: #f1ef47         /* Coyote Yellow */
--primary-dark: #d4d23d    /* Darker yellow for pressed states */
--primary-light: #f7f5a8   /* Lighter for backgrounds */
--primary-on-bg: rgba(241, 239, 71, 0.15) /* Transparent yellow */
```

**Neutrals:**
```css
--black: #000000
--gray-900: #111827        /* Primary text */
--gray-700: #374151        /* Secondary text */
--gray-500: #6B7280        /* Tertiary text */
--gray-300: #D1D5DB        /* Borders */
--gray-200: #E5E7EB        /* Dividers */
--gray-100: #F3F4F6        /* Backgrounds */
--white: #FFFFFF
```

**Semantic Colors:**
```css
--success: #22c55e         /* Green */
--error: #ef4444           /* Red */
--warning: #f59e0b         /* Orange */
--info: #3b82f6            /* Blue */
```

### 10.2 Context-Specific Usage

**Image Cards:**
- Normal border: #E5E7EB or transparent
- Selected border: #f1ef47 (3px)
- Background: #FFFFFF
- Overlay gradient: rgba(0,0,0,0) → rgba(0,0,0,0.7)

**Buttons:**
- Primary (Almacenar): bg-#f1ef47, text-#000
- Outline: border-#E5E7EB, bg-transparent, text-#111827
- Disabled: opacity-0.4

**Chips & Badges:**
- Filter chip: bg-rgba(241,239,71,0.15), border-#f1ef47
- Keyword chip: Same as filter
- Status badge (Active): bg-#f1ef47, text-#000

### 10.3 Dark Mode Considerations

**Note:** Current app uses `userInterfaceStyle: "automatic"`

**If Dark Mode Implemented:**
```css
/* Dark Mode Palette */
--background-dark: #111827
--card-dark: #1f2937
--text-dark: #f9fafb
--border-dark: rgba(255,255,255,0.1)
--primary-dark: #f1ef47 (same, high contrast)
```

**Current Implementation:**
- App defaults to light mode
- Yellow #f1ef47 works well in both light/dark
- Future-proof with HSL color system in global.css

---

## 11. STATE CHANGES

### 11.1 Mode Transitions

**Normal → Multi-Select:**

1. **Trigger:** Long press (600ms) on any image
2. **Haptic:** Medium impact
3. **Visual Changes:**
   - All cards: Show checkmark circles (0% → 40% opacity, 200ms)
   - Pressed card: Immediately selected (checkmark 100%, border yellow)
   - Header: Fade out filter/sort, fade in selection controls (300ms)
   - Bottom bar: Slide up from bottom (300ms spring)
   - Cards: Slight scale reduction (1.0 → 0.98) for breathing room

**Multi-Select → Normal:**

1. **Trigger:** Tap "X" in header or complete action
2. **Haptic:** Light impact
3. **Visual Changes:**
   - All checkmarks: Fade out (200ms)
   - Selected borders: Remove (200ms)
   - Cards: Return to original scale (0.98 → 1.0)
   - Header: Restore filter/sort (300ms)
   - Bottom bar: Slide down (300ms spring)

### 11.2 Selection State Matrix

| User Action | Current State | New State | Visual Feedback |
|-------------|--------------|-----------|-----------------|
| Long press unselected card | Normal | Multi-select (1 selected) | Haptic + animations |
| Tap unselected card | Multi-select | Add to selection | Light haptic + checkmark scale |
| Tap selected card | Multi-select | Remove from selection | Light haptic + checkmark fade |
| Tap "Select All" | Multi-select (partial) | All selected | Medium haptic + batch animation |
| Tap "Select All" | Multi-select (all) | None selected | Medium haptic + batch fade |
| Tap "Almacenar" | Multi-select (≥1) | Success → Normal | Success haptic + toast |

### 11.3 Filter State Transitions

**No Filters → Filtered:**
1. User taps "Filter" → Modal opens (slide from bottom)
2. User selects options → Options highlighted
3. User taps "Aplicar" → Modal closes, filter chips appear
4. Grid updates with fade transition (300ms)

**Active Filters → Clear Filter:**
1. User taps "X" on chip OR "Limpiar" in modal
2. Chip fades out (200ms)
3. Grid updates with new results (300ms fade)

**Sort Changes:**
1. User selects new sort option → Radio updates
2. Modal auto-closes (200ms)
3. Grid re-orders with smooth transition (400ms)
   - Cards fade out → reorder → fade in

---

## 12. FEEDBACK MECHANISMS

### 12.1 Visual Feedback

**Immediate Feedback (<100ms):**
- Button press: Opacity 0.7
- Card tap: Opacity 0.7
- Toggle selection: Border change + checkmark

**Short Feedback (100-300ms):**
- Animations: Checkmark scale, card selection
- Transitions: Modal open/close
- Loading: Spinner appears

**Long Feedback (300ms+):**
- Data loading: Skeleton screens
- Infinite scroll: Footer spinner
- Error recovery: Retry button

### 12.2 Haptic Feedback

**Patterns:**
```typescript
// Light - Subtle confirmation
- Toggle selection
- Pull to refresh trigger

// Medium - Important action
- Enter multi-select
- Select all / Deselect all
- Filter applied

// Success - Positive outcome
- Images saved successfully
- Action completed

// Warning - Caution needed
- Cannot perform action
- Validation error

// Error - Failed action
- Network error
- Save failed
```

### 12.3 Toasts & Alerts

**Toast Design:**
```
┌─────────────────────────────────────────┐
│ [Icon] Message Text                     │
│        Secondary info (optional)        │
└─────────────────────────────────────────┘
```

**Specifications:**
- Position: Top of screen (below safe area)
- Duration: 3 seconds (auto-dismiss)
- Background: #FFFFFF (success: green tint, error: red tint)
- Shadow: elevation 8
- Animation: Slide down from top, fade out

**Use Cases:**
- Success: "3 imágenes almacenadas correctamente"
- Error: "Error al almacenar imágenes. Intenta nuevamente."
- Info: "Filtrando por: Keyword X"

**Alerts (Modal Dialogs):**
- Use sparingly for critical actions
- Example: "¿Abrir enlace en navegador externo?"
- Buttons: "Cancelar" (outline) + "Abrir" (yellow)

### 12.4 Loading Indicators

**Inline Spinners:**
- Color: #f1ef47
- Size: 20px (small), 32px (medium), 48px (large)
- Animation: Continuous rotation

**Progress Indicators:**
- For batch operations: Linear progress bar
- Color: #f1ef47 fill, #E5E7EB background
- Show percentage: "Almacenando... 3/10"

---

## 13. ACCESSIBILITY NOTES

### 13.1 WCAG 2.1 Level AA Compliance

**Color Contrast Ratios:**

| Element | Foreground | Background | Ratio | Pass? |
|---------|-----------|------------|-------|-------|
| Primary text | #111827 | #FFFFFF | 16.2:1 | ✅ AAA |
| Secondary text | #6B7280 | #FFFFFF | 5.4:1 | ✅ AA |
| Yellow button text | #000000 | #f1ef47 | 16.8:1 | ✅ AAA |
| Selected border | #f1ef47 | #FFFFFF | 1.1:1 | ⚠️ Decorative |
| Error text | #ef4444 | #FFFFFF | 4.5:1 | ✅ AA |

**Note:** Yellow border is decorative; selection also indicated by checkmark (high contrast).

### 13.2 Touch Target Sizes

**Minimum Sizes (iOS HIG / Android Material):**
- All tappable elements: ≥ 44x44pt (iOS) / 48x48dp (Android)
- Image cards: Minimum 100x100px (exceeds standard)
- Buttons: Height 44px minimum
- Checkmarks: 24x24px (within 44px touch area)
- Filter chips: Height 32px, min-width 60px (tap area extends)

### 13.3 Screen Reader Support

**Accessibility Labels:**

```typescript
// Image Card
<Pressable
  accessibilityRole="button"
  accessibilityLabel={`Imagen de ${outlet.name}, ${keywords.join(', ')}`}
  accessibilityHint="Toca para ver detalles. Mantén presionado para seleccionar múltiples."
  accessibilityState={{ selected: isSelected }}
>

// Multi-select mode
<View accessibilityLiveRegion="polite">
  <Text accessibilityRole="header">
    {selectedCount} imágenes seleccionadas
  </Text>
</View>

// Filter button
<Button
  accessibilityLabel="Filtrar imágenes"
  accessibilityHint={activeFilters.length > 0
    ? `${activeFilters.length} filtros activos`
    : "Sin filtros activos"
  }
>

// Almacenar button
<Button
  accessibilityLabel={`Almacenar ${selectedCount} imágenes en banco`}
  accessibilityState={{ disabled: selectedCount === 0 }}
>
```

**Focus Order:**
1. Header (title, subtitle)
2. Filter/Sort buttons
3. Active filter chips
4. Image grid (row by row, left to right)
5. Infinite scroll loading indicator

### 13.4 Keyboard Navigation (Web/Tablet with Keyboard)

**Tab Navigation:**
- Tab: Move forward through focusable elements
- Shift+Tab: Move backward
- Enter/Space: Activate focused element
- Arrow keys: Navigate grid (optional enhancement)

**Focus Indicators:**
- All interactive elements: 2px solid #f1ef47 focus ring
- Offset: 2px from element
- Visible on keyboard focus, hidden on touch

### 13.5 Reduced Motion

**Respect `prefers-reduced-motion`:**

```typescript
import { AccessibilityInfo } from 'react-native';

const reduceMotion = AccessibilityInfo.isReduceMotionEnabled();

// Disable animations if reduced motion is enabled
const animationDuration = reduceMotion ? 0 : 300;
```

**Affected Animations:**
- Card selection: Instant instead of 200ms
- Modal transitions: Fade instead of slide
- Skeleton shimmers: Static placeholder instead of animated
- Checkmark scales: Instant appearance

### 13.6 Dynamic Type Support (iOS)

**Support iOS Dynamic Type:**
- Use `<Text>` with `allowFontScaling={true}` (default)
- Test at largest accessibility size (AX5)
- Ensure layouts don't break with large text
- Multi-line support for labels

**Maximum Scales:**
- Titles: 1.5x
- Body text: 2.0x
- Labels: 1.3x

---

## 14. EDGE CASES & USER FRUSTRATION POINTS

### 14.1 Edge Cases

**Empty States:**
1. **No images extracted yet:**
   - Show empty state with illustration
   - Action: "Ir a Sitios para extraer contenido"

2. **All images filtered out:**
   - Show: "No hay imágenes que coincidan con tus filtros"
   - Action: "Limpiar Filtros" button

3. **Network error:**
   - Show error state with retry button
   - Cache: Show last loaded images with "offline" indicator

**Data Limits:**
1. **Large datasets (1000+ images):**
   - Implement virtual list (react-native-flash-list)
   - Pagination: Load 30 images per page
   - Initial load: First 60 images

2. **Slow network:**
   - Progressive image loading (blur-up technique)
   - Skeleton screens for perceived performance
   - Timeout after 15 seconds → show error

**Multi-Selection Limits:**
1. **Select 100+ images:**
   - Warning toast: "Has seleccionado más de 100 imágenes. Esto puede tardar un momento."
   - Progress indicator during save

2. **Memory constraints:**
   - Limit selection to 200 images
   - Toast: "Máximo 200 imágenes por operación"

### 14.2 User Frustration Points & Solutions

**Frustration Point 1: Accidental Multi-Select**
- **Problem:** User accidentally long-presses while scrolling
- **Solution:**
  - Increase long-press duration to 600ms (longer than scroll)
  - Haptic feedback before entering mode (500ms warning)
  - Easy exit: Prominent "X" button

**Frustration Point 2: Losing Selection**
- **Problem:** User exits multi-select accidentally, loses all selections
- **Solution:**
  - Confirmation dialog if 5+ items selected
  - "Are you sure you want to exit? You have X items selected."
  - Remember last selection for 30 seconds

**Frustration Point 3: Slow Loading Images**
- **Problem:** User waits for images to load, frustration builds
- **Solution:**
  - Immediate skeleton feedback
  - Progressive loading (low-res first)
  - Pull-to-refresh to retry
  - Cached images load instantly

**Frustration Point 4: Can't Find Specific Image**
- **Problem:** Too many images, no good search
- **Solution:**
  - Robust filter by keyword
  - Sort by date (newest/oldest)
  - Filter by source outlet
  - Future: Add text search bar

**Frustration Point 5: Unclear What "Almacenar" Does**
- **Problem:** User doesn't understand the action
- **Solution:**
  - Clear button text: "Almacenar en Banco"
  - Success toast: "3 imágenes guardadas en tu banco"
  - Tooltip on first use (optional)

**Frustration Point 6: Tapping Wrong Image**
- **Problem:** Small touch targets, user taps adjacent image
- **Solution:**
  - Minimum 100px card size
  - 8px gaps between cards (ample separation)
  - Visual feedback (opacity) on press
  - Undo option (future enhancement)

### 14.3 Error Recovery Strategies

**Network Errors:**
1. Show error state with clear message
2. "Reintentar" button prominently displayed
3. Offline mode: Show cached images with indicator

**Save Failures:**
1. Toast: "Error al almacenar. Intenta nuevamente."
2. Keep selections active
3. Retry button in toast
4. Log error for debugging

**Image Load Failures:**
1. Show error icon in card
2. Allow user to tap to retry
3. Option to skip broken images
4. Report broken image (future)

---

## 15. IMPLEMENTATION NOTES FOR DEVELOPERS

### 15.1 Recommended Libraries

**Core:**
- `expo-router` - Navigation (already in use)
- `@tanstack/react-query` - Data fetching & caching (already in use)
- `@legendapp/list` - Performant virtualized list (already in use)

**UI Components:**
- `nativewind` - Styling (already in use)
- `lucide-react-native` - Icons (already in use)
- `react-native-reanimated` - Animations (already in use)
- `expo-haptics` - Haptic feedback (already in use)

**Images:**
- `expo-image` - Fast, cached image component (already in use)
- Progressive loading with blurhash or low-res thumbnails

**New Additions Needed:**
- `react-native-flash-list` - More performant than FlatList for large datasets
- `react-native-gesture-handler` - Better gesture handling (already in use)

### 15.2 Component Architecture

```
src/features/image-bank/
├── screens/
│   ├── ImageListScreen.tsx          (Main grid view)
│   └── ImageDetailScreen.tsx        (Detail modal)
├── components/
│   ├── ImageCard.tsx                (Individual card)
│   ├── ImageGrid.tsx                (Grid layout wrapper)
│   ├── MultiSelectBar.tsx           (Bottom action bar)
│   ├── FilterModal.tsx              (Filter UI)
│   ├── SortModal.tsx                (Sort UI)
│   ├── FilterChip.tsx               (Active filter chip)
│   └── RelatedImagesCarousel.tsx    (Horizontal scroll)
├── hooks/
│   ├── useImages.ts                 (Fetch images)
│   ├── useImageSelection.ts         (Selection state)
│   ├── useImageFilters.ts           (Filter/sort logic)
│   └── useImageBank.ts              (Save to bank)
├── types/
│   └── image.types.ts               (TypeScript interfaces)
└── utils/
    ├── imageHelpers.ts              (URL processing, etc.)
    └── animations.ts                (Reanimated configs)
```

### 15.3 State Management

**React Query for Server State:**
```typescript
const { data: images, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['images', filters, sort],
  queryFn: ({ pageParam = 0 }) => fetchImages(pageParam, filters, sort),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**Zustand for UI State:**
```typescript
interface ImageBankStore {
  selectedImages: Set<string>;
  isMultiSelectMode: boolean;
  activeFilters: Filter[];
  sortOption: SortOption;
  toggleSelection: (imageId: string) => void;
  enterMultiSelect: (imageId: string) => void;
  exitMultiSelect: () => void;
  selectAll: () => void;
  deselectAll: () => void;
}
```

### 15.4 Performance Optimizations

**Image Grid:**
- Use `FlashList` instead of `FlatList`
- `estimatedItemSize` for consistent layout
- `keyExtractor` using stable image IDs
- `removeClippedSubviews={true}`

**Image Loading:**
- Lazy load images (only visible + 2 screens ahead)
- Thumbnail URLs for grid (e.g., 300x300)
- Full-res URLs for detail screen
- Cache with `expo-image` (automatic)

**Memoization:**
```typescript
const ImageCard = memo(({ image, isSelected, onPress, onLongPress }) => {
  // Component logic
}, (prev, next) =>
  prev.image.id === next.image.id &&
  prev.isSelected === next.isSelected
);
```

**Debouncing:**
- Search input: 300ms debounce
- Filter changes: Immediate (no debounce)
- Infinite scroll: 500ms throttle

### 15.5 Accessibility Implementation

**Component Example:**
```typescript
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Imagen de ${image.outlet}, ${image.keywords.join(', ')}`}
  accessibilityHint="Toca para ver detalles"
  accessibilityState={{ selected: isSelected }}
  onPress={handlePress}
  onLongPress={handleLongPress}
>
  {/* Image content */}
</Pressable>
```

**Dynamic Announcements:**
```typescript
import { AccessibilityInfo } from 'react-native';

// Announce selection changes
AccessibilityInfo.announceForAccessibility(
  `${selectedCount} imágenes seleccionadas`
);
```

### 15.6 Testing Considerations

**Unit Tests:**
- Selection logic (toggle, select all, etc.)
- Filter/sort functions
- Image URL processing

**Integration Tests:**
- Multi-select flow
- Filter application
- Save to bank workflow

**E2E Tests (Detox):**
- Load grid → Tap image → View detail
- Long press → Multi-select → Save
- Apply filters → Verify results

**Accessibility Tests:**
- Screen reader navigation
- Color contrast validation
- Touch target sizes

---

## 16. DESIGN RATIONALE

### 16.1 Why 3-Column Grid?

**Decision:** 3 columns on mobile, 4-6 on tablet

**Rationale:**
1. **Optimal Preview Size:** 3 columns gives ~115px cards on average phone (iPhone 14 Pro: 393px width)
   - Large enough to see image detail
   - Small enough to show variety
2. **Scan-ability:** 3 columns is easy to scan row by row
3. **Touch Target:** Each card meets 44x44pt minimum
4. **Industry Standard:** Instagram, Pinterest, Google Photos use 3-4 columns
5. **Performance:** Manageable number of visible items (9-12 per screen)

**Alternatives Considered:**
- 2 columns: Too large, less variety visible
- 4 columns: Too small, hard to tap accurately
- Dynamic: Complexity not worth slight UX gain

### 16.2 Why Long-Press for Multi-Select?

**Decision:** 600ms long-press activates multi-select mode

**Rationale:**
1. **Platform Convention:** iOS Photos, Files apps use long-press
2. **Discoverability:** Users naturally try long-press after tap
3. **No UI Clutter:** No persistent checkboxes/edit button needed
4. **Gestalt Principle:** Mode change should be intentional, not accidental
5. **Haptic Feedback:** Clear confirmation of mode entry

**Alternatives Considered:**
- Checkbox on every card: Visual clutter, reduces image visibility
- Edit button in header: Extra tap, less discoverable
- Swipe gesture: Conflicts with scroll
- Double-tap: Too easy to trigger accidentally

### 16.3 Why Bottom Action Bar?

**Decision:** Sticky bottom bar for multi-select actions

**Rationale:**
1. **Thumb Zone:** Bottom of screen is easiest to reach on mobile (thumb ergonomics)
2. **Visibility:** Always visible, doesn't hide behind keyboard
3. **Platform Pattern:** iOS shortcuts, Google Photos use bottom bars
4. **Context:** Actions are related to selections (grid above)
5. **Safe Area:** Natural placement above home indicator

**Alternatives Considered:**
- Top bar: Hard to reach, especially on large phones
- Floating button: Can obscure content, less stable
- Contextual menu: Requires extra tap

### 16.4 Why 1:1 Aspect Ratio?

**Decision:** Square cards (1:1) for grid uniformity

**Rationale:**
1. **Predictable Layout:** All cards same size, easy grid math
2. **Visual Harmony:** Clean, organized appearance
3. **Performance:** Simpler layout calculations
4. **Content Agnostic:** Works for portrait/landscape/square images
5. **Scanning:** Regular grid is easier to scan than masonry

**Alternatives Considered:**
- Original aspect ratio: Uneven grid, jarring layout
- 4:3 or 16:9: Arbitrary choice, wastes space for some images
- Masonry layout: Harder to scan, worse performance

### 16.5 Why Sticky Header?

**Decision:** Filter/sort controls stick to top on scroll

**Rationale:**
1. **Persistent Access:** Users can filter/sort without scrolling back up
2. **Context Awareness:** See active filters while browsing
3. **Platform Pattern:** App Store, Safari use sticky headers
4. **Efficiency:** Reduces taps/scrolls to change filters
5. **Visual Anchor:** Provides orientation while scrolling

**Alternatives Considered:**
- Static header: Requires scroll to top to filter
- Floating button: Less context, single action only
- Bottom sheet: Too much interaction for common action

---

## 17. FUTURE ENHANCEMENTS (v2)

### 17.1 Search Functionality
- Text search across keywords, outlet names
- Search bar in sticky header
- Autocomplete suggestions
- Search history

### 17.2 Advanced Filters
- Date range picker (calendar UI)
- Multiple keyword selection (OR/AND logic)
- Filter by image dimensions (landscape/portrait/square)
- Exclude keywords (negative filters)

### 17.3 Batch Operations
- Delete selected images
- Share multiple images
- Download to device
- Tag/categorize selected images

### 17.4 Collections/Albums
- User-created albums
- Auto-collections (by date, outlet, keyword)
- Album cover image selection
- Nested organization

### 17.5 AI Features
- Similar image recommendations
- Auto-tagging with ML
- Image quality scoring
- Duplicate detection

### 17.6 Collaboration
- Share images with team members
- Comments on images
- Approval workflows
- Version history

### 17.7 Offline Support
- Download images for offline access
- Sync when back online
- Offline indicator in UI
- Conflict resolution

---

## 18. DESIGN CHECKLIST

**Before Implementation, Verify:**

- [ ] All touch targets ≥ 44x44pt
- [ ] Color contrast ratios meet WCAG AA
- [ ] Haptic feedback on key interactions
- [ ] Loading states for all async operations
- [ ] Empty states with clear messaging
- [ ] Error states with recovery actions
- [ ] Success feedback for all actions
- [ ] Animations respect reduced motion
- [ ] Screen reader labels on all interactive elements
- [ ] Focus indicators visible on keyboard nav
- [ ] Safe area insets respected
- [ ] Tablet layout tested (if applicable)
- [ ] Dark mode compatibility (if enabled)
- [ ] Network error handling
- [ ] Infinite scroll performance
- [ ] Image caching strategy
- [ ] Memory management for large datasets
- [ ] Selection state persistence (30s grace period)
- [ ] Filter state URL persistence (for deep linking)
- [ ] Analytics events tracked

---

## 19. COMPONENT SPECIFICATIONS SUMMARY

### 19.1 ImageCard Component

**Props:**
```typescript
interface ImageCardProps {
  image: ExtractedImage;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
}
```

**States:**
- Normal
- Pressed
- Selected
- Loading
- Error

**Dimensions:**
- Width: Calculated (screen width / 3 - gaps)
- Height: Same as width (1:1)
- Border radius: 8px
- Touch area: Full card + 4px margin

### 19.2 MultiSelectBar Component

**Props:**
```typescript
interface MultiSelectBarProps {
  selectedCount: number;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}
```

**Layout:**
- Height: 80px + safe area
- Padding: 12px 16px
- Gap: 12px
- Shadow: elevation 8

**Buttons:**
- Cancel: Flex 1, outline variant
- Save: Flex 2, yellow background, disabled when count = 0

### 19.3 FilterModal Component

**Props:**
```typescript
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filter[]) => void;
  activeFilters: Filter[];
}
```

**Sections:**
1. Keywords (checkbox list, max 10 visible, scrollable)
2. Date range (calendar picker)
3. Source outlet (radio group)

**Height:** 80% screen height
**Animation:** Slide from bottom (300ms)

### 19.4 ImageDetailScreen Component

**Props:**
```typescript
interface ImageDetailScreenProps {
  image: ExtractedImage;
  relatedImages: ExtractedImage[];
  onClose: () => void;
  onSave: () => void;
}
```

**Sections:**
1. Hero image (60vh, pinch-to-zoom)
2. Metadata (scrollable)
3. Related images (horizontal scroll)
4. Sticky footer (actions)

**Animation:** Slide from right (iOS) / bottom (Android)

---

## 20. FILE PATHS REFERENCE

**Key Files to Create/Modify:**

### Navigation:
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/(tabs)/_layout.tsx` - Update tab label from "Publicar" to "Imagenes"

### New Screens:
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/(tabs)/images.tsx` - Main image list screen
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/image/[id].tsx` - Detail screen (dynamic route)

### Components:
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/ImageCard.tsx`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/ImageGrid.tsx`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/MultiSelectBar.tsx`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/FilterModal.tsx`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/SortModal.tsx`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/FilterChip.tsx`

### Hooks:
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImages.ts`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImageSelection.ts`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImageFilters.ts`
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImageBank.ts`

### Types:
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/types/image.types.ts`

### Existing UI Components (Reuse):
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/components/ui/card.tsx` - For modal cards
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/components/ui/button.tsx` - For all buttons
- `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/components/ui/badge.tsx` - For keyword chips

---

## CONCLUSION

This UX specification provides a comprehensive blueprint for implementing the Image Bank feature with:

✅ **User-Centered Design:** Intuitive interactions, clear feedback
✅ **Accessibility First:** WCAG AA compliance, screen reader support
✅ **Performance Optimized:** Virtual lists, progressive loading
✅ **Brand Consistent:** Uses existing design system (#f1ef47 yellow, Aleo font)
✅ **Mobile-First:** Touch-optimized, thumb-zone aware
✅ **Edge Cases Covered:** Error handling, empty states, slow networks
✅ **Future-Proof:** Scalable architecture, dark mode ready

**Next Steps for Development:**
1. Review this spec with development team
2. Create component wireframes/mockups in Figma (optional)
3. Set up TypeScript interfaces
4. Implement core ImageGrid component
5. Add multi-selection logic
6. Integrate with API endpoints
7. Conduct usability testing
8. Iterate based on feedback

**Questions or Clarifications:**
Contact UX team for design assets, clarifications, or additional specs.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Prepared By:** UX Design Team
**Status:** Ready for Development
