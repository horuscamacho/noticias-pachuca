# Quick Read Components

Production-ready visual components for the Quick Read feature - swipeable article summaries with brutalist design.

## Overview

The Quick Read screen allows users to quickly browse article summaries in a card-based interface. This implementation includes the visual components only; gesture/swipe logic will be added in Phase 2.

## Components

### 1. QuickReadCard

The main article card component with hero image, category badge, title, author, and summary.

**Design Specifications:**
- Hero Image: 280px height (phone), 16:9 aspect ratio
- Category Badge: Overlaid bottom-left with 12px offset
- Content Area: White background, 20px padding, 4px top border
- Title: h3 variant, 3 lines max with ellipsis
- Author: caption variant, "Por [Name]" format
- Summary: body variant, 5 lines max with ellipsis

**Features:**
- Tappable image and title with visual feedback
- Image press: 98% scale, 90% opacity
- Title press: Brown color (#854836)
- Responsive sizing (phone/tablet)
- Full accessibility support

**Usage:**

```tsx
import { QuickReadCard } from '@/components/quick';

<QuickReadCard
  article={{
    id: '1',
    slug: 'article-slug',
    title: 'Article Title',
    summary: 'Article summary text...',
    author: { name: 'John Doe' },
    category: {
      id: 'deportes',
      label: 'DEPORTES',
      color: '#854836',
    },
    heroImage: {
      url: 'https://example.com/image.jpg',
      alt: 'Image description',
    },
  }}
  onPress={() => router.push('/article/1')}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `article` | `QuickReadArticleData` | Yes | Article data to display |
| `onPress` | `() => void` | Yes | Callback when card is tapped |
| `style` | `ViewStyle` | No | Additional animated styles |
| `testID` | `string` | No | Test identifier |

### 2. SwipeIndicator

Pagination dots showing the current position in the article stack.

**Design Specifications:**
- Dot size: 8px × 8px circle
- Dot gap: 8px between dots
- Active color: Brown (#854836)
- Inactive color: Light gray (#D1D5DB)
- Position: Bottom center, 24px from safe area

**Features:**
- Animated opacity transitions (for future integration)
- Accessible progress indicator
- Safe area aware positioning
- Validates index bounds

**Usage:**

```tsx
import { SwipeIndicator } from '@/components/quick';

<SwipeIndicator
  total={5}
  currentIndex={2}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `total` | `number` | Yes | Total number of articles |
| `currentIndex` | `number` | Yes | Current active index (0-based) |
| `style` | `ViewStyle` | No | Additional container styles |
| `testID` | `string` | No | Test identifier |

## Design Tokens

All design values are defined in `QuickRead.tokens.ts`:

```tsx
import {
  QUICK_READ_COLORS,
  QUICK_READ_DIMENSIONS,
  QUICK_READ_TYPOGRAPHY,
  QUICK_READ_ANIMATION,
} from '@/components/quick/QuickRead.tokens';
```

**Available Token Sets:**
- `QUICK_READ_COLORS` - Color palette
- `QUICK_READ_DIMENSIONS` - Spacing, sizes, borders
- `QUICK_READ_TYPOGRAPHY` - Font specs (references ThemedText)
- `QUICK_READ_ANIMATION` - Animation configs (for Phase 2)
- `QUICK_READ_GESTURE` - Gesture handler configs (for Phase 2)
- `QUICK_READ_ACCESSIBILITY` - A11y labels and roles
- `QUICK_READ_IMAGE` - Image optimization settings

## Type Definitions

```tsx
interface QuickReadArticleData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  author: {
    name: string;
  };
  category: {
    id: string;
    label: string;
    color?: string;
  };
  heroImage?: {
    url: string;
    alt: string;
  };
}
```

## Screen Implementation

The main Quick Read screen is located at:
```
/app/(invited)/quick/index.tsx
```

**Current Implementation:**
- Static single card display (testing visual design)
- Mock data for development
- Navigation to article detail on tap

**Next Phase (Phase 2):**
- Swipe gesture with react-native-gesture-handler
- Card stack animation with react-native-reanimated
- Cross-fade transitions
- Haptic feedback
- API integration

## Accessibility

All components implement WCAG 2.1 Level AA standards:

**QuickReadCard:**
- `accessibilityRole="article"` on container
- `accessibilityRole="imagebutton"` on hero image
- `accessibilityRole="header"` on title
- Descriptive labels with article title
- Hints for tappable elements
- Min 44pt touch targets

**SwipeIndicator:**
- `accessibilityRole="progressbar"` on container
- `accessibilityValue` with current/min/max
- Localized label: "Artículo X de Y"
- Individual dots hidden from screen readers

## Performance

**Optimizations:**
- `React.memo` on all components
- Minimal re-renders
- Native driver animations (Phase 2)
- Image optimization with resizeMode="cover"
- Preload adjacent images (Phase 2)

**Performance Budget:**
- Card render: < 16ms (60fps)
- Image load: < 200ms (with cache)
- Press feedback: < 100ms
- Swipe animation: < 300ms (Phase 2)

## Testing

**Component Tests:**

```tsx
// QuickReadCard
<QuickReadCard
  article={mockArticle}
  onPress={mockOnPress}
  testID="quick-read-card"
/>

// Access elements
getByTestId('quick-read-card-image');
getByTestId('quick-read-card-title');

// SwipeIndicator
<SwipeIndicator
  total={5}
  currentIndex={2}
  testID="swipe-indicator"
/>
```

**Example File:**
See `QuickRead.example.tsx` for 6 different usage examples.

## Styling

Components use StyleSheet.create for performance:

```tsx
import { QuickReadCardStyles, SwipeIndicatorStyles } from '@/components/quick';

// Access internal styles for testing
QuickReadCardStyles.container;
SwipeIndicatorStyles.dot;
```

## Browser Compatibility

**React Native:**
- iOS 13.4+
- Android 6.0+ (API 23)

**Expo:**
- SDK 51+

**Dependencies:**
- react-native: 0.74+
- expo-router: 3.5+
- react-native-safe-area-context: 4.10+

## Color Reference

```tsx
// Category Colors
deportes:   #854836  (Brown)
politica:   #FFB22C  (Yellow)
economia:   #FF0000  (Red)
salud:      #000000  (Black)
seguridad:  #854836  (Brown)
estado:     #FFB22C  (Yellow)

// UI Colors
cardBackground:     #FFFFFF  (White)
screenBackground:   #F7F7F7  (Light Gray)
borderColor:        #000000  (Black)
titleColor:         #000000  (Black)
authorColor:        #000000  (Black)
summaryColor:       #1F1F1F  (Near Black)
```

## Roadmap

**Phase 1: Visual Components** ✅ (Current)
- QuickReadCard component
- SwipeIndicator component
- Static screen implementation
- Design tokens
- Accessibility

**Phase 2: Gestures & Animation** (Next)
- Pan gesture handler
- Card stack with absolute positioning
- Cross-fade opacity animation
- Swipe velocity detection
- Haptic feedback
- Preload adjacent cards

**Phase 3: Data Integration**
- API service layer
- Infinite scroll / pagination
- Error states
- Loading states
- Pull to refresh
- Cache management

**Phase 4: Advanced Features**
- Bookmark articles
- Share functionality
- Analytics tracking
- Offline mode
- Push notifications

## File Structure

```
components/quick/
├── QuickReadCard.tsx          # Main card component
├── SwipeIndicator.tsx         # Pagination dots
├── QuickRead.tokens.ts        # Design tokens
├── QuickRead.example.tsx      # Usage examples
├── README.md                  # This file
└── index.ts                   # Barrel exports

app/(invited)/quick/
└── index.tsx                  # Main screen

types/
└── quickRead.types.ts         # Type definitions
```

## Contributing

When adding new features:

1. Update design tokens in `QuickRead.tokens.ts`
2. Add TypeScript types to `quickRead.types.ts`
3. Export new components from `index.ts`
4. Add usage examples to `QuickRead.example.tsx`
5. Update this README
6. Ensure accessibility compliance
7. Add performance measurements

## License

Proprietary - Noticias Pachuca 2026

## Contact

Frontend Team: frontend@noticiaspachuca.com
Design System: design@noticiaspachuca.com
