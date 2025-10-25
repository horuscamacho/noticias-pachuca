# Quick Start Guide - Brutalist Tabs

Get the tab navigation system working in your app in 5 minutes.

## Step 1: Import Component

```tsx
import { BrutalistTabs } from '@/components/home/tabs';
```

## Step 2: Add to Your Screen

```tsx
// app/(tabs)/index.tsx or your home screen
import { SafeAreaView } from 'react-native';
import { BrutalistTabs } from '@/components/home/tabs';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BrutalistTabs />
    </SafeAreaView>
  );
}
```

## Step 3: Run the App

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

That's it! The tab system is now working with:
- 7 categories (TODAS, DEPORTES, POLÍTICA, etc.)
- Smooth animations
- Swipeable content
- Haptic feedback
- Full accessibility

## Next Steps

### Customize Content

Replace the test backgrounds with your actual content:

```tsx
import { BrutalistTabs } from '@/components/home/tabs';
import { NewsFeed } from '@/components/news';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BrutalistTabs
        renderContent={(category) => (
          <NewsFeed category={category.slug} />
        )}
      />
    </SafeAreaView>
  );
}
```

### Track Category Changes

```tsx
<BrutalistTabs
  onCategoryChange={(category, index) => {
    console.log('User viewing:', category.label);
    // Track analytics, update URL, etc.
  }}
/>
```

### Start at Specific Category

```tsx
<BrutalistTabs initialIndex={1} /> {/* Start at DEPORTES */}
```

## File Locations

All components are in:
```
/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/home/tabs/
```

## Documentation

- **README.md** - Complete API reference
- **ACCESSIBILITY.md** - Accessibility features
- **PERFORMANCE.md** - Performance optimizations
- **BrutalistTabs.example.tsx** - Usage examples

## Troubleshooting

### Issue: "Cannot find module"

Make sure you're using the correct import path:

```tsx
// ✅ Correct
import { BrutalistTabs } from '@/components/home/tabs';

// ❌ Wrong
import { BrutalistTabs } from './components/home/tabs';
```

### Issue: Tabs not visible

Ensure parent container has flex:

```tsx
<View style={{ flex: 1 }}>
  <BrutalistTabs />
</View>
```

### Issue: Animation not smooth

Check that Reanimated plugin is in `babel.config.js`:

```js
// babel.config.js
module.exports = {
  plugins: [
    'react-native-reanimated/plugin', // Must be last
  ],
};
```

## Support

Check the full documentation in README.md for:
- Advanced examples
- TypeScript types
- Design tokens
- Performance tips
- Accessibility guide

---

**Ready to use!** The component is production-ready and fully tested.
