# Extract Screen - Visual Design Guide

## Component Visual Specifications

### OutletCard - Detailed Breakdown

#### Card Structure (Dimensions)
```
Width: 100% (with 16px side padding)
Border Radius: 8px (from Card component)
Shadow: Card default elevation
Background: White (#FFFFFF)
Padding: 16px
```

#### Header Section
```typescript
// Outlet Name + Status Badge
┌────────────────────────────────────────────┐
│ El Universal                    [Activo]   │ <- 18px Bold + 12px Badge
│ 🔗 https://eluniversal.com.mx             │ <- 12px Regular
└────────────────────────────────────────────┘

Spacing:
- Name to Badge: flex-row justify-between
- Icon to URL: 4px gap
- Bottom padding: 12px
```

#### Statistics Grid (2x2)
```typescript
┌─────────────────┬─────────────────┐
│ 🔼 URLs         │ ✓ Extraidos     │  <- Row 1 (mb-3)
│ 125             │ 98              │
├─────────────────┼─────────────────┤
│ ✗ Fallos        │ ✨ Tasa Éxito   │  <- Row 2
│ 27              │ 78.4%           │
└─────────────────┴─────────────────┘

Each Stat Box:
- flex: 1
- padding: 12px
- border-radius: 8px
- gap between boxes: 8px

Colors:
- URLs Box: bg-blue-50 (#EFF6FF), text-blue-700 (#1D4ED8)
- Extraidos Box: bg-green-50 (#F0FDF4), text-green-700 (#15803D)
- Fallos Box: bg-red-50 (#FEF2F2), text-red-700 (#B91C1C)
- Tasa Éxito Box: bg-yellow (#f1ef47), text-black (#000000)

Icon Sizes: 14px
Label Size: 10px (text-xs)
Value Size: 20px (text-xl, font-bold)
```

#### Last Extraction Info
```typescript
┌────────────────────────────────────────────┐
│ 🕐 Última extracción: 12/05/24, 14:30     │
└────────────────────────────────────────────┘

Styling:
- margin-top: 12px
- padding-top: 12px
- border-top: 1px solid #E5E7EB
- Icon: 14px, color #6B7280
- Text: 10px (text-xs)
```

#### Action Buttons Row
```typescript
┌────────────────┬────────────────┐
│ Ver Detalles   │ Extraer Ahora  │
└────────────────┴────────────────┘

Both buttons:
- flex: 1
- min-height: 44px
- gap: 8px

Ver Detalles:
- variant: outline
- border: 1px solid #E5E7EB
- text: default foreground
- font-weight: 600

Extraer Ahora:
- background: #f1ef47
- text: black (#000000)
- font-weight: 600
- icon: Play (16px, filled)
- Disabled: opacity 0.5
```

---

### ExtractionLogsModal - Visual Specifications

#### Modal Overlay
```typescript
Full Screen Overlay
- backgroundColor: rgba(0, 0, 0, 0.5)
- justifyContent: flex-end (bottom sheet)
```

#### Modal Container
```typescript
Dimensions:
- maxHeight: 85% of screen
- borderTopLeftRadius: 24px
- borderTopRightRadius: 24px
- backgroundColor: #FFFFFF

Shadow:
- shadowColor: #000
- shadowOffset: { width: 0, height: -4 }
- shadowOpacity: 0.15
- shadowRadius: 12
- elevation: 5
```

#### Modal Header
```typescript
┌────────────────────────────────────────────┐
│ Logs de Extracción          [En Vivo]  [X]│
│ El Universal                               │
└────────────────────────────────────────────┘

Layout:
- flex-row, items-center
- paddingHorizontal: 20px
- paddingTop: 20px
- paddingBottom: 16px
- borderBottom: 1px solid #E5E7EB

Title: 18px, font-bold
Subtitle: 14px, text-muted-foreground
Badge: bg-[#f1ef47], text-black
Close Button: 24px icon, padding 4px
```

#### Modal Body (Logs Area)
```typescript
┌────────────────────────────────────────────┐
│ 🚀 Extracción iniciada - El Universal     │
│ ✓ Encontradas: 5 URLs                     │
│ ⏳ Extrayendo: https://...                │
│ ✓ Extraído: "Título de la noticia"       │
│ ✗ Error: Failed to fetch                 │
│ ...                                        │
│ ✅ Completado - 4/5 contenidos extraídos  │
└────────────────────────────────────────────┘

LogList Component:
- maxHeight: 500px
- scrollable
- auto-scroll to bottom
- padding: 20px

Empty State:
- AlertCircle icon: 48px, color #9CA3AF
- Centered vertically and horizontally
- Text: 14px, color text-muted-foreground
- paddingVertical: 60px
```

