# Análisis: Problema de Enriquecimiento HTML en Contenido Generado

**Fecha:** 2025-10-21
**Analista:** Jarvis
**Proyecto:** Noticias Pachuca
**Versión del Documento:** 1.0

---

## 1. Diagnóstico del Problema

### ¿Por qué NO se está enriqueciendo?

El contenido NO se está enriqueciendo con HTML porque el **prompt de generación actual (v2.0)** en el archivo `/packages/api-nueva/src/content-ai/services/content-generation.service.ts` (líneas 879-1006) especifica que el campo `content` debe ser texto plano:

```json
{
  "content": "Artículo de 800-1200 palabras con estructura orgánica y flujo natural"
}
```

**Hallazgos clave:**
1. El prompt NO instruye al AI para agregar etiquetas HTML
2. El formato de salida esperado es JSON con texto plano
3. NO hay un paso de post-procesamiento para agregar HTML
4. El método `verifyFactualFidelity` (línea 1139) trabaja con texto plano

### ¿Dónde debería pasar?

El enriquecimiento HTML debería ocurrir en uno de estos puntos:

1. **Durante la generación** (línea 1380): El AI genera directamente con HTML
2. **Post-procesamiento** (después de línea 1385): Transformar el texto plano a HTML
3. **Servicio separado**: Un servicio dedicado de enriquecimiento HTML

### Estado actual del flujo

```
1. Noticia Original (texto plano)
        ↓
2. Prompt de Generación (sin instrucciones HTML)
        ↓
3. AI genera JSON con content en texto plano
        ↓
4. Se parsea y valida (sin HTML)
        ↓
5. Se guarda en DB (sin HTML) ❌
        ↓
6. Se muestra al usuario (sin formato) ❌
```

---

## 2. Evaluación de Opciones

### Opción A: Enriquecimiento en Prompt Principal
**Descripción**: Modificar el prompt v2.0 para que ChatGPT genere directamente el contenido con HTML embebido.

**Pros**:
- ✅ Solución más simple (solo modificar el prompt)
- ✅ Un solo paso de procesamiento
- ✅ El AI entiende el contexto y puede decidir mejor dónde aplicar formato
- ✅ Mantiene coherencia entre contenido y formato

**Contras**:
- ❌ Aumenta el tamaño del output (más tokens)
- ❌ Puede generar HTML inconsistente o mal formado
- ❌ Dificulta la verificación de plagio (HTML mezclado con contenido)
- ❌ El método `verifyFactualFidelity` necesitaría actualización

**Recomendación**: ⭐⭐⭐⭐☆

### Opción B: Post-procesamiento Separado
**Descripción**: Mantener la generación en texto plano y agregar un paso adicional que enriquece con HTML.

**Pros**:
- ✅ Separación de responsabilidades clara
- ✅ Formato HTML consistente y predecible
- ✅ Fácil de desactivar o modificar sin tocar la generación
- ✅ Verificación de plagio más simple (trabaja con texto plano)

**Contras**:
- ❌ Paso adicional de procesamiento
- ❌ Podría aplicar formato en lugares incorrectos
- ❌ No aprovecha el contexto completo del AI
- ❌ Más complejidad en el código

**Recomendación**: ⭐⭐⭐☆☆

---

## 3. Solución Recomendada

### Opción Elegida: A (Enriquecimiento en Prompt Principal)

**Justificación:**
- El usuario específicamente dijo: "El último prompt que revisa que no haya plagio **también debe enriquecer el texto**"
- ChatGPT/Claude entienden HTML perfectamente y pueden generarlo de forma coherente
- Minimiza la complejidad del sistema (no agrega pasos adicionales)
- El contexto completo permite mejor decisión sobre dónde aplicar formato

### Implementación Paso a Paso

#### Paso 1: Actualizar el Prompt de Generación
Modificar el método `preparePromptFromTemplate` en `content-generation.service.ts` (línea 871)

