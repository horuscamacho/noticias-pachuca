# Quick Read Screen Design Specification

**Version:** 1.0.0
**Date:** 2025-10-25
**Platform:** React Native (Expo)
**Design System:** Brutalist 2026

---

## 1. OVERVIEW

The Quick Read screen is a swipeable article summary interface where users can quickly browse through curated news by swiping left/right. Each card displays a hero image, category, title, author, and summary with elegant cross-fade transitions between articles.

### User Flow
1. User navigates to "Quick" tab from bottom navigation
2. Screen loads with first article displayed
3. User swipes left to see next article (current fades out, next fades in)
4. User swipes right to see previous article (same animation)
5. User taps hero image OR title to navigate to full article
6. Swipe indicators show position (e.g., 2/5)

---

## 2. LAYOUT STRUCTURE

### Screen Anatomy (Top to Bottom)

```
┌─────────────────────────────────────┐
│  Safe Area Top                      │ ← Status bar / notch
├─────────────────────────────────────┤
│  [Hero Image]                       │ ← 280px height, tappable
│  ┌─────────────┐                    │
│  │  DEPORTES   │ ← Category badge   │
│  └─────────────┘                    │
├─────────────────────────────────────┤
│                                     │
│  GOBERNADOR PRESENTA...             │ ← Title (h3, 2-3 lines)
│  NUEVO PLAN ECONÓMICO               │
│                                     │
│  Por María González                 │ ← Author (caption)
│                                     │
│  El gobernador de Pachuca           │ ← Summary (body)
│  presentó hoy un nuevo plan         │   5 lines max
│  económico que busca...             │   Fixed height
│  [more text here]                   │
│  [more text here]                   │
│                                     │
│  ○ ● ○ ○ ○                         │ ← Swipe indicators
│                                     │
│  Safe Area Bottom                   │ ← Home indicator
└─────────────────────────────────────┘
```

### Component Hierarchy

```
QuickReadScreen (full screen)
├─ Animated.View (stack of cards with absolute positioning)
│  ├─ QuickReadCard (Article 0, zIndex: 100)
│  ├─ QuickReadCard (Article 1, zIndex: 99)
│  └─ QuickReadCard (Article 2, zIndex: 98)
│
QuickReadCard
├─ Pressable (Hero Image Container)
│  └─ Image (Hero Image)
│     └─ CategoryBadge (absolute positioned)
├─ View (Content Container)
│  ├─ Pressable (Title Container)
│  │  └─ ThemedText variant="h3" (Title)
│  ├─ ThemedText variant="caption" (Author)
│  └─ ThemedText variant="body" (Summary)
└─ PaginationDots (Swipe Indicators)
```

---

## 3. DETAILED SPECIFICATIONS

### 3.1 Hero Image

**Dimensions:**
- Height: `280px` (fixed)
- Width: `100%` (full screen width)
- Aspect Ratio: Dynamic based on screen width
- Object Fit: `cover` (crop to fill)

**Styling:**
- Border: `4px solid #000000` (bottom only)
- Border Radius: `0` (sharp corners)
- Background Color: `#F7F7F7` (while loading)

**Behavior:**
- Tappable: Yes
- Press State: Opacity `0.8` (200ms transition)
- On Press: Navigate to full article
- Haptic Feedback: Light impact
- Accessibility: "Ver artículo completo con imagen"

**Category Badge (Overlaid on Image):**
- Position: Absolute
- Bottom: `16px`
- Left: `16px`
- Component: Reuse existing `CategoryBadge` pattern
- Background: Category-specific color with `4px` black border
- Text: Uppercase, bold, white
- Padding: `8px 16px`
- Example: "DEPORTES", "POLÍTICA", "ECONOMÍA"

---

### 3.2 Content Container

**Container Styling:**
- Background: `#FFFFFF` (white)
- Padding Top: `24px`
- Padding Horizontal: `20px`
- Padding Bottom: `32px`
- Border Left: `4px solid #000000`
- Border Right: `4px solid #000000`
- Border Bottom: `4px solid #000000`
- Flex: 1 (fills remaining space)

**Spacing Between Elements:**
- Title to Author: `16px`
- Author to Summary: `20px`
- Summary to Indicators: `auto` (pushed to bottom)

