# Social Media Copy Generation - Complete Backend Analysis
**Date:** 2025-10-23
**Purpose:** Comprehensive documentation of all backend locations generating Facebook and Twitter copys

---

## Executive Summary

The backend system generates social media copys through **3 main prompt-building services** across different content flows:

1. **GeneratorProPromptBuilderService** - Normal/scraped content generation (PRIMARY)
2. **UserContentService** - User-generated content (urgent/breaking news + normal articles)
3. **DirectorEditorialPromptBuilderService** - Free-form editorial instructions
4. **CopyImproverService** - Post-generation copy refinement (secondary)

All services use **consistent social media copy structures** defined in the `AIContentGeneration` schema.

---

## 1. PRIMARY LOCATIONS - Prompt Builder Services

### 1.1 GeneratorProPromptBuilderService
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/generator-pro/services/generator-pro-prompt-builder.service.ts`

**Purpose:** Generates prompts for scraped/extracted noticias transformation

**Lines:** 336-351 (Social Media Instructions)

**Current Prompt Text:**
```
📱 DIRECTRICES DE COPYS PARA REDES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACEBOOK (40-80 palabras):
• Hook con tu tono (informativo, emocional, crítico o irónico).
• Estructura: Hook → Contexto → Valor → CTA.
• Adapta emojis y ritmo a tu estilo.

TWITTER (200-240 caracteres):
• Tuit con voz distintiva y mensaje directo.
• Usa tono coherente con tu personalidad periodística.
• Evita hashtags genéricos, prioriza naturalidad.

💬 Cada copy debe reflejar TU voz, no sonar genérico ni publicitario.
```

**JSON Output Format (lines 446-462):**
```javascript
"socialMediaCopies": {
  "facebook": {
    "hook": "Hook único en tu tono",
    "copy": "Copy de 40-80 palabras en tu voz",
    "emojis": ["Emojis acordes al tono"],
    "hookType": "Scary|FreeValue|Strange|Sexy|Familiar",
    "estimatedEngagement": "high|medium|low"
  },
  "twitter": {
    "tweet": "Tweet de 200-240 caracteres con tu estilo",
    "hook": "Hook creativo y coherente",
    "emojis": ["Opcionales"],
    "hookType": "Tipo de hook usado",
    "threadIdeas": ["Ideas para hilo si aplica"]
  }
}
```

**Hook Types Specified:**
- Scary (miedo/alarma)
- FreeValue (información útil)
- Strange (sorpresa/extrañeza)
- Sexy (atractivo/deseo)
- Familiar (cercanía/identificación)

**Character Limits:**
- Facebook Copy: 40-80 palabras
- Facebook Emojis: Máximo 4
- Twitter Tweet: 200-240 caracteres
- Twitter Emojis: Máximo 2

**Used By:**
- Scraped content transformation (ExtractedNoticia → AIContentGeneration)
- Normal content generation flow

---

### 1.2 UserContentService (Urgent + Normal Modes)
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/generator-pro/services/user-content.service.ts`

**Purpose:** Generates content from user-submitted original text (manual content creation)

#### 1.2.1 URGENT MODE (Breaking News) - Lines 708-793

**Current Prompt Text (System):**
```
🔥 COPYS AGRESIVOS PARA REDES SOCIALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FACEBOOK (HOOK AGRESIVO):
• Hook: 10-15 palabras IMPACTANTES que generen URGENCIA
• Copy: 40-60 palabras con tono alarmante pero veraz
• Tipos de hook: Scary (miedo/alarma), Strange (sorpresa/shock)
• Emojis: 3-4 emojis que amplifiquen urgencia (🚨⚠️🔴💥⚡)
• Ejemplo: "🚨 ÚLTIMA HORA: Lo que acaba de pasar en [lugar] tiene a todos en shock"

TWITTER (TWEET URGENTE):
• 200-240 caracteres con voz DIRECTA y URGENTE
• Hook: Frase que obligue a hacer click
• Emojis: 2-3 relacionados con urgencia
• Ejemplo: "🔴 AHORA: Situación crítica en [lugar]. Lo que sabemos hasta el momento 👇"
```

