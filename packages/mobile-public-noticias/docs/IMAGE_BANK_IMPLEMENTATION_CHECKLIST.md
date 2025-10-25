# Image Bank - Implementation Checklist

**Feature:** Image Bank (Banco de Imágenes)
**Platform:** React Native (Expo)
**Status:** 🔴 Not Started

---

## PHASE 1: FOUNDATION & SETUP

### 1.1 Project Setup
- [ ] Create feature directory structure (`src/features/image-bank/`)
- [ ] Install additional dependencies (if needed):
  - [ ] `react-native-flash-list` (for performant grid)
  - [ ] Any other missing packages
- [ ] Set up TypeScript interfaces (`image.types.ts`)
- [ ] Configure query keys for React Query

### 1.2 API Integration Planning
- [ ] Review API endpoints for fetched images
- [ ] Document expected response structure
- [ ] Create API service functions
- [ ] Set up mock data for development

### 1.3 Navigation Update
- [ ] Update tab layout: Rename "Publicar" → "Imagenes"
- [ ] Update tab icon (if needed)
- [ ] Create dynamic route for detail screen: `app/(protected)/image/[id].tsx`

**Estimated Time:** 2-3 hours

---

## PHASE 2: CORE COMPONENTS

### 2.1 ImageCard Component
- [ ] Create base component with 1:1 aspect ratio
- [ ] Implement image loading with expo-image
- [ ] Add overlay gradient for keywords
- [ ] Add keyword chips (max 2, ellipsis)
- [ ] Implement loading skeleton state
- [ ] Implement error state
- [ ] Add accessibility labels
- [ ] Test on different screen sizes

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/ImageCard.tsx`

### 2.2 ImageGrid Component
- [ ] Set up FlashList with 3-column layout
- [ ] Implement responsive column count (3 mobile, 4-6 tablet)
- [ ] Add pull-to-refresh functionality
- [ ] Implement infinite scroll with loading indicator
- [ ] Add empty state
- [ ] Add error state with retry
- [ ] Optimize performance (memoization, key extraction)

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/ImageGrid.tsx`

**Estimated Time:** 4-6 hours

---

## PHASE 3: MULTI-SELECT FUNCTIONALITY

### 3.1 Selection State Management
- [ ] Create Zustand store for selection state
- [ ] Implement `useImageSelection` hook
- [ ] Add selection toggle logic
- [ ] Add select all / deselect all
- [ ] Add mode enter/exit logic
- [ ] Persist selection for 30 seconds (grace period)

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImageSelection.ts`

### 3.2 Multi-Select UI
- [ ] Update ImageCard for selection mode
- [ ] Add checkmark indicator (animated)
- [ ] Add yellow border on selection
- [ ] Implement long-press gesture (600ms)
- [ ] Add haptic feedback
- [ ] Implement selection animations (scale, border)

### 3.3 MultiSelectBar Component
- [ ] Create bottom action bar
- [ ] Add selection count display
- [ ] Add "Cancel" button
- [ ] Add "Almacenar" button with count badge
- [ ] Implement slide-up animation
- [ ] Add safe area support
- [ ] Disable button when 0 selected

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/MultiSelectBar.tsx`

**Estimated Time:** 6-8 hours

---

## PHASE 4: FILTER & SORT

### 4.1 Filter Logic
- [ ] Create filter state management
- [ ] Implement `useImageFilters` hook
- [ ] Add keyword filter logic
- [ ] Add date range filter logic
- [ ] Add source outlet filter logic
- [ ] Combine filters with AND logic

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImageFilters.ts`

### 4.2 FilterModal Component
- [ ] Create bottom sheet modal
- [ ] Add keyword checkbox section
- [ ] Add date range picker
- [ ] Add source outlet radio group
- [ ] Add "Aplicar" and "Limpiar" buttons
- [ ] Implement modal animations
- [ ] Add swipe-to-close gesture

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/FilterModal.tsx`