---

### 3.3 Title

**Typography:**
- Component: `<ThemedText variant="h3">`
- Font Size: `20px` (phone), `24px` (tablet)
- Font Weight: `700` (bold)
- Line Height: `1.4` (28px on phone)
- Letter Spacing: `0.5px`
- Text Transform: `UPPERCASE`
- Color: `#000000` (black)

**Layout:**
- Max Lines: `3`
- Ellipsis Mode: `tail`
- Overflow: Hidden

**Behavior:**
- Tappable: Yes
- Container: `<Pressable>`
- Press State: Background `#F7F7F7` (200ms transition)
- On Press: Navigate to full article
- Haptic Feedback: Light impact
- Accessibility: "Leer artículo: [title]"

---

### 3.4 Author

**Typography:**
- Component: `<ThemedText variant="caption">`
- Font Size: `12px` (phone), `14px` (tablet)
- Font Weight: `700` (bold)
- Line Height: `1.4`
- Letter Spacing: `1.0px`
- Text Transform: `UPPERCASE`
- Color: `#000000` (black)

**Format:**
- Prefix: "POR " (uppercase)
- Example: "POR MARÍA GONZÁLEZ"

**Layout:**
- Single line (no wrapping)
- Overflow: Ellipsis

**Behavior:**
- Not tappable (static text)

---

### 3.5 Summary

**Typography:**
- Component: `<ThemedText variant="body">`
- Font Size: `16px` (phone), `18px` (tablet)
- Font Weight: `400` (regular)
- Line Height: `1.6` (25.6px on phone)
- Letter Spacing: `0`
- Text Transform: `none` (sentence case)
- Color: `#1F1F1F` (near black)

**Layout:**
- Max Lines: `5`
- Ellipsis Mode: `tail`
- Fixed Height: `128px` (5 lines × 25.6px line height)
- Overflow: Hidden (no scrolling)

**Behavior:**
- Not tappable (static text)
- Text should be a concise summary (120-180 words)

---

### 3.6 Swipe Indicators

**Component:** Reuse existing `<PaginationDots>`

**Positioning:**
- Position: Absolute
- Bottom: `safe-area-bottom + 24px`
- Align: Center horizontally

**Styling (From PaginationDots component):**
- Inactive Dot: `8px × 8px`, `#F7F7F7` background, `2px` black border
- Active Dot: `32px × 8px`, `#FFFFFF` background, `2px` black border
- Gap: `8px` between dots
- Border Radius: `0` (square/rectangular)
- Animation: Spring animation (friction: 7, tension: 40)

**Behavior:**
- Shows current position: e.g., dot 2 active = viewing article 2 of 5
- Updates on swipe
- Not tappable (visual indicator only)

**Accessibility:**
- Label: "Artículo [current] de [total]"
- Example: "Artículo 2 de 5"

---

## 4. INTERACTION DESIGN

### 4.1 Pan Gesture (Swipe)

**Gesture Configuration:**
- Library: `react-native-gesture-handler` v2
- Type: `PanGestureHandler`
- Direction: Horizontal only
- Active Offset X: `[-10, 10]` (require 10px movement to activate)
- Fail Offset Y: `[-5, 5]` (vertical scroll cancels horizontal)

**Swipe Thresholds:**
- Distance Threshold: `40%` of screen width
- Velocity Threshold: `800px/s`
- Either condition triggers transition

**Animation Specification:**
- Library: `react-native-reanimated` v4
- Duration: `300ms`
- Easing: `Easing.out(Easing.cubic)`
- Type: Cross-fade (interpolated opacity)

**Opacity Interpolation:**

**Current Card (Fading Out):**
```typescript
// Translation: 0 → -screenWidth (swipe left) or 0 → +screenWidth (swipe right)
// Opacity: 1 → 0
opacity = interpolate(
  translationX.value,
  [-screenWidth, 0, screenWidth],
  [0, 1, 0],
  Extrapolate.CLAMP
)
```

**Next Card (Fading In):**
```typescript
// Initially behind current card at opacity 0
// Fades in as current card fades out
opacity = interpolate(
  translationX.value,
  [-screenWidth, 0, screenWidth],
  [1, 0, 1],
  Extrapolate.CLAMP
)
```