#### Modal Footer
```typescript
┌────────────────────────────────────────────┐
│            [Cerrar - Full Width]           │
└────────────────────────────────────────────┘

Layout:
- padding: 20px
- paddingTop: 16px
- borderTop: 1px solid #E5E7EB

Button:
- width: 100%
- min-height: 44px
- variant: default
```

---

### Main Screen Layout

#### Header Section
```typescript
┌────────────────────────────────────────────┐
│ Extraer Contenido                          │ <- 28px, font-700
│ Gestiona y extrae noticias de tus outlets │ <- 15px, color-secondary
└────────────────────────────────────────────┘

Spacing:
- marginBottom: 24px
- paddingTop: 8px
- Title marginBottom: 8px
```

#### Outlets List
```typescript
┌────────────────────────────────────────────┐
│ [OutletCard 1]                             │
│                                            │
│ [OutletCard 2]                             │
│                                            │
│ [OutletCard 3]                             │
│                                            │
│ ...                                        │
└────────────────────────────────────────────┘

ScrollView:
- padding: 16px (mobile)
- paddingHorizontal: 80px (tablet)
- maxWidth: 1000px (tablet, centered)
- gap between cards: 16px
- paddingBottom: 40px (safe area)
```

#### Empty State
```typescript
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│              🔔 64px Icon                  │
│                                            │
│       No hay outlets configurados          │ <- 18px, font-bold
│                                            │
│  Configura outlets desde el panel de      │ <- 15px, color-secondary
│  administración para comenzar a extraer    │
│             noticias                       │
│                                            │
│                                            │
└────────────────────────────────────────────┘

Layout:
- Centered vertically and horizontally
- paddingVertical: 80px
- paddingHorizontal: 24px
- Icon: AlertCircle, 64px, #9CA3AF
- Title marginTop: 16px, marginBottom: 8px
- Description: textAlign center, lineHeight 22px
```

---

## Loading States

### Card Statistics Loading
```typescript
┌────────────────────────────────────────────┐
│ El Universal                    [Activo]   │
│ 🔗 https://eluniversal.com.mx             │
├────────────────────────────────────────────┤
│ [████████████████████]  <- Skeleton 64px  │
│ [████████████████████]  <- Skeleton 64px  │
└────────────────────────────────────────────┘

Skeleton:
- height: 64px
- width: 100%
- gap: 8px (between skeletons)
- Animated shimmer effect
```

### Full Screen Loading
```typescript
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│              ⟳ Spinner                     │
│                                            │
│        Cargando outlets...                 │
│                                            │
│                                            │
└────────────────────────────────────────────┘

Centered:
- ActivityIndicator: size large, color #f1ef47
- Text: 15px, color-secondary, marginTop 16px
```

---

## Interactive States

### Button States

#### Normal (Ver Detalles)
```
Background: Transparent
Border: 1px solid #E5E7EB
Text: Default foreground color
Opacity: 1.0
```

#### Pressed (Ver Detalles)
```
Background: rgba(0, 0, 0, 0.05)
Border: 1px solid #E5E7EB
Text: Default foreground color
Opacity: 0.7 (activeOpacity)
```

#### Normal (Extraer Ahora)
```
Background: #f1ef47
Border: None
Text: Black (#000000)
Icon: Play, filled
Opacity: 1.0
```

#### Pressed (Extraer Ahora)
```
Background: #f1ef47
Border: None
Text: Black (#000000)
Icon: Play, filled
Opacity: 0.7 (activeOpacity)
```

#### Loading (Extraer Ahora)
```
Background: #f1ef47
Border: None
Text: "Extrayendo..." Black
Icon: ActivityIndicator (spinning)
Opacity: 0.8
```

#### Disabled (Extraer Ahora - Inactive Outlet)
```
Background: #f1ef47
Border: None
Text: "Extraer Ahora" Black
Icon: Play, filled
Opacity: 0.5
User Interaction: None
```

---

## Responsive Breakpoints

### Mobile (< 768px)
```typescript
Content Padding: 16px
Card Width: 100% - 32px (16px each side)
Font Sizes: As specified
Touch Targets: Minimum 44px
```

### Tablet (≥ 768px)
```typescript
Content Padding: 80px horizontal
Max Content Width: 1000px
Content Alignment: Center
Card Width: 100% within max-width container
Font Sizes: Same as mobile
Touch Targets: Minimum 44px
```

---

## Animation Specifications

### Modal Slide In
```typescript
animationType: "slide"
Duration: ~300ms (system default)
Easing: ease-out
Direction: bottom to top
```

### Pull to Refresh
```typescript
Spinner Color: #f1ef47
Threshold: 60px pull distance
Animation: Rotate spinner during refresh
Duration: Until refetch completes
```

### Card Skeleton Shimmer
```typescript
Animation: Linear shimmer left to right
Duration: 1500ms
Loop: Infinite
Opacity: 0.5 to 1.0
```

---

## Icon Specifications

