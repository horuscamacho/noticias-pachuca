# Brutalist Sidebar Design Specification
## News Article Page Layout

**Designer:** Jarvis (UI/UX Designer)
**Project:** Noticias Pachuca - Brutalist News Digital
**Date:** 2025-10-22
**Version:** 1.0

---

## 1. OVERALL LAYOUT STRUCTURE

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                                │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│        MAIN CONTENT              │       SIDEBAR            │
│        (66.67%)                  │       (33.33%)           │
│                                  │                          │
│  ┌────────────────────────────┐  │  ┌────────────────────┐ │
│  │  Article Header            │  │  │  Related News      │ │
│  │  Category | Author         │  │  │  Carousel          │ │
│  │  Date | Read time          │  │  └────────────────────┘ │
│  └────────────────────────────┘  │                          │
│                                  │  ┌────────────────────┐ │
│  ┌────────────────────────────┐  │  │  Keywords/Tags     │ │
│  │                            │  │  │  Section           │ │
│  │  Article Body Content      │  │  └────────────────────┘ │
│  │                            │  │                          │
│  │  Paragraphs, Images, etc.  │  │  (Sticky on scroll)    │
│  │                            │  │                          │
│  └────────────────────────────┘  │                          │
└──────────────────────────────────┴──────────────────────────┘
```

### Tailwind Grid Structure
```html
<div class="container mx-auto px-4 lg:px-8">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
    <!-- Main Content: 2 columns on desktop -->
    <article class="lg:col-span-2">
      <!-- Article content -->
    </article>

    <!-- Sidebar: 1 column on desktop -->
    <aside class="lg:col-span-1">
      <div class="lg:sticky lg:top-8 space-y-8">
        <!-- Sidebar components -->
      </div>
    </aside>
  </div>
</div>
```

### Proportions
- **Main Content:** 2/3 width (66.67%) - max-width: 800px
- **Sidebar:** 1/3 width (33.33%) - max-width: 400px
- **Gap:** 48px (3rem) between columns
- **Sidebar Position:** Sticky, top: 32px (2rem)
- **Mobile:** Single column, sidebar components stack below article

---

## 2. RELATED NEWS CAROUSEL DESIGN

### Visual Design

```
┌──────────────────────────────────────┐
│ ╔══════════════════════════════════╗ │ ← 4px black border
│ ║  RELATED NEWS                    ║ │
│ ║  ════════════                    ║ │ ← Orange underline decoration
│ ╠══════════════════════════════════╣ │
│ ║                                  ║ │
│ ║  ┌────────────────────────────┐  ║ │
│ ║  │                            │  ║ │
│ ║  │    ARTICLE IMAGE           │  ║ │ ← 3:2 aspect ratio
│ ║  │                            │  ║ │
│ ║  └────────────────────────────┘  ║ │
│ ║                                  ║ │
│ ║  ┌──────────┐                   ║ │
│ ║  │ DEPORTES │ ← Category badge  ║ │
│ ║  └──────────┘                   ║ │
│ ║                                  ║ │
│ ║  ESTA ES LA NOTICIA             ║ │ ← Title (2-3 lines)
│ ║  RELACIONADA MUY                ║ │
│ ║  IMPORTANTE                     ║ │
│ ║                                  ║ │
│ ║  Por: JUAN PÉREZ                ║ │ ← Author
│ ║  2h ago                         ║ │ ← Time
│ ║                                  ║ │
│ ║  ┌─┐                          ┌─┐║ │
│ ║  │◄│   ●  ○  ○                │►│║ │ ← Navigation
│ ║  └─┘                          └─┘║ │
│ ╚══════════════════════════════════╝ │
└──────────────────────────────────────┘
```

### Component Structure

```html
<div class="border-4 border-black bg-white p-6">
  <!-- Header with decoration -->
  <div class="mb-6">
    <h2 class="text-xl font-black uppercase tracking-wider mb-2">
      RELATED NEWS
    </h2>
    <div class="w-24 h-1 bg-[#FFB22C]"></div>
  </div>

  <!-- Carousel Container -->
  <div class="relative">
    <!-- Article Card -->
    <div class="space-y-4">
      <!-- Image -->
      <div class="relative aspect-[3/2] border-3 border-black overflow-hidden">
        <img
          src="article-image.jpg"
          alt="Article title"
          class="w-full h-full object-cover"
        />
        <!-- Decorative corner element -->
        <div class="absolute top-2 right-2 w-4 h-4 bg-[#FFB22C] border-2 border-black rotate-45"></div>
      </div>

      <!-- Category Badge -->
      <div class="inline-block">
        <span class="bg-[#854836] text-white px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-black">
          DEPORTES
        </span>
      </div>

      <!-- Title -->
      <h3 class="font-black uppercase text-lg leading-tight line-clamp-3">
        ESTA ES LA NOTICIA RELACIONADA MUY IMPORTANTE
      </h3>

      <!-- Meta Info -->
      <div class="flex items-center justify-between text-sm">
        <span class="font-bold uppercase tracking-wide">
          Por: JUAN PÉREZ
        </span>
        <span class="text-gray-600 font-bold">2h ago</span>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between mt-6 pt-6 border-t-2 border-black">
      <!-- Previous Button -->
      <button
        class="w-10 h-10 border-3 border-black bg-white hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black"
        aria-label="Previous article"
      >
        ◄
      </button>

      <!-- Dots Indicator -->
      <div class="flex gap-2">
        <button class="w-3 h-3 rounded-full bg-black" aria-label="Article 1"></button>
        <button class="w-3 h-3 rounded-full border-2 border-black bg-white" aria-label="Article 2"></button>
        <button class="w-3 h-3 rounded-full border-2 border-black bg-white" aria-label="Article 3"></button>
      </div>

      <!-- Next Button -->
      <button
        class="w-10 h-10 border-3 border-black bg-white hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black"
        aria-label="Next article"
      >
        ►
      </button>
    </div>
  </div>