**zIndex Management:**
- Current Card: `zIndex: 100`
- Previous Card: `zIndex: 99` (when swiping right)
- Next Card: `zIndex: 99` (when swiping left)
- All others: `zIndex: 98`

**Edge Behavior:**
- First Article (index 0): Cannot swipe right (no previous)
- Last Article (index N-1): Cannot swipe left (no next)
- Edge Resistance: Swipe gesture feels "sticky" at edges
- Implementation: Clamp `translationX` to prevent overscroll

---

### 4.2 Tap Interactions

**Hero Image Tap:**
- Trigger: `onPress` on image Pressable
- Visual Feedback: Opacity `0.8` during press
- Haptics: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Action: Navigate to `/(article)/[id]` route
- Transition: Push from right (250ms)

**Title Tap:**
- Trigger: `onPress` on title Pressable
- Visual Feedback: Background `#F7F7F7` during press
- Haptics: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Action: Navigate to `/(article)/[id]` route
- Transition: Push from right (250ms)

**Press State Timing:**
- Press In → Pressed State: `0ms` (immediate)
- Press Out → Default State: `200ms` transition

---

### 4.3 Animation Performance

**Optimization:**
- Use `useNativeDriver: true` for opacity animations
- Avoid layout shifts during animation
- Pre-render next card behind current card
- Use `shouldRasterizeIOS` for complex card layouts

**Target Frame Rate:**
- 60fps (16.67ms per frame)
- Animation must feel butter-smooth

**Memory Management:**
- Lazy load images (only load current + adjacent cards)
- Unload images for cards >2 positions away
- Use `FastImage` or `expo-image` for optimized loading

---

## 5. RESPONSIVE DESIGN

### 5.1 Phone (Width < 768px)

**Layout:**
- Hero Height: `280px`
- Content Padding: `20px`
- Title: `20px` font size, 3 lines max
- Summary: `16px` font size, 5 lines max

### 5.2 Tablet (Width >= 768px)

**Layout:**
- Hero Height: `360px` (taller for more immersive)
- Content Padding: `32px`
- Title: `24px` font size, 3 lines max
- Summary: `18px` font size, 5 lines max
- Max Content Width: `600px` (centered with padding)

---

## 6. ACCESSIBILITY

### 6.1 Screen Reader Support

**Screen Announcement (VoiceOver/TalkBack):**
```
"Quick Read, Artículo 2 de 5.
Categoría: DEPORTES.
Título: GOBERNADOR PRESENTA NUEVO PLAN ECONÓMICO.
Por María González.
Resumen: El gobernador de Pachuca presentó hoy...
Desliza izquierda para siguiente artículo, derecha para anterior.
Toca imagen o título para ver artículo completo."
```

**Component Accessibility Props:**

**Card Container:**
```typescript
accessibilityRole="article"
accessibilityLabel={`Artículo ${index + 1} de ${total}`}
```

**Hero Image:**
```typescript
accessibilityRole="imagebutton"
accessibilityLabel={`Ver artículo completo: ${title}`}
accessibilityHint="Toca para abrir artículo"
```

**Title:**
```typescript
accessibilityRole="header"
accessibilityLevel={2}
```

**Category Badge:**
```typescript
accessibilityLabel={`Categoría: ${categoryName}`}
```

**Swipe Indicators:**
```typescript
accessibilityRole="progressbar"
accessibilityLabel={`Artículo ${currentIndex + 1} de ${total}`}
accessibilityValue={{
  now: currentIndex + 1,
  min: 1,
  max: total,
}}
```

### 6.2 Keyboard Navigation (Web/Android TV)

- Arrow Left: Previous article
- Arrow Right: Next article
- Enter/Space: Open current article
- Tab: Focus on image → title → next card

### 6.3 Dynamic Type

- Respect user's font size preferences
- Max multiplier: `1.5x` (prevent layout breaks)
- Test with Large Text, Extra Large Text

---

## 7. DESIGN TOKENS

### 7.1 Colors