### 4.3 SortModal Component
- [ ] Create bottom sheet modal
- [ ] Add sort options (radio group)
- [ ] Implement auto-close on selection
- [ ] Add icons for each option

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/SortModal.tsx`

### 4.4 Filter Chips
- [ ] Create FilterChip component
- [ ] Display active filters
- [ ] Add remove (X) functionality
- [ ] Implement horizontal scroll
- [ ] Style with yellow tint

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/FilterChip.tsx`

### 4.5 Sticky Header
- [ ] Create sticky header layout
- [ ] Add filter/sort buttons
- [ ] Show active filter chips
- [ ] Add scroll shadow effect
- [ ] Handle mode transitions (normal ↔ multi-select)

**Estimated Time:** 8-10 hours

---

## PHASE 5: DETAIL SCREEN

### 5.1 ImageDetailScreen Layout
- [ ] Create full-screen modal
- [ ] Implement slide-from-right animation (iOS) / bottom (Android)
- [ ] Add header with back button and more options
- [ ] Create scrollable metadata section
- [ ] Add sticky footer with actions

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/app/(protected)/image/[id].tsx`

### 5.2 Hero Image Section
- [ ] Display full-res image (60vh max)
- [ ] Implement pinch-to-zoom
- [ ] Implement double-tap to zoom
- [ ] Add loading state
- [ ] Handle image errors

### 5.3 Metadata Section
- [ ] Display source outlet (icon + text)
- [ ] Display extraction date (formatted)
- [ ] Display keywords as chips
- [ ] Display original URL (truncated, tappable)
- [ ] Add dividers between sections

### 5.4 Related Images Carousel
- [ ] Create horizontal ScrollView
- [ ] Render 120x120px thumbnails
- [ ] Add tap navigation to related images
- [ ] Handle empty state

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/components/RelatedImagesCarousel.tsx`

### 5.5 Detail Actions
- [ ] Implement "Almacenar en Banco" button
- [ ] Implement "Compartir" button (native share)
- [ ] Add success toast feedback
- [ ] Handle action errors

**Estimated Time:** 6-8 hours

---

## PHASE 6: DATA LAYER

### 6.1 React Query Setup
- [ ] Create `useImages` hook (infinite query)
- [ ] Implement pagination logic
- [ ] Add filter/sort as query keys
- [ ] Configure cache and stale times
- [ ] Add prefetching for next page

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImages.ts`

### 6.2 Image Bank API
- [ ] Create `useImageBank` hook
- [ ] Implement save to bank mutation
- [ ] Add success/error handling
- [ ] Invalidate queries on success

**File:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/mobile-expo/src/features/image-bank/hooks/useImageBank.ts`

### 6.3 API Service Functions
- [ ] `fetchImages(page, filters, sort)` - Get paginated images
- [ ] `fetchImageDetail(id)` - Get single image detail
- [ ] `saveToBank(imageIds)` - Save selected images
- [ ] `fetchRelatedImages(id)` - Get related images

**Estimated Time:** 4-5 hours

---

## PHASE 7: LOADING & ERROR STATES

### 7.1 Skeleton Components
- [ ] Create reusable Skeleton component
- [ ] Add shimmer animation
- [ ] Create ImageCard skeleton
- [ ] Create header skeleton
- [ ] Test skeleton timing

### 7.2 Empty States
- [ ] Create "No images" empty state
- [ ] Create "No results" empty state (filtered)
- [ ] Add illustrations/icons
- [ ] Add call-to-action buttons

### 7.3 Error States
- [ ] Create error state component
- [ ] Add retry functionality
- [ ] Create individual image error card
- [ ] Add toast notifications for errors