#### Paso 2: Actualizar la Validación
Modificar `parseAndValidateResponse` para aceptar HTML (línea 1014)

#### Paso 3: Actualizar Verificación de Fidelidad
Modificar `verifyFactualFidelity` para trabajar con HTML (línea 1139)

### Código del Prompt

```typescript
// En content-generation.service.ts, línea 871
private preparePromptFromTemplate(template: any, variables: Record<string, string>): string {
    const enhancedPrompt = `Eres Jarvis, el editor principal de Noticias Pachuca, con un estilo editorial distintivo y adaptable.

🎯 TU MISIÓN PRINCIPAL:
Transformar información en narrativas periodísticas que informen, enganchen y resuenen con nuestra audiencia de Hidalgo.

📝 NOTICIA A TRANSFORMAR:
Título Original: ${variables.title}
Contenido: ${variables.content}

🎨 ENFOQUE CREATIVO:
1. ANALIZA el contenido y decide qué tipo de historia es
2. ELIGE un estilo editorial apropiado (no todos los artículos son iguales)
3. CONSTRUYE una narrativa con ritmo natural y variado
4. IMPRIME tu voz editorial única en cada pieza
5. **ENRIQUECE con HTML para mejor legibilidad**

✨ PRINCIPIOS EDITORIALES:

LONGITUD TOTAL: 800-1200 palabras
- Estructura en párrafos HTML bien formados
- Algunos párrafos cortos (30 palabras) para impacto
- Otros largos (150+ palabras) para desarrollo
- Varía según el ritmo de la historia

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 ENRIQUECIMIENTO HTML OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUCTURA HTML REQUERIDA:

1. PÁRRAFOS:
   - TODO el contenido DEBE estar dentro de etiquetas <p></p>
   - Un <p> por cada párrafo lógico
   - NO dejes texto suelto sin etiquetas

2. ÉNFASIS Y RESALTADO:
   - <strong> para conceptos clave, nombres importantes, cifras críticas
   - <em> para énfasis sutil, citas indirectas, términos especiales
   - Usa con moderación: 2-3 <strong> y 2-3 <em> por cada 200 palabras

3. CITAS Y TESTIMONIOS:
   - <blockquote><p>"Cita textual aquí..."</p></blockquote>
   - Solo para citas directas de personas

4. LISTAS (cuando aplique):
   - <ul><li>Para puntos no ordenados</li></ul>
   - <ol><li>Para secuencias o pasos</li></ol>

5. SUBTÍTULOS (opcional, solo si mejora la lectura):
   - <h2>Para secciones principales</h2>
   - <h3>Para subsecciones</h3>
   - Máximo 2-3 subtítulos en todo el artículo

EJEMPLO DE FORMATO CORRECTO:
<p>El <strong>alcalde Juan Pérez</strong> anunció hoy un incremento del <strong>15%</strong> en el presupuesto destinado a seguridad pública. Esta medida, que entrará en vigor el próximo mes, representa una <em>inversión histórica</em> para el municipio.</p>

<p>Durante la conferencia de prensa, el funcionario destacó que los recursos se destinarán principalmente a tres áreas:</p>

<ul>
<li>Adquisición de <strong>50 nuevas patrullas</strong></li>
<li>Capacitación especializada para <em>200 oficiales</em></li>
<li>Modernización del sistema de videovigilancia</li>
</ul>

<blockquote>
<p>"Es momento de tomar acciones contundentes para garantizar la seguridad de nuestras familias", expresó el alcalde.</p>
</blockquote>

REGLAS HTML ESTRICTAS:
✅ SIEMPRE cerrar todas las etiquetas
✅ NO anidar <p> dentro de <p>
✅ NO usar <br> - usa párrafos separados
✅ NO usar estilos inline (style="...")
✅ NO usar etiquetas obsoletas (<b>, <i>, <font>)
✅ Validar que todo el HTML esté bien formado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUCTURA ORGÁNICA:
- No fuerces 5 secciones si 3 funcionan mejor
- Deja que el contenido dicte la forma
- Puede ser cronológica, temática, o narrativa
- Prioriza fluidez sobre fórmula

