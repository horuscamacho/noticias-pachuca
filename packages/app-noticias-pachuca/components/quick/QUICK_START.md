# Quick Read Swipe - Quick Start Guide

## 🚀 Getting Started

### 1. Clear Cache & Restart (Important!)

The Reanimated plugin requires a clean build:

```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo

# Start with clean slate
npm start -- --clear
```

### 2. Run the App

```bash
# iOS
npm run ios

# Android
npm run android
```

### 3. Navigate to Quick Read

Tap the "Quick" tab in the bottom navigation.

## ✅ Testing the Swipe

### Gesture Tests

1. **Swipe Left** (Next Article)
   - Swipe from right to left past 40% of screen
   - OR swipe quickly (fast flick)
   - Should show next article with cross-fade

2. **Swipe Right** (Previous Article)
   - Swipe from left to right past 40% of screen
   - OR swipe quickly (fast flick)
   - Should show previous article with cross-fade

3. **Cancel Swipe**
   - Swipe less than 40% and release
   - Should spring back to current article

4. **Bounds Testing**
   - At first article: Right swipe does nothing
   - At last article: Left swipe does nothing

### Visual Tests

1. **Cross-fade Animation**
   - Current card should fade out (1 → 0)
   - Next card should fade in (0 → 1)
   - Smooth 300ms transition

2. **Parallax Effect**
   - Current card should move 50% of finger distance
   - Creates subtle depth effect

3. **Pagination Dots**
   - Should update to show current position
   - Located at bottom of screen

4. **Tap Navigation**
   - Tap on image → Navigate to article detail
   - Tap on title → Navigate to article detail

## 🎯 Expected Behavior

### Swipe Thresholds

| Action | Threshold | Result |
|--------|-----------|--------|
| Normal swipe | > 40% screen width | Complete swipe |
| Fast flick | > 800 px/s | Complete swipe |
| Slow swipe | < 40% screen width | Cancel (spring back) |

### Animation Timing

| Phase | Duration | Easing |
|-------|----------|--------|
| Complete | 300ms | Cubic ease-out |
| Cancel | ~400ms | Spring (damping: 18) |

### Card Stack

```
┌─────────────────────────┐
│  Previous Card (z: 1)   │  ← Hidden (opacity: 0)
│  [Fades in on right]    │
└─────────────────────────┘
┌─────────────────────────┐
│  Current Card (z: 2)    │  ← Visible (opacity: 1)
│  [Fades out on swipe]   │
└─────────────────────────┘
┌─────────────────────────┐
│  Next Card (z: 1)       │  ← Hidden (opacity: 0)
│  [Fades in on left]     │
└─────────────────────────┘
```

## 🐛 Troubleshooting

### Issue: Gestures Not Working

**Solution:**
```bash
# Clear babel cache
rm -rf node_modules/.cache
rm -rf .expo

# Restart metro
npm start -- --reset-cache
```

### Issue: Animations Choppy

**Solution:**
1. Check if running in debug mode (should be Release)
2. Verify Reanimated plugin is in babel.config.js
3. Ensure it's the LAST plugin in the array

```javascript
// babel.config.js
plugins: [
  "react-native-reanimated/plugin", // MUST BE LAST
],
```

### Issue: TypeScript Errors

**Solution:**
```bash
# Check for errors
npx tsc --noEmit

# Should show no errors in useSwipe* or SwipeableCard files
```

### Issue: App Crashes on Swipe

**Solution:**
1. Check console for Reanimated errors
2. Verify GestureHandlerRootView wraps the screen
3. Ensure worklet directive is in animated functions

## 📱 Performance Tips

### Check FPS

```typescript
import { enableLogging } from 'react-native-reanimated';

// Enable FPS logging (development only)
enableLogging(true);
```

### Profile Performance

```bash
# Build release version for testing
# iOS
npx react-native run-ios --configuration Release

# Android
npx react-native run-android --variant=release
```

## 🔧 Customization

### Change Swipe Threshold

Edit `/hooks/useSwipeGesture.ts`:

```typescript
const SWIPE_THRESHOLD_RATIO = 0.4; // Change to 0.3 for 30%
const VELOCITY_THRESHOLD = 800; // Change to 600 for easier flicks
```

### Change Animation Duration

Edit `/hooks/useSwipeGesture.ts`:

```typescript
const COMPLETE_ANIMATION_DURATION = 300; // Change to 400ms
```

### Change Parallax Effect

Edit `/hooks/useSwipeFadeAnimation.ts`:

```typescript
const PARALLAX_FACTOR = 0.5; // Change to 0.3 for less movement
```

## 📚 API Reference

