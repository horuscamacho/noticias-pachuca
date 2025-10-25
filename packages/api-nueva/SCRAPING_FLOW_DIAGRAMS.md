# Web Scraping Flow Diagrams
## Visual Reference for Understanding the System

**Date:** October 21, 2025
**Related Docs**: SCRAPING_ARCHITECTURE_ANALYSIS.md, ANTI_DETECTION_INTEGRATION_PLAN.md

---

## 1. Current Scraping Flow (Before Enhancement)

```
┌─────────────────────────────────────────────────────────────┐
│                  URL DISCOVERY SOURCES                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Facebook   │    │  News Site   │    │    Manual    │ │
│  │    Posts     │    │   Listings   │    │    Entry     │ │
│  │  (RapidAPI)  │    │  (Generator) │    │   (Admin)    │ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘ │
│         │                   │                    │          │
└─────────┼───────────────────┼────────────────────┼──────────┘
          │                   │                    │
          ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  URL DETECTION & STORAGE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UrlDetectionService          UrlExtractionService          │
│  ├─ Extract URLs from posts   ├─ Fetch listing pages        │
│  ├─ Domain categorization     ├─ Parse article links        │
│  └─ Store in ExternalUrl      └─ SHA-256 deduplication      │
│                                                              │
│  MongoDB Collections:                                        │
│  ├─ externalurls (manual config needed)                     │
│  └─ extractedurltrackings (generator-pro)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               CONFIGURATION MANAGEMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │  Noticias Config    │    │ Generator-Pro Config│        │
│  │  (Manual Selectors) │    │  (Auto Pipeline)    │        │
│  ├─────────────────────┤    ├─────────────────────┤        │
│  │ • Domain            │    │ • Base URL          │        │
│  │ • CSS Selectors     │    │ • Listing Selectors │        │
│  │ • Custom Headers    │    │ • Content Selectors │        │
│  │ • Rate Limits       │    │ • Frequencies       │        │
│  │ • Test Results      │    │ • AI Template       │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
│  Status: Active / Testing                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   BULL QUEUE SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Queue: noticias-extraction                                 │
│  ├─ Job Type: extract-noticia                               │
│  ├─ Priority: Normal                                        │
│  ├─ Retry: 3 attempts                                       │
│  └─ Concurrency: 5                                          │
│                                                              │
│  Queue: generator-pro-extraction                            │
│  ├─ Job Type: extract_urls, extract_content                │
│  ├─ Priority: High (fresh URLs)                             │
│  ├─ Retry: 5 attempts                                       │
│  └─ Concurrency: 10                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             SCRAPING EXECUTION (CURRENT)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NoticiasScrapingService / NewsWebsiteService               │
│                                                              │
│  Step 1: Cache Check                                        │
│  ├─ Generate SHA-256 key (url + selectors)                  │
│  ├─ Query Redis cache (30-min TTL)                          │
│  └─ If HIT → Return cached result                           │
│                                                              │
│  Step 2: Rate Limiting                                      │
│  ├─ Check domain rate limit (Redis counter)                 │
│  └─ Throw error if exceeded                                 │
│                                                              │
│  Step 3: Method Selection                                   │
│  ├─ If useJavaScript = false → Cheerio                      │
│  └─ If useJavaScript = true → Puppeteer                     │
│                                                              │
│  ┌───────────────────┐         ┌──────────────────┐        │
│  │  CHEERIO PATH     │         │  PUPPETEER PATH  │        │
│  ├───────────────────┤         ├──────────────────┤        │
│  │ 1. HTTP GET       │         │ 1. Browser Pool  │        │
│  │    (axios)        │         │    (max 5)       │        │
│  │ 2. Random UA      │         │ 2. Launch/Reuse  │        │
│  │ 3. Headers        │         │ 3. Random UA     │        │
│  │ 4. Timeout: 30s   │         │ 4. Block assets  │        │
│  │ 5. Parse HTML     │         │ 5. Render JS     │        │
│  │ 6. Extract data   │         │ 6. Extract HTML  │        │
│  │                   │         │ 7. Parse         │        │
│  └───────┬───────────┘         └─────┬────────────┘        │
│          │                           │                      │
│          └───────────┬───────────────┘                      │
│                      ▼                                       │
│  Step 4: Content Extraction                                 │
│  ├─ Title: $(selector).text()                               │
│  ├─ Content: $(selector).text() + cleaning                  │
│  ├─ Images: src, data-src, background-image                 │
│  ├─ Date: Parse to Date object                              │
│  ├─ Author, Categories, Tags                                │
│  └─ Keywords: Frequency analysis (stop words removed)       │
│                                                              │
│  Step 5: Quality Check                                      │
│  ├─ Title length (high/medium/low)                          │
│  ├─ Content length (min 100 chars)                          │
│  ├─ Completeness score (0-100)                              │
│  └─ Confidence score (0-100)                                │
│                                                              │
│  Current Anti-Detection:                                    │
│  ✅ User-Agent rotation (5 UAs, 2024 versions)              │
│  ✅ Rate limiting (domain-specific)                         │
│  ✅ Cache strategy (reduces requests)                       │
│  ✅ Random delays (configurable)                            │
│  ✅ Robots.txt respect (optional)                           │
│  ❌ No proxy rotation                                       │
│  ❌ No TLS fingerprinting fixes                             │
│  ❌ No advanced browser fingerprinting                      │
│  ❌ No CAPTCHA solving                                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA STORAGE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MongoDB: extractednoticias                                 │
│  ├─ sourceUrl, domain, title, content                       │
│  ├─ images[], author, categories[], tags[], keywords[]      │
│  ├─ extractedAt, status ('extracted')                       │
│  ├─ extractionMetadata (method, time, success)              │
│  ├─ qualityMetrics (completeness, confidence)               │
│  └─ rawData (full scraping result)                          │
│                                                              │
│  MongoDB: noticiasextractionlogs                            │
│  └─ Detailed logging for debugging                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 NEXT PIPELINE STAGES                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Generator-Pro Only:                                        │
│  ├─ AI Content Generation (OpenAI/Anthropic)                │
│  ├─ Multi-Platform Publishing                               │
│  │  ├─ Public Website                                       │
│  │  ├─ Facebook Pages                                       │
│  │  ├─ Twitter                                              │
│  │  └─ Mobile App Notifications                             │
│  └─ Analytics & Tracking                                    │
└─────────────────────────────────────────────────────────────┘

Current Success Rate: ~70%
Cloudflare Bypass: ~0%
Average Extraction Time: 5-10 seconds
```