</div>
```

### Design Specifications

**Container:**
- Border: 4px solid black
- Background: White (#FFFFFF)
- Padding: 24px (p-6)

**Header:**
- Text: Font-black, uppercase, 20px
- Decoration: 96px x 4px orange bar (#FFB22C)
- Bottom margin: 24px

**Image:**
- Aspect ratio: 3:2
- Border: 3px solid black
- Decorative element: Rotated square (16x16px, orange, 2px border)
- Position: Top-right corner (8px from edges)

**Category Badge:**
- Background: #854836 (brown)
- Text: White, font-black, 12px, uppercase
- Padding: 8px 16px
- Border: 2px solid black

**Title:**
- Font: Font-black, 18px
- Line height: Tight (1.1)
- Max lines: 3 (line-clamp-3)
- Text transform: Uppercase

**Meta Info:**
- Font size: 14px
- Author: Font-bold, uppercase
- Time: Gray-600, font-bold

**Navigation Buttons:**
- Size: 40x40px
- Border: 3px solid black
- Background: White
- Hover: Orange (#FFB22C)
- Font: Font-black
- Symbols: ◄ ►

**Dots Indicator:**
- Active: 12x12px circle, black background
- Inactive: 12x12px circle, white background, 2px black border
- Gap: 8px

---

## 3. KEYWORDS/TAGS SECTION DESIGN

### Visual Design

```
┌──────────────────────────────────────┐
│ ╔══════════════════════════════════╗ │
│ ║  KEYWORDS                        ║ │
│ ║  ════════                        ║ │
│ ╠══════════════════════════════════╣ │
│ ║                                  ║ │
│ ║  ┌───────────┐  ┌──────────┐    ║ │
│ ║  │ PACHUCA   │  │ FÚTBOL   │    ║ │
│ ║  └───────────┘  └──────────┘    ║ │
│ ║                                  ║ │
│ ║  ┌────────────┐  ┌──────────┐   ║ │
│ ║  │ LIGA MX    │  │ NOTICIAS │   ║ │
│ ║  └────────────┘  └──────────┘   ║ │
│ ║                                  ║ │
│ ║  ┌─────────────┐                ║ │
│ ║  │ DEPORTES    │                ║ │
│ ║  └─────────────┘                ║ │
│ ║                                  ║ │
│ ╚══════════════════════════════════╝ │
└──────────────────────────────────────┘
```

### Alternative Design (Grid Pattern)

```
┌──────────────────────────────────────┐
│ ╔══════════════════════════════════╗ │
│ ║  ▓▓▓▓▓▓▓▓                        ║ │
│ ║  ▓ TAGS ▓                        ║ │
│ ║  ▓▓▓▓▓▓▓▓                        ║ │
│ ╠══════════════════════════════════╣ │
│ ║                                  ║ │
│ ║  ╔═══════════╗  ╔═══════════╗   ║ │
│ ║  ║ PACHUCA   ║  ║ FÚTBOL    ║   ║ │
│ ║  ╚═══════════╝  ╚═══════════╝   ║ │
│ ║   ▲                 ▲            ║ │
│ ║                                  ║ │
│ ║  ╔═══════════╗  ╔═══════════╗   ║ │
│ ║  ║ LIGA MX   ║  ║ NOTICIAS  ║   ║ │
│ ║  ╚═══════════╝  ╚═══════════╝   ║ │
│ ║   ▲                 ▲            ║ │
│ ║                                  ║ │
│ ╚══════════════════════════════════╝ │
└──────────────────────────────────────┘
```

### Component Structure (Option 1: Standard)

```html
<div class="border-4 border-black bg-white p-6">
  <!-- Header -->
  <div class="mb-6">
    <h2 class="text-xl font-black uppercase tracking-wider mb-2">
      KEYWORDS
    </h2>
    <div class="w-16 h-1 bg-[#FFB22C]"></div>
  </div>

  <!-- Tags Container -->
  <div class="flex flex-wrap gap-3">
    <!-- Individual Tag -->
    <a
      href="/tag/pachuca"
      class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
    >
      PACHUCA
    </a>

    <a
      href="/tag/futbol"
      class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
    >
      FÚTBOL
    </a>

    <a
      href="/tag/liga-mx"
      class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
    >
      LIGA MX
    </a>

    <a
      href="/tag/noticias"
      class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
    >
      NOTICIAS
    </a>

    <a
      href="/tag/deportes"
      class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
    >
      DEPORTES
    </a>
  </div>
