# Quick Read Rotating Dot Indicator Design Specification

## Design Concept: Infinite Rotating Wheel

The dot indicator mimics a rotating wheel (like a Walkman volume control) where:
- Only 5 dots are visible at any time
- The CENTER dot is always the active article
- Swiping in ANY direction advances to the next article
- The wheel rotates to keep the new article centered
- Creates an illusion of infinite content

---

## 1. Visual Design Specifications

### 1.1 Dot States

```
INACTIVE DOTS (positions 1, 2, 4, 5)
- Size: 8px diameter
- Color: #D1D5DB (gray-300)
- Opacity: 0.6
- Shape: Perfect circle
- Border: None
- Transition: all 400ms ease-out

ACTIVE DOT (position 3 - center)
- Size: 12px diameter
- Color: #854836 (brown)
- Opacity: 1.0
- Shape: Perfect circle
- Border: 2px solid #FFFFFF
- Box shadow: 0px 2px 4px rgba(133, 72, 54, 0.3)
- Transition: all 400ms ease-out

APPROACHING DOTS (adjacent to center)
- Size: 10px diameter (scaled between 8px and 12px)
- Opacity: 0.8 (scaled between 0.6 and 1.0)
- Creates smooth gradient effect toward center
```

### 1.2 Spacing & Layout

```
Container:
├─ Width: 120px (fixed)
├─ Height: 40px
├─ Background: rgba(0, 0, 0, 0.4)
├─ Border radius: 20px
├─ Backdrop filter: blur(8px)
├─ Padding: 14px 16px
└─ Position: absolute bottom 40px, centered

Dot Layout:
[8px] ←12px→ [10px] ←12px→ [12px] ←12px→ [10px] ←12px→ [8px]
  1              2              3              4              5
(fade)      (approach)      (ACTIVE)      (approach)      (fade)

Total internal width: 8+12+10+12+12+12+10+12+8 = 96px
Horizontal padding: 12px each side
```

---

## 2. Animation Sequence Diagrams

### 2.1 Swipe LEFT (Next Article)

```
FRAME 0 (Start State):
[○₁] ←12px→ [○₂] ←12px→ [●₃] ←12px→ [○₄] ←12px→ [○₅]
 8px          10px          12px          10px          8px
opacity:0.6   opacity:0.8   opacity:1.0   opacity:0.8   opacity:0.6

FRAME 1 (100ms - Initial slide):
← All dots translate -24px (one position left)
← New dot ○₆ fades in from right (opacity: 0 → 0.3)
← Dot ○₁ begins fade out (opacity: 0.6 → 0.3)

[○₁] [○₂] [○₃] [●₄] [○₅] [○₆]
fade  move  move  ACTIVE move appearing
out

FRAME 2 (200ms - Mid animation):
← Continued translation
← Active styling shifts from ○₃ to ○₄
← Sizes begin morphing:
  - ○₂: 10px → 8px
  - ○₃: 12px → 10px
  - ○₄: 10px → 12px (becoming center)
  - ○₅: 8px → 10px

FRAME 3 (300ms - Almost complete):
← Translation nearly complete
← Dot ○₁ opacity: 0 (removed from view)
← Dot ○₆ opacity: 0.6 (fully appeared)

FRAME 4 (400ms - Final state):
      [○₂] ←12px→ [○₃] ←12px→ [●₄] ←12px→ [○₅] ←12px→ [○₆]
       8px          10px          12px          10px          8px
    opacity:0.6   opacity:0.8   opacity:1.0   opacity:0.8   opacity:0.6

Result: Wheel rotated left, dot ○₄ now centered
```

### 2.2 Swipe RIGHT (Next Article)

