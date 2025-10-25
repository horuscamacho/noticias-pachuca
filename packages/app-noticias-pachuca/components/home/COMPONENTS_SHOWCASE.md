# Brutalist Home Components - Visual Showcase

Production-ready React Native components for Noticias Pachuca.

---

## 🏗️ Component Architecture

```
HomeHeader (Main Component)
├── Logo Section
│   ├── Logo (small variant)
│   └── EditionDropdown
└── BrutalistBanner (optional)
    ├── Title Text
    └── CTA Button
```

---

## 📦 What's Included

### Components (3)
1. **HomeHeader** - Complete header with logo, dropdown, and banner
2. **BrutalistBanner** - Reusable promotional banner with CTA
3. **EditionDropdown** - Compact edition selector dropdown

### Supporting Files (8)
- `BrutalistBanner.tokens.ts` - Design tokens
- `HomeHeader.example.tsx` - 7 usage examples
- `HomeHeader.test.tsx` - Comprehensive tests
- `README.md` - Full documentation
- `QUICK_REFERENCE.md` - Fast lookup guide
- `VISUAL_SPEC.md` - Visual specifications
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `CHECKLIST.md` - Production checklist

---

## 🎨 Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Brown | `#854836` | Banner background, logo text |
| Yellow | `#FFB22C` | CTA button, accents |
| Black | `#000000` | Borders, text |
| White | `#FFFFFF` | Text, backgrounds |

### Typography
- **Weight:** 700-900 (bold/black)
- **Transform:** UPPERCASE
- **Letter Spacing:** 0.5
- **Line Height:** 1.2-1.3 (tight)