</div>
```

### Component Structure (Option 2: Brutalist Grid)

```html
<div class="border-4 border-black bg-white p-6">
  <!-- Header with Heavy Background -->
  <div class="mb-6 inline-block">
    <div class="bg-black text-white px-4 py-3 border-2 border-black">
      <h2 class="text-xl font-black uppercase tracking-widest">
        TAGS
      </h2>
    </div>
  </div>

  <!-- Tags Grid with Decorative Elements -->
  <div class="grid grid-cols-2 gap-4">
    <!-- Individual Tag with Arrow Decoration -->
    <a
      href="/tag/pachuca"
      class="group relative border-4 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] p-4 transition-colors"
    >
      <span class="font-black uppercase text-sm tracking-wide block text-center">
        PACHUCA
      </span>
      <!-- Decorative triangle -->
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
    </a>

    <a
      href="/tag/futbol"
      class="group relative border-4 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] p-4 transition-colors"
    >
      <span class="font-black uppercase text-sm tracking-wide block text-center">
        FÚTBOL
      </span>
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
    </a>

    <a
      href="/tag/liga-mx"
      class="group relative border-4 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] p-4 transition-colors"
    >
      <span class="font-black uppercase text-sm tracking-wide block text-center">
        LIGA MX
      </span>
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
    </a>

    <a
      href="/tag/noticias"
      class="group relative border-4 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] p-4 transition-colors"
    >
      <span class="font-black uppercase text-sm tracking-wide block text-center">
        NOTICIAS
      </span>
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
    </a>
  </div>