**Characteristics:**
- **Content Length:** 300-500 palabras (SHORTER than normal)
- **Hook Style:** AGGRESSIVE, urgent, alarming but truthful
- **Emojis:** 3-4 for Facebook (urgency focused: 🚨⚠️🔴💥⚡), 2-3 for Twitter
- **Hook Types:** Primarily "Scary" and "Strange"
- **estimatedEngagement:** Typically "high"

**JSON Output (same structure as above)**

---

#### 1.2.2 NORMAL MODE (Standard Articles) - Lines 819-927

**Current Prompt Text (System):**
```
📱 COPYS BALANCEADOS PARA REDES SOCIALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FACEBOOK (HOOK BALANCEADO):
• Hook: 10-15 palabras informativas e interesantes
• Copy: 40-80 palabras con tono profesional
• Tipos de hook: FreeValue (información útil), Familiar (cercanía)
• Emojis: 2-3 emojis relevantes y profesionales (📰✨📊💡)
• Ejemplo: "📰 Lo que necesitas saber sobre [tema]: datos clave y perspectivas"

TWITTER (TWEET INFORMATIVO):
• 200-240 caracteres con voz profesional
• Hook: Frase que aporte valor
• Emojis: 1-2 relacionados con el tema
• Ejemplo: "📊 Nuevos datos sobre [tema]: lo que revelan las cifras"
```

**Characteristics:**
- **Content Length:** 500-700 palabras (STANDARD)
- **Hook Style:** BALANCED, informative, professional
- **Emojis:** 2-3 for Facebook (professional: 📰✨📊💡), 1-2 for Twitter
- **Hook Types:** Primarily "FreeValue" and "Familiar"
- **estimatedEngagement:** Typically "medium"

**JSON Output (same structure as above)**

---

### 1.3 DirectorEditorialPromptBuilderService
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/generator-pro/services/director-editorial-prompt-builder.service.ts`

**Purpose:** Free-form content generation from editorial instructions

**Lines:** 172-189 (Social Media Instructions)

**Current Prompt Text:**
```
📱 DIRECTRICES DE COPYS PARA REDES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACEBOOK (40-80 palabras):
• Hook con tu tono (informativo, emocional, crítico o irónico).
• Estructura: Hook → Contexto → Valor → CTA.
• Adapta emojis y ritmo a tu estilo.
• Tipos de hook: Scary, FreeValue, Strange, Sexy, Familiar

TWITTER (200-240 caracteres):
• Tuit con voz distintiva y mensaje directo.
• Usa tono coherente con tu personalidad periodística.
• Evita hashtags genéricos, prioriza naturalidad.
• 4 ideas para thread si aplica.

💬 Cada copy debe reflejar TU voz, no sonar genérico ni publicitario.
```

**JSON Output (lines 378-394):**
```javascript
"socialMediaCopies": {
  "facebook": {
    "hook": "Hook único en tu tono (10-15 palabras)",
    "copy": "Copy de 40-80 palabras en tu voz",
    "emojis": ["Emojis acordes al tono"],
    "hookType": "Scary|FreeValue|Strange|Sexy|Familiar",
    "estimatedEngagement": "high|medium|low"
  },
  "twitter": {
    "tweet": "Tweet de 200-240 caracteres con tu estilo",
    "hook": "Hook creativo y coherente",
    "emojis": ["Opcionales"],
    "hookType": "Tipo de hook usado",
    "threadIdeas": ["4 ideas para hilo si aplica"]
  }
}
```

**Differences from GeneratorProPromptBuilder:**
- Mentions "4 ideas para thread" explicitly in Twitter instructions
- Emphasizes agent personality more heavily
- Used for completely original content (no source URL)

---

## 2. SECONDARY LOCATION - Copy Refinement Service

### 2.1 CopyImproverService
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/content-ai/services/copy-improver.service.ts`

**Purpose:** Post-generation refinement of social media copys before publishing

**Lines:** 113-182 (Improve Copy Prompt)