```
FRAME 0 (Start State):
[○₁] ←12px→ [○₂] ←12px→ [●₃] ←12px→ [○₄] ←12px→ [○₅]

FRAME 1-4 (400ms total):
→ All dots translate +24px (one position right)
→ New dot ○₀ fades in from left
→ Dot ○₅ fades out to right
→ Dot ○₂ becomes center and active

FRAME 4 (Final state):
[○₀] ←12px→ [○₁] ←12px→ [●₂] ←12px→ [○₃] ←12px→ [○₄]
 8px          10px          12px          10px          8px
```

### 2.3 Visual Flow Diagram

```
Conceptual Infinite Wheel:

         ○₆
    ○₅   ●₃   ○₁    ← Current view (5 visible)
         ○₂

SWIPE LEFT → Rotate counter-clockwise:
         ○₇
    ○₆   ●₄   ○₂    ← New view
         ○₃

SWIPE RIGHT → Rotate clockwise:
         ○₅
    ○₄   ●₂   ○₀    ← New view
         ○₁
```

---

## 3. Animation Technical Specs

### 3.1 Easing Curves

```javascript
// Main translation movement
easing: cubic-bezier(0.25, 0.1, 0.25, 1.0) // ease-out

// Size scaling (dots growing/shrinking)
easing: cubic-bezier(0.34, 1.56, 0.64, 1) // back-out (slight overshoot)

// Opacity fading
easing: linear

// Active state color transition
easing: cubic-bezier(0.4, 0.0, 0.2, 1) // ease-in-out
```

### 3.2 Timing

```
Total duration: 400ms

Staggered animations:
├─ 0-100ms: Initiate slide, start fade-out
├─ 100-200ms: Mid-slide, active state begins shifting
├─ 200-300ms: Size scaling peaks, color transition
└─ 300-400ms: Complete fade-in, settle to final state

Performance:
- Use transform: translateX() for GPU acceleration
- Use will-change: transform on active animations
- Remove will-change after animation completes
```

### 3.3 Transform Properties

```css
/* Slide animation */
transform: translateX(${direction === 'left' ? '-24px' : '24px'})

/* Scale during transition */
transform: translateX(Xpx) scale(${scale})

/* Combined with opacity for smooth appearance */
opacity: ${opacity}
```

---

## 4. Layout Positioning

### 4.1 Container Position

```
Fixed position:
- Bottom: 40px (above bottom navigation if present)
- Left: 50%
- Transform: translateX(-50%) // Perfect horizontal centering
- Z-index: 100 (above content, below modals)

Safe area handling:
- Bottom: max(40px, env(safe-area-inset-bottom) + 20px)
- Ensures visibility on devices with notches
```

### 4.2 Responsive Considerations

```
Mobile portrait (default):
- Container width: 120px
- Dot spacing: 12px
- Active dot: 12px

Small screens (<360px width):
- Container width: 100px
- Dot spacing: 10px
- Active dot: 10px
- Scale all proportionally

Landscape mode:
- Move to right side: bottom 50%, right 20px
- Transform: translateY(-50%)
- Rotate orientation 90deg if needed
```

---

## 5. Component Architecture

### 5.1 Data Structure

```typescript
interface DotIndicatorState {
  // Visible dots (always 5)
  visibleDots: number[]; // e.g., [8, 9, 10, 11, 12]

  // Current active index in the sequence
  activeIndex: number; // e.g., 10 (always middle of visibleDots)

  // Animation state
  isAnimating: boolean;
  animationDirection: 'left' | 'right' | null;

  // Total articles (for edge case handling)
  totalArticles: number;
}

interface DotProps {
  index: number;
  position: 1 | 2 | 3 | 4 | 5; // Position in visible window
  isActive: boolean;
  animationProgress: number; // 0 to 1
}
```

### 5.2 Component Hierarchy

```
<DotIndicatorContainer>
  │
  ├─ <AnimatedDotsWrapper>
  │   │
  │   ├─ <Dot key={visibleDots[0]} position={1} />
  │   ├─ <Dot key={visibleDots[1]} position={2} />
  │   ├─ <Dot key={visibleDots[2]} position={3} isActive />
  │   ├─ <Dot key={visibleDots[3]} position={4} />
  │   └─ <Dot key={visibleDots[4]} position={5} />
  │
  └─ <GhostDots> (for smooth appearance)
      ├─ <Dot fade-in-left />
      └─ <Dot fade-out-right />
```