</div>
```

### Design Specifications

**Option 1 - Standard Tags:**
- Container: 4px black border, white background
- Tag style: Inline pills
- Border: 3px solid black
- Background: #F7F7F7 (light gray)
- Hover: #FFB22C (orange)
- Padding: 8px 16px
- Font: Font-bold, 14px, uppercase
- Gap: 12px between tags

**Option 2 - Brutalist Grid:**
- Container: 4px black border, white background
- Grid: 2 columns on mobile/sidebar
- Tag style: Block buttons
- Border: 4px solid black
- Background: #F7F7F7
- Hover: #FFB22C
- Padding: 16px
- Font: Font-black, 14px, uppercase, centered
- Decorative element: Black triangle (8px) below each tag
- Gap: 16px between tags

**Header (Option 1):**
- Text: Font-black, 20px, uppercase
- Decoration: Orange underline (64px x 4px)

**Header (Option 2):**
- Background: Black
- Text: White, font-black, 20px, uppercase
- Padding: 12px 16px
- Border: 2px black (creates layered effect)

---

## 4. COMPLETE SIDEBAR IMPLEMENTATION

### Full Sidebar Component

```html
<aside class="lg:col-span-1">
  <div class="lg:sticky lg:top-8 space-y-8">

    <!-- RELATED NEWS CAROUSEL -->
    <div class="border-4 border-black bg-white p-6">
      <div class="mb-6">
        <h2 class="text-xl font-black uppercase tracking-wider mb-2">
          RELATED NEWS
        </h2>
        <div class="w-24 h-1 bg-[#FFB22C]"></div>
      </div>

      <div class="relative" id="related-carousel">
        <!-- Carousel items (controlled by JavaScript) -->
        <div class="carousel-item space-y-4">
          <div class="relative aspect-[3/2] border-3 border-black overflow-hidden">
            <img
              src="/api/placeholder/400/267"
              alt="Related article"
              class="w-full h-full object-cover"
            />
            <div class="absolute top-2 right-2 w-4 h-4 bg-[#FFB22C] border-2 border-black rotate-45"></div>
          </div>

          <div class="inline-block">
            <span class="bg-[#854836] text-white px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-black">
              DEPORTES
            </span>
          </div>

          <h3 class="font-black uppercase text-lg leading-tight line-clamp-3">
            ESTA ES LA NOTICIA RELACIONADA MUY IMPORTANTE
          </h3>

          <div class="flex items-center justify-between text-sm">
            <span class="font-bold uppercase tracking-wide">
              Por: JUAN PÉREZ
            </span>
            <span class="text-gray-600 font-bold">2h ago</span>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-6 pt-6 border-t-2 border-black">
          <button
            class="carousel-prev w-10 h-10 border-3 border-black bg-white hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black text-xl"
            aria-label="Previous article"
          >
            ◄
          </button>

          <div class="flex gap-2" id="carousel-dots">
            <button class="w-3 h-3 rounded-full bg-black" data-index="0"></button>
            <button class="w-3 h-3 rounded-full border-2 border-black bg-white" data-index="1"></button>
            <button class="w-3 h-3 rounded-full border-2 border-black bg-white" data-index="2"></button>
          </div>

          <button
            class="carousel-next w-10 h-10 border-3 border-black bg-white hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black text-xl"
            aria-label="Next article"
          >
            ►
          </button>
        </div>
      </div>
    </div>

    <!-- KEYWORDS SECTION (Option 1) -->
    <div class="border-4 border-black bg-white p-6">
      <div class="mb-6">
        <h2 class="text-xl font-black uppercase tracking-wider mb-2">
          KEYWORDS
        </h2>
        <div class="w-16 h-1 bg-[#FFB22C]"></div>
      </div>

      <div class="flex flex-wrap gap-3">
        <a
          href="/tag/pachuca"
          class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
        >
          PACHUCA
        </a>
        <a
          href="/tag/futbol"
          class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
        >
          FÚTBOL
        </a>
        <a
          href="/tag/liga-mx"
          class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
        >
          LIGA MX
        </a>
        <a
          href="/tag/noticias"
          class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
        >
          NOTICIAS
        </a>
        <a
          href="/tag/deportes"
          class="inline-block px-4 py-2 border-3 border-black bg-[#F7F7F7] hover:bg-[#FFB22C] hover:text-black transition-colors font-bold uppercase text-sm tracking-wide"
        >
          DEPORTES
        </a>
      </div>
    </div>

    <!-- OPTIONAL: Ad Space or Social Share (Brutalist style) -->
    <div class="border-4 border-black bg-[#854836] p-6 text-white">
      <div class="text-center space-y-4">
        <div class="inline-block bg-[#FFB22C] text-black px-4 py-2 border-2 border-black font-black text-xs uppercase">
          SHARE THIS
        </div>
        <div class="flex justify-center gap-4">
          <button class="w-12 h-12 bg-white border-3 border-black hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black">
            F
          </button>
          <button class="w-12 h-12 bg-white border-3 border-black hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black">
            T
          </button>
          <button class="w-12 h-12 bg-white border-3 border-black hover:bg-[#FFB22C] transition-colors flex items-center justify-center font-black">
            W
          </button>
        </div>
      </div>
    </div>

  </div>