VOZ Y ESTILO:
- Profesional pero accesible
- Usa lenguaje vivo y específico de Hidalgo cuando sea relevante
- Evita jerga periodística trillada
- Conecta con experiencias locales auténticas

🛡️ ANTI-PLAGIO Y TRANSFORMACIÓN CREATIVA:

MANTÉN EXACTO (Precisión es sagrada):
• Nombres de instituciones, personas, cargos políticos
• Cifras, fechas, lugares específicos
• Términos técnicos y nombres propios

TRANSFORMA 100% (Esto SÍ previene plagio):
• CAMBIA el orden en que presentas la información
• USA un ángulo narrativo diferente
• ENFOCA en aspectos que el original no enfatizó
• CONECTA ideas con transiciones propias
• AGREGA contexto LOCAL relevante de Pachuca

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ PRECISIÓN FACTUAL - NO NEGOCIABLE ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COPIA TEXTUALMENTE del contenido original:
• NOMBRES con CARGOS EXACTOS
• FECHAS tal cual aparecen
• CIFRAS y números exactos
• LUGARES específicos
• TÉRMINOS TÉCNICOS exactos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título único y creativo (sin HTML)",
  "content": "Artículo de 800-1200 palabras COMPLETAMENTE ENRIQUECIDO CON HTML. Todo el contenido debe estar dentro de etiquetas HTML apropiadas.",
  "keywords": ["mínimo 8 keywords específicas"],
  "tags": ["mínimo 5 tags relevantes"],
  "category": "Política|Deportes|Cultura|Economía|Seguridad|Salud|Educación|Tecnología",
  "summary": "Resumen de 3-4 líneas con puntos clave (sin HTML)",
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

IMPORTANTE: El campo "content" DEBE contener HTML válido y bien formado. NO texto plano.

RESPONDE SOLO CON EL JSON. NO AGREGUES EXPLICACIONES.`;

    return enhancedPrompt;
}
```

---

## 4. Reglas de Enriquecimiento HTML

### Estructura Básica

#### Elementos Permitidos
- **`<p>`**: Todos los párrafos (obligatorio)
- **`<strong>`**: Conceptos importantes, nombres clave, cifras críticas
- **`<em>`**: Énfasis sutil, términos especiales
- **`<blockquote>`**: Citas textuales con `<p>` interno
- **`<h2>`, `<h3>`**: Subtítulos cuando mejoren la estructura
- **`<ul>`, `<ol>`, `<li>`**: Listas cuando sea apropiado

#### Elementos Prohibidos
- ❌ `<br>` - usar párrafos separados
- ❌ `<b>`, `<i>` - usar `<strong>`, `<em>`
- ❌ `style=""` - no estilos inline
- ❌ `<font>`, `<center>` - etiquetas obsoletas
- ❌ `<div>`, `<span>` - mantener simple

### Ejemplo Antes/Después

#### ANTES (Texto Plano):
```
Mineral de la Reforma, Hidalgo, 19 de octubre de 2025. Una tarde que parecía transcurrir con normalidad se convirtió en un episodio de emergencia cuando una unidad de transporte público sufrió un percance en la transitada carretera Pachuca-Tulancingo.

El incidente ocurrió aproximadamente a las 14:30 horas cuando el vehículo, que transportaba 25 pasajeros, experimentó una falla mecánica que obligó al conductor a realizar una maniobra de emergencia.
```

#### DESPUÉS (Con HTML):
```html
<p><strong>Mineral de la Reforma, Hidalgo, 19 de octubre de 2025.</strong> Una tarde que parecía transcurrir con normalidad se convirtió en un <em>episodio de emergencia</em> cuando una unidad de transporte público sufrió un percance en la transitada carretera <strong>Pachuca-Tulancingo</strong>.</p>

<p>El incidente ocurrió aproximadamente a las <strong>14:30 horas</strong> cuando el vehículo, que transportaba <strong>25 pasajeros</strong>, experimentó una falla mecánica que obligó al conductor a realizar una <em>maniobra de emergencia</em>.</p>
```