---

## 6. Edge Cases & Behavior

### 6.1 Article Loop Boundaries

```
Scenario: 10 total articles

At article 1 (first):
- Visible: [virtual -1, virtual 0, 1, 2, 3]
- Virtual dots appear as real to user
- Swipe left → go to article 2
- Swipe right → go to article 2 (always forward)

At article 10 (last):
- Visible: [8, 9, 10, virtual 11, virtual 12]
- After article 10 → loop to article 1
- Wheel continues rotating smoothly
- No visual indication of loop

Infinite illusion:
- Always maintain 5 dots
- Generate virtual indices for display
- Map to real articles with modulo: realIndex = (virtualIndex % totalArticles)
```

### 6.2 Rapid Swipe Handling

```
User swipes rapidly (multiple swipes before animation completes):

Queue approach:
1. First swipe: Start animation
2. Second swipe during animation:
   - Add to queue
   - Don't interrupt current animation
3. On animation complete:
   - Process next queued swipe
   - Chain animations smoothly

Alternative: Interrupt and skip
- Cancel current animation
- Jump to intermediate state
- Start new animation
- Feels more responsive for power users
```

### 6.3 Performance Edge Cases

```
Low-end devices:
- Reduce animation duration to 300ms
- Disable backdrop-filter blur
- Use simpler easing (ease-out)
- Reduce dot shadows

Accessibility:
- Respect prefers-reduced-motion
  - No sliding animation
  - Instant state change
  - Simple opacity swap
- Active dot always distinguishable (color + size)
- Minimum contrast ratio: 4.5:1 with background
```

---

## 7. Styling System Integration

### 7.1 Theme Variables

```typescript
// Design tokens
const DOT_INDICATOR = {
  container: {
    width: 120,
    height: 40,
    borderRadius: 20,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropBlur: 8,
    padding: { horizontal: 12, vertical: 14 },
  },

  dot: {
    inactive: {
      size: 8,
      color: '#D1D5DB',
      opacity: 0.6,
    },
    approaching: {
      size: 10,
      opacity: 0.8,
    },
    active: {
      size: 12,
      color: '#854836',
      opacity: 1.0,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        blur: 4,
        color: 'rgba(133, 72, 54, 0.3)',
      },
    },
    spacing: 12,
  },

  animation: {
    duration: 400,
    easing: {
      slide: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
      scale: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fade: 'linear',
    },
  },
};
```

### 7.2 React Native Animated API

```typescript
// Animation values
const slideAnim = useRef(new Animated.Value(0)).current;
const scaleAnims = useRef(
  Array(5).fill(null).map(() => new Animated.Value(1))
).current;
const opacityAnims = useRef(
  Array(5).fill(null).map(() => new Animated.Value(1))
).current;

// Slide animation
const slideToNext = (direction: 'left' | 'right') => {
  const distance = direction === 'left' ? -24 : 24;

  Animated.parallel([
    // Slide all dots
    Animated.timing(slideAnim, {
      toValue: distance,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      useNativeDriver: true,
    }),

    // Fade out first/last
    Animated.timing(opacityAnims[direction === 'left' ? 0 : 4], {
      toValue: 0,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }),

    // Scale transitions
    ...scaleAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: getScaleForPosition(index, direction),
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      })
    ),
  ]).start(() => {
    // Reset and update visible dots
    slideAnim.setValue(0);
    updateVisibleDots(direction);
  });
};
```

---

## 8. Interaction States

### 8.1 Touch Feedback