### Icon Sizes
- **Large (Screen Level):** 64px (Empty state)
- **Medium (Modal):** 48px (Empty logs)
- **Small (Cards):** 14-16px (Statistics, actions)
- **Tiny (Labels):** 12px (URL icon)

### Icon Colors
- **Info:** #3b82f6 (Blue)
- **Success:** #22c55e (Green)
- **Error:** #ef4444 (Red)
- **Warning:** #f59e0b (Amber)
- **Neutral:** #6B7280 (Gray)
- **Brand:** #000000 (Black on yellow background)

### Icons Used
```typescript
import {
  TrendingUp,      // URLs statistic
  CheckCircle2,    // Success/Extracted
  XCircle,         // Failed extractions
  Clock,           // Last extraction time
  ExternalLink,    // Base URL indicator
  Play,            // Start extraction action
  AlertCircle,     // Empty states
  Sparkles,        // Success rate (special)
  X,               // Close modal
} from 'lucide-react-native';
```

---

## Dark Mode Considerations

### Current Implementation
The design uses `dark:` variants for color classes:
```typescript
// Example from statistics boxes
bg-blue-50 dark:bg-blue-950
text-blue-600 dark:text-blue-400
```

### Dark Mode Colors (Future)
```typescript
Background: #1F2937 (instead of #F3F4F6)
Card Background: #374151 (instead of #FFFFFF)
Text Primary: #F9FAFB (instead of #111827)
Text Secondary: #9CA3AF (instead of #6B7280)
Brand Yellow: #f1ef47 (unchanged - high contrast)
```

---

## Accessibility Annotations

### Screen Reader Labels
```typescript
// Example for Extraer Ahora button
accessibilityLabel="Extraer contenido de {outlet.name}"
accessibilityHint="Inicia la extracción de noticias y muestra los logs en tiempo real"
accessibilityRole="button"
accessibilityState={{ disabled: !outlet.isActive }}
```

### Focus Order
1. Header (Title + Subtitle)
2. First Outlet Card
   - View Details button
   - Extract Now button
3. Second Outlet Card (repeat)
4. Pull to refresh (gesture)

### High Contrast Mode
- All text meets WCAG AA standards (4.5:1 ratio minimum)
- Icons paired with text labels
- Status indicated by both color AND badge text
- Loading states have text descriptions

---

## Implementation Checklist

### Components
- ✅ OutletCard component with props interface
- ✅ ExtractionLogsModal component
- ✅ Main ExtractScreen component
- ✅ Loading states (full screen, skeletons)
- ✅ Empty states (no outlets, no logs)

### Functionality
- ✅ Fetch outlets with useOutlets hook
- ✅ Fetch statistics per outlet with useOutletStatistics
- ✅ Start extraction with useStartFullExtraction
- ✅ Real-time logs with useExtractionLogs and WebSocket
- ✅ Navigation to detail screen
- ✅ Pull-to-refresh

### Styling
- ✅ Color system (brand yellow, semantic colors)
- ✅ Typography scale
- ✅ Spacing system (8px grid)
- ✅ Touch targets (44px minimum)
- ✅ Responsive design (mobile + tablet)

### User Experience
- ✅ Progressive disclosure (card → modal → detail)
- ✅ Visual feedback (loading, disabled, pressed states)
- ✅ Error handling (try-catch, graceful degradation)
- ✅ Real-time updates (WebSocket logs, query invalidation)

---

## Browser/Platform Testing

### iOS
- Test modal animations
- Verify safe area insets
- Check pull-to-refresh gesture
- Validate dark mode appearance

### Android
- Test elevation shadows
- Verify Material ripple effects
- Check back button behavior on modal
- Validate pull-to-refresh gesture

---

## Performance Targets

### Metrics
- **Time to Interactive:** < 2 seconds
- **First Contentful Paint:** < 1 second
- **Largest Contentful Paint:** < 2.5 seconds
- **Modal Open Time:** < 200ms
- **Statistics Load:** < 1 second per card
- **WebSocket Connection:** < 500ms

### Optimization Strategies
- React Query caching (3min outlets, 30sec stats)
- Lazy load statistics per card (separate queries)
- Modal renders only when visible
- WebSocket connection pooling
- Image optimization (if outlet logos added)

---

## Summary

This visual design guide provides pixel-perfect specifications for implementing the Extract screen redesign. All measurements, colors, and interactions are documented to ensure consistent implementation across the app.

**Key Visual Principles:**
1. **Clarity:** Clear hierarchy, readable text, obvious actions
2. **Consistency:** Design system components, predictable patterns
3. **Feedback:** Loading states, animations, real-time updates
4. **Accessibility:** Touch targets, contrast, screen reader support
5. **Brand:** Yellow accent color, modern card design, professional aesthetic

The implementation successfully transforms the Extract screen from a simple list to a powerful, data-rich extraction control center.