### SwipeableCard Props

```typescript
interface SwipeableCardProps {
  articles: QuickReadArticleData[];  // Array of articles
  currentIndex: number;              // Current article index
  onIndexChange: (i: number) => void; // Called on swipe
  onArticlePress: (slug: string) => void; // Called on tap
  testID?: string;                   // For testing
}
```

### useSwipeGesture Options

```typescript
interface UseSwipeGestureOptions {
  onSwipeLeft: () => void;   // Callback for left swipe
  onSwipeRight: () => void;  // Callback for right swipe
  screenWidth: number;       // Screen width (from useWindowDimensions)
  enabled?: boolean;         // Enable/disable gesture
}
```

### useSwipeFadeAnimation Options

```typescript
interface UseSwipeFadeAnimationOptions {
  translateX: SharedValue<number>;  // From useSwipeGesture
  screenWidth: number;              // Screen width
  direction?: 'left' | 'right' | 'both'; // Animation direction
}
```

## 📝 Common Patterns

### Custom Swipe Handler

```typescript
const [index, setIndex] = useState(0);

const handleSwipe = useCallback((newIndex: number) => {
  setIndex(newIndex);
  // Optional: Track analytics
  analytics.track('article_swipe', { from: index, to: newIndex });
}, [index]);

<SwipeableCard
  articles={articles}
  currentIndex={index}
  onIndexChange={handleSwipe}
  onArticlePress={handlePress}
/>
```

### Disable Swipe Conditionally

```typescript
const { gesture } = useSwipeGesture({
  onSwipeLeft: handleLeft,
  onSwipeRight: handleRight,
  screenWidth: width,
  enabled: articles.length > 1, // Only enable if multiple articles
});
```

### Haptic Feedback (Future)

```typescript
import * as Haptics from 'expo-haptics';

const handleSwipeLeft = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setIndex(i => i + 1);
}, []);
```

## 🎨 Styling

### Card Container

Located in `SwipeableCard.tsx`:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardFront: {
    zIndex: 2, // Current card (top)
  },
  cardBehind: {
    zIndex: 1, // Next/previous cards (behind)
  },
});
```

### Gesture Root

Located in `app/(invited)/quick/index.tsx`:

```typescript
const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1, // Required for GestureHandlerRootView
  },
  container: {
    flex: 1,
    backgroundColor: '#F7ECDD',
  },
});
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Swipe left → next article
- [ ] Swipe right → previous article
- [ ] Fast flick works
- [ ] Cancel works (spring back)
- [ ] Bounds work (first/last)
- [ ] Tap image works
- [ ] Tap title works
- [ ] Pagination updates
- [ ] Smooth 60fps
- [ ] No crashes

### Automated Testing (Future)

```typescript
import { render, fireEvent } from '@testing-library/react-native';

test('swipe left navigates to next article', () => {
  const onIndexChange = jest.fn();
  const { getByTestId } = render(
    <SwipeableCard
      articles={mockArticles}
      currentIndex={0}
      onIndexChange={onIndexChange}
      onArticlePress={jest.fn()}
    />
  );

  // Simulate swipe gesture
  // ... gesture simulation code ...

  expect(onIndexChange).toHaveBeenCalledWith(1);
});
```

## 📊 Performance Benchmarks

Expected performance on mid-range device:

- **FPS:** 60 (constant)
- **Frame time:** <16ms
- **Memory:** ~50MB for 5 articles
- **Cards in DOM:** 3 max
- **Animation delay:** <1ms

## 🔗 Related Files

- Implementation: `/components/quick/SwipeableCard.tsx`
- Gesture Hook: `/hooks/useSwipeGesture.ts`
- Animation Hook: `/hooks/useSwipeFadeAnimation.ts`
- Screen: `/app/(invited)/quick/index.tsx`
- Documentation: `/components/quick/SWIPE_IMPLEMENTATION.md`

## ✨ Tips & Tricks

1. **Always clear cache** after changing babel.config.js
2. **Test on real device** for accurate gesture feel
3. **Use Release build** for performance testing
4. **Check zIndex** if cards appear in wrong order
5. **Verify GestureHandlerRootView** wraps entire screen
6. **Use worklet directive** in all animated functions
7. **Wrap state updates** from gestures with runOnJS

## 🎓 Learning Resources

- [Reanimated v4 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler v2 Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Worklets Guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/worklets)

## 📞 Support

For issues or questions:
1. Check SWIPE_IMPLEMENTATION.md for detailed docs
2. Review troubleshooting section above
3. Verify all caches are cleared
4. Test on real device (not simulator)

---

**Happy Swiping!** 🎉