---

## 2. Enhanced Scraping Flow (After Implementation)

```
┌─────────────────────────────────────────────────────────────┐
│                  URL DISCOVERY SOURCES                      │
│                    (UNCHANGED)                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            ENHANCED CONFIGURATION MANAGEMENT                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NEW: ScrapingConfig (Global Settings)                      │
│  ├─ Proxy tiers (datacenter/residential/mobile)             │
│  ├─ CAPTCHA solver credentials                              │
│  ├─ Rate limit strategies                                   │
│  ├─ Fallback chain configuration                            │
│  └─ Cost budgets & alerts                                   │
│                                                              │
│  Enhanced Domain Configs:                                   │
│  ├─ Anti-detection level (low/medium/high)                  │
│  ├─ Required proxy tier                                     │
│  ├─ CAPTCHA frequency estimate                              │
│  └─ Historical success rate tracking                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             ENHANCED BULL QUEUE SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NEW: Priority Queues                                       │
│  ├─ Priority 1 (High): Fresh URLs, time-sensitive           │
│  ├─ Priority 2 (Normal): Regular scraping                   │
│  ├─ Priority 3 (Low): Re-extraction, archive                │
│  └─ Priority 4 (Fallback): ScraperAPI queue                 │
│                                                              │
│  Enhanced Retry Strategy:                                   │
│  ├─ Attempt 1: Cheerio (no proxy)                           │
│  ├─ Attempt 2: Rebrowser + datacenter proxy                 │
│  ├─ Attempt 3: Crawlee + residential proxy                  │
│  ├─ Attempt 4: ScraperAPI (guaranteed success)              │
│  └─ Exponential backoff: 2s → 4s → 8s → 16s                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│        NEW: ADVANCED SCRAPING SERVICE (CORE)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Entry Point: AdvancedScrapingService.scrape()              │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  STEP 1: PRE-SCRAPING CHECKS                     │      │
│  ├──────────────────────────────────────────────────┤      │
│  │                                                   │      │
│  │  1.1 Rate Limiter Service                        │      │
│  │  ├─ Domain-specific limits (Bottleneck)          │      │
│  │  ├─ Adaptive backoff on failures                 │      │
│  │  └─ Queue if limit exceeded                      │      │
│  │                                                   │      │
│  │  1.2 Metrics Service Check                       │      │
│  │  ├─ Get domain success rate history              │      │
│  │  ├─ Identify protection type (Cloudflare/etc)    │      │
│  │  └─ Determine optimal method                     │      │
│  │                                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                               ▼                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  STEP 2: RESOURCE PREPARATION                    │      │
│  ├──────────────────────────────────────────────────┤      │
│  │                                                   │      │
│  │  2.1 Proxy Configuration Service                 │      │
│  │  ├─ Determine required tier (tiered escalation)  │      │
│  │  │  ├─ Check domain failure history              │      │
│  │  │  ├─ Start: datacenter (cheap)                 │      │
│  │  │  ├─ Escalate: residential (blocked)           │      │
│  │  │  └─ Max: mobile (heavy protection)            │      │
│  │  ├─ Round-robin with health checks               │      │
│  │  └─ Track proxy performance metrics              │      │
│  │                                                   │      │
│  │  2.2 Fingerprint Generator Service               │      │
│  │  ├─ Generate realistic browser fingerprint       │      │
│  │  │  ├─ User-Agent (Chrome 131 / Firefox 133)     │      │
│  │  │  ├─ Sec-CH-UA Client Hints (2025 standard)    │      │
│  │  │  ├─ Platform, viewport, screen resolution     │      │
│  │  │  ├─ WebGL renderer, Canvas fingerprint        │      │
│  │  │  └─ Timezone, language, plugins               │      │
│  │  └─ Rotate fingerprints (hourly)                 │      │
│  │                                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                               ▼                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  STEP 3: SCRAPING EXECUTION (FALLBACK CHAIN)    │      │
│  ├──────────────────────────────────────────────────┤      │
│  │                                                   │      │
│  │  ┌─────────────────────────────────────────┐    │      │
│  │  │  METHOD 1: CHEERIO (Static HTML)        │    │      │
│  │  ├─────────────────────────────────────────┤    │      │
│  │  │  Cost: $0                                │    │      │
│  │  │  Speed: 0.5-1 second                     │    │      │
│  │  │  Success Rate: 90% (simple sites)        │    │      │
│  │  │                                          │    │      │
│  │  │  • HTTP GET with axios                   │    │      │
│  │  │  • Connection pooling (100 sockets)      │    │      │
│  │  │  • Modern User-Agent (2025)              │    │      │
│  │  │  • Sec-CH-UA headers                     │    │      │
│  │  │  • Optional proxy                        │    │      │
│  │  │  • Parse with cheerio                    │    │      │
│  │  └─────────────────────────────────────────┘    │      │
│  │         │                                        │      │
│  │         │ FAIL (403/429/timeout)                 │      │
│  │         ▼                                        │      │
│  │  ┌─────────────────────────────────────────┐    │      │
│  │  │  METHOD 2: REBROWSER (Cloudflare Bypass)│    │      │
│  │  ├─────────────────────────────────────────┤    │      │
│  │  │  Cost: ~$0.001 (proxy)                   │    │      │
│  │  │  Speed: 3-5 seconds                      │    │      │
│  │  │  Success Rate: 85% (Cloudflare sites)    │    │      │
│  │  │                                          │    │      │
│  │  │  • rebrowser-puppeteer-core              │    │      │
│  │  │  • Patches Runtime.Enable CDP leak       │    │      │
│  │  │  • Residential/datacenter proxy          │    │      │
│  │  │  • Apply fingerprint to page             │    │      │
│  │  │  • Modern headers (Sec-CH-UA)            │    │      │
│  │  │  • Human-like delays (1-3 seconds)       │    │      │
│  │  │  • CAPTCHA detection & solving           │    │      │
│  │  │  • Extract rendered HTML                 │    │      │
│  │  └─────────────────────────────────────────┘    │      │
│  │         │                                        │      │
│  │         │ FAIL (CAPTCHA unsolved/DataDome)       │      │
│  │         ▼                                        │      │
│  │  ┌─────────────────────────────────────────┐    │      │
│  │  │  METHOD 3: CRAWLEE (Max Automation)     │    │      │
│  │  ├─────────────────────────────────────────┤    │      │
│  │  │  Cost: ~$0.002 (premium proxy)           │    │      │
│  │  │  Speed: 4-6 seconds                      │    │      │
│  │  │  Success Rate: 88% (most sites)          │    │      │
│  │  │                                          │    │      │
│  │  │  • PlaywrightCrawler / PuppeteerCrawler  │    │      │
│  │  │  • Built-in anti-detection               │    │      │
│  │  │  • Auto-fingerprint generation           │    │      │
│  │  │  • Residential proxy                     │    │      │
│  │  │  • Smart retry logic                     │    │      │
│  │  │  • Session management                    │    │      │
│  │  └─────────────────────────────────────────┘    │      │
│  │         │                                        │      │
│  │         │ FAIL (DataDome/PerimeterX)             │      │
│  │         ▼                                        │      │
│  │  ┌─────────────────────────────────────────┐    │      │
│  │  │  METHOD 4: SCRAPERAPI (Guaranteed)      │    │      │
│  │  ├─────────────────────────────────────────┤    │      │
│  │  │  Cost: $0.01 per request                 │    │      │
│  │  │  Speed: 5-10 seconds                     │    │      │
│  │  │  Success Rate: 99% (all sites)           │    │      │
│  │  │                                          │    │      │
│  │  │  • Commercial API fallback               │    │      │
│  │  │  • Managed proxy pool                    │    │      │
│  │  │  • Auto-CAPTCHA solving                  │    │      │
│  │  │  • JavaScript rendering                  │    │      │
│  │  │  • Guaranteed success (SLA-backed)       │    │      │
│  │  └─────────────────────────────────────────┘    │      │
│  │                                                  │      │
│  └──────────────────────────────────────────────────┘      │
│                               ▼                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  STEP 4: CAPTCHA HANDLING (IF ENCOUNTERED)      │      │
│  ├──────────────────────────────────────────────────┤      │
│  │                                                   │      │
│  │  4.1 CAPTCHA Solver Service                      │      │
│  │  ├─ Detect CAPTCHA type                          │      │
│  │  │  ├─ reCAPTCHA v2/v3                           │      │
│  │  │  ├─ hCaptcha                                  │      │
│  │  │  ├─ Cloudflare Turnstile                      │      │
│  │  │  └─ DataDome                                  │      │
│  │  ├─ Solve with service (2Captcha/NoCaptchaAI)    │      │
│  │  ├─ Inject solution into page                    │      │
│  │  └─ Track cost & success rate                    │      │
│  │                                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                               ▼                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  STEP 5: CONTENT EXTRACTION & QUALITY CHECK      │      │
│  │              (SAME AS CURRENT)                    │      │
│  └──────────────────────────────────────────────────┘      │
│                               ▼                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  STEP 6: METRICS & COST TRACKING                │      │
│  ├──────────────────────────────────────────────────┤      │
│  │                                                   │      │
│  │  6.1 Scraping Metrics Service                    │      │
│  │  ├─ Record success/failure                       │      │
│  │  ├─ Track method used                            │      │
│  │  ├─ Log processing time                          │      │
│  │  ├─ Identify block reason                        │      │
│  │  │  ├─ Cloudflare challenge                      │      │
│  │  │  ├─ DataDome block                            │      │
│  │  │  ├─ CAPTCHA encountered                       │      │
│  │  │  └─ Rate limit / timeout                      │      │
│  │  └─ Update domain protection profile             │      │
│  │                                                   │      │
│  │  6.2 Cost Tracking                               │      │
│  │  ├─ Proxy usage ($0.001-0.01 per request)        │      │
│  │  ├─ CAPTCHA solving ($0.50-1.00 per solve)       │      │
│  │  ├─ ScraperAPI calls ($0.01 per request)         │      │
│  │  └─ Alert if monthly budget exceeded             │      │
│  │                                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              ENHANCED DATA STORAGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MongoDB: extractednoticias (EXTENDED)                      │
│  └─ NEW: extractionMetadata                                 │
│     ├─ blockedByCloudflare: boolean                         │
│     ├─ blockedByDataDome: boolean                           │
│     ├─ captchaEncountered: boolean                          │
│     ├─ captchaSolved: boolean                               │
│     ├─ proxyUsed: string                                    │
│     ├─ proxyType: 'datacenter' | 'residential' | 'mobile'   │
│     ├─ scrapeAttempts: number                               │
│     └─ totalCost: number (USD)                              │
│                                                              │
│  NEW MongoDB: proxyusagelogs                                │
│  ├─ proxyUrl, targetDomain, success, responseTime           │
│  └─ Used for proxy health monitoring                        │
│                                                              │
│  NEW MongoDB: captchaencounters                             │
│  ├─ url, captchaType, solvingMethod, cost                   │
│  └─ Used for cost optimization                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             MONITORING & ALERTING DASHBOARD                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Real-Time Metrics:                                         │
│  ├─ Overall success rate: 92.5% ✅                          │
│  ├─ Cloudflare bypass rate: 87.3% ✅                        │
│  ├─ Average extraction time: 3.2 seconds                    │
│  ├─ Cost this month: $87.45 / $150 budget                   │
│  │                                                           │
│  │  Breakdown:                                              │
│  │  ├─ Proxies: $45.20                                      │
│  │  ├─ CAPTCHA: $28.15                                      │
│  │  └─ ScraperAPI: $14.10                                   │
│  │                                                           │
│  └─ Active proxies: 23/25 healthy                           │
│                                                              │
│  Alerts:                                                    │
│  ├─ Domain failure spike: ejemplo.com (>50% fail) 🔴        │
│  ├─ Proxy pool low: datacenter tier (2 healthy) ⚠️          │
│  └─ Budget warning: 58% of monthly limit used 🟡            │
└─────────────────────────────────────────────────────────────┘

Enhanced Success Rate: ~92%
Cloudflare Bypass: ~87%
Average Extraction Time: 3-5 seconds
Monthly Cost: $50-150 (mid-range)
```

