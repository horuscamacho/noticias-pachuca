# Extract Screen - Design Specification

## Overview
Complete redesign of the Extract screen for mobile news extraction app, focusing on user-centered design, real-time data visualization, and intuitive extraction workflows.

**File Location:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/(tabs)/extract.tsx`

---

## User Experience Improvements

### Previous UX Problems (Resolved)
1. ✅ **Basic outlet cards** → Now feature-rich cards with real statistics
2. ✅ **No statistics shown** → Real-time data from database displayed
3. ✅ **Extract button just navigates** → Now starts extraction directly with real-time logs
4. ✅ **Poor information architecture** → Clean, organized card-based layout

---

## Design System

### Color Palette
- **Primary Action:** `#f1ef47` (Brand Yellow)
- **Background:** `#F3F4F6` (Light Gray)
- **Text Primary:** `#111827` (Dark Gray)
- **Text Secondary:** `#6B7280` (Medium Gray)
- **Success:** `#22c55e` (Green)
- **Error:** `#ef4444` (Red)
- **Info:** `#3b82f6` (Blue)

### Typography
- **Title:** 28px, Bold (700)
- **Card Title:** 18px, Bold (700)
- **Body:** 15px, Regular (400)
- **Labels:** 12px, Medium (500)
- **Stats:** 20px, Bold (700)

### Spacing
- **Screen Padding:** 16px
- **Card Gap:** 16px
- **Internal Padding:** 12-20px
- **Touch Target Minimum:** 44px

### Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Button`, `Badge`, `Skeleton`
- `Text`, `LogList`
- Icons from `lucide-react-native`

---

## Component Architecture

### 1. OutletCard Component
**Purpose:** Display outlet information with real statistics and action buttons

**Features:**
- Outlet name and base URL with icon
- Active/Inactive status badge
- Real-time statistics (4 key metrics)
- Last extraction timestamp
- Two action buttons: "Ver Detalles" and "Extraer Ahora"

**Data Display:**
```
┌─────────────────────────────────────┐
│ Outlet Name              [Badge]    │
│ 🔗 Base URL                         │
├─────────────────────────────────────┤
│ [URLs] [Extraidos]                  │
│   0      0                          │
│                                     │
│ [Fallos] [Tasa Éxito]              │
│   0        0%                       │
│                                     │
│ 🕐 Última extracción: Nunca         │
├─────────────────────────────────────┤
│ [Ver Detalles] [Extraer Ahora]     │
└─────────────────────────────────────┘
```

**Statistics Colors:**
- **URLs:** Blue background (`bg-blue-50`)
- **Extraidos:** Green background (`bg-green-50`)
- **Fallos:** Red background (`bg-red-50`)
- **Tasa Éxito:** Yellow background (`#f1ef47`)

**Loading State:**
- Shows skeleton placeholders while statistics load
- Non-blocking: card structure remains visible

**Interactive States:**
- "Ver Detalles" button: Outline variant, navigates to detail screen
- "Extraer Ahora" button: Yellow background, starts extraction
- Disabled state when outlet is inactive or extraction in progress

---

### 2. ExtractionLogsModal Component
**Purpose:** Display real-time extraction logs in a modal overlay

**Features:**
- Bottom sheet modal with slide animation
- Real-time log streaming via WebSocket
- "En Vivo" badge when extraction is active
- Scrollable log list with auto-scroll
- Close button and footer action

**Modal Layout:**
```
┌─────────────────────────────────────┐
│ Logs de Extracción        [En Vivo] │
│ Outlet Name                      [X]│
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🚀 Extracción iniciada      │   │
│ │ ✓ Encontradas: 5 URLs       │   │
│ │ ⏳ Extrayendo: url1         │   │
│ │ ✓ Extraído: "Título"        │   │
│ │ ...                          │   │
│ └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ [Cerrar]                            │
└─────────────────────────────────────┘
```

**Empty State:**
- Shows AlertCircle icon (48px)
- Message: "No hay logs disponibles..."
- Displayed before extraction starts

**Interaction:**
- Opens when "Extraer Ahora" is pressed
- Updates in real-time during extraction
- Can be closed anytime without canceling extraction
- Backdrop tap or X button closes modal

---

### 3. Main Extract Screen
**Purpose:** List all configured outlets with extraction controls

**Layout Structure:**
1. **Header Section**
   - Title: "Extraer Contenido"
   - Subtitle: "Gestiona y extrae noticias de tus outlets configurados"
   - Fixed at top, scrolls with content

2. **Outlets List**
   - Vertical scroll list of OutletCard components
   - Pull-to-refresh functionality
   - Gap between cards: 16px

3. **Empty State**
   - AlertCircle icon (64px)
   - Title: "No hay outlets configurados"
   - Description with call-to-action
   - Centered vertically and horizontally

**Responsive Design:**
- **Mobile:** 16px padding
- **Tablet:** 80px horizontal padding, max-width 1000px

---

## User Flows

### Flow 1: View Outlet Details
```
Extract Screen
  → User taps "Ver Detalles" on any card
  → Navigate to `/outlet/[id]` screen
  → Shows detailed statistics, history, and configuration
```

### Flow 2: Start Extraction
```
Extract Screen
  → User taps "Extraer Ahora" on active outlet
  → Logs modal opens immediately
  → Extraction starts in background
  → Real-time logs stream to modal
  → User can close modal anytime
  → Extraction continues until completion
  → Statistics refresh automatically
```

### Flow 3: Refresh Data
```
Extract Screen
  → User pulls down to refresh
  → Shows spinner in pull area
  → Refetches outlet list
  → Updates statistics for all cards
  → Pull indicator disappears
```