```typescript
export const QUICK_READ_COLORS = {
  // Backgrounds
  cardBackground: '#FFFFFF',
  screenBackground: '#F7F7F7',

  // Borders
  borderColor: '#000000',

  // Text
  titleColor: '#000000',
  authorColor: '#000000',
  summaryColor: '#1F1F1F',

  // Interactive States
  imagePressOverlay: 'rgba(0, 0, 0, 0.2)', // 20% black
  titlePressBackground: '#F7F7F7',

  // Category Badge (inherited from design system)
  categoryDeportes: '#854836', // Brown
  categoryPolitica: '#FFB22C', // Yellow
  categoryEconomia: '#FF0000', // Red
  categorySalud: '#000000', // Black
  categorySeguridad: '#854836', // Brown
  categoryEstado: '#FFB22C', // Yellow
} as const;
```

### 7.2 Spacing

```typescript
export const QUICK_READ_SPACING = {
  // Hero Image
  heroHeight: 280,
  heroHeightTablet: 360,
  heroBorderWidth: 4,

  // Content Container
  contentPadding: 20,
  contentPaddingTablet: 32,
  contentPaddingTop: 24,
  contentPaddingBottom: 32,

  // Element Gaps
  titleToAuthor: 16,
  authorToSummary: 20,
  summaryToIndicators: 'auto',

  // Category Badge (on image)
  badgeBottom: 16,
  badgeLeft: 16,
  badgePadding: 8,
  badgePaddingHorizontal: 16,

  // Indicators
  indicatorsBottom: 24, // + safe area

  // Borders
  borderWidth: 4,
} as const;
```

### 7.3 Typography (Reference)

```typescript
// Title
variant: 'h3'
fontSize: { phone: 20, tablet: 24 }
fontWeight: '700'
lineHeight: 1.4
letterSpacing: 0.5
textTransform: 'uppercase'

// Author
variant: 'caption'
fontSize: { phone: 12, tablet: 14 }
fontWeight: '700'
lineHeight: 1.4
letterSpacing: 1.0
textTransform: 'uppercase'

// Summary
variant: 'body'
fontSize: { phone: 16, tablet: 18 }
fontWeight: '400'
lineHeight: 1.6
letterSpacing: 0
textTransform: 'none'
```

### 7.4 Animation

```typescript
export const QUICK_READ_ANIMATION = {
  // Swipe Transition
  swipeDuration: 300, // ms
  swipeEasing: Easing.out(Easing.cubic),

  // Swipe Thresholds
  distanceThreshold: 0.4, // 40% of screen width
  velocityThreshold: 800, // px/s

  // Press Feedback
  pressDuration: 200, // ms
  pressOpacity: 0.8,

  // Haptics
  hapticStyle: 'light', // ImpactFeedbackStyle.Light
} as const;
```

---

## 8. COMPONENT BREAKDOWN

### 8.1 New Components to Create

**QuickReadScreen** (`/app/(invited)/quick/index.tsx`)
- Container component
- Manages article data state
- Handles pan gesture logic
- Manages card stack with zIndex
- Tracks current index
- Provides navigation

**QuickReadCard** (`/components/quick/QuickReadCard.tsx`)
- Displays single article
- Contains hero image, title, author, summary
- Handles tap interactions
- Animated opacity based on gesture

**QuickReadHeroImage** (`/components/quick/QuickReadHeroImage.tsx`)
- Pressable image container
- Category badge overlay
- Loading state
- Error fallback
- Optimized image loading

**QuickReadContent** (`/components/quick/QuickReadContent.tsx`)
- Content area container
- Title (pressable)
- Author
- Summary
- Proper spacing

---

### 8.2 Reusable Components

These components already exist and should be reused:

**CategoryBadge** (`/components/CategoryBadge.tsx` - needs to be created)
- Background color based on category
- 4px black border
- Uppercase bold text
- White text color
- Padding: 8px 16px

**PaginationDots** (`/components/PaginationDots.tsx`)
- Already exists
- Reuse as-is for swipe indicators

**ThemedText** (`/components/ThemedText.tsx`)
- Already exists
- Use variants: `h3`, `caption`, `body`

---

## 9. DATA STRUCTURE

### 9.1 QuickReadArticle Type

