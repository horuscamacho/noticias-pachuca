# Web Scraping Anti-Detection & Proxy Rotation Guide (2025-2026)
## Comprehensive Research for NestJS Backend Applications

**Last Updated:** October 21, 2025
**Research Compiled By:** Technical Research Agent
**Target:** Modern web scraping techniques to avoid bot detection in 2025-2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Proxy Solutions](#proxy-solutions)
3. [DNS-Based Solutions](#dns-based-solutions)
4. [Modern Anti-Detection Techniques](#modern-anti-detection-techniques)
5. [NestJS Integration](#nestjs-integration)
6. [Rate Limiting & Request Management](#rate-limiting--request-management)
7. [Cost Analysis](#cost-analysis)
8. [Implementation Recommendations](#implementation-recommendations)
9. [Code Examples](#code-examples)
10. [Resources & Tools](#resources--tools)

---

## Executive Summary

### Key Findings (2025-2026)

**Current State of Bot Detection:**
- Modern anti-bot systems (Cloudflare, DataDome, PerimeterX) have become significantly more sophisticated
- Traditional approaches like basic User-Agent rotation and simple proxy usage are no longer sufficient
- TLS fingerprinting, browser fingerprinting, and behavioral analysis are now standard
- Open-source stealth plugins (puppeteer-stealth) struggle with advanced protection in 2025

**Most Effective Approaches:**
1. **Crawlee Framework** - Best all-in-one solution with built-in anti-detection (15.7k GitHub stars)
2. **Rebrowser-Patches** - Successfully bypasses Cloudflare/DataDome as of 2025
3. **Commercial APIs** - ScraperAPI, ZenRows offer highest success rates for heavily protected sites
4. **Tiered Proxy Strategy** - Start free, escalate to residential proxies when blocked

**Cost-Effective Solutions for Budget-Conscious Implementation:**
- Free tier: Webshare (10 rotating datacenter proxies forever free)
- Budget proxies: ProxyWing ($1.05/month datacenter, $2.50/GB residential)
- Budget CAPTCHA: NoCaptchaAI ($0.14/1000), 2Captcha ($0.50/1000)
- Open-source: Crawlee + rebrowser-patches + free proxy rotation

---

## Proxy Solutions

### 1. Proxy Types Comparison

| Type | Success Rate | Cost | Speed | Detection Risk | Best For |
|------|-------------|------|-------|----------------|----------|
| **Datacenter Proxies** | Moderate | Low ($0.65-$1/GB) | Very Fast | High | Low-security sites, API scraping |
| **Residential Proxies** | High | Medium ($2.50-$10/GB) | Moderate | Low | E-commerce, social media |
| **ISP Proxies** | Very High | High ($9-$17/GB) | Fast | Very Low | Banking, high-security sites |
| **Mobile Proxies** | Highest | Highest ($8-$24/GB) | Slow | Extremely Low | Social media, mobile apps |

### 2. Cost-Effective Proxy Providers (2025)

#### FREE Options

**Webshare** [Citation: [1](#ref1)]
- **Free Plan:** 10 rotating datacenter proxies (forever free)
- **Paid Plans:** Start at reasonable rates
- **Best For:** Testing and small-scale projects
- **URL:** https://www.webshare.io

**Free Proxy Lists (GitHub - Updated Daily)** [Citation: [2](#ref2)]
- **proxifly/free-proxy-list:** 3,062 working proxies from 92 countries (updated every 5 min)
- **vakhov/fresh-proxy-list:** HTTP/HTTPS/SOCKS4/SOCKS5 (updated every 5-20 min)
- **TheSpeedX/PROXY-List:** 44,119 total proxies (updated daily)
- **monosans/proxy-list:** With geolocation info (updated hourly)
- **WARNING:** Free proxies are unreliable, slow, and often blocked. Not suitable for production.

#### BUDGET-FRIENDLY Options ($1-$5/month)

**1. ProxyWing** [Citation: [3](#ref3)]
- **Datacenter:** $1.05/month
- **Residential:** $2.50/GB
- **ISP:** $1.80/month with unlimited 1Gb/s+ speed
- **Best For:** Budget-conscious developers starting out

**2. Smartproxy/Decodo** [Citation: [4](#ref4)]
- **Residential:** $3.50-$4/GB (most affordable among premium)
- **Datacenter:** $0.70/GB
- **Mobile:** $8/GB
- **Best For:** Small to medium-scale scraping

**3. IPRoyal** [Citation: [3](#ref3)]
- **Pricing:** One of the lowest in the market
- **Flexible Plans:** Entry-level friendly
- **Best For:** Budget-conscious beginners

#### MID-RANGE Options ($50-$200/month)

**4. ScraperAPI** [Citation: [5](#ref5)]
- **Starting Price:** $49/month (100,000 API credits)
- **Enterprise:** $299/month (3,000,000 credits)
- **Features:** Automatic proxy rotation, JS rendering, CAPTCHA solving
- **Flat Pricing:** No cost jump for advanced features
- **Best For:** Production scraping without infrastructure management

**5. Bright Data** [Citation: [4](#ref4)]
- **Residential:** $8.40-$10.50/GB (pay-as-you-go), $5.04/GB (micro-package)
- **Datacenter:** $0.11/GB + $0.80 per IP (pay-as-you-go)
- **Mobile:** $24/GB (pay-as-you-go)
- **Best For:** Enterprise-scale operations

**6. Oxylabs** [Citation: [4](#ref4)]
- **Residential:** $10/GB (pay-as-you-go), $0.65/GB (rotating)
- **Datacenter:** Starting $50/month for 77GB
- **Mobile:** $22/GB
- **Best For:** Large-scale professional scraping

### 3. Proxy Rotation Strategies

#### Round-Robin Rotation
```typescript
const proxies = [
  'http://proxy1.com:8080',
  'http://proxy2.com:8080',
  'http://proxy3.com:8080'
];

let currentIndex = 0;

function getNextProxy() {
  const proxy = proxies[currentIndex];
  currentIndex = (currentIndex + 1) % proxies.length;
  return proxy;
}
```

#### Random Selection
```typescript
function getRandomProxy(proxies: string[]) {
  return proxies[Math.floor(Math.random() * proxies.length)];
}
```

#### Session-Based (Sticky Sessions)
```typescript
const sessionProxies = new Map<string, string>();

function getProxyForSession(sessionId: string, proxyPool: string[]) {
  if (!sessionProxies.has(sessionId)) {
    sessionProxies.set(sessionId, getRandomProxy(proxyPool));
  }
  return sessionProxies.get(sessionId);
}
```

#### Tiered Escalation (Crawlee Approach) [Citation: [6](#ref6)]
```typescript
// Start with no proxy, escalate to better proxies when blocked
const proxyConfiguration = new ProxyConfiguration({
  tieredProxyUrls: [
    null,  // No proxy first
    'http://cheap-datacenter-proxy.com:8080',
    'http://residential-proxy.com:8080',
    'http://premium-mobile-proxy.com:8080'
  ]
});
```

---

## DNS-Based Solutions

### Smart DNS Services [Citation: [7](#ref7)]

**What is Smart DNS:**
- Replaces DNS address to simulate device location elsewhere
- Does NOT hide/change IP address (unlike VPN)
- Faster than VPN (no encryption overhead)
- Less expensive than VPN

**Limitations for Scraping:**
- Doesn't hide IP address (limited anti-bot value)
- Primarily for geo-restriction bypass
- Not suitable as primary anti-detection method

**When to Use:**
- Bypassing geo-blocking for content access
- Combined with proxy rotation for location spoofing
- Accessing region-specific content

**Recommended Approach:**
- Combine Smart DNS with IP rotation via proxies
- Use residential proxies with geo-targeting instead

---

## Modern Anti-Detection Techniques (2025-2026)

### 1. Browser Fingerprinting Evasion

#### Current State [Citation: [8](#ref8)]
Modern anti-bot systems analyze 200+ browser properties:
- **TLS Fingerprinting:** JA3/JA4 signatures
- **Canvas Fingerprinting:** GPU rendering signatures
- **WebGL Fingerprinting:** Graphics card metadata
- **Audio Context:** Audio processing signatures
- **Font Fingerprinting:** Installed font detection
- **HTTP/2 Frame Order:** Protocol-level patterns
- **Chrome Runtime:** Automation indicators
- **Sec-CH-UA Headers:** Client Hints analysis

#### Solutions (2025)

**A. Rebrowser-Patches** [Citation: [9](#ref9)] ⭐ RECOMMENDED
```bash
# Installation
npm install rebrowser-puppeteer-core
# or
npx rebrowser-patches@latest patch --packageName puppeteer-core
```

**Features:**
- Fixes Runtime.Enable CDP leak (primary detection vector)
- Patches SourceURL identifiers
- Modifies utility world naming
- **Status:** Undetectable by Cloudflare/DataDome as of 2025
- **Tested Versions:** Puppeteer 24.8.1 (May 2025), Playwright 1.52.0 (April 2025)

**Configuration:**
```typescript
// Environment variables for fine-tuning
process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'addBinding'; // or 'alwaysIsolated' or 'enableDisable'
process.env.REBROWSER_PATCHES_SOURCE_URL = 'app.js'; // or '0' to disable
process.env.REBROWSER_PATCHES_DEBUG = '1'; // Enable logging
```

**B. Puppeteer-Real-Browser** [Citation: [10](#ref10)]
```bash
npm i puppeteer-real-browser
```

**Features:**
- Uses rebrowser-patches under the hood
- Ghost-cursor integration for natural mouse movement
- Automatic Cloudflare Turnstile clicking
- Launches Chrome in "most natural state"

**Limitations:**
- ⚠️ Repository no longer receives updates
- No reCAPTCHA v3 support
- Consider using rebrowser-patches directly

**Code Example:**
```typescript
import { connect } from "puppeteer-real-browser";

const { browser, page } = await connect({
  headless: false,
  turnstile: true,
  connectOption: {
    defaultViewport: null
  }
});

await page.goto('https://example.com');
```

**C. Undetected-Browser** [Citation: [11](#ref11)]
```bash
npm install undetected-browser
```

**Features:**
- Extends Puppeteer with additional anti-detection
- Modular plugin system
- Supports custom patches

**D. Fingerprint-Suite (Apify)** [Citation: [12](#ref12)]
```bash
npm install fingerprint-suite
```

**Features:**
- Generates realistic browser fingerprints
- Header generation
- Fingerprint injection for Puppeteer/Playwright

**Status:** ⚠️ No longer actively maintained (as of 2025)

**Limitations:**
- Doesn't capture all essential leakages
- Fails some Chrome runtime tests
- Consider newer alternatives

### 2. Puppeteer-Extra Stealth Plugin

#### Installation [Citation: [13](#ref13)]
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

#### Implementation
```typescript
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: "new"
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
```

#### What It Does
- **17 evasion modules** targeting fingerprinting
- Masks headless indicators
- Modifies navigator properties
- Simulates mouse/keyboard activity

#### Current Limitations (2025) [Citation: [8](#ref8)]
- ❌ **Does NOT bypass Cloudflare** (as of Feb 2025)
- ❌ **Does NOT bypass DataDome**
- ❌ Still detectable via TLS fingerprinting
- ❌ Fails on rendering delays
- ❌ Can't fix WebGL anomalies

**Verdict:** Use for basic protection only. Upgrade to rebrowser-patches for serious scraping.

### 3. Playwright Anti-Detection

#### Playwright-Extra Stealth [Citation: [14](#ref14)]
```bash
npm install playwright-extra playwright-extra-plugin-stealth
```

**Similar limitations to Puppeteer stealth:**
- Struggles against modern Cloudflare (2025)
- TLS signatures still detectable
- HTTP/2 frame order analysis still catches it

#### Better Alternative: Rebrowser-Patches for Playwright
```bash
npm install rebrowser-playwright-core
```

### 4. User-Agent Rotation & Realistic Headers

#### Modern Browser Versions (2025) [Citation: [15](#ref15)]
```typescript
const modernUserAgents = [
  // Chrome 131 (2025)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

  // Firefox 133 (2025)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
];
```

#### Sec-CH-UA Client Hints (Critical for 2025) [Citation: [15](#ref15)]
```typescript
const chromeHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
};
```

**Critical Rules:**
1. ✅ **Header Consistency:** UA must match Sec-CH-UA and behavior
2. ✅ **No HeadlessChrome:** Instant bot signal
3. ✅ **Rotate with proxies:** Static UA + rotating IP = red flag
4. ✅ **Match fingerprint:** Screen resolution, WebGL must align with UA

### 5. JavaScript Challenge Solving

#### Cloudflare [Citation: [16](#ref16)]
**Difficulty Level:** Very High (2025)

**Approaches:**
1. **Rebrowser-Patches:** Currently bypasses (as of 2025)
2. **Commercial APIs:** ScraperAPI, ZenRows handle automatically
3. **Residential Proxies + Stealth:** Limited success
4. **Browser farms:** Self-hosted with real browsers

#### DataDome [Citation: [17](#ref17)]
**Difficulty Level:** Extreme (2025)

**Detection Methods:**
- 200+ browser property analysis
- Behavioral tracking (mouse movement, timing)
- TLS fingerprinting
- HTTP header analysis

**Approaches:**
1. **Commercial APIs only:** Very difficult to bypass manually
2. **High-quality residential/mobile proxies:** Required minimum
3. **Rebrowser-patches + perfect fingerprinting:** Possible but fragile

#### PerimeterX (HUMAN)
**Difficulty Level:** Extreme

**Similar to DataDome, requires:**
- Commercial solutions or
- Extensive custom fingerprinting + behavior simulation

### 6. CAPTCHA Solving Services

#### Comparison Table (2025) [Citation: [18](#ref18)]

| Service | Pricing | Speed | Success Rate | Types Supported |
|---------|---------|-------|--------------|-----------------|
| **NoCaptchaAI** | $0.14/1000 | Fast | ~95% | reCAPTCHA, hCaptcha |
| **2Captcha** | $0.50/1000 (image)<br>$1.00/1000 (reCAPTCHA) | ~4s (image)<br>~9s (reCAPTCHA v2) | ~99% | All types including Turnstile |
| **AntiCaptcha** | $0.50/1000 (image) | ~7s average | ~99% | reCAPTCHA, FunCaptcha, GeeTest |
| **CapMonster Cloud** | 2-3x cheaper (neural network) | <1s | ~99% | Most types |
| **SolveCaptcha** | Variable (hybrid) | 2-5s (neural)<br>Slower (human) | High | Multi-part puzzles |

**Budget Recommendation:** NoCaptchaAI for basic needs, 2Captcha for comprehensive support

#### Integration Example (2Captcha)
```typescript
import Captcha from '2captcha';

const solver = new Captcha.Solver(process.env.TWOCAPTCHA_API_KEY);

// Solve reCAPTCHA v2
const result = await solver.recaptcha({
  pageurl: 'https://example.com',
  googlekey: 'SITE_KEY_HERE'
});

// Use the token
await page.evaluate((token) => {
  document.getElementById('g-recaptcha-response').innerHTML = token;
}, result.data);
```

---

## NestJS Integration

### 1. Crawlee with NestJS ⭐ RECOMMENDED

#### Installation [Citation: [19](#ref19)]
```bash
npm install crawlee playwright
# or
npm install crawlee puppeteer
```

#### Create Scraper Service
```typescript
// src/scraper/scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler, ProxyConfiguration, Dataset } from 'crawlee';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  async scrapeWithAntiDetection(urls: string[]) {
    // Configure tiered proxy strategy
    const proxyConfiguration = new ProxyConfiguration({
      tieredProxyUrls: [
        null, // Start without proxy
        process.env.DATACENTER_PROXY_URL,
        process.env.RESIDENTIAL_PROXY_URL,
      ],
    });

    const crawler = new PlaywrightCrawler({
      proxyConfiguration,

      // Anti-detection enabled by default
      // Generates human-like fingerprints automatically

      requestHandler: async ({ request, page, enqueueLinks, log }) => {
        this.logger.log(`Scraping: ${request.loadedUrl}`);

        // Wait for content
        await page.waitForSelector('h1');

        // Extract data
        const data = await page.evaluate(() => {
          return {
            title: document.querySelector('h1')?.textContent,
            content: document.querySelector('.content')?.textContent,
          };
        });

        // Save to dataset
        await Dataset.pushData({
          url: request.loadedUrl,
          ...data,
        });

        // Enqueue more links
        await enqueueLinks({
          selector: 'a[href]',
          limit: 10,
        });
      },

      // Rate limiting
      maxConcurrency: 5,
      maxRequestsPerCrawl: 100,

      // Error handling
      failedRequestHandler: async ({ request }, error) => {
        this.logger.error(`Request ${request.url} failed: ${error.message}`);
      },
    });

    await crawler.run(urls);

    // Export results
    const dataset = await Dataset.open();
    const results = await dataset.getData();

    return results.items;
  }
}
```

#### Create Scraper Module
```typescript
// src/scraper/scraper.module.ts
import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';

@Module({
  providers: [ScraperService],
  controllers: [ScraperController],
  exports: [ScraperService],
})
export class ScraperModule {}
```

#### Create Controller
```typescript
// src/scraper/scraper.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('scrape')
  async scrape(@Body('urls') urls: string[]) {
    return this.scraperService.scrapeWithAntiDetection(urls);
  }
}
```

### 2. Puppeteer with Rebrowser-Patches in NestJS

#### Installation
```bash
npm install rebrowser-puppeteer-core
```

#### Create Service
```typescript
// src/scraper/puppeteer-scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'rebrowser-puppeteer-core';

@Injectable()
export class PuppeteerScraperService {
  private readonly logger = new Logger(PuppeteerScraperService.name);

  async scrapeWithRebrowser(url: string) {
    // Configure rebrowser patches
    process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'addBinding';
    process.env.REBROWSER_PATCHES_SOURCE_URL = 'app.js';

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();

      // Set modern user agent and headers
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      );

      await page.setExtraHTTPHeaders({
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'accept-language': 'en-US,en;q=0.9',
      });

      // Navigate and scrape
      await page.goto(url, { waitUntil: 'networkidle2' });

      const data = await page.evaluate(() => {
        return {
          title: document.title,
          content: document.body.innerText,
        };
      });

      return data;
    } finally {
      await browser.close();
    }
  }
}
```

### 3. NestJS with nest-crawler Module [Citation: [20](#ref20)]

#### Installation
```bash
npm install --save nest-crawler
```

#### Setup
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { NestCrawlerModule } from 'nest-crawler';

@Module({
  imports: [NestCrawlerModule],
})
export class AppModule {}
```

#### Usage in Service
```typescript
import { Injectable } from '@nestjs/common';
import { NestCrawlerService } from 'nest-crawler';

@Injectable()
export class MyScraperService {
  constructor(private readonly crawler: NestCrawlerService) {}

  async scrapeData() {
    const data = await this.crawler.fetch({
      target: 'https://example.com',
      fetch: {
        title: 'h1',
        links: {
          selector: 'a',
          attr: 'href',
        },
        content: {
          selector: '.content',
          how: 'html',
        },
      },
    });

    return data;
  }

  async scrapeManyPages() {
    const sites = await this.crawler.fetch({
      target: ['https://example1.com', 'https://example2.com'],
      fetch: (data, index, url) => ({
        title: 'h1',
        description: 'meta[name="description"]',
      }),
    });

    return sites;
  }
}
```

**Limitations:**
- No built-in proxy rotation
- No advanced anti-detection
- Best for simple scraping tasks

### 4. Axios with Proxy Rotation [Citation: [21](#ref21)]

#### Installation
```bash
npm install axios https-proxy-agent socks-proxy-agent
```

#### Create Proxy Service
```typescript
// src/scraper/proxy.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class ProxyService {
  private proxies: string[];
  private currentIndex = 0;

  constructor() {
    this.proxies = [
      'http://proxy1.com:8080',
      'http://proxy2.com:8080',
      'http://proxy3.com:8080',
    ];
  }

  private getNextProxy(): string {
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  createAxiosWithProxy(): AxiosInstance {
    const proxy = this.getNextProxy();
    const agent = new HttpsProxyAgent(proxy);

    return axios.create({
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
  }

  async fetchWithProxy(url: string) {
    const axiosInstance = this.createAxiosWithProxy();
    const response = await axiosInstance.get(url);
    return response.data;
  }
}
```

---

## Rate Limiting & Request Management

### 1. Bottleneck Library [Citation: [22](#ref22)]

#### Installation
```bash
npm install bottleneck
```

#### Basic Rate Limiting
```typescript
import Bottleneck from 'bottleneck';

// Create limiter: max 5 requests per second
const limiter = new Bottleneck({
  maxConcurrent: 5,      // Max 5 concurrent requests
  minTime: 200,          // Minimum 200ms between requests (5 req/sec)
});

// Wrap your scraping function
const scrape = limiter.wrap(async (url: string) => {
  const response = await axios.get(url);
  return response.data;
});

// Use it
const data = await scrape('https://example.com');
```

#### Advanced Configuration (Shopify API Example)
```typescript
const limiter = new Bottleneck({
  reservoir: 40,               // Initial number of requests
  reservoirRefreshAmount: 2,   // Add 2 requests
  reservoirRefreshInterval: 1000, // Every 1 second
  maxConcurrent: 5,
});
```

#### NestJS Integration
```typescript
// src/scraper/rate-limiter.service.ts
import { Injectable } from '@nestjs/common';
import Bottleneck from 'bottleneck';

@Injectable()
export class RateLimiterService {
  private limiter: Bottleneck;

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 200,
    });
  }

  async scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(fn);
  }

  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return this.limiter.wrap(fn) as T;
  }
}
```

#### Usage in Scraper Service
```typescript
@Injectable()
export class ScraperService {
  constructor(private rateLimiter: RateLimiterService) {}

  async scrapeMany(urls: string[]) {
    const wrappedScrape = this.rateLimiter.wrap(this.scrapeSingle.bind(this));

    const results = await Promise.all(
      urls.map(url => wrappedScrape(url))
    );

    return results;
  }

  private async scrapeSingle(url: string) {
    // Your scraping logic
  }
}
```

### 2. p-queue Library

#### Installation
```bash
npm install p-queue
```

#### Usage
```typescript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 5,           // Max 5 concurrent requests
  interval: 1000,           // Per interval
  intervalCap: 10,          // Max 10 requests per interval
});

// Add tasks to queue
const results = await Promise.all([
  queue.add(() => scrapeUrl('https://example1.com')),
  queue.add(() => scrapeUrl('https://example2.com')),
  queue.add(() => scrapeUrl('https://example3.com')),
]);
```

### 3. Retry Mechanisms

#### With axios-retry
```bash
npm install axios-retry
```

```typescript
import axios from 'axios';
import axiosRetry from 'axios-retry';

const client = axios.create();

axiosRetry(client, {
  retries: 3,                    // Retry 3 times
  retryDelay: axiosRetry.exponentialDelay,  // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.response?.status === 429; // Rate limited
  },
});
```

#### Custom Retry with Exponential Backoff
```typescript
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 4. Session Management [Citation: [23](#ref23)]

#### Install Session Package
```bash
npm install express-session @types/express-session
npm install connect-redis redis
```

#### Configure in NestJS
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import * as RedisStore from 'connect-redis';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Redis client for session storage
  const redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

#### Cookie Persistence in Scraper
```typescript
import * as fs from 'fs';

class CookieManager {
  private cookiesFile = './cookies.json';

  async saveCookies(page: any) {
    const cookies = await page.cookies();
    fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies, null, 2));
  }

  async loadCookies(page: any) {
    if (fs.existsSync(this.cookiesFile)) {
      const cookies = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
      await page.setCookie(...cookies);
    }
  }
}

// Usage
const cookieManager = new CookieManager();
await cookieManager.loadCookies(page);
await page.goto('https://example.com');
await cookieManager.saveCookies(page);
```

---

## Cost Analysis

### FREE vs PAID Solutions Comparison

#### Option 1: Fully Free (Hobby/Testing)
**Monthly Cost:** $0

**Stack:**
- Crawlee (free, open-source)
- Rebrowser-patches (free)
- Free proxy lists (GitHub)
- Self-hosted NestJS

**Pros:**
- ✅ Zero cost
- ✅ Full control
- ✅ Good for learning

**Cons:**
- ❌ Unreliable proxies
- ❌ High failure rate
- ❌ Time-intensive maintenance
- ❌ Limited scale (< 1000 requests/day)

**Best For:** Learning, personal projects, testing

---

#### Option 2: Budget-Conscious ($10-50/month)
**Monthly Cost:** $10-50

**Stack:**
- Crawlee + rebrowser-patches (free)
- ProxyWing: $2.50/GB residential (~10GB = $25)
- NoCaptchaAI: $10 for 71,428 CAPTCHAs
- Self-hosted on VPS ($5-10/month)

**Capacity:**
- ~50,000 requests/month
- Basic CAPTCHA solving
- Moderate success rate on protected sites

**Pros:**
- ✅ Very affordable
- ✅ Reliable proxies
- ✅ CAPTCHA solving included
- ✅ Can handle e-commerce sites

**Cons:**
- ❌ Limited scale
- ❌ Some manual intervention needed
- ❌ May struggle with heavy protection

**Best For:** Small businesses, freelancers, MVPs

---

#### Option 3: Mid-Range ($50-200/month)
**Monthly Cost:** $50-200

**Options:**

**A. ScraperAPI Approach**
- ScraperAPI: $49-$99/month
- No proxy/CAPTCHA costs (included)
- 100,000-500,000 API credits

**B. Self-Hosted Approach**
- Crawlee + rebrowser-patches (free)
- Smartproxy: $100 for 25GB residential
- 2Captcha: $20
- VPS: $20-40/month
- **Total:** ~$140-160/month

**Capacity:**
- 500,000-2,000,000 requests/month
- All CAPTCHA types
- High success rate on most sites

**Pros:**
- ✅ Production-ready
- ✅ High reliability
- ✅ Good scaling
- ✅ Multiple site support

**Cons:**
- ❌ Still may struggle with DataDome/PerimeterX
- ❌ Requires monitoring

**Best For:** Growing startups, production apps, data-driven businesses

---

#### Option 4: Enterprise ($200-1000+/month)
**Monthly Cost:** $200-1000+

**Options:**

**A. Premium API (ScraperAPI Enterprise)**
- $299/month for 3,000,000 credits
- Full automation
- Guaranteed success rates

**B. Premium Proxies**
- Bright Data: $500-1000/month
- Oxylabs: Similar pricing
- Custom infrastructure

**Capacity:**
- 10,000,000+ requests/month
- DataDome/PerimeterX bypass
- 99%+ uptime

**Pros:**
- ✅ Enterprise SLAs
- ✅ Bypass everything
- ✅ Unlimited scale
- ✅ Support included

**Cons:**
- ❌ Expensive

**Best For:** Large enterprises, data providers, Fortune 500

---

### Monthly Cost Estimates by Scale

| Scale | Requests/Month | Free | Budget | Mid-Range | Enterprise |
|-------|----------------|------|--------|-----------|------------|
| **Tiny** | < 1,000 | ✅ $0 | $10 | - | - |
| **Small** | 1K-50K | ⚠️ $0 | ✅ $10-30 | $50 | - |
| **Medium** | 50K-500K | ❌ | ✅ $30-50 | ✅ $50-150 | $200 |
| **Large** | 500K-5M | ❌ | ❌ | ✅ $150-300 | ✅ $300-600 |
| **Enterprise** | 5M+ | ❌ | ❌ | ⚠️ | ✅ $600+ |

---

### Cost Breakdown Examples

#### Example 1: E-commerce Price Monitoring (100K products/day)
**Requirements:**
- 3M requests/month
- CAPTCHA solving
- 99% success rate

**Solution:**
- ScraperAPI Enterprise: $299/month
- **OR**
- Smartproxy (200GB): $600/month + 2Captcha: $50 = $650/month

**Recommendation:** ScraperAPI ($299) for simplicity

---

#### Example 2: News Aggregation (10K articles/day)
**Requirements:**
- 300K requests/month
- Light protection
- No CAPTCHA

**Solution:**
- Crawlee (free) + ProxyWing (20GB): $50/month
- VPS: $10/month
- **Total:** $60/month

**Recommendation:** Budget approach ($60)

---

#### Example 3: Social Media Monitoring (1K profiles/day)
**Requirements:**
- 30K requests/month
- Heavy protection
- CAPTCHA solving

**Solution:**
- ScraperAPI Hobby: $49/month (100K credits)
- **OR**
- Crawlee + Smartproxy (10GB): $35 + NoCaptchaAI: $10 = $45/month

**Recommendation:** Try budget first ($45), upgrade to ScraperAPI if needed

---

## Implementation Recommendations

### For Different Scenarios

#### Scenario 1: News/Blog Scraping (Low Protection)
**Recommended Stack:**
```
✅ Crawlee (free)
✅ Free proxies or no proxies
✅ No CAPTCHA solving needed
✅ Self-hosted
```

**Estimated Cost:** $0-10/month
**Success Rate:** 95%+
**Rationale:** Most news sites don't have strong anti-bot protection

---

#### Scenario 2: E-commerce Product Data (Medium Protection)
**Recommended Stack:**
```
✅ Crawlee + rebrowser-patches
✅ ProxyWing or Smartproxy (residential)
✅ NoCaptchaAI or 2Captcha
✅ Bottleneck for rate limiting
```

**Estimated Cost:** $30-100/month
**Success Rate:** 85-95%
**Rationale:** Balance between cost and reliability. Can handle most e-commerce sites.

---

#### Scenario 3: Social Media Data (High Protection)
**Recommended Stack:**
```
✅ ScraperAPI or ZenRows
✅ OR: Rebrowser-patches + Premium residential proxies
✅ 2Captcha
✅ Session management
```

**Estimated Cost:** $100-300/month
**Success Rate:** 80-90%
**Rationale:** Social media has sophisticated detection. Commercial APIs are more reliable.

---

#### Scenario 4: Financial/Banking Data (Extreme Protection)
**Recommended Stack:**
```
✅ Commercial API (ScraperAPI, ZenRows)
✅ ISP or mobile proxies
✅ Premium CAPTCHA solving
✅ Manual intervention backup
```

**Estimated Cost:** $300-1000+/month
**Success Rate:** 70-85%
**Rationale:** Extremely difficult. May require custom solutions or data partnerships.

---

### General Best Practices (2025-2026)

#### 1. Start Simple, Escalate When Blocked
```typescript
// Tiered approach
1. Try without proxy
2. If blocked → use datacenter proxy
3. If blocked → use residential proxy
4. If blocked → use mobile proxy + CAPTCHA solving
5. If blocked → switch to commercial API
```

#### 2. Mimic Human Behavior
```typescript
// Random delays
await page.waitForTimeout(Math.random() * 2000 + 1000); // 1-3 seconds

// Random mouse movement
await page.mouse.move(
  Math.random() * 800,
  Math.random() * 600
);

// Random scrolling
await page.evaluate(() => {
  window.scrollBy(0, Math.random() * 500);
});
```

#### 3. Respect robots.txt (When Appropriate)
```typescript
import robotsParser from 'robots-parser';

const robots = robotsParser('https://example.com/robots.txt', userAgent);
const canScrape = robots.isAllowed(url);
```

#### 4. Monitor and Adapt
```typescript
// Track success rates
const metrics = {
  total: 0,
  success: 0,
  blocked: 0,
  captcha: 0,
};

// Adjust strategy based on metrics
if (metrics.blocked / metrics.total > 0.2) {
  // Switch to better proxies
}
```

#### 5. Use Distributed Architecture for Scale
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Worker 1  │      │   Worker 2  │      │   Worker 3  │
│  (Region A) │      │  (Region B) │      │  (Region C) │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Redis Queue   │
                    │ (Task Manager) │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │
                    │ (Results Store)│
                    └────────────────┘
```

---

## Code Examples

### Complete NestJS Scraper with All Best Practices

```typescript
// src/scraper/advanced-scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler, ProxyConfiguration, Dataset } from 'crawlee';
import Bottleneck from 'bottleneck';
import puppeteer from 'rebrowser-puppeteer-core';
import Captcha from '2captcha';

interface ScraperConfig {
  useProxy?: boolean;
  useCaptchaSolver?: boolean;
  maxConcurrency?: number;
  maxRequestsPerSecond?: number;
}

@Injectable()
export class AdvancedScraperService {
  private readonly logger = new Logger(AdvancedScraperService.name);
  private rateLimiter: Bottleneck;
  private captchaSolver: Captcha.Solver;

  constructor() {
    // Rate limiting: 5 requests per second
    this.rateLimiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 200,
    });

    // CAPTCHA solver
    if (process.env.TWOCAPTCHA_API_KEY) {
      this.captchaSolver = new Captcha.Solver(process.env.TWOCAPTCHA_API_KEY);
    }
  }

  /**
   * Method 1: Crawlee for maximum automation and anti-detection
   */
  async scrapeWithCrawlee(urls: string[], config: ScraperConfig = {}) {
    const proxyConfiguration = new ProxyConfiguration({
      tieredProxyUrls: config.useProxy ? [
        null,
        process.env.DATACENTER_PROXY_URL,
        process.env.RESIDENTIAL_PROXY_URL,
      ] : [null],
    });

    const crawler = new PlaywrightCrawler({
      proxyConfiguration,
      maxConcurrency: config.maxConcurrency || 5,

      requestHandler: async ({ request, page, log }) => {
        log.info(`Processing: ${request.loadedUrl}`);

        // Wait for content
        await page.waitForLoadState('networkidle');

        // Check for CAPTCHA
        const hasCaptcha = await this.detectCaptcha(page);
        if (hasCaptcha && config.useCaptchaSolver) {
          await this.solveCaptcha(page);
        }

        // Extract data
        const data = await page.evaluate(() => ({
          title: document.title,
          content: document.body.innerText,
          links: Array.from(document.querySelectorAll('a')).map(a => a.href),
        }));

        // Save
        await Dataset.pushData({
          url: request.loadedUrl,
          timestamp: new Date().toISOString(),
          ...data,
        });
      },

      failedRequestHandler: async ({ request }, error) => {
        this.logger.error(`Failed: ${request.url} - ${error.message}`);
      },
    });

    await crawler.run(urls);

    const dataset = await Dataset.open();
    return dataset.getData();
  }

  /**
   * Method 2: Rebrowser-Puppeteer for maximum stealth
   */
  async scrapeWithRebrowser(url: string) {
    return this.rateLimiter.schedule(async () => {
      process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'addBinding';

      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      try {
        const page = await browser.newPage();

        // Set realistic headers
        await page.setExtraHTTPHeaders({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'accept-language': 'en-US,en;q=0.9',
        });

        // Stealth techniques
        await page.evaluateOnNewDocument(() => {
          // Remove webdriver property
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });

          // Mock plugins
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });

          // Mock languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
          });
        });

        await page.goto(url, { waitUntil: 'networkidle2' });

        // Random human-like delay
        await this.randomDelay(1000, 3000);

        const data = await page.evaluate(() => ({
          title: document.title,
          content: document.body.innerText,
        }));

        return data;
      } finally {
        await browser.close();
      }
    });
  }

  /**
   * Method 3: Commercial API fallback
   */
  async scrapeWithScraperAPI(url: string) {
    const axios = require('axios');

    const response = await axios.get('https://api.scraperapi.com', {
      params: {
        api_key: process.env.SCRAPERAPI_KEY,
        url: url,
        render: 'true', // JavaScript rendering
        country_code: 'us', // Geo-targeting
      },
    });

    return response.data;
  }

  /**
   * Adaptive scraping: Try different methods until one succeeds
   */
  async adaptiveScrape(url: string) {
    const methods = [
      { name: 'Crawlee (no proxy)', fn: () => this.scrapeWithCrawlee([url], { useProxy: false }) },
      { name: 'Rebrowser', fn: () => this.scrapeWithRebrowser(url) },
      { name: 'Crawlee (with proxy)', fn: () => this.scrapeWithCrawlee([url], { useProxy: true }) },
      { name: 'ScraperAPI', fn: () => this.scrapeWithScraperAPI(url) },
    ];

    for (const method of methods) {
      try {
        this.logger.log(`Trying method: ${method.name}`);
        const result = await method.fn();
        this.logger.log(`Success with: ${method.name}`);
        return result;
      } catch (error) {
        this.logger.warn(`Failed with ${method.name}: ${error.message}`);
        continue;
      }
    }

    throw new Error('All scraping methods failed');
  }

  /**
   * Helper: Detect CAPTCHA
   */
  private async detectCaptcha(page: any): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.cf-turnstile',
      '#captcha',
    ];

    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) return true;
    }

    return false;
  }

  /**
   * Helper: Solve CAPTCHA
   */
  private async solveCaptcha(page: any) {
    if (!this.captchaSolver) {
      throw new Error('CAPTCHA solver not configured');
    }

    // Detect CAPTCHA type and solve
    const recaptcha = await page.$('iframe[src*="recaptcha"]');
    if (recaptcha) {
      const siteKey = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="recaptcha"]');
        return iframe?.src.match(/k=([^&]+)/)?.[1];
      });

      if (siteKey) {
        const result = await this.captchaSolver.recaptcha({
          pageurl: page.url(),
          googlekey: siteKey,
        });

        await page.evaluate((token) => {
          const textarea = document.getElementById('g-recaptcha-response');
          if (textarea) textarea.innerHTML = token;
        }, result.data);
      }
    }
  }

  /**
   * Helper: Random delay
   */
  private async randomDelay(min: number, max: number) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### Complete Controller with Queue Management

```typescript
// src/scraper/scraper.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AdvancedScraperService } from './advanced-scraper.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface ScrapeRequest {
  urls: string[];
  method?: 'crawlee' | 'rebrowser' | 'api' | 'adaptive';
  config?: {
    useProxy?: boolean;
    useCaptchaSolver?: boolean;
  };
}

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scraperService: AdvancedScraperService,
    @InjectQueue('scraper') private scraperQueue: Queue,
  ) {}

  @Post('scrape')
  async scrape(@Body() request: ScrapeRequest) {
    const { urls, method = 'adaptive', config = {} } = request;

    // Add to queue for async processing
    const job = await this.scraperQueue.add('scrape-urls', {
      urls,
      method,
      config,
    });

    return {
      jobId: job.id,
      status: 'queued',
      message: `Scraping ${urls.length} URLs`,
    };
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.scraperQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    return {
      jobId: job.id,
      status: await job.getState(),
      progress: job.progress(),
      result: await job.finished(),
    };
  }
}
```

### Queue Processor

```typescript
// src/scraper/scraper.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AdvancedScraperService } from './advanced-scraper.service';

@Processor('scraper')
export class ScraperProcessor {
  constructor(private scraperService: AdvancedScraperService) {}

  @Process('scrape-urls')
  async handleScrape(job: Job) {
    const { urls, method, config } = job.data;

    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        let result;

        switch (method) {
          case 'crawlee':
            result = await this.scraperService.scrapeWithCrawlee([url], config);
            break;
          case 'rebrowser':
            result = await this.scraperService.scrapeWithRebrowser(url);
            break;
          case 'api':
            result = await this.scraperService.scrapeWithScraperAPI(url);
            break;
          case 'adaptive':
          default:
            result = await this.scraperService.adaptiveScrape(url);
        }

        results.push({ url, success: true, data: result });
      } catch (error) {
        results.push({ url, success: false, error: error.message });
      }

      // Update progress
      await job.progress((i + 1) / urls.length * 100);
    }

    return results;
  }
}
```

---

## Resources & Tools

### GitHub Repositories (2025)

#### Anti-Detection Libraries
1. **Crawlee** - https://github.com/apify/crawlee (15.7k stars)
   - Full-featured web scraping framework
   - Built-in anti-detection
   - TypeScript support
   - Proxy rotation

2. **Rebrowser-Patches** - https://github.com/rebrowser/rebrowser-patches
   - Puppeteer/Playwright patches
   - Bypasses Cloudflare/DataDome (2025)
   - Actively maintained

3. **Puppeteer-Real-Browser** - https://github.com/ZFC-Digital/puppeteer-real-browser
   - Uses rebrowser-patches
   - Ghost-cursor integration
   - ⚠️ No longer updated

4. **Undetected-Browser** - https://github.com/AlloryDante/undetected-browser
   - Extended Puppeteer
   - Modular plugin system

5. **Fingerprint-Suite** - https://github.com/apify/fingerprint-suite
   - Browser fingerprint generation
   - ⚠️ No longer actively maintained

#### Proxy Lists (Free)
6. **proxifly/free-proxy-list** - https://github.com/proxifly/free-proxy-list
   - 3,062 proxies, 92 countries
   - Updated every 5 minutes

7. **vakhov/fresh-proxy-list** - https://github.com/vakhov/fresh-proxy-list
   - HTTP/HTTPS/SOCKS4/SOCKS5
   - Updated every 5-20 minutes

8. **monosans/proxy-list** - https://github.com/monosans/proxy-list
   - With geolocation
   - Updated hourly

#### NestJS Integration
9. **nest-crawler** - https://github.com/saltyshiomix/nest-crawler
   - NestJS scraping module
   - Simple API

10. **nestjs-scraping** - https://github.com/nodejs-typescript-classroom/nestjs-scraping
    - Puppeteer + NestJS example

### Commercial Services

#### Scraping APIs
- **ScraperAPI** - https://www.scraperapi.com
  - $49-$299/month
  - Flat pricing, no feature upcharges

- **ZenRows** - https://www.zenrows.com
  - $0.28/1000 URLs base
  - Feature-based pricing

- **ScrapingBee** - https://www.scrapingbee.com
  - $49+/month
  - 150,000 credits/month

#### Proxy Providers
- **ProxyWing** - https://proxywing.com
  - Budget-friendly ($1.05-$2.50)

- **Smartproxy** - https://smartproxy.com
  - $3.50-$4/GB residential
  - Good value

- **Bright Data** - https://brightdata.com
  - Enterprise-grade
  - $8.40-$10.50/GB residential

- **Oxylabs** - https://oxylabs.io
  - Premium proxies
  - $10/GB residential

- **Webshare** - https://www.webshare.io
  - FREE tier: 10 rotating proxies

#### CAPTCHA Solvers
- **NoCaptchaAI** - https://nocaptchaai.com
  - $0.14/1000 (cheapest)

- **2Captcha** - https://2captcha.com
  - $0.50-$1/1000
  - All types supported

- **AntiCaptcha** - https://anti-captcha.com
  - $0.50/1000
  - 99% success rate

- **CapMonster Cloud** - https://capmonster.cloud
  - Neural network-based
  - 2-3x cheaper

### Documentation & Guides

#### Official Documentation
- **Crawlee Docs** - https://crawlee.dev
- **Puppeteer Docs** - https://pptr.dev
- **Playwright Docs** - https://playwright.dev
- **NestJS Docs** - https://docs.nestjs.com

#### Technical Blogs (2024-2025)
- **ZenRows Blog** - https://www.zenrows.com/blog
  - Modern scraping techniques
  - Up-to-date guides

- **ScrapingBee Blog** - https://www.scrapingbee.com/blog
  - Anti-detection tutorials
  - Code examples

- **ScrapeOps** - https://scrapeops.io
  - Comprehensive playbooks
  - Best practices

- **ScrapFly Blog** - https://scrapfly.io/blog
  - Advanced techniques
  - Fingerprinting guides

### Testing & Debugging Tools

- **CreepJS** - https://abrahamjuliot.github.io/creepjs/
  - Browser fingerprint testing

- **BrowserLeaks** - https://browserleaks.com
  - WebRTC, Canvas, WebGL testing

- **IPLeak.net** - https://ipleak.net
  - IP/DNS leak detection

- **WhatIsMyBrowser** - https://www.whatismybrowser.com
  - User-Agent validation

---

## Citations & References

<a id="ref1"></a>**[1]** Webshare. "Free Proxy Service - 10 Rotating Datacenter Proxies Forever Free." https://www.webshare.io (Accessed: October 2025)

<a id="ref2"></a>**[2]** Various. "Free Proxy Lists on GitHub." GitHub Topics, 2025. https://github.com/topics/free-proxy-list

<a id="ref3"></a>**[3]** Multiple Sources. "10 Best Datacenter Proxies for Web Scraping in 2025." ScrapingDog, 2025. https://www.scrapingdog.com/blog/best-datacenter-proxies/

<a id="ref4"></a>**[4]** AIMultiple Research. "Proxy Pricing Calculator: Lowest Price Proxy Services." 2025. https://research.aimultiple.com/proxy-pricing/

<a id="ref5"></a>**[5]** ScraperAPI. "Zenrows vs. Scrapingbee: Web Scraping API Comparison." 2025. https://www.scraperapi.com/comparisons/zenrows-vs-scrapingbee/

<a id="ref6"></a>**[6]** Crawlee. "Proxy Management | Crawlee for JavaScript." 2025. https://crawlee.dev/js/docs/guides/proxy-management

<a id="ref7"></a>**[7]** SmartDNS. "How to Bypass Geo-Blocks in 2025." 2025. https://www.smartdnsproxy.com/news/smart-dns/how-to-bypass-2025-583.aspx

<a id="ref8"></a>**[8]** Browserless. "Bypass Cloudflare with Puppeteer (2025 Guide)." 2025. https://www.browserless.io/blog/bypass-cloudflare-with-puppeteer

<a id="ref9"></a>**[9]** Rebrowser. "GitHub - rebrowser/rebrowser-patches." GitHub, 2025. https://github.com/rebrowser/rebrowser-patches

<a id="ref10"></a>**[10]** ZFC Digital. "GitHub - ZFC-Digital/puppeteer-real-browser." GitHub, 2024. https://github.com/ZFC-Digital/puppeteer-real-browser

<a id="ref11"></a>**[11]** AlloryDante. "GitHub - AlloryDante/undetected-browser." GitHub, 2024. https://github.com/AlloryDante/undetected-browser

<a id="ref12"></a>**[12]** Apify. "GitHub - apify/fingerprint-suite." GitHub, 2024. https://github.com/apify/fingerprint-suite

<a id="ref13"></a>**[13]** ScrapingBee. "Puppeteer Stealth Tutorial." 2025. https://www.scrapingbee.com/blog/puppeteer-stealth-tutorial-with-examples/

<a id="ref14"></a>**[14]** ZenRows. "Playwright Fingerprinting: Explained & Bypass." 2025. https://www.zenrows.com/blog/playwright-fingerprint

<a id="ref15"></a>**[15]** Browserless. "What Is a User Agent? A 2025 Guide." 2025. https://www.browserless.io/blog/what-is-a-user-agent

<a id="ref16"></a>**[16]** Kameleo. "How to Bypass Cloudflare with Playwright in 2025." 2025. https://kameleo.io/blog/how-to-bypass-cloudflare-with-playwright

<a id="ref17"></a>**[17]** ScrapeOps. "How To Bypass DataDome in 2025." 2025. https://scrapeops.io/web-scraping-playbook/how-to-bypass-datadome/

<a id="ref18"></a>**[18]** Data Journal. "Best CAPTCHA Solving Services of 2025." 2025. https://medium.com/@datajournal/best-captcha-solving-tools-b5af8e6e1e94

<a id="ref19"></a>**[19]** Apify. "GitHub - apify/crawlee." GitHub, 2025. https://github.com/apify/crawlee

<a id="ref20"></a>**[20]** saltyshiomix. "GitHub - saltyshiomix/nest-crawler." GitHub, 2024. https://github.com/saltyshiomix/nest-crawler

<a id="ref21"></a>**[21]** ScrapingBee. "How to set up Axios proxy: A step-by-step guide for Node.js." 2024. https://www.scrapingbee.com/blog/nodejs-axios-proxy/

<a id="ref22"></a>**[22]** NPM. "bottleneck - npm." 2024. https://www.npmjs.com/package/bottleneck

<a id="ref23"></a>**[23]** Sling Academy. "Using Cookies and Sessions in NestJS." 2024. https://www.slingacademy.com/article/using-cookies-and-sessions-in-nestjs/

---

## Appendix: Quick Decision Tree

```
START: Need to scrape a website
│
├─ Is the site protected? (Cloudflare/CAPTCHA/Rate limits)
│  │
│  ├─ NO → Use Crawlee (free) with no proxy
│  │         Cost: $0, Success: 95%+
│  │
│  └─ YES → What's your budget?
│     │
│     ├─ $0-30/month (Hobby/Learning)
│     │  └─ Use: Crawlee + rebrowser-patches + free/cheap proxies
│     │     Expect: 60-80% success, some manual intervention
│     │
│     ├─ $30-100/month (Small Business)
│     │  └─ Use: Crawlee + ProxyWing/Smartproxy + NoCaptchaAI
│     │     Expect: 80-90% success, mostly automated
│     │
│     ├─ $100-300/month (Production)
│     │  └─ Use: ScraperAPI OR Crawlee + premium proxies + 2Captcha
│     │     Expect: 90-95% success, fully automated
│     │
│     └─ $300+/month (Enterprise)
│        └─ Use: ScraperAPI Enterprise OR Bright Data/Oxylabs
│           Expect: 95-99% success, SLA-backed
│
└─ Special case: DataDome/PerimeterX detected?
   └─ Use commercial API (ScraperAPI/ZenRows) - DIY very difficult

---

RECOMMENDED STARTER STACK:
- Framework: Crawlee (free, TypeScript, anti-detection built-in)
- Anti-detection: rebrowser-patches (free, bypasses Cloudflare 2025)
- Proxies: Start free, upgrade to ProxyWing ($2.50/GB) when needed
- CAPTCHA: NoCaptchaAI ($0.14/1000) or 2Captcha ($0.50/1000)
- Rate Limiting: Bottleneck (free, simple)
- Total cost: $0-50/month for 95% of use cases
```

---

**Document End**

*This research was compiled on October 21, 2025, based on current best practices and available technologies. Web scraping detection methods evolve rapidly - always test your implementation and be prepared to adapt.*

*For legal compliance: Always review website Terms of Service, respect robots.txt, and consult legal counsel for commercial scraping projects.*