</aside>
```

---

## 5. RESPONSIVE BEHAVIOR

### Mobile (< 1024px)
- Single column layout
- Sidebar stacks below article content
- Related news carousel: Full width
- Keywords: Full width, maintain 2-column grid
- Remove sticky positioning
- Maintain all brutalist styling

### Tablet (1024px - 1280px)
- Enable two-column layout
- Sidebar width: 33.33%
- Reduce gap to 32px (2rem)
- Sidebar becomes sticky

### Desktop (1280px+)
- Full layout as designed
- Max content width: 1280px
- Sidebar sticky with top: 32px
- Gap: 48px (3rem)

### Tailwind Breakpoints
```html
<!-- Responsive Classes -->
<div class="
  container mx-auto
  px-4 lg:px-8
  max-w-[1440px]
">
  <div class="
    grid
    grid-cols-1
    lg:grid-cols-3
    gap-8
    lg:gap-12
  ">
    <article class="
      lg:col-span-2
      max-w-none
      lg:max-w-[800px]
    ">
      <!-- Article -->
    </article>

    <aside class="
      lg:col-span-1
      max-w-none
      lg:max-w-[400px]
    ">
      <div class="
        lg:sticky
        lg:top-8
        space-y-6
        lg:space-y-8
      ">
        <!-- Sidebar components -->
      </div>
    </aside>
  </div>
</div>
```

---

## 6. CAROUSEL JAVASCRIPT IMPLEMENTATION

### Basic Carousel Logic

```javascript
// Related News Carousel
class BrutalistCarousel {
  constructor(container) {
    this.container = container;
    this.items = [];
    this.currentIndex = 0;
    this.init();
  }

  init() {
    this.items = Array.from(this.container.querySelectorAll('.carousel-item'));
    this.prevBtn = this.container.querySelector('.carousel-prev');
    this.nextBtn = this.container.querySelector('.carousel-next');
    this.dots = Array.from(this.container.querySelectorAll('[data-index]'));

    this.bindEvents();
    this.showItem(0);
  }