```typescript
export interface QuickReadArticle {
  id: string; // Unique article ID
  slug: string; // URL-friendly slug

  // Hero Image
  heroImage: {
    url: string;
    alt: string;
    blurhash?: string; // For loading placeholder
    width: number;
    height: number;
  };

  // Content
  category: {
    id: string; // 'deportes', 'politica', etc.
    label: string; // 'DEPORTES', 'POLÍTICA', etc.
    color: string; // '#854836', '#FFB22C', etc.
  };
  title: string; // Max 120 characters
  author: {
    name: string; // "María González"
    id: string;
  };
  summary: string; // 120-180 words, plain text

  // Metadata
  publishedAt: string; // ISO 8601 date
  readTime?: number; // Estimated minutes
}
```

### 9.2 Mock Data (for development)

```typescript
export const MOCK_QUICK_READ_ARTICLES: QuickReadArticle[] = [
  {
    id: '1',
    slug: 'gobernador-plan-economico',
    heroImage: {
      url: 'https://picsum.photos/800/600?random=1',
      alt: 'Gobernador en conferencia',
      width: 800,
      height: 600,
    },
    category: {
      id: 'politica',
      label: 'POLÍTICA',
      color: '#FFB22C',
    },
    title: 'GOBERNADOR PRESENTA NUEVO PLAN ECONÓMICO',
    author: {
      name: 'María González',
      id: 'maria-gonzalez',
    },
    summary: 'El gobernador de Pachuca presentó hoy un nuevo plan económico que busca impulsar el desarrollo de la región. El plan incluye inversiones en infraestructura, educación y apoyo a pequeñas empresas. Se espera que genere más de 5,000 empleos en los próximos dos años.',
    publishedAt: '2025-10-25T10:30:00Z',
    readTime: 3,
  },
  // ... 4 more articles
];
```

---

## 10. IMPLEMENTATION NOTES

### 10.1 Priority Order

**Phase 1: Core Layout (Day 1-2)**
1. Create `QuickReadScreen` with static layout
2. Create `QuickReadCard` component
3. Implement hero image with category badge
4. Add title, author, summary with correct typography
5. Add pagination dots

**Phase 2: Swipe Gesture (Day 3-4)**
1. Integrate `PanGestureHandler`
2. Implement cross-fade animation logic
3. Add swipe thresholds and edge resistance
4. Wire up pagination dots to update on swipe

**Phase 3: Interactions (Day 5)**
1. Add tap handlers for image and title
2. Implement navigation to article detail
3. Add haptic feedback
4. Test press states

**Phase 4: Polish (Day 6-7)**
1. Optimize image loading
2. Add accessibility labels
3. Test with VoiceOver/TalkBack
4. Responsive tablet layout
5. Performance testing

---

### 10.2 File Structure

```
app-noticias-pachuca/
├── app/
│   └── (invited)/
│       └── quick/
│           └── index.tsx              # QuickReadScreen
│
├── components/
│   ├── quick/
│   │   ├── QuickReadCard.tsx         # Individual card
│   │   ├── QuickReadHeroImage.tsx    # Hero image + badge
│   │   ├── QuickReadContent.tsx      # Content area
│   │   └── QuickRead.tokens.ts       # Design tokens
│   │
│   └── CategoryBadge.tsx              # Shared badge component
│
├── types/
│   └── quickRead.types.ts             # TypeScript interfaces
│
└── hooks/
    └── useQuickReadGesture.ts         # Swipe gesture hook
```

---

### 10.3 Testing Checklist

**Functional Testing:**
- [ ] Swipe left transitions to next article
- [ ] Swipe right transitions to previous article
- [ ] Can't swipe right on first article
- [ ] Can't swipe left on last article
- [ ] Tapping image navigates to article
- [ ] Tapping title navigates to article
- [ ] Pagination dots show correct position
- [ ] Category badge displays correct color

**Visual Testing:**
- [ ] Hero image fills 280px height correctly
- [ ] 4px black borders on all edges
- [ ] Text truncates properly (title 3 lines, summary 5 lines)
- [ ] Spacing matches spec (24px, 20px, 16px)
- [ ] Category badge positioned correctly on image

