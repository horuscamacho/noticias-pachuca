# Carousel Components Documentation

Production-ready carousel components for React Native brutalist onboarding screens.

## Overview

This package provides a complete carousel solution with proper separation of concerns:

- **Logic Layer**: `useCarousel` hook manages state and scroll behavior
- **Presentation Layer**: `CarouselSlide` renders individual slides
- **Container Layer**: `OnboardingCarousel` composes slides into a scrollable view
- **UI Layer**: `PaginationDots` provides visual navigation feedback

## Architecture

```
┌─────────────────────────────────────┐
│      OnboardingCarousel             │
│  (Container & Orchestration)        │
│                                     │
│  ┌────────────────────────────┐    │
│  │   useCarousel Hook         │    │
│  │   (State & Logic)          │    │
│  └────────────────────────────┘    │
│                                     │
│  ┌────────────────────────────┐    │
│  │   CarouselSlide            │    │
│  │   (Presentation)           │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│      PaginationDots                 │
│   (Navigation Indicator)            │
└─────────────────────────────────────┘
```

## Components

### 1. OnboardingCarousel

Container component that manages carousel state and renders slides.

**Props**:
```typescript
interface OnboardingCarouselProps {
  slides: OnboardingSlide[];
  onSlideChange?: (index: number) => void;
  className?: string;
  accessibilityLabel?: string;
}
```

**Example**:
```tsx
const slides = [
  { id: 1, title: 'Welcome', description: 'Get started...' },
  { id: 2, title: 'Features', description: 'Discover...' },
];

<OnboardingCarousel
  slides={slides}
  onSlideChange={(index) => console.log('Slide:', index)}
/>
```

### 2. CarouselSlide

Individual slide component with image placeholder and text content.

**Props**:
```typescript
interface CarouselSlideProps {
  title: string;
  description: string;
  width: number;
  imagePlaceholder?: boolean;
  className?: string;
  accessibilityLabel?: string;
}
```

**Design Tokens**:
- Image height: 400px
- Image border: 4px black
- Content padding: 24px horizontal
- Gap between elements: 16px

**Example**:
```tsx
<CarouselSlide
  width={375}
  title="Breaking news"
  description="Follow stories as they unfold"
  imagePlaceholder
/>
```

### 3. PaginationDots

Brutalist square pagination dots with animated transitions.

**Props**:
```typescript
interface PaginationDotsProps {
  total: number;
  activeIndex: number;
  className?: string;
  accessibilityLabel?: string;
}
```

**Design Tokens**:
- Active dot: 32px x 8px, white, 2px black border
- Inactive dot: 8px x 8px, light gray, 2px black border
- Gap: 8px
- Border radius: 0 (sharp corners)

**Example**:
```tsx
<PaginationDots total={3} activeIndex={1} />
```

### 4. useCarousel Hook

Custom hook for carousel logic and state management.

**Returns**:
```typescript
interface UseCarouselReturn {
  activeIndex: number;
  scrollViewRef: React.RefObject<ScrollView | null>;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  goToSlide: (index: number) => void;
  width: number;
}
```

**Example**:
```tsx
const { activeIndex, scrollViewRef, handleScroll, goToSlide, width } = useCarousel(3);

// Use in ScrollView
<ScrollView
  ref={scrollViewRef}
  onScroll={handleScroll}
  scrollEventThrottle={16}
>
  {/* slides */}
</ScrollView>

// Programmatic navigation
<Button onPress={() => goToSlide(2)}>Go to slide 3</Button>
```

## Complete Example