---

## 5. Testing

### Cómo Validar

#### Checklist de Validación HTML
- [ ] Todo el contenido está dentro de etiquetas `<p>`
- [ ] Las etiquetas están correctamente cerradas
- [ ] No hay etiquetas anidadas incorrectamente
- [ ] El HTML pasa validación W3C
- [ ] Los nombres y cifras mantienen precisión factual
- [ ] El formato mejora la legibilidad sin distraer

#### Validación en Código

```typescript
// Agregar después de línea 1385 en content-generation.service.ts
private validateHTMLContent(content: string): boolean {
    // Verificar que tiene etiquetas HTML básicas
    const hasHTMLTags = /<p>.*<\/p>/.test(content);

    // Verificar que no es solo texto plano
    const htmlTagCount = (content.match(/<[^>]+>/g) || []).length;
    const minExpectedTags = 20; // Al menos 10 pares de etiquetas

    // Verificar balance de etiquetas
    const openTags = (content.match(/<[^\/][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]+>/g) || []).length;
    const tagsBalanced = Math.abs(openTags - closeTags) < 3; // Tolerancia pequeña

    return hasHTMLTags && htmlTagCount >= minExpectedTags && tagsBalanced;
}
```

### Casos de Prueba

#### Caso 1: Noticia Simple
**Input**: "El alcalde anunció nueva inversión de 10 millones"
**Output Esperado**:
```html
<p>El <strong>alcalde</strong> anunció una nueva inversión de <strong>10 millones de pesos</strong>...</p>
```

#### Caso 2: Con Citas
**Input**: "El gobernador dijo: 'Este es un momento histórico'"
**Output Esperado**:
```html
<p>El <strong>gobernador</strong> expresó su satisfacción por el logro alcanzado.</p>
<blockquote>
<p>"Este es un momento histórico"</p>
</blockquote>
```

#### Caso 3: Con Lista
**Input**: "Se implementarán tres medidas: seguridad, educación y salud"
**Output Esperado**:
```html
<p>Se implementarán <strong>tres medidas fundamentales</strong>:</p>
<ul>
<li>Mejoras en <strong>seguridad pública</strong></li>
<li>Inversión en <em>educación básica</em></li>
<li>Ampliación de servicios de <strong>salud</strong></li>
</ul>
```

---

## 6. Implementación Alternativa (Opción B)

Si la Opción A presenta problemas, aquí está la implementación de post-procesamiento:

```typescript
// Nuevo método para agregar después de línea 1466
private enrichContentWithHTML(plainText: string): string {
    if (!plainText) return '';

    // Dividir en párrafos
    let paragraphs = plainText.split(/\n\n+/);

    // Procesar cada párrafo
    paragraphs = paragraphs.map(paragraph => {
        if (!paragraph.trim()) return '';

        // Detectar si es una cita (comienza con comillas o guión)
        if (/^[""].*[""]$/.test(paragraph.trim())) {
            return `<blockquote><p>${paragraph.trim()}</p></blockquote>`;
        }

        // Aplicar formato a números importantes (más de 3 dígitos)
        paragraph = paragraph.replace(/\b(\d{3,}(?:,\d{3})*(?:\.\d+)?)\b/g, '<strong>$1</strong>');

        // Aplicar formato a porcentajes
        paragraph = paragraph.replace(/\b(\d+(?:\.\d+)?%)\b/g, '<strong>$1</strong>');

        // Resaltar nombres propios (palabras capitalizadas de más de 3 letras)
        paragraph = paragraph.replace(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\b/g, (match) => {
            // Solo aplicar strong a nombres de personas/lugares importantes
            const importantWords = ['Pachuca', 'Hidalgo', 'Mineral', 'Reforma', 'Tulancingo'];
            if (importantWords.some(word => match.includes(word))) {
                return `<strong>${match}</strong>`;
            }
            return match;
        });

        // Detectar y formatear listas
        if (/^[-•*]\s/.test(paragraph)) {
            const items = paragraph.split(/\n[-•*]\s/);
            const listItems = items
                .filter(item => item.trim())
                .map(item => `<li>${item.trim()}</li>`)
                .join('\n');
            return `<ul>\n${listItems}\n</ul>`;
        }

        // Párrafo normal
        return `<p>${paragraph.trim()}</p>`;
    });

    return paragraphs.filter(p => p).join('\n\n');
}

// Usar en generateFromNews, después de línea 1385:
if (!this.validateHTMLContent(result.content)) {
    this.logger.warn('Content does not contain HTML, applying enrichment...');
    result.content = this.enrichContentWithHTML(result.content);
}
```

