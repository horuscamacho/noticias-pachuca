# Bug: Content Generation AI Hallucinations - Inferencias sin contexto

**Fecha:** 13 octubre 2025
**Reportado por:** Coyotito
**Severidad:** ALTA
**Archivo afectado:** `packages/api-nueva/src/content-ai/services/content-generation.service.ts` (líneas 873-1038)

---

## 🐛 Descripción del Problema

El modelo de generación de contenido está realizando **inferencias basadas en su conocimiento de entrenamiento** en lugar de adherirse estrictamente a los hechos presentados en la noticia original.

### Ejemplo del Bug

**Input (noticia original):**
```
La presidenta Claudia Sheinbaum afirmó este lunes que las autoridades no esperaban las lluvias tan intensas...
```

**Output generado (INCORRECTO):**
```
Durante una conferencia de prensa celebrada este lunes, la jefa de Gobierno de la Ciudad de México, Claudia Sheinbaum, abordó el impacto...
```

### Por qué es un problema

1. **Desinformación**: El modelo dice "jefa de Gobierno" cuando la noticia claramente dice "presidenta"
2. **Conocimiento desactualizado**: El modelo (GPT-4o-mini con cutoff 2018) no sabe que Sheinbaum ya es presidenta
3. **Falta de grounding**: El prompt no fuerza suficientemente al modelo a usar SOLO los hechos del input
4. **Pérdida de credibilidad**: Los lectores detectarán información incorrecta

---

## 🔬 Análisis Técnico

### Investigación de Mejores Prácticas 2025

Basado en investigación de últimas técnicas para prevenir alucinaciones en LLMs:

#### 1. **Source-Aware Prompting** ⭐ (Más efectiva)
```
"Usa ÚNICAMENTE información del texto proporcionado. Si algo no está en el texto, NO lo menciones."
```

#### 2. **Grounding Estricto con Prohibiciones Explícitas**
```
❌ NO uses tu conocimiento previo
❌ NO hagas suposiciones
❌ NO infiera contextos que no están en el texto
✅ SOLO usa hechos textuales del input
```

#### 3. **Chain-of-Verification (CoVe)**
Hacer que el modelo verifique su output contra el input antes de responder.

#### 4. **Reflective Prompting**
```
"Antes de responder, verifica que CADA afirmación esté en el texto original."
```

#### 5. **"According to" Framing**
Forzar frases como "Según la noticia...", "El texto indica...", "De acuerdo con..."

---

## 📊 Comparación: Prompt Actual vs Prompt Mejorado

### ❌ Problema en el Prompt Actual

El prompt actual (líneas 873-1038) tiene:
- ✅ MUCHAS instrucciones sobre creatividad y extensión
- ✅ Buenas instrucciones sobre estructura y formato
- ❌ POCAS instrucciones sobre fidelidad factual
- ❌ NO prohibe explícitamente inferencias
- ❌ NO pide verificación contra la fuente

**Fragmento actual:**
```typescript
const optimizedPrompt = `Eres Jarvis, el asistente editorial de Pachuca Noticias...

📝 REGLAS PARA CONTENIDO EXTENSO:
EXTENSIÓN MÍNIMA OBLIGATORIA: 800-1200 palabras

ESTRUCTURA DETALLADA (distribución de palabras):
1. LEAD/ENTRADA (100-150 palabras)
2. DESARROLLO CONTEXTUAL (200-300 palabras)
3. CUERPO PRINCIPAL (300-400 palabras)
...
```

**Lo que falta:**
- NO hay instrucciones explícitas de "NO INVENTES"
- NO hay validación contra el texto fuente
- NO hay advertencia sobre usar conocimiento previo

---

## ✅ Solución Propuesta

### Modificación del Prompt (Agregar ANTES del contenido)

Insertar estas instrucciones **CRÍTICAS** al inicio del prompt (después de la línea 873):

```typescript
const optimizedPrompt = `Eres Jarvis, el asistente editorial de Pachuca Noticias...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGLAS CRÍTICAS DE FIDELIDAD FACTUAL (LEE PRIMERO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRINCIPIO FUNDAMENTAL - SOURCE GROUNDING:
• USA ÚNICAMENTE información explícitamente presente en el CONTENIDO DE LA NOTICIA proporcionado
• Si la noticia dice "presidenta", escribe "presidenta" (NO "jefa de gobierno")
• Si la noticia dice "alcalde", escribe "alcalde" (NO "presidente municipal")
• COPIA EXACTAMENTE los títulos, cargos, y nombres tal como aparecen en el input

❌ PROHIBICIONES ABSOLUTAS:
1. NO uses tu conocimiento previo o memoria de entrenamiento
2. NO hagas suposiciones sobre cargos, fechas, o contextos
3. NO infiera información que no está explícitamente en el texto
4. NO "corrijas" información del texto original aunque creas que está mal
5. NO agregues datos históricos que no están en la noticia
6. NO uses información de tu cutoff de entrenamiento

✅ OBLIGACIONES ESTRICTAS:
1. VERIFICA cada nombre propio contra el texto original
2. CONFIRMA cada cargo o título exactamente como aparece
3. USA las fechas y números tal cual están en el input
4. MANTÉN la terminología exacta del texto fuente
5. SI dudas de un detalle, revisa el input nuevamente

🔍 PROCESO DE VERIFICACIÓN (APLICA SIEMPRE):
Antes de generar cada párrafo:
1. ¿Este hecho está textualmente en el input? → ✅ Úsalo / ❌ Descártalo
2. ¿Estoy usando el cargo/título exacto del input? → Verificar
3. ¿Estoy agregando contexto de mi entrenamiento? → ❌ PROHIBIDO

📋 EJEMPLOS DE FIDELIDAD:

CORRECTO ✅:
Input: "La presidenta Claudia Sheinbaum declaró..."
Output: "La presidenta Claudia Sheinbaum declaró..."

INCORRECTO ❌:
Input: "La presidenta Claudia Sheinbaum declaró..."
Output: "La jefa de Gobierno Claudia Sheinbaum declaró..." ← PROHIBIDO

CORRECTO ✅:
Input: "El secretario de Marina, Raymundo Morales..."
Output: "El secretario de Marina, Raymundo Morales..."

INCORRECTO ❌:
Input: "El secretario de Marina, Raymundo Morales..."
Output: "El almirante Raymundo Morales..." ← PROHIBIDO

⚡ REGLA DE ORO:
"Cuando hay conflicto entre tu conocimiento y el texto, el texto SIEMPRE gana"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<thinking>
Voy a procesar esta noticia siguiendo estos pasos:
1. Extraer TODOS los hechos relevantes del input SIN AGREGAR NADA
2. Identificar personajes, fechas, lugares, cifras, declaraciones TAL COMO ESTÁN
3. VERIFICAR cada elemento contra el texto original antes de usarlo
4. Determinar múltiples ángulos editoriales posibles BASADOS EN EL TEXTO
5. Crear título ÚNICO y CREATIVO usando técnicas de variación
6. Desarrollar contenido EXTENSO y DETALLADO PERO FIEL A LA FUENTE
7. Generar keywords y tags basados en el contenido real
8. Crear copys sociales con hooks únicos y llamativos
</thinking>

🎯 REGLAS CRÍTICAS PARA TÍTULOS:
...
[resto del prompt actual]
```