**Current Prompt Text:**
```
Eres un experto en social media y copywriting. Tu tarea es mejorar los copys para Facebook y Twitter de una noticia.

**INSTRUCCIONES:**

1. **Facebook:**
   - Mejora el hook para que sea más atractivo y genere más engagement
   - Ajusta el copy para que tenga entre 40-80 palabras
   - Mantén máximo 4 emojis relevantes
   - Si se proporcionó URL, agrégala al final del copy
   - Determina el hookType: Scary, FreeValue, Strange, Sexy o Familiar
   - Estima el engagement: high, medium o low

2. **Twitter:**
   - Mejora el tweet para que sea conciso (200-240 caracteres recomendado)
   - Mantén máximo 2 emojis
   - Si se proporcionó URL, agrégala al final
   - Genera ideas para threads (2-3 ideas)
   - Mejora el hook
```

**When Used:**
- Before publishing to social media (optional enhancement step)
- Can add canonical URL to copys
- Receives existing copys as input and refines them

**NOT A PRIMARY GENERATOR** - This service improves already-generated copys

---

## 3. CONTENT AI MAIN SERVICE

### 3.1 ContentGenerationService
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/content-ai/services/content-generation.service.ts`

**Purpose:** Core content generation orchestrator (uses templates/providers)

**Social Media Prompt Sections:**

#### Lines 1143-1159 (Social Media Format Specification)
```javascript
"social_media_copies": {
  "facebook": {
    "hook": "Hook atractivo y variable",
    "copy": "Post de 80-120 palabras",
    "emojis": ["máximo 3 emojis relevantes"],
    "hookType": "Scary|FreeValue|Strange|Sexy|Familiar",
    "estimatedEngagement": "high|medium|low"
  },
  "twitter": {
    "tweet": "Tweet de 230-270 caracteres",
    "hook": "Hook conciso",
    "emojis": ["1-2 emojis"],
    "hookType": "Informativo|Provocador|Factual",
    "threadIdeas": ["2-3 ideas para thread"]
  }
}
```

**Notes:**
- This service validates the JSON structure (lines 1223-1230)
- Ensures Facebook, Twitter, and Instagram copys are present
- Used for general-purpose AI content generation
- More flexible than specialized services

---

## 4. DATA SCHEMA DEFINITION

### 4.1 AIContentGeneration Schema
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/content-ai/schemas/ai-content-generation.schema.ts`

**Lines:** 68-86

**Complete Schema Structure:**
```typescript
socialMediaCopies?: {
  facebook?: {
    hook: string;
    copy: string;
    emojis: string[];
    hookType: 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar';
    estimatedEngagement: 'high' | 'medium' | 'low';
  };
  twitter?: {
    tweet: string;
    hook: string;
    emojis: string[];
    hookType: string;
    threadIdeas: string[];
  };
  instagram?: string; // Caption para Instagram con emojis y hashtags
  linkedin?: string; // Post profesional para LinkedIn
}
```

**This is the SINGLE SOURCE OF TRUTH** for all social media copy structures

---

## 5. VALIDATION SERVICES