### Borders
- **Width:** 4px solid
- **Color:** Black (#000000)
- **Radius:** 0 (sharp brutalist corners)

---

## 🚀 Quick Start

### 1. Import
```tsx
import { HomeHeader } from '@/components/home';
```

### 2. Basic Usage
```tsx
<HomeHeader
  onEditionPress={() => console.log('Edition pressed')}
  onBannerCtaPress={() => console.log('CTA pressed')}
/>
```

### 3. Advanced Usage
```tsx
<HomeHeader
  onEditionPress={handleEditionPicker}
  currentEdition="PACHUCA"
  onBannerCtaPress={handleRegister}
  bannerTitle="CUSTOM PROMOTION"
  bannerCtaText="Get Started"
/>
```

---

## ✨ Features

### Performance
- ✅ React.memo optimization
- ✅ useMemo for styles
- ✅ useCallback for handlers
- ✅ Zero unnecessary re-renders

### Accessibility (WCAG AAA)
- ✅ 44pt minimum touch targets
- ✅ AAA color contrast ratios
- ✅ Screen reader support
- ✅ Semantic HTML roles
- ✅ Descriptive labels

### TypeScript
- ✅ 100% typed (zero `any`)
- ✅ Exported types
- ✅ Strict mode compliant
- ✅ Full IntelliSense support

### Responsive
- ✅ Phone/tablet scaling
- ✅ Safe area aware
- ✅ Dynamic typography
- ✅ Flexible layouts

### Interactive
- ✅ Haptic feedback
- ✅ Press animations
- ✅ Disabled states
- ✅ Visual feedback

---

## 📱 Component Preview

### HomeHeader (Full Layout)
```
┌────────────────────────────────────┐
│ [Safe Area]                        │
├────────────────────────────────────┤
│  NOTICIAS          [EDICIÓN ▼]     │
│  PACHUCA                           │
│  ────────                          │
├════════════════════════════════════┤ ← 4px border
│                                    │
│  SUSCRÍBETE PARA VIVIR LA NUEVA    │
│  EXPERIENCIA DE LAS NOTICIAS       │
│                                    │
│       ┌──────────────┐             │
│       │ Registrarse  │             │
│       └──────────────┘             │
│                                    │
├════════════════════════════════════┤ ← 4px border
```

### BrutalistBanner (Standalone)
```
┌════════════════════════════════════┐
│ Brown background (#854836)         │
│                                    │
│  YOUR PROMOTIONAL TEXT HERE        │
│  SUPPORTING TEXT LINE              │
│                                    │
│       ┌──────────────┐             │
│       │  CTA Button  │ ← Yellow    │
│       └──────────────┘             │
│                                    │
└════════════════════════════════════┘
```

### EditionDropdown (Standalone)
```
┌─────────────────┐
│  EDICIÓN     ▼  │ ← 100px × 40px
└─────────────────┘
White bg, black borders
```

---

## 🎯 Use Cases

### 1. Home Screen Header
```tsx
// Complete header with all features
<HomeHeader
  onEditionPress={handleEditionPicker}
  currentEdition="PACHUCA"
  onBannerCtaPress={handleRegister}
/>
```

### 2. Promotional Banner
```tsx
// Custom promotion
<BrutalistBanner
  title="OFERTA ESPECIAL: 3 MESES GRATIS"
  ctaText="Obtener ahora"
  onCtaPress={handlePromotion}
  backgroundColor="yellow"
/>
```

### 3. Edition Selector
```tsx
// Standalone dropdown
<EditionDropdown
  onPress={handleOpenPicker}
  currentEdition="NACIONAL"
/>
```

---

## 📊 Technical Specs

### Bundle Size
- BrutalistBanner: ~7.9KB
- EditionDropdown: ~6.2KB
- HomeHeader: ~5.8KB
- Tokens: ~1.6KB
- **Total:** ~21.5KB

### Dependencies
- react-native (core)
- expo-haptics
- react-native-safe-area-context
- @expo/vector-icons

### Platform Support
- iOS 13+
- Android 5.0+ (API 21+)
- Expo SDK 50+

---

## 🧪 Testing

### Test Coverage
```
✓ Unit tests (15+)
✓ Integration tests (3+)
✓ Accessibility tests
✓ Memoization tests
✓ Haptic feedback tests
✓ State management tests
```

### Run Tests
```bash
npm test components/home/HomeHeader.test.tsx
```

---

## 📚 Documentation Files

| File | Size | Purpose |
|------|------|---------|
| README.md | 11KB | Comprehensive docs |
| QUICK_REFERENCE.md | 4.4KB | Quick lookup |
| VISUAL_SPEC.md | 13KB | Visual design |
| IMPLEMENTATION_SUMMARY.md | 8KB | Overview |
| CHECKLIST.md | 6KB | Production checklist |

---

## 🔧 Customization

### Custom Colors
```tsx
import { BRUTALIST_BANNER_TOKENS } from '@/components/home';

// Access design tokens
const customBrown = BRUTALIST_BANNER_TOKENS.background.brown;
```

### Custom Banner
```tsx
<BrutalistBanner
  title="YOUR CUSTOM MESSAGE"
  ctaText="Custom CTA"
  onCtaPress={yourHandler}
  backgroundColor="yellow" // or 'brown', 'black', 'default'
/>
```

### Hide Banner
```tsx
<HomeHeader
  onEditionPress={handleEdition}
  onBannerCtaPress={() => {}}
  hideBanner={true}
/>
```

---

## 🎓 Examples Included

### 7 Complete Examples
1. Basic HomeHeader
2. HomeHeader with Edition
3. Custom Banner Content
4. Without Banner
5. Standalone Banners
6. Standalone Dropdown
7. Complete Integration

**See:** `HomeHeader.example.tsx`

---

## ✅ Production Ready

### Quality Checklist
- [x] TypeScript 100% typed
- [x] WCAG AAA compliant
- [x] React.memo optimized
- [x] Fully documented
- [x] Comprehensive tests
- [x] Examples included
- [x] Zero console warnings
- [x] ESLint compliant
- [x] Responsive design
- [x] Safe area aware

---

## 🚦 Status

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Created:** October 24, 2025
**For:** Noticias Pachuca Mobile App

---

## 📖 Next Steps

1. **Import** components into your home screen
2. **Connect** handlers to your app logic
3. **Test** on physical devices
4. **Verify** accessibility with screen readers
5. **Deploy** to production

---

## 💡 Tips

### Best Practices
- Use React.memo for parent components
- Memoize handlers with useCallback
- Test on real devices for haptics
- Verify safe area on notched devices
- Test with large text sizes

### Common Patterns
```tsx
// Edition picker flow
const [edition, setEdition] = useState('EDICIÓN');

const handleEditionPress = () => {
  // Show picker modal
  Alert.alert('Select Edition', 'Choose', [
    { text: 'Pachuca', onPress: () => setEdition('PACHUCA') },
    { text: 'Nacional', onPress: () => setEdition('NACIONAL') },
  ]);
};
```

---

## 📞 Support

**Documentation:** See `README.md` for full details
**Quick Reference:** See `QUICK_REFERENCE.md`
**Visual Specs:** See `VISUAL_SPEC.md`
**Examples:** See `HomeHeader.example.tsx`
**Tests:** See `HomeHeader.test.tsx`

---

**Built with ❤️ using Claude Code**
**For Noticias Pachuca**
**Ready for Production ✓**