---

## 🔧 Implementación

### Paso 1: Modificar el archivo

Editar: `packages/api-nueva/src/content-ai/services/content-generation.service.ts`

**Línea ~873** - Método `preparePromptFromTemplate()`

Agregar la sección de "REGLAS CRÍTICAS DE FIDELIDAD FACTUAL" inmediatamente después de:
```typescript
const optimizedPrompt = `Eres Jarvis, el asistente editorial de Pachuca Noticias...
```

### Paso 2: Agregar validación post-generación (opcional pero recomendado)

Agregar un método de verificación después de `parseAndValidateResponse()`:

```typescript
/**
 * 🔍 Verificar fidelidad factual del contenido generado
 */
private verifyFactualFidelity(
  generatedContent: string,
  originalContent: string
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Extraer nombres propios del original
  const originalNames = this.extractProperNouns(originalContent);
  const generatedNames = this.extractProperNouns(generatedContent);

  // Verificar que los nombres/cargos no hayan cambiado
  for (const originalName of originalNames) {
    const found = generatedNames.some(genName =>
      genName.toLowerCase().includes(originalName.toLowerCase())
    );

    if (!found) {
      warnings.push(`Posible alucinación: "${originalName}" del original no encontrado en generado`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

private extractProperNouns(text: string): string[] {
  // Regex simple para nombres propios (capitalización)
  const regex = /\b[A-ZÑÁÉÍÓÚ][a-zñáéíóúü]+(?:\s+[A-ZÑÁÉÍÓÚ][a-zñáéíóúü]+)*\b/g;
  return text.match(regex) || [];
}
```

### Paso 3: Testing

Probar con casos problemáticos:

```bash
# Test 1: Cargo correcto (presidenta vs jefa de gobierno)
# Test 2: Fechas actuales vs conocimiento histórico
# Test 3: Nombres exactos sin modificación
```

---

## 📈 Resultados Esperados

### Antes (Con bug):
```
Input: "La presidenta Claudia Sheinbaum..."
Output: "La jefa de Gobierno de la Ciudad de México, Claudia Sheinbaum..." ❌
```

### Después (Corregido):
```
Input: "La presidenta Claudia Sheinbaum..."
Output: "La presidenta Claudia Sheinbaum..." ✅
```

---

## 🔗 Referencias

1. **Prompt Engineering Methods to Reduce Hallucinations (2025)**
   - Source-Aware Prompting
   - Chain-of-Verification (CoVe)
   - Reflective Prompting

2. **OpenAI Best Practices**
   - "Answer based only on the text below"
   - Explicit instruction to avoid knowledge base

3. **Lakera AI - LLM Hallucinations Guide 2025**
   - Grounding techniques
   - Verification strategies

---

## ⏰ Prioridad de Implementación

**ALTA** - Este bug afecta la credibilidad del contenido generado

**Impacto:**
- 🔴 Desinformación a usuarios
- 🔴 Pérdida de confianza
- 🟡 Más trabajo de revisión manual

**Esfuerzo estimado:** 2-3 horas
- 1 hora: Modificación del prompt
- 1 hora: Testing exhaustivo
- 30 min: Validación con casos reales

---

## 📝 Notas Adicionales

El modelo actual (GPT-4o-mini con cutoff 2018) es especialmente vulnerable a este tipo de errores con información política reciente. Las instrucciones explícitas de grounding son CRÍTICAS para este caso de uso.

**Alternativa a largo plazo:** Considerar upgrade a modelo con cutoff más reciente (GPT-4 Turbo 2024+) que tenga contexto de Sheinbaum como presidenta.
