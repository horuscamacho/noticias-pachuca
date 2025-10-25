# RelatedNewsCard - Visual Wireframes & Specifications

## Detailed Visual Comparison

### OLD DESIGN - Horizontal Layout (80x80 Image)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌────────┐┌────────────────────────────────────┐  │
│  │        ││  ┌──────────┐                      │  │
│  │        ││  │ POLÍTICA │  ← 8px top           │  │
│  │  80px  ││  └──────────┘                      │  │
│  │   ×    ││                                    │  │
│  │  80px  ││  Breaking news headline here...   │  │
│  │        ││  that gets truncated              │  │
│  │ IMAGE  ││  ← Only 2 lines, 15px/20px        │  │
│  │        ││                                    │  │
│  │        ││  Por Juan · 2h  ← 11px, small     │  │
│  └────────┘└────────────────────────────────────┘  │
│     ↑           ↑                                   │
│   80px        ~220px text area (cramped!)           │
│                                                     │
└─────4px black separator──────────────────────────────┘
  ← No gap to next card (separator only)

DIMENSIONS:
- Total height: ~88-96px
- Image: 80×80px (6,400px² area)
- Text width: ~220px (screen - 80px - padding)
- Title: 15px/20px, 2 lines max
- Author: 11px/14px
- Spacing: Cramped, minimal breathing room

PROBLEMS:
✗ Tiny images look bad, get poorly cropped
✗ Text area too narrow (only ~220px wide)
✗ Hard to read, cluttered feeling
✗ 2-line titles truncate too much
✗ Small fonts hard to read
✗ No spacing between cards
✗ Not visually appealing or engaging
✗ Doesn't encourage clicks
```

---

### NEW DESIGN - Vertical Hero Card (200px Image)
```
┌─────────────────────────────────────────────────────┐ ← 4px border (top)
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │                                                 │ │
│ │            HERO IMAGE 16:9                      │ │
│ │         Full Width × 200px                      │ │ ← 200px height
│ │                                                 │ │
│ │                                                 │ │
│ │  ┌──────────┐  ← 8px from left                 │ │
│ │  │ POLÍTICA │     8px from bottom               │ │
│ │  └──────────┘     (overlaid on image)          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤ ← 4px border (image separator)
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │                                               │ │ ← 16px padding top
│  │  Breaking news headline here that spans      │ │
│  │  up to three lines maximum for better        │ │ ← 17px/24px
│  │  readability and context clarity             │ │   (3 lines max)
│  │                                               │ │
│  │  ↑ 8px margin bottom                          │ │
│  │                                               │ │
│  │  Por Juan Pérez · 2h  ← 12px/16px (larger)   │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │ ← 16px padding bottom
│                                                     │
└─────────────────────────────────────────────────────┘ ← 4px border (bottom)
        ↕
     16px gap (white space)
        ↕
┌─────────────────────────────────────────────────────┐
│                [NEXT CARD]                          │

DIMENSIONS:
- Total height: ~280-300px (depends on title length)
- Image: Full width × 200px (~71,000px² area at 355px width)
- Text width: Full width minus 32px padding = ~343px
- Title: 17px/24px, 3 lines max
- Author: 12px/16px
- Spacing: Generous 16px padding, 16px gaps

IMPROVEMENTS:
✓ 11x larger image area (6,400 → 71,000px²)
✓ Full-width text area (343px vs 220px = 56% more space)
✓ 13% larger title font, 20% more line height
✓ 3 lines vs 2 lines = 50% more content visible
✓ 9% larger author font
✓ 16px spacing between cards (vs 0px)
✓ Dramatically more visually appealing
✓ Much better readability and hierarchy
✓ Strongly encourages engagement
```

---

## Detailed Dimension Specifications

### Card Container
```
┌─ WRAPPER ────────────────────────────────────────┐
│ Margin Left: 16px                                │
│ Margin Right: 16px                               │
│ Margin Bottom: 16px                              │
│                                                  │
│ ┌─ CONTAINER ──────────────────────────────────┐│
│ │ Border: 4px solid black (all sides)          ││
│ │ Background: white → yellow on press          ││
│ │                                              ││
│ │ [Content here]                               ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘

Total Width: Screen width
Card Width: Screen width - 32px (16px × 2 margins)
```

### Image Section (200px Fixed Height)
```
┌────────────────────────────────────────┐ ← Top of card
│                                        │
│        <Image>                         │ ← 200px height
│        resizeMode="cover"              │   (fixed)
│        16:9 aspect ratio               │
│                                        │
│ ┌──────────┐                           │
│ │ CATEGORY │  ← Badge (absolute)       │ ← 8px from bottom
│ └──────────┘     8px from left         │   8px from left
│        ↑                               │
│     Shadow (for contrast)              │
│     - offset: (0, 2)                   │
│     - opacity: 0.3                     │
│     - radius: 4px                      │
└────────────────────────────────────────┘
         ↓
    4px black border
         ↓