---

## 3. Proxy Tier Escalation Flow

```
┌─────────────────────────────────────────────────────────────┐
│             ADAPTIVE PROXY TIER ESCALATION                  │
└─────────────────────────────────────────────────────────────┘

START: New URL to scrape
  │
  ▼
┌─────────────────────────────────────────┐
│  Check Domain History                   │
├─────────────────────────────────────────┤
│  Query: DomainMetrics (last 30 days)    │
│  ├─ Total attempts                      │
│  ├─ Success rate                        │
│  ├─ Block patterns                      │
│  │  ├─ Cloudflare blocks                │
│  │  ├─ DataDome blocks                  │
│  │  ├─ CAPTCHA frequency                │
│  │  └─ Rate limit hits                  │
│  └─ Last successful proxy tier          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │  Decision Tree  │
         └────────┬────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │ Tier 0 │ │ Tier 1 │ │ Tier 2 │ ┌────────┐
   │  NONE  │ │  DATA  │ │  RESI  │ │ Tier 3 │
   │        │ │ CENTER │ │DENTIAL │ │ MOBILE │
   └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
        │          │          │          │
        ▼          ▼          ▼          ▼

┌─────────────────────────────────────────────────────────────┐
│  TIER 0: NO PROXY (Free)                                    │
├─────────────────────────────────────────────────────────────┤
│  Conditions:                                                 │
│  ├─ Success rate > 85%                                       │
│  ├─ No protection detected                                   │
│  └─ Simple news/blog sites                                   │
│                                                              │
│  Cost: $0                                                    │
│  Success Rate: 90%+                                          │
│  Speed: Fastest (0.5-1s)                                     │
│                                                              │
│  ✅ Use For:                                                 │
│  ├─ Local news sites                                         │
│  ├─ Blogs                                                    │
│  ├─ Government sites                                         │
│  └─ Academic sites                                           │
└─────────────────────────────────────────────────────────────┘
        │
        │ FAIL (403/429)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 1: DATACENTER PROXIES (Cheap)                         │
├─────────────────────────────────────────────────────────────┤
│  Conditions:                                                 │
│  ├─ Tier 0 failed OR                                         │
│  ├─ Success rate 50-85% OR                                   │
│  ├─ Light rate limiting detected                             │
│  └─ Moderate traffic sites                                   │
│                                                              │
│  Cost: $0.001 per request (~$1/1000)                         │
│  Success Rate: 75-85%                                        │
│  Speed: Fast (1-2s)                                          │
│                                                              │
│  ✅ Use For:                                                 │
│  ├─ E-commerce sites (Amazon, eBay)                          │
│  ├─ News aggregators                                         │
│  ├─ Job boards                                               │
│  └─ Review sites                                             │
│                                                              │
│  Proxy Pool:                                                 │
│  ├─ ProxyWing datacenter ($1.05/month unlimited)             │
│  ├─ Webshare datacenter (10 free proxies)                    │
│  └─ Smartproxy datacenter ($0.70/GB)                         │
└─────────────────────────────────────────────────────────────┘
        │
        │ FAIL (Cloudflare/DataDome)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: RESIDENTIAL PROXIES (Recommended)                  │
├─────────────────────────────────────────────────────────────┤
│  Conditions:                                                 │
│  ├─ Tier 1 failed OR                                         │
│  ├─ Cloudflare challenge detected OR                         │
│  ├─ Success rate < 50% OR                                    │
│  ├─ CAPTCHA encountered frequently                           │
│  └─ Protected sites                                          │
│                                                              │
│  Cost: $0.003-0.005 per request (~$3-5/1000)                 │
│  Success Rate: 85-95%                                        │
│  Speed: Moderate (3-5s)                                      │
│                                                              │
│  ✅ Use For:                                                 │
│  ├─ Social media (Facebook, Twitter)                         │
│  ├─ Cloudflare-protected sites                               │
│  ├─ Travel booking sites                                     │
│  ├─ Sneaker/ticket sites                                     │
│  └─ Financial data sites                                     │
│                                                              │
│  Proxy Pool:                                                 │
│  ├─ ProxyWing residential ($2.50/GB)                         │
│  ├─ Smartproxy residential ($3.50/GB)                        │
│  └─ IPRoyal residential ($2.80/GB)                           │
└─────────────────────────────────────────────────────────────┘
        │
        │ FAIL (DataDome/PerimeterX)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 3: MOBILE PROXIES (Premium)                           │
├─────────────────────────────────────────────────────────────┤
│  Conditions:                                                 │
│  ├─ Tier 2 failed OR                                         │
│  ├─ DataDome/PerimeterX detected OR                          │
│  ├─ Success rate < 30% OR                                    │
│  ├─ Banking/high-security sites                              │
│  └─ Last resort before ScraperAPI                            │
│                                                              │
│  Cost: $0.01-0.02 per request (~$10-20/1000)                 │
│  Success Rate: 95-99%                                        │
│  Speed: Slow (5-10s)                                         │
│                                                              │
│  ✅ Use For:                                                 │
│  ├─ Banking/financial sites                                  │
│  ├─ DataDome-protected sites                                 │
│  ├─ PerimeterX-protected sites                               │
│  ├─ Government verification                                  │
│  └─ High-value target scraping                               │
│                                                              │
│  Proxy Pool:                                                 │
│  ├─ Smartproxy mobile ($8/GB)                                │
│  ├─ Bright Data mobile ($24/GB)                              │
│  └─ Oxylabs mobile ($22/GB)                                  │
└─────────────────────────────────────────────────────────────┘
        │
        │ FAIL (Absolute last resort)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  FALLBACK: SCRAPERAPI (Guaranteed)                          │
├─────────────────────────────────────────────────────────────┤
│  Cost: $0.01 per request (100,000 credits for $49/month)    │
│  Success Rate: 99%+                                          │
│  Speed: Variable (5-15s)                                     │
│                                                              │
│  ✅ Features:                                                │
│  ├─ Automatic proxy rotation                                │
│  ├─ CAPTCHA solving included                                │
│  ├─ JavaScript rendering                                    │
│  ├─ Geo-targeting                                            │
│  └─ SLA-backed success guarantee                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               ADAPTIVE LEARNING SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  After Each Scraping Attempt:                               │
│  ├─ Record: Domain, Tier Used, Success/Fail, Time, Cost     │
│  ├─ Update: Domain success rate by tier                     │
│  ├─ Learn: Optimal tier for each domain                     │
│  └─ Adjust: Future tier selection for domain                │
│                                                              │
│  Example Learning:                                          │
│  Domain: cloudflare-protected-site.com                      │
│  ├─ Week 1: Tier 0 → 10% success → Escalate to Tier 1      │
│  ├─ Week 2: Tier 1 → 40% success → Escalate to Tier 2      │
│  ├─ Week 3: Tier 2 → 92% success → Lock to Tier 2          │
│  └─ Week 4+: Always start at Tier 2 for this domain        │
│                                                              │
│  Cost Optimization:                                         │
│  ├─ Track: Cost per successful extraction                   │
│  ├─ Compare: Tier costs vs ScraperAPI                       │
│  ├─ Decision: If Tier 2 fails > 70%, use ScraperAPI        │
│  └─ Blacklist: Domains with cost > $0.05/extraction         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. CAPTCHA Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  CAPTCHA DETECTION & SOLVING                │
└─────────────────────────────────────────────────────────────┘

During Scraping (After Page Load):
  │
  ▼
┌─────────────────────────────────────────┐
│  CAPTCHA Detection                      │
├─────────────────────────────────────────┤
│  Check for selectors:                   │
│  ├─ iframe[src*="recaptcha"]            │
│  ├─ iframe[src*="hcaptcha"]             │
│  ├─ .cf-turnstile                       │
│  ├─ #captcha-container                  │
│  └─ .g-recaptcha                        │
│                                         │
│  OR check page content:                 │
│  ├─ "Verify you are human"              │
│  ├─ "Complete the CAPTCHA"              │
│  └─ "Click to continue"                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
        ┌─────────┴─────────┐
        │  CAPTCHA Found?   │
        └─────────┬─────────┘
                  │
         ┌────────┼────────┐
         │                 │
        YES               NO
         │                 │
         ▼                 ▼
  ┌──────────────┐    ┌──────────────┐
  │ Identify Type│    │   Continue   │
  └──────┬───────┘    │  Scraping    │
         │            └──────────────┘
         ▼
┌─────────────────────────────────────────┐
│  CAPTCHA Type Identification            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  reCAPTCHA v2 (Image Selection) │   │
│  ├─────────────────────────────────┤   │
│  │  Solve Method: 2Captcha          │   │
│  │  Cost: $1.00 per 1000            │   │
│  │  Time: 9-15 seconds              │   │
│  │  Success Rate: 99%               │   │
│  └─────────────────────────────────┘   │
│         │                                │
│         ▼                                │
│  ┌─────────────────────────────────┐   │
│  │  reCAPTCHA v3 (Invisible)       │   │
│  ├─────────────────────────────────┤   │
│  │  Solve Method: NoCaptchaAI       │   │
│  │  Cost: $0.14 per 1000            │   │
│  │  Time: 2-5 seconds               │   │
│  │  Success Rate: 95%               │   │
│  └─────────────────────────────────┘   │
│         │                                │
│         ▼                                │
│  ┌─────────────────────────────────┐   │
│  │  hCaptcha                       │   │
│  ├─────────────────────────────────┤   │
│  │  Solve Method: 2Captcha          │   │
│  │  Cost: $1.00 per 1000            │   │
│  │  Time: 10-20 seconds             │   │
│  │  Success Rate: 98%               │   │
│  └─────────────────────────────────┘   │
│         │                                │
│         ▼                                │
│  ┌─────────────────────────────────┐   │
│  │  Cloudflare Turnstile           │   │
│  ├─────────────────────────────────┤   │
│  │  Solve Method: Rebrowser Auto    │   │
│  │  Cost: $0 (built-in)             │   │
│  │  Time: 3-8 seconds               │   │
│  │  Success Rate: 80%               │   │
│  └─────────────────────────────────┘   │
│         │                                │
│         ▼                                │
│  ┌─────────────────────────────────┐   │
│  │  DataDome CAPTCHA               │   │
│  ├─────────────────────────────────┤   │
│  │  Solve Method: ScraperAPI        │   │
│  │  Cost: $0.01 (API call)          │   │
│  │  Time: 5-15 seconds              │   │
│  │  Success Rate: 95%               │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  CAPTCHA Solving Process                │
├─────────────────────────────────────────┤
│                                         │
│  Step 1: Extract CAPTCHA Parameters     │
│  ├─ Site key (for reCAPTCHA/hCaptcha)   │
│  ├─ Page URL                            │
│  ├─ Action (for reCAPTCHA v3)           │
│  └─ s-token (for DataDome)              │
│                                         │
│  Step 2: Submit to Solving Service      │
│  ├─ API call to 2Captcha/NoCaptchaAI    │
│  ├─ Wait for task ID                    │
│  └─ Poll for solution (every 2-5 sec)   │
│                                         │
│  Step 3: Inject Solution                │
│  ├─ Locate response field in page       │
│  ├─ Execute JavaScript injection         │
│  │  Example:                             │
│  │  document.getElementById(             │
│  │    'g-recaptcha-response'             │
│  │  ).innerHTML = 'TOKEN_HERE';          │
│  └─ Submit form / trigger callback       │
│                                         │
│  Step 4: Verify Success                 │
│  ├─ Wait for page change                │
│  ├─ Check for CAPTCHA removal            │
│  └─ Verify content is accessible         │
│                                         │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │  Solved?          │
        └─────────┬─────────┘
                  │
         ┌────────┼────────┐
         │                 │
        YES               NO
         │                 │
         ▼                 ▼
  ┌──────────────┐    ┌──────────────┐
  │  Continue    │    │  Retry (Max  │
  │  Scraping    │    │  3 Attempts) │
  └──────────────┘    └──────┬───────┘
                             │
                             │ All retries failed
                             ▼
                      ┌──────────────┐
                      │  Escalate    │
                      │  to Tier 3   │
                      │  Proxy or    │
                      │  ScraperAPI  │
                      └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CAPTCHA COST OPTIMIZATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Strategy 1: Avoid CAPTCHAs Proactively                     │
│  ├─ Use residential/mobile proxies                          │
│  ├─ Implement realistic delays                              │
│  ├─ Rotate fingerprints                                     │
│  └─ Cache results longer (reduce requests)                  │
│                                                              │
│  Strategy 2: Choose Cheapest Solver                         │
│  ├─ reCAPTCHA v3: NoCaptchaAI ($0.14/1000)                  │
│  ├─ reCAPTCHA v2: 2Captcha ($1.00/1000)                     │
│  └─ Cloudflare Turnstile: Rebrowser (free)                  │
│                                                              │
│  Strategy 3: Blacklist High-CAPTCHA Sites                   │
│  ├─ Track: CAPTCHA frequency per domain                     │
│  ├─ If > 80%: Use ScraperAPI directly                       │
│  └─ Avoid wasting money on solving                          │
│                                                              │
│  Strategy 4: Budget Alerts                                  │
│  ├─ Monthly CAPTCHA budget: $30                             │
│  ├─ Alert at 70% usage ($21)                                │
│  └─ Pause non-critical scraping if exceeded                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Monitoring & Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│          SCRAPING METRICS DASHBOARD (Real-Time)             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│  OVERALL SUCCESS METRICS     │   COST TRACKING              │
├──────────────────────────────┼──────────────────────────────┤
│                              │                              │
│  Overall Success Rate: 92.5% │  This Month: $87.45          │
│  ████████████████████░░░░    │  Budget: $150.00             │
│                              │  ██████████████░░░░░ 58%     │
│  Last 24 Hours: 89.2%        │                              │
│  Last 7 Days: 87.8%          │  Breakdown:                  │
│  Last 30 Days: 91.3%         │  ├─ Proxies: $45.20 (52%)    │
│                              │  ├─ CAPTCHA: $28.15 (32%)    │
│  Total Requests: 125,430     │  └─ ScraperAPI: $14.10 (16%) │
│  ├─ Successful: 116,024      │                              │
│  ├─ Failed: 8,206            │  Projected Monthly: $142.50  │
│  └─ In Queue: 1,200          │  ⚠️ On track for budget      │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SUCCESS RATE BY METHOD                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cheerio (Static):     92.1%  ████████████████████░░  78,234│
│  Rebrowser (CF):       85.7%  █████████████████░░░░  28,456 │
│  Crawlee (Advanced):   88.3%  █████████████████░░░  15,123  │
│  ScraperAPI (Fallback): 99.1% ███████████████████░   3,617  │
│                                                              │
│  Average Extraction Time: 3.2 seconds                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TOP DOMAINS BY VOLUME                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ejemplo.com           15,234 req    95.2% success  ✅   │
│  2. news-site.com         12,456 req    89.7% success  ✅   │
│  3. cloudflare-site.com    8,123 req    65.3% success  ⚠️   │
│  4. datadome-site.com      5,678 req    42.1% success  🔴   │
│  5. protected.com          3,456 req    78.4% success  🟡   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PROTECTION DETECTION (Last 7 Days)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cloudflare Challenges:  2,345  (87.3% bypassed)            │
│  DataDome Blocks:          456  (42.1% bypassed)            │
│  reCAPTCHA Encountered:    234  (95.7% solved)              │
│  hCaptcha Encountered:      89  (98.9% solved)              │
│  Rate Limit 429:           123  (100% retried)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PROXY HEALTH STATUS                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Datacenter Proxies:     8/10 healthy (80%)                 │
│  ├─ Average success: 85.3%                                  │
│  ├─ Average latency: 245ms                                  │
│  └─ Unhealthy: proxy7.com, proxy10.com                      │
│                                                              │
│  Residential Proxies:    4/5 healthy (80%)                  │
│  ├─ Average success: 92.7%                                  │
│  ├─ Average latency: 567ms                                  │
│  └─ Unhealthy: residential3.com                             │
│                                                              │
│  Mobile Proxies:         2/2 healthy (100%)                 │
│  ├─ Average success: 97.1%                                  │
│  └─ Average latency: 1,234ms                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ACTIVE ALERTS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔴 CRITICAL: datadome-site.com failure rate > 50%          │
│     Action: Switch to ScraperAPI for this domain            │
│                                                              │
│  ⚠️ WARNING: Proxy pool low (datacenter tier: 2 healthy)    │
│     Action: Add more datacenter proxies or disable sick ones│
│                                                              │
│  🟡 INFO: Budget at 58% of monthly limit                    │
│     Projected: $142.50 / $150 budget                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COST PER SUCCESSFUL EXTRACTION (by tier)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  No Proxy (Tier 0):       $0.000  (cheapest)                │
│  Datacenter (Tier 1):     $0.001                            │
│  Residential (Tier 2):    $0.004                            │
│  Mobile (Tier 3):         $0.012                            │
│  ScraperAPI (Fallback):   $0.010  (guaranteed success)      │
│                                                              │
│  Overall Average: $0.0015 per successful extraction         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  RECENT FAILURES (Last Hour)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  14:23 | cloudflare-site.com/article-123                    │
│         Cloudflare Challenge Failed (Tier 1)                │
│         Action: Escalated to Tier 2 (residential)           │
│                                                              │
│  14:18 | datadome-site.com/news-456                         │
│         DataDome Block (Tier 2)                             │
│         Action: Switched to ScraperAPI                      │
│                                                              │
│  14:12 | protected.com/page-789                             │
│         CAPTCHA Solve Timeout (2Captcha)                    │
│         Action: Retrying with NoCaptchaAI                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**End of Diagrams Document**

**Usage**: Reference these diagrams when implementing the anti-detection system to understand the complete flow and decision points.

**Related Documents**:
- Full analysis: `SCRAPING_ARCHITECTURE_ANALYSIS.md`
- Implementation plan: `ANTI_DETECTION_INTEGRATION_PLAN.md`
- Research: `/rotation_scraper_for_escape_blockers.md`