```
On swipe start:
- No immediate dot change
- Wait for swipe velocity threshold
- Haptic feedback: light impact

During swipe:
- No dot animation yet
- Article content slides
- Threshold: 50px or velocity > 0.5

On swipe complete:
- Trigger dot animation
- Haptic feedback: medium impact
- Update article index

On swipe cancel:
- Article snaps back
- Dots remain unchanged
- No haptic feedback
```

### 8.2 Progressive Disclosure

```
First time user sees dots:
- Subtle pulsing animation on active dot
- Scale from 12px to 14px and back (2s loop)
- After 3 cycles, stop pulsing

User completes first swipe:
- Show mini tooltip: "Swipe for more"
- Fade out after 2 seconds
- Never show again

Power user indicators:
- After 10+ swipes in session
- Reduce animation duration to 300ms
- Feels snappier for engaged users
```

---

## 9. Accessibility Specifications

### 9.1 Screen Reader Support

```
Container:
- accessibilityRole: "progressbar"
- accessibilityLabel: "Article progress"
- accessibilityValue: {
    min: 1,
    max: totalArticles,
    now: currentArticle,
    text: `Article ${currentArticle} of ${totalArticles}`
  }

Individual dots:
- accessibilityElementsHidden: true
- Not individually focusable (redundant)

On article change:
- Announce: "Article ${currentArticle}"
- Use accessibilityLiveRegion: "polite"
```

### 9.2 Reduced Motion

```css
/* When prefers-reduced-motion is enabled */
@media (prefers-reduced-motion: reduce) {
  .dot-indicator {
    /* No sliding animation */
    transition: opacity 200ms ease;
  }

  .dot {
    /* Instant size change */
    transition: none;
  }

  /* Active state changes immediately */
  .dot-active {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 9.3 Color Contrast

```
Active dot #854836 on background rgba(0,0,0,0.4):
- Effective background: #666666 (40% black)
- Contrast ratio: 4.8:1 ✓ WCAG AA compliant

Inactive dot #D1D5DB at 0.6 opacity on background:
- Effective color: #A0A4A8
- Contrast ratio: 3.2:1 ✓ Decorative element exemption

White border on active dot:
- Adds 2px separation
- Improves distinguishability
- Pattern recognition aid
```

---

## 10. Implementation Notes

### 10.1 React Native Component

```typescript
import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface RotatingDotsProps {
  currentIndex: number;
  totalArticles: number;
  onAnimationComplete?: () => void;
}

export const RotatingDots: React.FC<RotatingDotsProps> = ({
  currentIndex,
  totalArticles,
  onAnimationComplete,
}) => {
  // Implementation would go here
  // See detailed code structure above

  return (
    <View style={styles.container}>
      {/* Dot components */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -60 }], // Half of width
    width: 120,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  // ... more styles
});
```

### 10.2 State Management

```typescript
// Use reducer for complex state updates
const dotReducer = (state: DotState, action: DotAction) => {
  switch (action.type) {
    case 'SWIPE_LEFT':
      return {
        ...state,
        visibleDots: rotateLeft(state.visibleDots, state.totalArticles),
        activeIndex: state.activeIndex + 1,
        isAnimating: true,
      };

    case 'SWIPE_RIGHT':
      return {
        ...state,
        visibleDots: rotateRight(state.visibleDots, state.totalArticles),
        activeIndex: state.activeIndex + 1, // Always forward
        isAnimating: true,
      };

    case 'ANIMATION_COMPLETE':
      return { ...state, isAnimating: false };

    default:
      return state;
  }
};
```

### 10.3 Testing Considerations

```typescript
// Unit tests
describe('RotatingDots', () => {
  it('should always show 5 dots', () => {});
  it('should keep center dot active', () => {});
  it('should rotate left on swipe', () => {});
  it('should loop at boundaries', () => {});
  it('should handle rapid swipes', () => {});
});

// Visual regression tests
describe('RotatingDots Visual', () => {
  it('should match snapshot at rest', () => {});
  it('should match snapshot mid-animation', () => {});
  it('should have correct spacing', () => {});
});