```

### Content Section
```
┌────────────────────────────────────────┐
│ ← 16px padding left                    │ ← 16px padding top
│                                        │
│ Breaking news headline here that       │ ← TITLE
│ spans up to three lines maximum        │   17px font
│ for better readability                 │   24px line height
│                                        │   Bold (700)
│ ↓ 8px margin bottom                    │   3 lines max
│                                        │
│ Por Juan Pérez · 2h                    │ ← AUTHOR
│                                        │   12px font
│                                        │   16px line height
│                                        │   Regular (400)
│ ↓ 16px padding bottom                  │   1 line max
└────────────────────────────────────────┘

Horizontal Padding: 16px left + 16px right
Vertical Padding: 16px top + 16px bottom
Text Width: Card width - 32px = ~343px
```

---

## Typography Visual Comparison

### Title Typography

**OLD:**
```
Breaking news headline here
that gets truncated quickly
← Only 2 lines
← 15px size / 20px line height
← Feels cramped
```

**NEW:**
```
Breaking news headline here that
spans up to three lines maximum
for better readability and clarity
← Full 3 lines
← 17px size / 24px line height
← More breathing room, easier to read
```

**Improvements:**
- Font size: 15px → 17px (13% increase)
- Line height: 20px → 24px (20% increase)
- Lines: 2 → 3 (50% more content)
- Visual weight: More prominent, better hierarchy

---

### Author Typography

**OLD:**
```
Por Juan · 2h
← 11px / 14px
← Quite small, hard to read
```

**NEW:**
```
Por Juan Pérez · 2h
← 12px / 16px
← More legible, still compact
```

**Improvements:**
- Font size: 11px → 12px (9% increase)
- Line height: 14px → 16px (14% increase)
- Much more readable on mobile

---

## Color & Interaction States

### Default State (Unpressed)
```
┌─────────────────────────────────────┐
│ Border: #000000 (black, 4px)        │
│ Background: #FFFFFF (white)         │
│                                     │
│ [Image]                             │
│                                     │
│ Title: #000000 (black)              │
│ Author: #000000 (black)             │
└─────────────────────────────────────┘
```

### Pressed State
```
┌─────────────────────────────────────┐
│ Border: #000000 (black, 4px)        │
│ Background: #FFB22C (yellow) ← KEY  │
│                                     │
│ [Image]                             │
│                                     │
│ Title: #000000 (black)              │
│ Author: #000000 (black)             │
└─────────────────────────────────────┘
```

### Category Badge Variants
```
BROWN (default):
┌──────────┐
│ POLÍTICA │  Background: #854836 (brown)
└──────────┘  Text: #FFFFFF (white)
             Border: #000000 (black, 2-3px)

YELLOW:
┌──────────┐
│ CULTURA  │  Background: #FFB22C (yellow)
└──────────┘  Text: #000000 (black)
             Border: #000000 (black, 2-3px)
```

### Image Placeholder (No Image)
```
┌─────────────────────────────────────┐
│                                     │
│         [Gray Rectangle]            │
│       Background: #F7F7F7           │
│                                     │
└─────────────────────────────────────┘
```

---

## Spacing System Visual Guide

### Vertical Rhythm
```
[Card 1]
   ↕ 16px gap (wrapper margin bottom)
[Card 2]
   ↕ 16px gap
[Card 3]
   ↕ 16px gap
[Card 4]

Consistent spacing creates visual rhythm
and makes scanning easier
```

### Internal Card Spacing
```
┌─────────────────────────┐
│ ← 16px padding          │ ← 16px padding top
│                         │
│ Title (17px/24px)       │
│   72px total height     │ ← 3 lines × 24px
│                         │
│ ↕ 8px gap               │
│                         │
│ Author (12px/16px)      │
│   16px height           │ ← 1 line
│                         │
│ ← 16px padding          │ ← 16px padding bottom
└─────────────────────────┘

Total content height: ~112px
(16 + 72 + 8 + 16 + 16)
```

---

## Touch Target Analysis

### OLD Design Touch Area
```
[80px image] + [Text area]
= ~88-96px tall
= Acceptable but minimal

Horizontal layout means narrow tap zones
```

### NEW Design Touch Area
```
[200px image]
+
[~100-112px content]
+
[8px borders]
= ~308-320px tall total