  bindEvents() {
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());
    this.dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.showItem(index);
      });
    });
  }

  showItem(index) {
    // Hide all items
    this.items.forEach(item => {
      item.style.display = 'none';
    });

    // Show current item
    this.items[index].style.display = 'block';
    this.currentIndex = index;

    // Update dots
    this.updateDots();
  }

  updateDots() {
    this.dots.forEach((dot, index) => {
      if (index === this.currentIndex) {
        dot.classList.remove('bg-white', 'border-2', 'border-black');
        dot.classList.add('bg-black');
      } else {
        dot.classList.remove('bg-black');
        dot.classList.add('bg-white', 'border-2', 'border-black');
      }
    });
  }

  next() {
    const nextIndex = (this.currentIndex + 1) % this.items.length;
    this.showItem(nextIndex);
  }

  prev() {
    const prevIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.showItem(prevIndex);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const carouselContainer = document.getElementById('related-carousel');
  if (carouselContainer) {
    new BrutalistCarousel(carouselContainer);
  }
});
```

### Alternative: Using Swiper.js (Recommended)

```javascript
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

const relatedSwiper = new Swiper('#related-carousel', {
  modules: [Navigation, Pagination],
  slidesPerView: 1,
  spaceBetween: 0,
  navigation: {
    nextEl: '.carousel-next',
    prevEl: '.carousel-prev',
  },
  pagination: {
    el: '#carousel-dots',
    clickable: true,
    bulletClass: 'w-3 h-3 rounded-full border-2 border-black bg-white cursor-pointer',
    bulletActiveClass: 'bg-black',
  },
});
```

---

## 7. ACCESSIBILITY REQUIREMENTS

### ARIA Labels
- Carousel navigation buttons must have `aria-label`
- Carousel must have `role="region"` and `aria-label="Related news"`
- Current slide indicator: `aria-current="true"`
- Dot buttons: `aria-label="Go to article {number}"`

### Keyboard Navigation
- Arrow keys should navigate carousel
- Tab key should move through interactive elements
- Enter/Space should activate buttons
- Focus indicators must be visible (orange outline)

### Focus Styles
```css
/* Add to your CSS */
.focus-visible:focus {
  outline: 3px solid #FFB22C;
  outline-offset: 2px;
}
```

### Screen Reader Support
```html
<!-- Carousel with screen reader support -->
<div
  role="region"
  aria-label="Related news articles"
  id="related-carousel"
>
  <div class="carousel-item" aria-current="true">
    <!-- Article content -->
  </div>

  <button
    class="carousel-prev"
    aria-label="Previous related article"
    aria-controls="related-carousel"
  >
    ◄
  </button>
</div>
```

---

## 8. PERFORMANCE CONSIDERATIONS

### Image Optimization
- Use responsive images with `srcset`
- Lazy load carousel images not currently visible
- WebP format with JPG fallback
- Dimensions: 400x267px for sidebar (3:2 ratio)

```html
<img
  src="/images/article-sm.webp"
  srcset="
    /images/article-sm.webp 400w,
    /images/article-md.webp 600w
  "
  sizes="(max-width: 1024px) 100vw, 400px"
  alt="Article title"
  loading="lazy"
  class="w-full h-full object-cover"