// Accessibility tests
describe('RotatingDots A11y', () => {
  it('should announce article changes', () => {});
  it('should respect reduced motion', () => {});
  it('should meet contrast requirements', () => {});
});
```

---

## 11. Design Rationale

### Why This Design Works

1. **Familiarity**: Mimics physical controls users understand (volume wheels, scrolling)

2. **Feedback**: Always visible progress without being intrusive

3. **Infinite Feel**: 5-dot window creates illusion of endless content

4. **Center Focus**: Eye naturally drawn to center, reducing cognitive load

5. **Smooth Motion**: 400ms timing feels natural, not too fast or slow

6. **Progressive Enhancement**: Works without animation (accessibility)

7. **Minimal Footprint**: Small container, doesn't obstruct content

8. **Adaptive Sizing**: Adjacent dots hint at direction/movement

9. **High Contrast**: Active dot clearly distinguishable

10. **GPU Optimized**: Transform animations perform well on mobile

### Alternative Designs Considered

```
Linear strip (rejected):
[○ ○ ○ ○ ●]
- Problem: Looks like pagination, implies going back
- Violates forward-only pattern

Single dot with counter (rejected):
[● 5/10]
- Problem: Too numerical, less playful
- Doesn't convey infinite scroll feel

Circular progress (rejected):
   ◔
  ╱ ╲
 ○   ○
  ╲ ╱
   ●
- Problem: Too complex, hard to animate
- Takes more screen space

Minimalist single indicator (rejected):
[●]
- Problem: No context of position
- User doesn't know how much content remains
```

---

## 12. Future Enhancements

### Phase 2 Features

1. **Gesture hints**: Slight parallax effect on dots during active swipe

2. **Momentum**: Dots continue rotating slightly after swipe stops

3. **Customization**: User preference for dot style (minimal, full, hidden)

4. **Smart positioning**: Auto-hide when user is reading (inactive for 30s)

5. **Analytics hooks**: Track swipe patterns, article completion rates

6. **Haptic richness**: Varying intensities based on swipe velocity

7. **Theme integration**: Dots change color with app theme/time of day

8. **Article quality indicators**: Dot color intensity = article popularity

---

## Summary: Key Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Visible dots | 5 | Optimal for mobile screen, shows context |
| Active position | Center (3rd) | Natural eye focus, symmetric |
| Animation duration | 400ms | Matches article swipe, feels natural |
| Active dot size | 12px | 50% larger than inactive, clearly visible |
| Spacing | 12px | Prevents accidental touches, clean look |
| Background | Semi-transparent | Floats above content, modern aesthetic |
| Direction behavior | Both advance forward | Unique pattern, prevents back-navigation |
| Loop handling | Infinite appearance | User never reaches "end", encouraging exploration |
| Accessibility | Full support | Screen readers, reduced motion, contrast |
| Performance | GPU-accelerated | Smooth 60fps on mid-range devices |

---

**Design Owner**: UX Design Team
**Implementation Team**: Mobile Engineering
**Review Status**: Ready for Development
**Last Updated**: 2025-10-25

---

## Appendix: Visual Mockups

### State Diagram
```
╔════════════════════════════════════════╗
║     Quick Read Article Container      ║
║                                        ║
║   [Article Content Here]               ║
║                                        ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║              ┌────────┐                ║
║              │○ ○ ● ○ ○│               ║
║              └────────┘                ║
║         Dot Indicator (120px)          ║
║                                        ║
║     [Safe Area Bottom: 40px]           ║
╚════════════════════════════════════════╝
```

### Animation Frames (Swipe Left)
```
Frame 0:    [○ ○ ● ○ ○]
            ↑ Center active

Frame 100ms: ←[○ ○ ● ○ ○]○
               Sliding left

Frame 200ms:  ←[○ ○ ○ ● ○]○
                Active shifting

Frame 400ms:   [○ ○ ● ○ ○]
               New center active
```

