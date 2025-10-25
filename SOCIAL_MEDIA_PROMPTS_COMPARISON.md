# Social Media Copy Prompts - Side-by-Side Comparison
**Complete Prompt Text from All Services**

---

## 1. GENERATOR PRO PROMPT BUILDER (Scraped Content)
**File:** `generator-pro-prompt-builder.service.ts` | **Lines:** 336-351

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

**JSON Output Format:**
```json
{
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
}
```

---

## 2. USER CONTENT SERVICE - URGENT MODE (Breaking News)
**File:** `user-content.service.ts` | **Lines:** 742-793

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

**System Context:**
- Content length: 300-500 palabras (SHORTER)
- Auto-publishes immediately
- Auto-closes after 2 hours
- Purpose: Breaking news, last-minute updates

**JSON Output Format:**
```json
{
  "socialMediaCopies": {
    "facebook": {
      "hook": "Hook AGRESIVO 10-15 palabras",
      "copy": "Copy completo 40-60 palabras con urgencia",
      "emojis": ["🚨", "⚠️", "🔴", "💥"],
      "hookType": "Scary",
      "estimatedEngagement": "high"
    },
    "twitter": {
      "tweet": "Tweet urgente 200-240 caracteres",
      "hook": "Hook directo y urgente",
      "emojis": ["🔴", "⚡"],
      "hookType": "Scary",
      "threadIdeas": ["Idea 1", "Idea 2"]
    }
  }
}
```

---

## 3. USER CONTENT SERVICE - NORMAL MODE (Standard Articles)
**File:** `user-content.service.ts` | **Lines:** 876-927

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

**System Context:**
- Content length: 500-700 palabras (STANDARD)
- User decides publication type (noticia/blog/breaking)
- Does NOT auto-close
- Purpose: Normal articles, blog posts

**JSON Output Format:**
```json
{
  "socialMediaCopies": {
    "facebook": {
      "hook": "Hook balanceado 10-15 palabras",
      "copy": "Copy completo 40-80 palabras informativo",
      "emojis": ["📰", "✨", "📊"],
      "hookType": "FreeValue",
      "estimatedEngagement": "medium"
    },
    "twitter": {
      "tweet": "Tweet informativo 200-240 caracteres",
      "hook": "Hook profesional",
      "emojis": ["📊"],
      "hookType": "FreeValue",
      "threadIdeas": ["Idea 1", "Idea 2", "Idea 3"]
    }
  }
}
```

---

## 4. DIRECTOR EDITORIAL PROMPT BUILDER (Free-Form Instructions)
**File:** `director-editorial-prompt-builder.service.ts` | **Lines:** 172-189

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

**System Context:**
- User gives free-form instructions ("write about democratizing information")
- AI interprets and creates full article from scratch
- Minimum 800 palabras (LONGER than normal)
- Heavy emphasis on agent personality

**JSON Output Format:**
```json
{
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
}
```

---

## 5. CONTENT GENERATION SERVICE (General AI)
**File:** `content-generation.service.ts` | **Lines:** 1143-1159

```json
{
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
}
```

**Note:** This is only the JSON format specification, not a full prompt with instructions.

**System Context:**
- Most flexible/general-purpose service
- Uses dynamic prompt templates
- Validates JSON structure strictly
- Requires Facebook, Twitter, AND Instagram copys

---

## 6. COPY IMPROVER SERVICE (Post-Generation Refinement)
**File:** `copy-improver.service.ts` | **Lines:** 113-182

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

**System Context:**
- NOT a primary generator (refines existing copys)
- Called before publishing to social media
- Can inject canonical URL into copys
- Receives existing copy as input

**JSON Output Format:**
```json
{
  "facebook": {
    "hook": "Hook mejorado aquí",
    "copy": "Copy mejorado aquí [URL]",
    "emojis": ["🔥", "📰"],
    "hookType": "Scary",
    "estimatedEngagement": "high"
  },
  "twitter": {
    "tweet": "Tweet mejorado aquí [URL]",
    "hook": "Hook mejorado para Twitter",
    "emojis": ["📰"],
    "hookType": "FreeValue",
    "threadIdeas": ["Idea 1 para thread", "Idea 2 para thread"]
  }
}
```

---

## INCONSISTENCIES SUMMARY

### Character Limits
| Service | Facebook Copy | Twitter Tweet |
|---------|---------------|---------------|
| Generator Pro | 40-80 palabras | 200-240 caracteres |
| User Content (Urgent) | 40-60 palabras | 200-240 caracteres |
| User Content (Normal) | 40-80 palabras | 200-240 caracteres |
| Director Editorial | 40-80 palabras | 200-240 caracteres |
| Content Generation | **80-120 palabras** ⚠️ | **230-270 caracteres** ⚠️ |
| Copy Improver | 40-80 palabras | 200-240 caracteres |

**RECOMMENDATION:** Standardize to **40-80 palabras** (FB) and **200-240 caracteres** (TW)

---

### Emoji Limits
| Service | Facebook | Twitter |
|---------|----------|---------|
| Generator Pro | Not specified | Not specified |
| User Content (Urgent) | 3-4 emojis | 2-3 emojis |
| User Content (Normal) | 2-3 emojis | 1-2 emojis |
| Director Editorial | Not specified | Not specified |
| Content Generation | **Max 3** | 1-2 emojis |
| Copy Improver | **Max 4** ⚠️ | Max 2 |

**RECOMMENDATION:** Standardize to **Max 3** (FB) and **Max 2** (TW)

---

### Thread Ideas Count
| Service | Count |
|---------|-------|
| Generator Pro | "Ideas para hilo si aplica" |
| User Content (Urgent) | 2 ideas |
| User Content (Normal) | 3 ideas |
| Director Editorial | **4 ideas** ⚠️ |
| Content Generation | **2-3 ideas** |
| Copy Improver | 2-3 ideas |