### 5.1 SocialMediaCopyGeneratorService
**File:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva/src/generator-pro/services/social-media-copy-generator.service.ts`

**Purpose:** Validates generated copys against 2025 best practices

**Validation Rules (lines 15-73):**

**Facebook Copy:**
- Hook: 10-15 palabras (flexible 5-20)
- Copy: 40-80 palabras mínimo (puede ser más)
- Emojis: Máximo 4

**Twitter Copy:**
- Tweet: 200-240 caracteres recomendado (máximo 250)
- Tweet mínimo: 50 caracteres
- Emojis: Máximo 2

**Methods:**
- `validateFacebookCopy()` - Returns validation errors
- `validateTwitterCopy()` - Returns validation errors
- `validateAllCopies()` - Validates complete social media package

---

## 6. COMPARISON: URGENT vs NORMAL CONTENT

| Aspect | URGENT Mode | NORMAL Mode |
|--------|-------------|-------------|
| **Content Length** | 300-500 palabras | 500-700 palabras |
| **Hook Style** | AGGRESSIVE, alarming | BALANCED, informative |
| **Facebook Copy** | 40-60 palabras | 40-80 palabras |
| **Facebook Emojis** | 3-4 (urgency: 🚨⚠️🔴💥⚡) | 2-3 (professional: 📰✨📊💡) |
| **Twitter Emojis** | 2-3 | 1-2 |
| **Hook Types** | Scary, Strange | FreeValue, Familiar |
| **Engagement** | High | Medium |
| **Tone** | Urgent, direct, shocking | Professional, balanced |
| **Use Case** | Breaking news, last minute | Standard articles, blogs |
| **Auto-Publish** | Yes (immediate) | Optional (user decides) |
| **Auto-Close** | Yes (2 hours) | No |

---

## 7. CURRENT ISSUES & LIMITATIONS

### 7.1 Inconsistencies Found

1. **Character Limits Variation:**
   - GeneratorProPromptBuilder: "200-240 caracteres"
   - ContentGenerationService: "230-270 caracteres"
   - **Recommendation:** Standardize to 200-240 (2025 best practice)

2. **Word Count Variation:**
   - Most services: "40-80 palabras"
   - ContentGenerationService: "80-120 palabras"
   - **Recommendation:** Standardize to 40-80 (optimal engagement)

3. **Emoji Counts:**
   - Facebook: Some prompts say "máximo 3", others "máximo 4"
   - **Recommendation:** Standardize to max 3 (2025 best practice)

4. **Hook Types:**
   - Twitter hookType is `string` in schema, not enum
   - ContentGenerationService uses different types: "Informativo|Provocador|Factual"
   - **Recommendation:** Standardize Twitter hookTypes to match Facebook

5. **Thread Ideas:**
   - GeneratorProPromptBuilder: "3-4 ideas"
   - DirectorEditorialPromptBuilder: "4 ideas"
   - CopyImproverService: "2-3 ideas"
   - **Recommendation:** Standardize to 3-4 ideas

### 7.2 Missing Features

1. **No Instagram Copy Generation** in urgent/normal modes
2. **No LinkedIn Copy Generation** in any mode
3. **No A/B Testing** copy variants mentioned in prompts
4. **No Persona/Audience Targeting** in copy instructions
5. **No Seasonal/Trending Topics** adaptation in prompts

---

## 8. HOOK TYPES - COMPLETE TAXONOMY

### 8.1 Current Hook Types (5 types)

1. **Scary** - Fear, alarm, urgency, threat
   - Example: "🚨 ÚLTIMA HORA: Lo que acaba de pasar..."
   - Best for: Breaking news, security, health alerts

2. **FreeValue** - Free information, education, utility
   - Example: "📰 Lo que necesitas saber sobre [tema]..."
   - Best for: Educational content, how-tos, guides

3. **Strange** - Surprise, shock, unusual facts
   - Example: "Lo que nadie te había contado sobre..."
   - Best for: Investigations, revelations, discoveries

4. **Sexy** - Desire, attraction, aspiration
   - Example: "El secreto mejor guardado de..."
   - Best for: Lifestyle, culture, entertainment

5. **Familiar** - Closeness, identification, community
   - Example: "Esto le pasa a todos los pachuqueños..."
   - Best for: Local news, community stories

### 8.2 Hook Type Usage by Content Type

| Content Type | Primary Hook Type | Secondary Hook Type |
|--------------|-------------------|---------------------|
| Breaking News (Urgent) | Scary | Strange |
| Normal Articles | FreeValue | Familiar |
| Investigations | Strange | Scary |
| Opinion/Analysis | Familiar | FreeValue |
| Culture/Entertainment | Sexy | Familiar |
| Local Community | Familiar | FreeValue |

---

## 9. RECOMMENDATIONS FOR 2025 COPYWRITING STRATEGY

### 9.1 Immediate Actions

1. **Standardize Character Limits:**
   - Facebook: 40-80 palabras
   - Twitter: 200-240 caracteres
   - Facebook Emojis: Max 3
   - Twitter Emojis: Max 2

2. **Unify Hook Types:**
   - Add Twitter hook type enum to schema
   - Use same 5 types across all platforms

3. **Add Context Variables:**
   - Time of day (morning/afternoon/night)
   - Day of week (weekday/weekend)
   - Breaking news flag
   - Local vs national scope

### 9.2 Medium-Term Improvements

1. **Persona-Based Copys:**
   - Target "busy professional"
   - Target "concerned parent"
   - Target "local activist"
   - Target "business owner"

2. **Platform-Specific Optimization:**
   - Facebook: Story-driven, emotional
   - Twitter: Data-driven, concise
   - Instagram: Visual-focused (currently missing)
   - LinkedIn: Professional insight (currently missing)

3. **Seasonal Adaptations:**
   - Holiday-specific language
   - Weather-related contexts
   - Local events awareness

### 9.3 Advanced Features

1. **A/B Testing Framework:**
   - Generate 2-3 copy variants
   - Track engagement per variant
   - Learn optimal patterns

2. **Trend Integration:**
   - Detect trending topics
   - Adapt language to current events
   - Use viral hooks appropriately

3. **Audience Segmentation:**
   - Different copys for different audience segments
   - Age-based language adaptation
   - Geographic context (Pachuca vs Tulancingo)

---

## 10. PROMPT ENGINEERING BEST PRACTICES IDENTIFIED

### 10.1 What's Working Well

1. **Clear Structure:** All prompts have clear sections (Facebook, Twitter)
2. **Examples:** Most prompts include example hooks
3. **Emoji Guidance:** Specific emoji suggestions for each tone
4. **Hook Type Taxonomy:** 5 clearly defined hook types
5. **Word/Character Limits:** Explicit limits prevent bloat

### 10.2 Areas for Improvement

1. **No Negative Examples:** Prompts don't show what NOT to do
2. **No Context Variables:** Missing time/day/urgency context
3. **Limited Tone Variation:** Only 2 main tones (aggressive, balanced)
4. **No Audience Targeting:** Doesn't adapt to demographics
5. **No Performance Feedback Loop:** Generated copys aren't evaluated

---

## 11. COMPLETE FILE INVENTORY

### Services Generating Social Media Copys:
1. `/src/generator-pro/services/generator-pro-prompt-builder.service.ts` (PRIMARY)
2. `/src/generator-pro/services/user-content.service.ts` (URGENT + NORMAL)
3. `/src/generator-pro/services/director-editorial-prompt-builder.service.ts` (EDITORIAL)
4. `/src/content-ai/services/content-generation.service.ts` (GENERAL AI)
5. `/src/content-ai/services/copy-improver.service.ts` (REFINEMENT)

### Validation Services:
6. `/src/generator-pro/services/social-media-copy-generator.service.ts` (VALIDATION)

### Schema Definitions:
7. `/src/content-ai/schemas/ai-content-generation.schema.ts` (DATA MODEL)

### Related Services (Publishing):
8. `/src/generator-pro/services/social-media-publishing.service.ts`
9. `/src/generator-pro/services/facebook-publishing.service.ts`
10. `/src/generator-pro/services/twitter-publishing.service.ts`

### Scheduler Services:
11. `/src/generator-pro/services/urgent-content-scheduler.service.ts` (AUTO-CLOSE)

---

## 12. NEXT STEPS FOR IMPLEMENTATION

### Phase 1: Standardization (Week 1)
- [ ] Align all character/word limits across services
- [ ] Standardize emoji counts (FB: 3, TW: 2)
- [ ] Unify hook type enums
- [ ] Create single source of truth for copy specs

### Phase 2: Enhancement (Week 2-3)
- [ ] Add context variables (time, day, urgency)
- [ ] Implement negative examples in prompts
- [ ] Add persona-based copy variants
- [ ] Create Instagram and LinkedIn copy generation

### Phase 3: Optimization (Week 4+)
- [ ] Implement A/B testing framework
- [ ] Add performance tracking per hook type
- [ ] Create feedback loop for copy improvement
- [ ] Develop trend detection and adaptation

---

## 13. CONCLUSION

The backend has a **well-structured social media copy generation system** with:

✅ **Strengths:**
- Consistent schema across all services
- Clear hook type taxonomy
- Separate urgent/normal modes
- Validation layer for quality control

⚠️ **Areas to Improve:**
- Standardize specifications across services
- Add more context awareness
- Implement persona targeting
- Create feedback/learning loops
- Generate copys for Instagram and LinkedIn

**The system is production-ready but can be significantly enhanced** by implementing the recommendations in this report, particularly around standardization and context-aware generation based on 2025 social media best practices.

---

**Report Generated:** 2025-10-23
**Analyst:** Jarvis (Claude Code Backend Architect)
**Status:** Complete and ready for implementation planning