---

## 7. Monitoreo y Métricas

### Métricas a Rastrear

```typescript
// Agregar a generationMetadata
generationMetadata: {
    // ... existing fields
    htmlEnrichment: {
        applied: boolean,
        method: 'ai-generated' | 'post-processed' | 'none',
        tagCount: number,
        validationPassed: boolean,
        enrichmentTime: number
    }
}
```

### Dashboard de Monitoreo

Crear vista para monitorear:
- Porcentaje de contenidos con HTML válido
- Tipos de etiquetas más usadas
- Errores de validación HTML
- Tiempo de enriquecimiento promedio

---

## 8. Rollback Plan

Si la implementación causa problemas:

### Fase 1: Desactivación Rápida
```typescript
// Agregar flag de feature
const ENABLE_HTML_ENRICHMENT = process.env.ENABLE_HTML_ENRICHMENT === 'true';

if (ENABLE_HTML_ENRICHMENT) {
    // Aplicar enriquecimiento
} else {
    // Mantener texto plano
}
```

### Fase 2: Rollback Completo
1. Revertir cambios en el prompt
2. Desactivar validación HTML
3. Mantener contenido existente sin modificar

---

## 9. Conclusiones y Siguientes Pasos

### Resumen del Problema
- ✅ **Identificado**: El prompt actual NO instruye para generar HTML
- ✅ **Causa Raíz**: Falta de especificación en el formato de salida
- ✅ **Impacto**: Todo el contenido se genera en texto plano

### Solución Propuesta
- **Opción A**: Modificar el prompt para generar HTML directamente
- **Tiempo Estimado**: 2-4 horas de implementación + testing
- **Riesgo**: Bajo (con feature flag para rollback)

### Pasos Inmediatos
1. **Implementar** el nuevo prompt con instrucciones HTML
2. **Actualizar** la validación para aceptar y verificar HTML
3. **Testear** con 10-20 noticias reales
4. **Monitorear** la calidad del HTML generado
5. **Ajustar** las reglas según resultados

### Métricas de Éxito
- 95%+ de contenidos con HTML válido
- 0% de pérdida de información factual
- Mejora en engagement del usuario (medible en analytics)

---

## Apéndice A: Archivos a Modificar

| Archivo | Líneas | Cambios |
|---------|---------|---------|
| `/packages/api-nueva/src/content-ai/services/content-generation.service.ts` | 871-1006 | Actualizar prompt con instrucciones HTML |
| `/packages/api-nueva/src/content-ai/services/content-generation.service.ts` | 1014-1136 | Actualizar validación para aceptar HTML |
| `/packages/api-nueva/src/content-ai/services/content-generation.service.ts` | 1139-1292 | Adaptar verificación de fidelidad para HTML |

## Apéndice B: Ejemplos de Prompts Exitosos

### Ejemplo que Funciona
```
"content": "<p>El <strong>presidente municipal</strong> anunció...</p>"
```

### Ejemplo que NO Funciona
```
"content": "El presidente municipal anunció..."
```

---

**Fin del Documento**

**Autor**: Jarvis
**Fecha**: 2025-10-21
**Estado**: Listo para Implementación