**RECOMMENDATION:** Standardize to **3-4 ideas**

---

### Hook Types - Twitter
| Service | Twitter Hook Types |
|---------|-------------------|
| Generator Pro | "Tipo de hook usado" (unspecified) |
| User Content (Urgent) | Scary |
| User Content (Normal) | FreeValue |
| Director Editorial | "Tipo de hook usado" (unspecified) |
| Content Generation | **Informativo\|Provocador\|Factual** ⚠️ |
| Copy Improver | (Inherits from input) |

**RECOMMENDATION:** Use same 5 hook types as Facebook across all platforms

---

## HOOK TYPE EXAMPLES BY CATEGORY

### 1. Scary (Miedo/Alarma/Urgencia)
**Best For:** Breaking news, security alerts, health emergencies

**Facebook Examples:**
- 🚨 ÚLTIMA HORA: Lo que acaba de pasar en [lugar] tiene a todos en shock
- ⚠️ ALERTA: Situación crítica se desarrolla en este momento en [zona]
- 🔴 URGENTE: Autoridades piden evitar [área] por [razón grave]

**Twitter Examples:**
- 🔴 AHORA: Situación crítica en [lugar]. Lo que sabemos 👇
- 🚨 ÚLTIMA HORA: [Autoridad] confirma [hecho grave]
- ⚠️ ALERTA: Esto está pasando EN VIVO en [zona]

---

### 2. FreeValue (Información Útil/Educativa)
**Best For:** Educational content, guides, useful data

**Facebook Examples:**
- 📰 Lo que necesitas saber sobre [tema]: datos clave y perspectivas
- 💡 Guía completa: Todo lo que debes entender sobre [situación]
- ✨ Información clave que te ayudará con [problema/tema]

**Twitter Examples:**
- 📊 Nuevos datos sobre [tema]: lo que revelan las cifras
- 💡 5 puntos clave para entender [situación]
- 📰 La información completa sobre [tema] que buscabas

---

### 3. Strange (Sorpresa/Extrañeza/Revelación)
**Best For:** Investigations, unusual facts, discoveries

**Facebook Examples:**
- 🤯 Lo que nadie te había contado sobre [tema] hasta ahora
- 👀 El dato que todos están comentando sobre [situación]
- ❗ La revelación que cambia todo lo que sabíamos sobre [tema]

**Twitter Examples:**
- 👀 El dato sorprendente detrás de [situación]
- 🤯 Lo que nadie esperaba: [revelación]
- ❗ La información que todos están comentando

---

### 4. Sexy (Atractivo/Deseo/Aspiración)
**Best For:** Lifestyle, culture, entertainment, aspirational content

**Facebook Examples:**
- ✨ El secreto mejor guardado de [lugar/persona/tema]
- 💎 La experiencia que todos quieren vivir en [lugar]
- 🌟 Descubre lo que hace especial a [tema/lugar]

**Twitter Examples:**
- ✨ El secreto detrás de [éxito/fenómeno]
- 💎 La joya oculta de [lugar/tema]
- 🌟 Lo que hace único a [tema]

---

### 5. Familiar (Cercanía/Identificación/Comunidad)
**Best For:** Local news, community stories, relatable content

**Facebook Examples:**
- 🏠 Esto le pasa a todos los pachuqueños y hoy lo confirmamos
- 👥 La historia que nos une como comunidad en [lugar]
- ❤️ Lo que todos en [ciudad] estamos viviendo en este momento

**Twitter Examples:**
- 🏠 Si eres de Pachuca, esto te va a resonar
- 👥 La realidad de todos en [comunidad]
- ❤️ Lo que nos une como [grupo/comunidad]

---

## RECOMMENDED UNIFIED PROMPT (2025 Best Practices)

```
📱 COPYS PARA REDES SOCIALES - GUÍA 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FACEBOOK:
• Hook: 10-15 palabras impactantes (adapta a tu tono)
• Copy Total: 40-80 palabras
• Estructura: Hook → Contexto → Valor → [URL si aplica]
• Emojis: Máximo 3 (relevantes y acordes al tema)
• Hook Type: Scary | FreeValue | Strange | Sexy | Familiar
• Estima engagement: high | medium | low

TWITTER:
• Tweet: 200-240 caracteres (deja espacio para URL)
• Hook: Frase directa que genere click
• Emojis: Máximo 2
• Hook Type: Scary | FreeValue | Strange | Sexy | Familiar
• Thread Ideas: 3-4 ideas para desarrollar en thread

REGLAS CLAVE:
✅ Adapta el tono a la personalidad del agente
✅ Usa lenguaje natural, evita hashtags genéricos
✅ El hook debe reflejar honestamente el contenido
✅ Prioriza valor sobre clickbait engañoso
✅ Agrega URL al final si está disponible

JSON RESPONSE:
{
  "socialMediaCopies": {
    "facebook": {
      "hook": "Hook 10-15 palabras",
      "copy": "Copy completo 40-80 palabras + URL",
      "emojis": ["emoji1", "emoji2", "emoji3"],
      "hookType": "Scary|FreeValue|Strange|Sexy|Familiar",
      "estimatedEngagement": "high|medium|low"
    },
    "twitter": {
      "tweet": "Tweet 200-240 chars + URL",
      "hook": "Hook directo",
      "emojis": ["emoji1", "emoji2"],
      "hookType": "Scary|FreeValue|Strange|Sexy|Familiar",
      "threadIdeas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4"]
    }
  }
}
```

---

**Document Created:** 2025-10-23
**Purpose:** Side-by-side comparison for copywriting strategy optimization
**Status:** Ready for implementation planning
