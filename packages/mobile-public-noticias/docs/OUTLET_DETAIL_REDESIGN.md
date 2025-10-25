# Outlet Detail Screen Redesign - Mobile UX Improvements

## Overview
Complete redesign of the outlet detail screen with focus on mobile-first UX, real statistics, and better visual hierarchy.

## Key Improvements

### 1. Logs Section - ALWAYS VISIBLE
- **Before**: Could collapse, users couldn't see extraction progress
- **After**: Always visible, prominent position at top
- Shows "En Vivo" badge when extraction is active
- Empty state with helpful message when no logs
- Real-time updates via Socket.IO

### 2. Statistics Section - REAL DATA
- **Before**: Showing fake/wrong data from outlet.statistics
- **After**: Fetches real data from database via API
- **New metrics**:
  - Total URLs Extracted (from extractednoticias table)
  - Content Extracted Successfully (status = 'extracted')
  - Failed Extractions (status = 'failed')
  - Success Rate (percentage)
- Visual indicators with icons and color coding
- Loading skeleton states

### 3. Quick Actions - CARD-BASED UX
- **Before**: Buttons with cut-off text, poor touch targets
- **After**: Card-based design with:
  - Icons (Play, Pause, RotateCw from lucide-react-native)
  - Full text visible without truncation
  - Minimum 56px height (touch-friendly)
  - Brand yellow color (#f1ef47) for primary action
  - Descriptive subtitles
  - Disabled states clearly indicated
  - Loading indicators

### 4. Extraction History Section - NEW
Shows last 5 extraction runs with:
- Date/time of extraction
- URLs found
- Content extracted (success count)
- Failed count
- Duration (formatted as "Xm Ys")
- Status badges (Completado, Error, Parcial, En progreso)
- Error messages when applicable
- Empty state when no history available

### 5. Better Information Architecture
New order prioritizes user needs:
1. Header (outlet name, status)
2. Real-time logs (most important during extractions)
3. Statistics (performance overview)
4. Quick actions (control)
5. Extraction history (context)
6. Configuration (settings)
7. Info section (metadata)

## Technical Implementation

### New Files Created

#### 1. Types
**File**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/types/extraction-history.types.ts`

```typescript
export interface ExtractionHistoryItem {
  id: string;
  websiteConfigId: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number; // seconds
  totalUrlsFound: number;
  totalContentExtracted: number;
  totalFailed: number;
  status: 'in_progress' | 'completed' | 'failed' | 'partial';
  errorMessage?: string;
}

export interface OutletStatisticsDetailed {
  totalUrlsExtracted: number;
  totalContentExtracted: number;
  totalFailed: number;
  successRate: number; // percentage
}
```

#### 2. API Service
**File**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/services/outlets/extractionHistoryApi.ts`

```typescript
export const extractionHistoryApi = {
  // GET /generator-pro/websites/:id/statistics
  getOutletStatistics: async (websiteConfigId: string): Promise<OutletStatisticsDetailed>

  // GET /generator-pro/websites/:id/extraction-history?limit=5
  getExtractionHistory: async (websiteConfigId: string, limit: number = 5): Promise<ExtractionHistoryItem[]>
}
```

#### 3. React Hooks
**File**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/hooks/useExtractionHistory.ts`

```typescript
// Fetch real statistics from database
useOutletStatistics(outletId: string)

// Fetch extraction history
useExtractionHistory(outletId: string, limit: number = 5)
```

#### 4. Updated Screen
**File**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/outlet/[id].tsx`

Complete redesign with new sections and improved UX.

## Backend API Requirements

The backend needs to implement these NEW endpoints:

### 1. Get Outlet Statistics
```
GET /generator-pro/websites/:id/statistics
```

**Response**:
```json
{
  "totalUrlsExtracted": 1250,
  "totalContentExtracted": 1180,
  "totalFailed": 70,
  "successRate": 94.4
}
```

**SQL Query Logic**:
```sql
-- Total URLs extracted
SELECT COUNT(*) FROM extractednoticias
WHERE websiteConfigId = :id;

-- Total content extracted successfully
SELECT COUNT(*) FROM extractednoticias
WHERE websiteConfigId = :id AND status = 'extracted';

-- Total failed
SELECT COUNT(*) FROM extractednoticias
WHERE websiteConfigId = :id AND status = 'failed';

-- Success rate
SELECT (COUNT(CASE WHEN status = 'extracted' THEN 1 END) * 100.0 / COUNT(*))
FROM extractednoticias
WHERE websiteConfigId = :id;
```

### 2. Get Extraction History
```
GET /generator-pro/websites/:id/extraction-history?limit=5
```

**Response**:
```json
{
  "history": [
    {
      "id": "uuid-1",
      "websiteConfigId": "uuid-website",
      "startedAt": "2025-10-09T10:30:00Z",
      "completedAt": "2025-10-09T10:35:00Z",
      "duration": 300,
      "totalUrlsFound": 50,
      "totalContentExtracted": 45,
      "totalFailed": 5,
      "status": "completed",
      "errorMessage": null
    }
  ],
  "total": 25
}
```

**Implementation Notes**:
- Create an `extraction_runs` table to track each extraction execution
- Store: websiteConfigId, startedAt, completedAt, duration, metrics, status
- Update this table at the start and end of each extraction
- Query ordered by `startedAt DESC` with limit

**Suggested Table Schema**:
```sql
CREATE TABLE extraction_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  websiteConfigId UUID REFERENCES websiteconfig(id),
  startedAt TIMESTAMP NOT NULL,
  completedAt TIMESTAMP,
  duration INT, -- seconds
  totalUrlsFound INT DEFAULT 0,
  totalContentExtracted INT DEFAULT 0,
  totalFailed INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_extraction_runs_website ON extraction_runs(websiteConfigId, startedAt DESC);
```

## Design System Compliance

### Colors
- Brand Yellow: `#f1ef47` (primary action button)
- Success: `#22c55e` (green-600)
- Error: `#ef4444` (red-600)
- Warning: `#f59e0b` (yellow-600)
- Info: `#3b82f6` (blue-600)

### Components Used
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Button (with variants: default, secondary)
- Badge (with variants: default, secondary, destructive, outline)
- Input, Label
- Skeleton (loading states)
- Separator
- LogList (custom component)
- TouchableOpacity (for custom card actions)

### Accessibility
- All touch targets minimum 48px (actually using 56px for better UX)
- Clear disabled states with opacity
- Loading indicators for async actions
- Semantic HTML-like structure with proper roles
- Color-blind friendly (not relying on color alone)

### Mobile-First Design
- Responsive grid layout (flex-row with gap-3)
- Touch-friendly spacing
- Scrollable content with proper padding
- No horizontal scrolling
- Clear visual hierarchy
- Bottom sheets for future enhancements

## User Flow Improvements

### Before
1. User opens outlet detail
2. Sees fake statistics
3. Logs section can be collapsed (users miss updates)
4. Buttons with text cut off
5. No historical context

### After
1. User opens outlet detail
2. Sees outlet name and status
3. **Logs section prominently displayed** (always visible)
4. Real statistics from database
5. Clear action cards with icons and full text
6. Historical context with last 5 runs
7. Configuration and info at bottom

## Testing Checklist

### Frontend
- [ ] Logs section always visible
- [ ] Statistics fetch real data
- [ ] Action cards are touch-friendly (min 56px)
- [ ] Icons display correctly
- [ ] Loading states show skeletons
- [ ] Error states handled gracefully
- [ ] Empty states show helpful messages
- [ ] Success rate calculated correctly
- [ ] Duration formatted properly (Xm Ys)
- [ ] Status badges show correct colors
- [ ] Disabled states work correctly

### Backend
- [ ] `/statistics` endpoint returns correct counts
- [ ] `/extraction-history` endpoint returns last 5 runs
- [ ] extraction_runs table created
- [ ] Extraction process updates extraction_runs
- [ ] Success rate calculation is accurate
- [ ] Queries are optimized with indexes

### Integration
- [ ] Real-time logs via Socket.IO work
- [ ] Statistics refresh after extraction
- [ ] History updates after extraction completes
- [ ] Mutation invalidations trigger refetch
- [ ] No memory leaks with Socket listeners

## Future Enhancements

1. **Pull-to-refresh** on statistics and history
2. **Infinite scroll** on extraction history (load more)
3. **Filter history** by status (success, failed, partial)
4. **Chart visualization** of success rate over time
5. **Export history** to CSV
6. **Notifications** when extraction completes
7. **Detailed view** of each extraction run
8. **Comparison** between different time periods

## Design Rationale

### Why Logs First?
Users care most about what's happening RIGHT NOW during extractions. The logs section provides immediate feedback and reduces anxiety about whether the system is working.

### Why Card-Based Actions?
Buttons are too small for mobile. Cards provide:
- Larger touch targets
- Room for descriptive text
- Visual hierarchy with icons
- Better spacing between actions

### Why Real Statistics?
Fake data erodes trust. Real database queries provide:
- Accurate metrics for decision-making
- Performance insights
- Problem identification
- Historical trends

### Why Extraction History?
Context helps users:
- Understand patterns
- Identify issues
- Track improvements
- Build confidence in the system

## Performance Considerations

1. **Statistics cached for 30 seconds** (staleTime)
2. **History cached for 30 seconds**
3. **Outlet data cached for 3 minutes**
4. **React Query handles background refetch**
5. **Skeleton loading prevents layout shift**
6. **Socket listeners cleaned up on unmount**

## Accessibility Notes

- Minimum 48dp touch targets (using 56px)
- Color contrast ratios meet WCAG AA
- Screen reader friendly with proper labels
- Keyboard navigation support (web)
- Loading states announced
- Error messages clear and actionable

---

**Updated**: 2025-10-09
**Version**: 1.0
**Designer**: Claude (Jarvis)
**Implementation Status**: Frontend Complete | Backend Pending