---

## API Integration

### Hooks Used

**1. useOutlets()**
- Fetches list of all outlets
- Returns: `OutletConfig[]`
- Cached for 3 minutes
- Auto-refresh on mutation

**2. useOutletStatistics(outletId)**
- Fetches real statistics from database
- Returns: `OutletStatisticsDetailed`
  - `totalUrlsExtracted: number`
  - `totalContentExtracted: number`
  - `totalFailed: number`
  - `successRate: number`
- Cached for 30 seconds (frequently updated)

**3. useStartFullExtraction()**
- Mutation to start extraction
- Endpoint: `POST /generator-pro/websites/:id/extract-all`
- Invalidates queries after success
- Returns: `ExtractAllResponse`

**4. useExtractionLogs(outletId)**
- WebSocket-based real-time logs
- Events: `extraction-started`, `extraction-progress`, `extraction-completed`, `extraction-failed`
- Returns: `{ logs, isExtracting, addLog, clearLogs }`
- Auto-clears when outlet changes

---

## Accessibility Features

### Touch Targets
- All buttons: Minimum 44px height
- Adequate spacing between interactive elements
- Visual feedback on press (opacity changes)

### Visual Hierarchy
- Clear contrast ratios for text
- Icon + text labels for clarity
- Color not sole indicator (icons + text)

### Loading States
- Skeleton placeholders for statistics
- Spinner indicators for actions
- Text feedback ("Extrayendo...")

### Error Handling
- Try-catch blocks around all API calls
- Console logging for debugging
- User-friendly error messages
- Graceful degradation (empty states)

---

## Performance Optimizations

### 1. Query Caching
- Outlets cached for 3 minutes
- Statistics cached for 30 seconds
- Prevents unnecessary API calls

### 2. Conditional Rendering
- Statistics load only when card is visible
- Logs modal renders only when open
- Empty states prevent unnecessary loops

### 3. React Optimization
- `useCallback` for event handlers
- Proper dependency arrays
- Key props on mapped components

### 4. WebSocket Management
- Single socket connection reused
- Automatic reconnection on disconnect
- Cleanup on unmount

---

## Testing Scenarios

### Happy Path
1. User opens Extract screen → Sees list of outlets with statistics
2. User taps "Extraer Ahora" → Modal opens, extraction starts, logs stream
3. Extraction completes → Statistics update, modal can be closed
4. User taps "Ver Detalles" → Navigates to detail screen

### Edge Cases
1. **No outlets configured** → Shows empty state with clear message
2. **Outlet inactive** → "Extraer Ahora" button disabled with opacity
3. **Extraction already running** → Button shows "Extrayendo..." with spinner
4. **Network error** → Error logged, user can retry via pull-to-refresh
5. **Modal closed during extraction** → Extraction continues in background

### Performance
1. **Multiple outlets** → Each card loads statistics independently
2. **Slow network** → Skeleton placeholders show immediately
3. **Socket disconnect** → Auto-reconnect, logs resume

---

## Visual Design Principles

### 1. Progressive Disclosure
- Card shows essential info upfront
- Details available on tap
- Logs revealed in modal

### 2. Visual Feedback
- Immediate response to all interactions
- Loading states for async operations
- Success/error indicators

### 3. Consistency
- Design system components throughout
- Predictable button placements
- Uniform spacing and typography

### 4. Mobile-First
- Touch-friendly targets
- Readable text sizes
- Scrollable content areas
- Pull-to-refresh gesture

### 5. Brand Alignment
- Yellow (#f1ef47) for primary actions
- Professional, clean aesthetic
- Modern card-based layout

---

## Implementation Notes

### Key Files Modified
1. **Main Screen:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/(tabs)/extract.tsx`

### Dependencies
- React Native core components
- Expo Router for navigation
- React Query for data fetching
- Socket.IO client for real-time logs
- Lucide React Native for icons
- react-native-reusables UI components

### State Management
- Local state for modal visibility and extraction status
- React Query cache for API data
- WebSocket events for real-time updates

### Error Boundaries
- Try-catch in async functions
- Console error logging
- User-friendly messages
- Fallback to empty states

---

## Future Enhancements

### Phase 2 (Optional)
1. **Search/Filter** - Filter outlets by name or status
2. **Sort Options** - Sort by last extraction, success rate, etc.
3. **Batch Actions** - Extract from multiple outlets at once
4. **Notifications** - Push notifications when extraction completes
5. **Analytics** - Extraction success trends over time
6. **Export** - Download extraction logs

### Phase 3 (Advanced)
1. **Offline Support** - Queue extractions when offline
2. **Scheduled Extractions** - Set custom extraction times
3. **Advanced Filters** - Filter by date range, content type
4. **Comparison View** - Compare outlet performance

---

## Success Metrics

### User Experience
- Time to start extraction: < 2 seconds
- Statistics load time: < 1 second
- Modal open time: < 200ms
- Pull-to-refresh: < 1 second

### Technical
- Query cache hit rate: > 80%
- WebSocket connection uptime: > 99%
- Error rate: < 1%
- App crashes: 0

### Business
- Daily extractions per user
- Extraction success rate
- Time spent on Extract screen
- Feature adoption rate

---

## Conclusion

This redesign transforms the Extract screen from a basic navigation interface to a powerful, data-rich extraction control center. Users can now:

1. **See real statistics** at a glance for all outlets
2. **Start extractions directly** from the main screen
3. **Monitor progress in real-time** via live logs
4. **Navigate to details** when needed for advanced controls
5. **Refresh data** with a simple pull gesture

The design follows mobile-first principles, accessibility standards, and modern UX patterns while maintaining the app's brand identity.