/>
```

### Sticky Positioning
- Use CSS `position: sticky` instead of JavaScript scroll listeners
- Set `will-change: transform` on sticky elements for better performance
- Limit sticky sidebar height to viewport height

```css
.sidebar-sticky {
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  will-change: transform;
}
```

---

## 9. DESIGN RATIONALE

### Why This Layout?
1. **66/33 Split:** Standard editorial layout that prioritizes content while maintaining strong sidebar presence
2. **Sticky Sidebar:** Keeps related content and navigation accessible during long articles
3. **Carousel vs Grid:** Saves vertical space while maintaining prominence of related content
4. **Tag Redesign:** Interactive, scannable, and maintains brutalist aesthetic

### Brutalist Principles Applied
1. **Thick Borders (4px):** Creates strong visual boundaries and hierarchy
2. **Maximum Contrast:** Black on white, orange accents for wayfinding
3. **Geometric Decorations:** Rotated squares, triangles add visual interest without clutter
4. **Typography:** All-caps, bold, wide tracking creates authoritative voice
5. **No Gradients/Shadows:** Flat design maintains brutalist purity
6. **Functional First:** Every element serves a purpose, no decoration for decoration's sake

### User Experience Decisions
1. **Carousel Navigation:** Multiple methods (arrows, dots, swipe) for accessibility
2. **Tag Hover States:** Clear feedback with orange background
3. **Sticky Positioning:** Reduces scrolling, keeps navigation accessible
4. **Mobile-First:** Single column on mobile prevents cramped sidebar
5. **Touch Targets:** Minimum 40x40px for buttons (carousel navigation)

---

## 10. IMPLEMENTATION CHECKLIST

### Phase 1: Structure
- [ ] Set up grid layout (2-col desktop, 1-col mobile)
- [ ] Create sidebar container with sticky positioning
- [ ] Add spacing system (gap-8, space-y-8)

### Phase 2: Related News Carousel
- [ ] Build carousel HTML structure
- [ ] Add carousel images with lazy loading
- [ ] Implement navigation buttons
- [ ] Create dot indicators
- [ ] Add JavaScript/Swiper functionality
- [ ] Test swipe gestures on mobile
- [ ] Verify keyboard navigation

### Phase 3: Keywords Section
- [ ] Choose design option (pills vs grid)
- [ ] Build tag components
- [ ] Add hover states
- [ ] Link to tag pages
- [ ] Test responsive wrapping

### Phase 4: Polish
- [ ] Add all brutalist decorative elements
- [ ] Verify all borders are correct thickness
- [ ] Test sticky positioning across browsers
- [ ] Add focus indicators for accessibility
- [ ] Test with screen reader
- [ ] Optimize images
- [ ] Add loading states

### Phase 5: Testing
- [ ] Desktop responsiveness (1024px - 1920px)
- [ ] Tablet behavior (768px - 1024px)
- [ ] Mobile layout (320px - 768px)
- [ ] Carousel functionality all browsers
- [ ] Keyboard navigation
- [ ] Touch gestures
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (aXe)

---

## 11. ALTERNATIVE VARIATIONS

### Variation A: Vertical Carousel with Thumbnails
Instead of dots, show mini thumbnails of all 3 articles with the active one highlighted.

### Variation B: Keywords as Cloud
Random sizes for tags based on popularity, maintaining brutalist borders.

### Variation C: Sidebar Tabs
Add tabs to sidebar: "Related" | "Popular" | "Latest" to show different content sets.

### Variation D: Fixed Sidebar with Scroll
Make sidebar independently scrollable if it exceeds viewport height.

---

## 12. TAILWIND CONFIG EXTENSIONS

Add these to your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'brutalist-orange': '#FFB22C',
        'brutalist-brown': '#854836',
        'brutalist-bg': '#F7F7F7',
        'brutalist-red': '#FF0000',
      },
      borderWidth: {
        '3': '3px',
      },
      letterSpacing: {
        'widest': '0.2em',
      },
      maxWidth: {
        'article': '800px',
        'sidebar': '400px',
      },
    },
  },
}
```

---

## FILES STRUCTURE

```
/components
  /article
    ArticleLayout.jsx          # Main layout wrapper
    ArticleSidebar.jsx          # Sidebar container
    RelatedNewsCarousel.jsx     # Carousel component
    KeywordsSection.jsx         # Tags component
  /ui
    BrutalistButton.jsx         # Reusable button
    BrutalistCard.jsx           # Reusable card wrapper
    CategoryBadge.jsx           # Category label
```

---

## NEXT STEPS

1. Review design specifications with development team
2. Choose keywords section variation (pills vs grid)
3. Decide on carousel implementation (vanilla JS vs Swiper)
4. Create component library for reusable brutalist elements
5. Build prototypes for user testing
6. Conduct A/B testing on tag interaction patterns

---

**End of Design Specification**

Questions or need clarification? Contact: Jarvis (UI/UX Designer)