**Animation Testing:**
- [ ] Cross-fade is smooth (60fps)
- [ ] 300ms duration feels right
- [ ] No janky transitions
- [ ] Press states animate smoothly
- [ ] Haptic feedback fires on tap

**Accessibility Testing:**
- [ ] VoiceOver announces article info correctly
- [ ] Image button is focusable
- [ ] Title button is focusable
- [ ] Pagination dots read current position
- [ ] Keyboard navigation works (if applicable)

**Performance Testing:**
- [ ] Smooth scrolling on low-end devices
- [ ] Images load efficiently
- [ ] No memory leaks on repeated swipes
- [ ] App doesn't crash with 50+ articles

---

## 11. DESIGN RATIONALE

### Why These Decisions?

**Hero Image at 280px:**
- Prominent but not overwhelming
- Leaves room for content without scrolling
- Works on most phone screen heights (667px+)
- 16:9 aspect ratio at ~375px width

**Category Badge on Image:**
- Saves vertical space
- Creates visual hierarchy (color draws eye)
- Common pattern (Instagram, Pinterest)
- Badge stands out against image with 4px border

**Title as h3 (20px), Not h1/h2:**
- Large enough to be prominent
- Not so large it takes 4-5 lines
- Matches existing design system scale
- Readable at arm's length

**Fixed 5-Line Summary:**
- Prevents layout shifts during swipe
- Consistent card height = better animation
- Forces content curation (quality over quantity)
- 5 lines ≈ 90-100 words = perfect quick read

**Cross-Fade Instead of Slide:**
- More elegant and modern
- Less visual noise
- Doesn't feel like "swiping through a deck"
- Focuses attention on incoming content

**300ms Duration:**
- Fast enough to feel responsive
- Slow enough to be noticeable
- Matches iOS standard transition timing
- Not jarring

**40% Distance / 800px/s Velocity:**
- Balances intentionality vs. ease
- Prevents accidental swipes
- Feels natural to users
- Matches gesture patterns in other apps

---

## 12. FUTURE ENHANCEMENTS

**Phase 2 Features (Not in MVP):**

1. **Pull to Refresh**
   - Load new articles at top of stack
   - Haptic feedback on refresh

2. **Share Button**
   - Floating button on card
   - Share article URL + preview

3. **Bookmark Toggle**
   - Heart icon in corner
   - Save for later functionality

4. **Video Support**
   - Play inline video in hero area
   - Auto-play on focus

5. **Article Progress**
   - Show percentage read on card
   - "Continue Reading" badge

6. **Personalization**
   - AI-curated feed based on interests
   - "Not interested" swipe down gesture

7. **Offline Mode**
   - Cache articles for offline reading
   - Sync when back online

---

## 13. COMPARISON WITH EXISTING SCREENS

### Consistency Check

**Brutalist Design Language:**
- ✅ 4px black borders (matches home screen cards)
- ✅ Sharp corners (no border-radius)
- ✅ Bold uppercase typography for headers
- ✅ White/black/brown/yellow color palette
- ✅ High contrast, geometric shapes

**Typography Scale:**
- ✅ Uses existing `ThemedText` variants
- ✅ h3 for article titles (same as home screen)
- ✅ caption for metadata (same as author bylines)
- ✅ body for content (same as article text)

**Component Reuse:**
- ✅ `PaginationDots` from onboarding
- ✅ `ThemedText` from design system
- ✅ Category badge pattern from home screen
- ✅ Same press states as `BrutalistButton`

**Animation Style:**
- ✅ Spring animations (same as pagination dots)
- ✅ 300ms transitions (matches tab animations)
- ✅ Opacity-based (consistent with header collapse)

**Spacing System:**
- ✅ 16px, 20px, 24px increments
- ✅ Same padding as home content (20px)
- ✅ Same border widths (4px)

---

## CONCLUSION

This Quick Read screen design is production-ready, fully specified, and aligned with your existing brutalist design system. It leverages Reanimated v4 for butter-smooth 60fps animations while maintaining accessibility and performance standards.

The cross-fade swipe interaction is modern and elegant, fitting perfectly into the 2026 brutalist aesthetic while providing an intuitive, delightful user experience.

**Ready to implement!** 🚀