```tsx
import React, { useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import {
  OnboardingCarousel,
  PaginationDots,
  BrutalistButton,
  OnboardingSlide,
} from '@/components';

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Breaking news',
    description: 'Follow stories as they unfold',
  },
  {
    id: 2,
    title: 'Stay informed',
    description: 'Get instant notifications',
  },
  {
    id: 3,
    title: 'Trusted sources',
    description: 'Read verified news',
  },
];

export function OnboardingScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const isLastSlide = activeSlide === slides.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Skip Button */}
        <View style={{ alignItems: 'flex-end', padding: 24 }}>
          <BrutalistButton variant="tertiary" onPress={() => {}}>
            SKIP
          </BrutalistButton>
        </View>

        {/* Carousel */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <OnboardingCarousel
            slides={slides}
            onSlideChange={setActiveSlide}
          />
        </View>

        {/* Bottom Section */}
        <View style={{ padding: 24, gap: 32 }}>
          {/* Pagination */}
          <View style={{ alignItems: 'center' }}>
            <PaginationDots total={slides.length} activeIndex={activeSlide} />
          </View>

          {/* CTA Button */}
          <BrutalistButton variant="primary" fullWidth onPress={() => {}}>
            {isLastSlide ? 'GET STARTED' : 'NEXT'}
          </BrutalistButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

## Design Tokens

### Colors
```typescript
{
  placeholder: '#F7F7F7',  // Light gray
  border: '#000000',        // Black
  activeDot: '#FFFFFF',     // White
  inactiveDot: '#F7F7F7',   // Light gray
}
```

### Spacing
```typescript
{
  gap: 8,                   // Between dots
  contentPadding: 24,       // Horizontal padding
  imagePadding: 16,         // Image margin
  elementGap: 16,           // Between elements
}
```

### Borders
```typescript
{
  imageBorder: 4,           // Image border width
  dotBorder: 2,             // Dot border width
  radius: 0,                // Sharp corners
}
```

### Sizing
```typescript
{
  imageHeight: 400,
  dotInactive: 8,
  dotActive: { width: 32, height: 8 },
}
```

## Accessibility

All components are fully accessible:

### PaginationDots
- ✅ Screen reader announces "Page X of Y"
- ✅ Custom labels supported
- ✅ Proper accessibility role

### CarouselSlide
- ✅ Screen reader announces title and description
- ✅ Image placeholder hidden from screen readers
- ✅ Custom labels supported

### OnboardingCarousel
- ✅ ScrollView properly labeled
- ✅ Each slide has detailed label with position
- ✅ Supports keyboard navigation

## Performance Optimizations

1. **React.memo**: All components memoized to prevent unnecessary re-renders
2. **useCallback**: Scroll handlers and event callbacks memoized
3. **useMemo**: Styles computed once and cached
4. **Native Driver**: Animations use native driver where possible
5. **Throttling**: Scroll events throttled to 16fps (60fps animation)

## TypeScript Support

All components are fully typed with exported interfaces:

```typescript
import type {
  OnboardingSlide,
  OnboardingCarouselProps,
  CarouselSlideProps,
  PaginationDotsProps,
  UseCarouselReturn,
} from '@/components';
```

## Testing

Comprehensive test suite included:

```bash
# Run tests
npm test -- carousel.test.tsx

# Test coverage
npm test -- --coverage carousel.test.tsx
```

Test coverage includes:
- ✅ Unit tests for all components
- ✅ Hook behavior tests
- ✅ Integration tests
- ✅ Accessibility compliance tests
- ✅ Memoization verification

## Customization

### Custom Slide Layout

```tsx
// Create custom slide component
import { CarouselSlideProps } from '@/components';

const CustomSlide: React.FC<CarouselSlideProps> = ({ title, description, width }) => {
  return (
    <View style={{ width }}>
      {/* Your custom layout */}
    </View>
  );
};
```

### Custom Pagination Indicator

```tsx
// Use PaginationDots design tokens
import { PAGINATION_DOT_TOKENS } from '@/components';

const CustomPagination = ({ total, activeIndex }) => {
  return (
    <View style={{ gap: PAGINATION_DOT_TOKENS.gap }}>
      {/* Your custom pagination */}
    </View>
  );
};
```

### Extending useCarousel

```tsx
// Wrap useCarousel for custom behavior
const useCustomCarousel = (totalSlides: number) => {
  const carousel = useCarousel(totalSlides);

  // Add auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (carousel.activeIndex + 1) % totalSlides;
      carousel.goToSlide(nextSlide);
    }, 3000);

    return () => clearInterval(interval);
  }, [carousel.activeIndex]);

  return carousel;
};
```

## Browser & Device Support

- ✅ iOS 13+
- ✅ Android 6.0+
- ✅ React Native 0.70+
- ✅ Expo SDK 47+
- ✅ Phone and Tablet layouts
- ✅ Portrait and Landscape orientations

## File Structure

```
components/
├── OnboardingCarousel.tsx          # Main container
├── CarouselSlide.tsx               # Slide presentation
├── PaginationDots.tsx              # Navigation indicator
├── OnboardingCarousel.example.tsx  # Usage examples
├── CAROUSEL_README.md              # This file
├── __tests__/
│   └── carousel.test.tsx           # Test suite
└── index.ts                        # Exports

hooks/
├── useCarousel.ts                  # Carousel logic hook
└── index.ts                        # Exports
```

## Contributing

When modifying carousel components:

1. Maintain TypeScript strict mode compliance
2. Update tests to match changes
3. Preserve accessibility features
4. Keep design tokens in sync
5. Document breaking changes
6. Add JSDoc comments to public APIs

## License

Part of the Noticias Pachuca mobile app project.