MUCH larger target, easier to tap
Full card width × full card height
```

**Touch Target Score:**
- OLD: 88px × 343px = ~30,184px²
- NEW: 308px × 343px = ~105,644px²
- **Improvement: 3.5x larger touch area!**

---

## Screen Layout Example (iPhone Size)

```
┌─────────── iPhone (375px wide) ─────────────┐
│  Status Bar                                 │
├─────────────────────────────────────────────┤
│  Navigation Header                          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │ ← 16px margin
│  │                                     │   │
│  │         [Hero Image 200px]          │   │ ← Card 1
│  │                                     │   │
│  │  Breaking news headline spans       │   │
│  │  up to three lines                  │   │
│  │                                     │   │
│  │  Por Juan · 2h                      │   │
│  └─────────────────────────────────────┘   │
│                                             │ ← 16px gap
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         [Hero Image 200px]          │   │ ← Card 2
│  │                                     │   │
│  │  Another headline here that         │   │
│  │  explains the story                 │   │
│  │                                     │   │
│  │  Por María · 5h                     │   │
│  └─────────────────────────────────────┘   │
│                                             │ ← 16px gap
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         [Hero Image 200px]          │   │ ← Card 3
│  │           (Scrolls here)            │   │
│  │                                     │   │

Card width: 375 - 32 = 343px
Image width: 343px
Image height: 200px (fixed)
Content width: 343 - 32 = 311px (with padding)
```

---

## Comparison Chart

| Metric | OLD Design | NEW Design | Change |
|--------|-----------|-----------|---------|
| **Image Size** | 80×80px | 343×200px | +854% area |
| **Image Aspect** | 1:1 square | 16:9 cinematic | Better for photos |
| **Text Width** | ~220px | ~311px | +41% |
| **Title Font** | 15px/20px | 17px/24px | +13% size, +20% line |
| **Title Lines** | 2 lines | 3 lines | +50% |
| **Author Font** | 11px/14px | 12px/16px | +9% size, +14% line |
| **Card Spacing** | 0px (separator) | 16px gap | ∞% improvement |
| **Touch Area** | ~30,184px² | ~105,644px² | +250% |
| **Total Height** | ~88-96px | ~308-320px | +240% |
| **Visual Appeal** | ⭐⭐ | ⭐⭐⭐⭐⭐ | Much better! |

---

## Accessibility Wireframe

### Screen Reader Flow
```
1. "Button"
   ↓
2. "Leer artículo: [TITLE], categoría [CATEGORY], por [AUTHOR]"
   ↓
3. "Toca para leer el artículo completo"
   ↓
4. User can double-tap to activate
```

### Visual Hierarchy for Low Vision
```
STRONGEST VISUAL WEIGHT:
↓
[Large Hero Image]  ← Most prominent
↓
[Category Badge]    ← High contrast, bold
↓
[Bold Title]        ← Large, dark, readable
↓
[Author Text]       ← Smaller but still legible
↓
WEAKEST VISUAL WEIGHT
```

---

## Implementation Notes

### Layout Flow
```
<View style={wrapper}>              ← 16px margins
  <Pressable style={container}>     ← 4px border, white bg

    <View style={imageContainer}>   ← 200px fixed height
      <Image />                      ← Full width/height

      <View style={badge}>           ← Absolute positioned
        <CategoryBadge />            ← 8px from edges
      </View>
    </View>

    <View style={content}>           ← 16px padding
      <Text style={title}>           ← 17px/24px, 3 lines
        {title}
      </Text>

      <Text style={author}>          ← 12px/16px, 1 line
        {author}
      </Text>
    </View>

  </Pressable>
</View>
```

### Style Inheritance
```
Container (Pressable):
  → backgroundColor changes on press (white → yellow)
  → All children inherit this background
  → Border stays black (doesn't change)

Image Container:
  → position: 'relative' (for absolute badge)
  → Fixed 200px height
  → Border bottom separates from content

Badge Container:
  → position: 'absolute'
  → Overlays on image
  → Shadow for contrast

Content:
  → Padding creates breathing room
  → Background from parent (white or yellow)
```

---

## Responsive Behavior

### Small Phones (320-360px)
```
Card width: 288-328px
Image: 288-328px × 200px
Text width: 256-296px
Still looks great, text wraps naturally
```

### Medium Phones (375-390px)
```
Card width: 343-358px  ← Optimal
Image: 343-358px × 200px
Text width: 311-326px
Perfect balance of image and text
```

### Large Phones (400-430px)
```
Card width: 368-398px
Image: 368-398px × 200px
Text width: 336-366px
More comfortable reading, same great look
```

### Tablets (768px+)
```
Consider 2-column layout at this size
Or maintain single column for consistency
Current design works well at any width
```

---

## Final Visual Summary

### The Transformation

**BEFORE:** Tiny images, cramped text, poor hierarchy
**AFTER:** Hero images, spacious layout, clear hierarchy

**BEFORE:** Hard to scan, low engagement
**AFTER:** Easy to scan, highly engaging

**BEFORE:** Looked basic and uninviting
**AFTER:** Looks premium and compelling

**BEFORE:** Brutalist but boring
**AFTER:** Brutalist and beautiful!

---

**Component File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/RelatedNewsCard.tsx`

**Wireframes by:** Jarvis (UI/UX Designer)

**Date:** 2025-10-25