### 7.4 Loading Indicators
- [ ] Add infinite scroll loading spinner
- [ ] Add pull-to-refresh spinner
- [ ] Add button loading states
- [ ] Configure spinner colors (#f1ef47)

**Estimated Time:** 3-4 hours

---

## PHASE 8: ANIMATIONS & INTERACTIONS

### 8.1 Card Animations
- [ ] Implement selection animation (border, checkmark)
- [ ] Add scale animations (1.0 ↔ 0.95)
- [ ] Implement checkmark scale (0.8 → 1.0)
- [ ] Add fade transitions

### 8.2 Modal Animations
- [ ] Bottom sheet slide-up animation
- [ ] Modal slide-from-right (detail)
- [ ] Swipe-to-close gesture
- [ ] Spring physics for natural feel

### 8.3 Haptic Feedback
- [ ] Add haptic on long-press (medium)
- [ ] Add haptic on selection toggle (light)
- [ ] Add haptic on select all (medium)
- [ ] Add haptic on success (notification)
- [ ] Add haptic on error (warning)

### 8.4 Gesture Handling
- [ ] Long-press gesture (600ms threshold)
- [ ] Pinch-to-zoom gesture
- [ ] Swipe-back gesture (iOS)
- [ ] Pull-to-refresh gesture

**Estimated Time:** 5-6 hours

---

## PHASE 9: ACCESSIBILITY

### 9.1 Semantic HTML/Components
- [ ] Add `accessibilityRole` to all interactive elements
- [ ] Add `accessibilityLabel` to images
- [ ] Add `accessibilityHint` where needed
- [ ] Set `accessibilityState` for selection

### 9.2 Screen Reader Support
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Add live region announcements
- [ ] Test focus order

### 9.3 Color Contrast
- [ ] Verify all text meets WCAG AA (4.5:1)
- [ ] Check yellow button contrast (✅ 16.8:1)
- [ ] Ensure error text is readable
- [ ] Add non-color indicators (checkmarks, not just borders)

### 9.4 Touch Targets
- [ ] Verify all buttons ≥ 44pt
- [ ] Check card touch areas
- [ ] Test on smallest device (iPhone SE)
- [ ] Ensure proper spacing between targets

### 9.5 Reduced Motion
- [ ] Detect `prefers-reduced-motion`
- [ ] Disable animations when enabled
- [ ] Test with reduced motion on

**Estimated Time:** 4-5 hours

---

## PHASE 10: POLISHING & OPTIMIZATION

### 10.1 Performance Optimization
- [ ] Memoize ImageCard component
- [ ] Optimize re-renders (React.memo)
- [ ] Implement virtual scrolling (FlashList)
- [ ] Lazy load images (only visible + 2 screens)
- [ ] Profile with React DevTools
- [ ] Test with 1000+ images

### 10.2 Edge Cases
- [ ] Handle very long keywords (ellipsis)
- [ ] Handle missing images (broken URLs)
- [ ] Handle slow network (progressive loading)
- [ ] Handle offline mode (show cached)
- [ ] Limit selection to 200 images
- [ ] Handle accidental exits (confirmation)

### 10.3 User Feedback
- [ ] Add success toasts
- [ ] Add error toasts with retry
- [ ] Add loading states everywhere
- [ ] Add empty state guidance
- [ ] Test user frustration points

### 10.4 Code Quality
- [ ] Add TypeScript strict types (no `any`)
- [ ] Add JSDoc comments
- [ ] Remove console logs
- [ ] Add error boundaries
- [ ] Code review

**Estimated Time:** 6-8 hours

---

## PHASE 11: TESTING

### 11.1 Unit Tests
- [ ] Test selection logic
- [ ] Test filter logic
- [ ] Test sort logic
- [ ] Test API service functions
- [ ] Test utility functions

### 11.2 Integration Tests
- [ ] Test multi-select flow
- [ ] Test filter application
- [ ] Test save to bank workflow
- [ ] Test error recovery

### 11.3 E2E Tests (Detox)
- [ ] Test: Load grid → Tap image → View detail
- [ ] Test: Long press → Multi-select → Save
- [ ] Test: Apply filters → Verify results
- [ ] Test: Pull to refresh
- [ ] Test: Infinite scroll

### 11.4 Manual QA
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on tablet
- [ ] Test with slow network
- [ ] Test with VoiceOver/TalkBack
- [ ] Test with reduced motion

**Estimated Time:** 8-10 hours

---

## PHASE 12: DOCUMENTATION & DEPLOYMENT

### 12.1 Code Documentation
- [ ] Add JSDoc to all components
- [ ] Document prop types
- [ ] Add usage examples
- [ ] Update README

### 12.2 User Documentation
- [ ] Create user guide (optional)
- [ ] Add tooltips for first-time users
- [ ] Create onboarding flow (optional)

### 12.3 Deployment
- [ ] Merge to main branch
- [ ] Create pull request
- [ ] Code review
- [ ] QA approval
- [ ] Deploy to TestFlight/Internal Testing
- [ ] Production deployment

### 12.4 Monitoring
- [ ] Set up analytics events
- [ ] Track feature usage
- [ ] Monitor error rates
- [ ] Gather user feedback

**Estimated Time:** 3-4 hours

---

## TOTAL ESTIMATED TIME

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Foundation | 2-3 | 🔴 Critical |
| Phase 2: Core Components | 4-6 | 🔴 Critical |
| Phase 3: Multi-Select | 6-8 | 🔴 Critical |
| Phase 4: Filter & Sort | 8-10 | 🟡 High |
| Phase 5: Detail Screen | 6-8 | 🟡 High |
| Phase 6: Data Layer | 4-5 | 🔴 Critical |
| Phase 7: Loading States | 3-4 | 🟡 High |
| Phase 8: Animations | 5-6 | 🟢 Medium |
| Phase 9: Accessibility | 4-5 | 🟡 High |
| Phase 10: Polishing | 6-8 | 🟢 Medium |
| Phase 11: Testing | 8-10 | 🔴 Critical |
| Phase 12: Deployment | 3-4 | 🔴 Critical |

**Total:** 59-77 hours (~1.5 to 2 weeks for 1 developer)

---

## DEPENDENCIES & BLOCKERS

### External Dependencies
- [ ] API endpoints ready
- [ ] Image storage/CDN configured
- [ ] Backend support for filters/sorting
- [ ] Backend support for "save to bank" action

### Design Assets
- [ ] Icon set confirmed (lucide-react-native ✅)
- [ ] Color palette confirmed (#f1ef47 ✅)
- [ ] Font family confirmed (Aleo ✅)

### Technical Blockers
- [ ] None identified (all dependencies in package.json)

---

## RISK ASSESSMENT

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API not ready | 🔴 High | 🟡 Medium | Use mock data during development |
| Performance issues (1000+ images) | 🟡 Medium | 🟢 Low | Use FlashList, virtual scrolling |
| Complex gesture conflicts | 🟡 Medium | 🟡 Medium | Test early, adjust thresholds |
| Accessibility gaps | 🟡 Medium | 🟡 Medium | Test with assistive tech early |
| Scope creep (v2 features) | 🟢 Low | 🟡 Medium | Strict phase adherence |

---

## SUCCESS METRICS

### User Experience
- [ ] Users can browse 1000+ images smoothly (60fps)
- [ ] Multi-select activation < 1 second
- [ ] Filter application < 500ms
- [ ] Detail screen loads < 1 second
- [ ] Zero accessibility violations (WCAG AA)

### Technical
- [ ] Test coverage > 70%
- [ ] Zero critical bugs
- [ ] Crash rate < 0.1%
- [ ] Bundle size increase < 500KB

### Business
- [ ] Feature adoption > 60% of active users
- [ ] User retention increase (track via analytics)
- [ ] Positive user feedback (surveys/reviews)

---

## QUICK START COMMANDS

```bash
# Create feature directory
mkdir -p src/features/image-bank/{components,hooks,types,utils}

# Install additional dependencies (if needed)
yarn add react-native-flash-list

# Run linter
yarn lint

# Run tests
yarn test

# Start development
yarn ios  # or yarn android
```

---

## CONTACT & SUPPORT

**UX Specification:** `/docs/IMAGE_BANK_UX_SPECIFICATION.md`
**Wireframes:** `/docs/IMAGE_BANK_WIREFRAMES.md`
**This Checklist:** `/docs/IMAGE_BANK_IMPLEMENTATION_CHECKLIST.md`

**Questions?** Contact UX/Dev team

---

**Checklist Version:** 1.0
**Last Updated:** 2025-10-10
**Status:** 🔴 Ready to Start
