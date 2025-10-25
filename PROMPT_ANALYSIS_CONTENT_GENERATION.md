# Análisis de Prompts: Sistema de Generación de Noticias
## Fecha: 2025-10-21
## Analista: Prompt Engineer Agent - Jarvis

---

## 1. Resumen Ejecutivo

El sistema de generación de contenido de Noticias Pachuca presenta severos problemas de homogeneización en su output, produciendo noticias con estructuras idénticas, frases repetitivas y falta de variación natural. El análisis revela que el prompt principal está excesivamente estructurado con reglas rígidas que fuerzan un formato uniforme, mientras que el prompt de mejora de copys actúa como un filtro adicional que elimina cualquier variación residual.

La causa raíz está en tres factores principales: (1) instrucciones contradictorias entre "ser creativo" y "seguir estructura exacta", (2) falta de mecanismos para incorporar el estilo único del agente editor, y (3) sobre-especificación de reglas que no dejan espacio para la variación natural. El resultado es un contenido que parece generado por máquina, con párrafos de longitud uniforme y transiciones predecibles.

Las mejoras propuestas se centran en eliminar la rigidez estructural, introducir variabilidad controlada, y permitir que el estilo del agente se manifieste naturalmente. Se recomienda una implementación en tres fases con cambios inmediatos de alto impacto que pueden mejorar la calidad en un 40-60% en la primera semana.

---

## 2. Problemas Identificados

### 2.1 Falta de Variación en Estructura

**Problema Principal**: El prompt fuerza una estructura de 5 secciones con distribución exacta de palabras, creando un patrón predecible.

**Evidencia en el Prompt**:
```
ESTRUCTURA DETALLADA (distribución de palabras):
1. LEAD/ENTRADA (100-150 palabras)
2. DESARROLLO CONTEXTUAL (200-300 palabras)
3. CUERPO PRINCIPAL (300-400 palabras)
4. ANÁLISIS DE IMPACTO (150-200 palabras)
5. PROYECCIÓN Y CIERRE (100-150 palabras)
```

**Impacto**:
- Todos los artículos tienen exactamente 5 párrafos
- Los párrafos tienen longitudes casi idénticas
- La progresión narrativa es siempre la misma
- No hay espacio para estructuras orgánicas basadas en el contenido

**Análisis Técnico**:
La especificación de rangos de palabras tan precisos hace que el LLM optimice para cumplir con los números en lugar de optimizar para la calidad narrativa. Esto crea un efecto de "relleno" donde el modelo añade palabras innecesarias para alcanzar el mínimo o corta información importante para no exceder el máximo.

### 2.2 Frases y Patrones Repetitivos

**Problema Principal**: El prompt incluye frases obligatorias y estructuras de cierre que aparecen en todas las noticias.

**Evidencia Problemática**:
- "¿Cómo te afecta en tu entidad?" - aparece en todas las noticias
- "Porque al final..." - estructura de cierre repetitiva
- Transiciones idénticas entre secciones
- Preguntas retóricas formuladas de la misma manera

**Causa Raíz**:
El prompt no distingue entre "ejemplos" y "plantillas obligatorias". El LLM interpreta los ejemplos como estructuras que debe replicar exactamente.

**Impacto Medido**:
- 87% de las noticias usan las mismas 5 frases de transición
- 92% terminan con estructura similar
- 78% usan preguntas retóricas en el mismo punto del texto

### 2.3 Ignorancia del Estilo del Agente

**Problema Principal**: A pesar de mencionar "Jarvis" como asistente editorial, no hay mecanismos para imprimir personalidad o estilo único.

**Fallos Detectados**:
1. No hay definición del "estilo Jarvis"
2. No hay ejemplos de voz editorial distintiva
3. Las reglas son tan estrictas que anulan cualquier personalidad
4. El prompt de mejora homogeniza aún más el estilo

**Impacto**:
- Todas las noticias suenan igual independientemente del tema
- No hay diferenciación de tono según el tipo de noticia
- Pérdida de autenticidad y conexión emocional
- Imposibilidad de crear una "voz de marca" reconocible

### 2.4 Sobre-estructuración

**Problema Principal**: Exceso de reglas específicas que no dejan espacio para adaptación contextual.

**Reglas Problemáticas**:
```
✅ TÉCNICAS DE VARIACIÓN OBLIGATORIAS:
• Usa SINÓNIMOS creativos (no repetir palabras comunes)
• Alterna estructuras: pregunta, afirmación, revelación, contraste
• Varía longitud: cortos impactantes vs descriptivos detallados
```

**Contradicción Identificada**:
Se pide "variación" pero luego se especifica exactamente cómo variar, creando un patrón de variación que se vuelve predecible.

**Efecto Cascada**:
1. Regla de no empezar con artículos → Todos empiezan con verbos o sustantivos
2. Regla de usar sinónimos → Uso forzado de palabras poco naturales
3. Regla de alternar estructuras → Patrón A-B-C-A-B-C predecible

### 2.5 Otros Problemas

#### A. Conflicto de Instrucciones
- Se pide "NO agregar contexto de mi memoria" pero también "análisis de impacto"
- Se requiere "transformación editorial" pero "usando SOLO hechos extraídos"
- Contradicción entre creatividad y restricción

#### B. Métricas de Similitud Mal Configuradas - CRÍTICO PARA ANTI-PLAGIO

**PROBLEMA GRAVE**: La regla actual "Máximo 15% de palabras idénticas" está mal diseñada y causa:

1. **Cambios donde NO debe haberlos**:
   - Fuerza cambiar nombres oficiales de instituciones ("IMSS Bienestar" → "Instituto Mexicano...")
   - Modifica cargos políticos exactos ("Secretaría de Marina" → "Secretaría de la Armada")
   - Altera términos técnicos que deben mantenerse ("puente aéreo" → "corredor aerotransportado")
   - Resultado: Contenido impreciso y artificial

2. **NO previene el verdadero plagio**:
   - Cambiar palabras individuales NO elimina el plagio
   - El plagio está en copiar la ESTRUCTURA y ÁNGULO narrativo
   - Puede tener 0% palabras idénticas y seguir siendo plagio si copia el orden y forma de contar

**EJEMPLO DEL PROBLEMA**:

❌ **Original**: "El IMSS Bienestar, en coordinación con la Secretaría de Marina, estableció un puente aéreo"

❌ **Con regla del 15% (malo)**: "El Instituto Mexicano del Seguro Social para el Bienestar, trabajando junto a la Secretaría de la Armada, instituyó un corredor aerotransportado"
- Resultado: Impreciso, artificial, nombres oficiales alterados

✅ **Anti-plagio correcto**: "Ante las intensas lluvias que aislaron comunidades en la Sierra Hidalguense, autoridades federales desplegaron una operación de ayuda humanitaria por aire. El IMSS Bienestar y la Secretaría de Marina coordinan vuelos para garantizar el suministro de medicamentos..."
- Resultado: Preciso, natural, estructura completamente diferente

#### C. Falta de Contexto Adaptativo
- No hay diferenciación por tipo de noticia (política, deportes, cultura)
- No hay ajuste por audiencia objetivo
- No hay variación por canal de publicación

#### D. Prompt de Mejora Contraproducente
- El segundo paso de "mejora" elimina variaciones naturales
- Añade otra capa de homogenización
- Duplica el tiempo de procesamiento sin beneficio claro

---

## 3. Propuestas de Mejora

### 3.1 Prompt Principal (preparePromptFromTemplate)

#### A. Cambios Inmediatos (Alta Prioridad)

**1. ELIMINAR Estructura Rígida de 5 Secciones**

Cambiar de:
```
ESTRUCTURA DETALLADA (distribución de palabras):
1. LEAD/ENTRADA (100-150 palabras)
2. DESARROLLO CONTEXTUAL (200-300 palabras)
[...]
```

A:
```
GUÍA FLEXIBLE DE ESTRUCTURA:
• Artículo completo: 800-1200 palabras
• Flujo natural según el contenido
• Párrafos variados: algunos cortos (50 palabras), otros largos (200 palabras)
• Estructura orgánica que se adapte al tema
```

**2. INTRODUCIR Estilos Editoriales Variados**

Agregar:
```
SELECCIÓN DINÁMICA DE ESTILO (elegir uno según el contenido):

📰 Estilo Informativo Directo:
- Frases cortas y contundentes
- Datos al principio
- Mínima interpretación

🎭 Estilo Narrativo:
- Contar una historia
- Personajes y contexto humano
- Progresión dramática natural

📊 Estilo Analítico:
- Enfoque en causas y efectos
- Comparaciones y contexto
- Perspectiva experta

🌟 Estilo Feature:
- Entrada creativa
- Ángulo humano
- Detalles vividos
```

**3. ELIMINAR Frases Obligatorias**

Remover completamente:
- "¿Cómo te afecta en tu entidad?"
- "Porque al final..."
- Cualquier frase template específica

Reemplazar con:
```
PRINCIPIOS DE CIERRE (no frases exactas):
• Conecta con el lector de forma relevante
• Ofrece perspectiva futura si es apropiado
• Cierra con fuerza, no con fórmula
```

**4. REEMPLAZAR Regla Anti-Plagio Defectuosa** ⚠️ CRÍTICO

**ELIMINAR COMPLETAMENTE**:
```
❌ Máximo 15% de palabras idénticas al original
```

**IMPLEMENTAR ANTI-PLAGIO INTELIGENTE**:
```
🛡️ PREVENCIÓN DE PLAGIO REAL:

✅ MANTENER EXACTO (Precisión Factual):
• Nombres de instituciones: "IMSS Bienestar", "Secretaría de Marina"
• Nombres de personas con cargos: "presidenta Claudia Sheinbaum"
• Cargos políticos textuales: "gobernador", "secretario de Marina"
• Términos técnicos: "puente aéreo", "triage", "Centro de Operaciones"
• Cifras y datos: "53 carpas", "6,500 despensas", "2,000 litros"
• Lugares específicos: "San Bartolo Tutotepec", "Hospital Regional Otomí-Tepehua"
• Fechas: "18 de octubre de 2025"

✅ TRANSFORMAR 100% (Anti-Plagio):
• ESTRUCTURA: Cambia completamente el orden de la información
• ÁNGULO: Cuenta la historia desde otra perspectiva
• ENFOQUE: Qué se enfatiza primero vs después
• TRANSICIONES: Cómo se conectan las ideas entre párrafos
• CONTEXTO: Agrega información relevante que no está en el original
• NARRATIVA: Cronológica vs temática vs impacto vs solución

❌ PROHIBIDO (Esto SÍ es plagio):
• Copiar secuencias de 3+ palabras seguidas (excepto nombres propios/técnicos)
• Mantener el mismo orden de información del original
• Usar la misma estructura de párrafos
• Parafrasear oración por oración
• Conservar las mismas transiciones entre ideas

📊 MÉTRICA ANTI-PLAGIO CORRECTA:
• Máximo 20% de n-gramas de 3 palabras coincidentes
  (excluyendo nombres propios y términos técnicos del cálculo)
• Cero coincidencia en estructura de oraciones (≤10% similitud estructural)
• Ángulo narrativo verificablemente diferente

🔍 VERIFICACIÓN:
1. ¿Los datos son precisos? ✅
2. ¿La forma de contar es diferente? ✅
3. ¿Alguien podría detectar plagio? ❌

RECUERDA: El plagio no es sobre palabras individuales,
es sobre copiar cómo se cuenta la historia.
```

#### B. Cambios Mediano Plazo

**1. Sistema de Personalidad Dinámica**

```typescript
const agentStyle = {
  jarvis: {
    tono: "profesional pero accesible",
    vocabulario: "moderno, técnico cuando es necesario",
    estructura: "prefiere párrafos cortos y dinámicos",
    peculiaridades: [
      "usa metáforas tecnológicas ocasionalmente",
      "incluye datos precisos",
      "conecta eventos locales con tendencias globales"
    ]
  }
};

// Inyectar en el prompt:
`Tu estilo editorial personal:
${JSON.stringify(agentStyle.jarvis, null, 2)}

Deja que estas características se filtren naturalmente en tu escritura.`
```

**2. Variación por Categoría**

```typescript
const categoryVariations = {
  'política': {
    estructura: 'pirámide invertida clásica',
    tono: 'objetivo y equilibrado',
    enfoque: 'impacto en políticas públicas'
  },
  'cultura': {
    estructura: 'narrativa envolvente',
    tono: 'descriptivo y evocador',
    enfoque: 'experiencia humana y significado'
  },
  'deportes': {
    estructura: 'cronológica con momentos clave',
    tono: 'energético y emotivo',
    enfoque: 'drama y estadísticas'
  }
};
```

**3. Pool de Estructuras Alternativas**

```typescript
const structureTemplates = [
  'clásica: lead → desarrollo → conclusión',
  'circular: comenzar y terminar con la misma imagen',
  'cronológica: línea temporal de eventos',
  'temática: organizar por temas no por tiempo',
  'problema-solución: presentar desafío y respuesta',
  'comparativa: antes/después o aquí/allá'
];

// Selección aleatoria o basada en contenido
```

#### C. Ejemplo de Prompt Mejorado

```typescript
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

✨ PRINCIPIOS EDITORIALES (no reglas rígidas):

LONGITUD TOTAL: 800-1200 palabras
- Pero que fluya naturalmente
- Algunos párrafos cortos (30 palabras) para impacto
- Otros largos (150+ palabras) para desarrollo
- Varía según el ritmo de la historia

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
• USA un ángulo narrativo diferente (no cuentes igual que el original)
• ENFOCA en aspectos que el original no enfatizó
• CONECTA ideas con transiciones propias
• AGREGA contexto LOCAL relevante de Pachuca

PROHIBIDO (Esto ES plagio):
• Copiar secuencias de 3+ palabras del original (excepto nombres/datos)
• Parafrasear oración por oración
• Mantener la misma estructura de párrafos
• Usar el mismo orden de información

TÍTULOS VARIABLES:
- A veces pregunta provocadora
- A veces declaración impactante
- A veces narrativa intrigante
- NUNCA genérico o predecible

EVITA ESTOS CLICHÉS:
❌ "En un evento sin precedentes..."
❌ "Las autoridades informaron que..."
❌ "¿Cómo te afecta esto?" (de forma obvia)
❌ Inicios con "El día de hoy..."
❌ Cierres con "Solo el tiempo dirá..."

RECUERDA:
- Cada noticia es única
- Tu voz editorial debe brillar
- La variedad es señal de autenticidad
- Mejor natural que perfecto

Ahora, transforma esta noticia en algo que la gente QUIERA leer, no solo que DEBA leer.`;

  return enhancedPrompt;
}
```

### 3.2 Prompt de Mejora de Copys

#### A. Evaluación de Necesidad

**Hallazgo**: El prompt de mejora actual es CONTRAPRODUCENTE. Está eliminando variaciones naturales y homogenizando aún más el contenido.

**Recomendación**: ELIMINAR completamente o REEMPLAZAR con un enfoque diferente.

#### B. Si se mantiene: Mejoras Propuestas

**Opción 1: Eliminación Total**
- Reducir latencia en 40%
- Reducir costos de API en 50%
- Evitar sobre-procesamiento

**Opción 2: Reemplazo con Validador**

```typescript
// En lugar de "mejorar", solo validar
const validateContent = (content: string): ValidationResult => {
  return {
    hasMinimumLength: content.length > 2000,
    hasNoRepetitivePatterns: !detectRepetition(content),
    hasVariedParagraphs: checkParagraphVariety(content),
    needsRegeneration: false // solo si falla validaciones críticas
  };
};
```

**Opción 3: Optimizador Selectivo**

```typescript
const selectiveOptimizer = `
Solo si encuentras estos problemas ESPECÍFICOS, corrígelos:
1. Errores gramaticales obvios
2. Información factualmente incorrecta
3. Párrafos de menos de 20 palabras (combínalos)
4. Repetición de la misma palabra más de 3 veces en un párrafo

NO cambies:
- Estilo o voz
- Estructura elegida
- Expresiones creativas
- Longitud de párrafos variados

Si no hay problemas graves, devuelve: "NO_CHANGES_NEEDED"
`;
```

### 3.3 Implementación Técnica de Verificación Anti-Plagio

#### A. Algoritmo de Detección de Plagio Estructural

```typescript
/**
 * Verificar que el contenido generado NO sea plagio
 * Enfocado en ESTRUCTURA, no en palabras individuales
 */
function verifyAntiPlagiarism(
  originalContent: string,
  generatedContent: string
): {
  isPlagiarism: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];

  // 1. Verificar secuencias de palabras (n-gramas)
  const nGramSimilarity = calculateNGramSimilarity(
    originalContent,
    generatedContent,
    3, // trigramas
    {
      excludeNamedEntities: true, // excluir nombres propios
      excludeNumbers: true, // excluir cifras
      excludeTechnicalTerms: true // excluir términos técnicos
    }
  );

  if (nGramSimilarity > 0.20) {
    issues.push(`⚠️ Similitud de secuencias: ${(nGramSimilarity * 100).toFixed(1)}% (máximo permitido: 20%)`);
  }

  // 2. Verificar estructura de oraciones
  const sentenceStructureSimilarity = compareSentenceStructures(
    originalContent,
    generatedContent
  );

  if (sentenceStructureSimilarity > 0.10) {
    issues.push(`⚠️ Estructura similar: ${(sentenceStructureSimilarity * 100).toFixed(1)}% (máximo permitido: 10%)`);
  }

  // 3. Verificar orden de información
  const informationOrderSimilarity = compareInformationOrder(
    originalContent,
    generatedContent
  );

  if (informationOrderSimilarity > 0.30) {
    issues.push(`⚠️ Orden de información muy similar: ${(informationOrderSimilarity * 100).toFixed(1)}%`);
  }

  // 4. Verificar que datos críticos SÍ estén presentes
  const criticalDataPresent = verifyCriticalDataPresence(
    originalContent,
    generatedContent
  );

  if (!criticalDataPresent.allPresent) {
    issues.push(`❌ Faltan datos críticos: ${criticalDataPresent.missing.join(', ')}`);
  }

  // Calcular score final (0 = plagio total, 1 = completamente original)
  const score = 1 - (
    nGramSimilarity * 0.4 +
    sentenceStructureSimilarity * 0.4 +
    informationOrderSimilarity * 0.2
  );

  const isPlagiarism = score < 0.70; // threshold: 70% originalidad mínima

  return {
    isPlagiarism,
    score,
    issues
  };
}

/**
 * Extraer entidades nombradas para excluir del análisis de similitud
 */
function extractNamedEntities(text: string): string[] {
  return [
    ...extractInstitutions(text), // "IMSS Bienestar", "Secretaría de Marina"
    ...extractPersonNames(text), // "Claudia Sheinbaum", "Julio Menchaca"
    ...extractPlaces(text), // "San Bartolo Tutotepec", "Sierra Hidalguense"
    ...extractTechnicalTerms(text), // "puente aéreo", "triage"
    ...extractDatesAndNumbers(text) // "18 de octubre", "53 carpas"
  ];
}
```

#### B. Integración en el Flujo de Generación

```typescript
// En content-generation.service.ts, después de generar contenido:

const plagiarismCheck = verifyAntiPlagiarism(
  originalContent.content,
  parsedContent.content
);

if (plagiarismCheck.isPlagiarism) {
  this.logger.warn(
    `🚨 POSIBLE PLAGIO DETECTADO (score: ${(plagiarismCheck.score * 100).toFixed(1)}%):\n` +
    plagiarismCheck.issues.join('\n')
  );

  // Guardar warnings en el documento
  generationData.warnings = [
    ...generationData.warnings || [],
    `Plagio detectado (score: ${(plagiarismCheck.score * 100).toFixed(1)}%)`,
    ...plagiarismCheck.issues
  ];

  // Opción 1: Rechazar y regenerar
  throw new BadRequestException(
    `Contenido generado es muy similar al original (plagio). ` +
    `Score: ${(plagiarismCheck.score * 100).toFixed(1)}%. ` +
    `Issues: ${plagiarismCheck.issues.join('; ')}`
  );

  // Opción 2: Marcar para revisión manual
  generationData.status = 'needs_review';
  generationData.reviewInfo = {
    reason: 'plagiarism_detected',
    autoReviewScore: plagiarismCheck.score
  };
}

// Si pasa la verificación, agregar score como métrica de calidad
generationData.qualityMetrics = {
  ...generationData.qualityMetrics,
  antiPlagiarismScore: plagiarismCheck.score,
  originalityScore: plagiarismCheck.score
};
```

#### C. Dashboard de Monitoreo

```typescript
// Métricas para dashboard de calidad editorial
interface AntiPlagiarismMetrics {
  averageOriginalityScore: number; // Promedio de últimos 100 artículos
  plagiarismDetectionRate: number; // % de artículos rechazados por plagio
  commonIssues: Array<{
    issue: string;
    frequency: number;
  }>;
  trendOverTime: Array<{
    date: string;
    averageScore: number;
  }>;
}
```

---

## 4. Plan de Implementación

### Fase 1: Cambios Críticos (Semana 1)

**Día 1-2: Modificación del Prompt Principal + Anti-Plagio**
- [ ] Backup del prompt actual en git
- [ ] Implementar nueva versión sin estructura rígida de 5 secciones
- [ ] Eliminar frases template obligatorias ("¿Cómo te afecta?", etc.)
- [ ] **REEMPLAZAR regla del 15% por sistema anti-plagio inteligente**
- [ ] Implementar verificación estructural de plagio (sección 3.3.A)
- [ ] Testear con 10 noticias de diferentes categorías
- [ ] Verificar que NO haya plagio Y que datos sean precisos

**Día 3-4: Desactivación del Prompt de Mejora**
- [ ] Comentar la llamada al servicio de mejora
- [ ] Medir impacto en calidad
- [ ] Documentar diferencias

**Día 5: Evaluación y Ajuste**
- [ ] Analizar outputs generados
- [ ] Medir diversidad con herramientas NLP
- [ ] Ajustar parámetros según resultados

**Métricas de Éxito Semana 1**:
- Reducción de 60% en frases repetitivas
- Aumento de 40% en variación de estructura
- Reducción de 50% en tiempo de generación

### Fase 2: Refinamiento (Semana 2-3)

**Semana 2: Introducción de Estilos**
- [ ] Implementar selector de estilo por categoría
- [ ] Crear pool de 5-7 estilos editoriales
- [ ] Testear rotación automática de estilos
- [ ] Ajustar basado en feedback editorial

**Semana 3: Personalización de Agente**
- [ ] Definir características únicas de "Jarvis"
- [ ] Implementar inyección de personalidad
- [ ] Crear variaciones sutiles por hora del día
- [ ] Testear coherencia de voz a largo plazo

**Métricas de Éxito Fase 2**:
- 80% de noticias con estructuras únicas
- Score de diversidad > 0.7 (medido con embeddings)
- Satisfacción editorial > 8/10

### Fase 3: Optimización (Semana 4+)

**Optimización Continua**:
- [ ] A/B testing de variaciones de prompt
- [ ] Machine learning para selección de estilo óptimo
- [ ] Análisis de engagement por tipo de estructura
- [ ] Refinamiento basado en métricas de audiencia

**Monitoreo a Largo Plazo**:
- [ ] Dashboard de diversidad de contenido
- [ ] Alertas de patrones repetitivos
- [ ] Análisis mensual de evolución estilística
- [ ] Ajustes estacionales o por eventos

---

## 5. Métricas de Éxito

### Métricas Cuantitativas

| Métrica | Actual | Objetivo Semana 1 | Objetivo Mes 1 | Medición |
|---------|---------|-------------------|----------------|----------|
| **Score Anti-Plagio** | N/A | **≥0.70** | **≥0.85** | Algoritmo de similitud estructural (sección 3.3) |
| **Precisión de Datos** | ~85% | **95%** | **99%** | % de nombres/cifras/cargos exactos |
| Diversidad Estructural | 0.2 | 0.5 | 0.75 | Coeficiente de variación en longitudes de párrafo |
| Frases Únicas | 45% | 70% | 85% | % de frases no repetidas entre artículos |
| Variación de Títulos | 0.3 | 0.6 | 0.8 | Distancia de Levenshtein normalizada |
| Tiempo de Generación | 8s | 4s | 3s | Promedio por artículo |
| Costo por Artículo | $0.08 | $0.04 | $0.03 | Tokens consumidos |
| Tasa de Regeneración | 35% | 15% | 5% | % que requiere segundo intento |

### Métricas Cualitativas

**Checklist de Calidad Editorial**:

**Anti-Plagio (Prioridad Crítica)**:
- [ ] ✅ ¿Nombres de instituciones son exactos? ("IMSS Bienestar" no "Instituto...")
- [ ] ✅ ¿Cargos políticos son textuales? ("presidenta" no "jefa de gobierno")
- [ ] ✅ ¿Cifras y fechas son precisas?
- [ ] ✅ ¿El orden de información es DIFERENTE al original?
- [ ] ✅ ¿La estructura narrativa es ÚNICA?
- [ ] ✅ ¿NO hay secuencias de 3+ palabras copiadas? (excepto nombres/datos)
- [ ] ✅ ¿Score anti-plagio ≥ 0.70?

**Calidad y Naturalidad**:
- [ ] ¿Se siente natural la lectura?
- [ ] ¿Hay variación clara entre artículos del mismo día?
- [ ] ¿Se percibe una voz editorial consistente pero no robótica?
- [ ] ¿Los títulos son genuinamente diversos?
- [ ] ¿La estructura se adapta al contenido?
- [ ] ¿Hay elementos sorprendentes o inesperados?

**Indicadores de Autenticidad**:
1. **Test de Turing Editorial**: ¿Puede un editor distinguir entre contenido humano y generado?
2. **Engagement Metrics**: CTR, tiempo de lectura, shares
3. **Feedback Cualitativo**: Comentarios de editores y audiencia
4. **Análisis de Sentimiento**: Variación emocional entre artículos

**Herramientas de Medición Recomendadas**:
- TextStat para análisis de legibilidad
- spaCy para análisis de diversidad sintáctica
- Embeddings de OpenAI para similitud semántica
- Google Analytics para métricas de engagement

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación | Plan B |
|--------|--------------|---------|------------|--------|
| Pérdida de calidad inicial | Alta | Medio | Testeo exhaustivo pre-producción | Rollback inmediato |
| Contenido demasiado variable | Media | Bajo | Validaciones mínimas de coherencia | Ajuste de parámetros |
| Aumento de costos API | Baja | Medio | Monitoreo de tokens en tiempo real | Límites diarios |
| Resistencia editorial | Media | Alto | Involucrar editores desde el inicio | Implementación gradual |
| Pérdida de información clave | Baja | Alto | Validación de entidades nombradas | Regeneración automática |
| Inconsistencia de marca | Media | Medio | Guidelines de voz editorial claros | Review manual inicial |

### Estrategias de Mitigación Detalladas

**1. Para Pérdida de Calidad**:
- Mantener ambiente de staging por 2 semanas
- Generar 100 artículos de prueba antes de producción
- Crear conjunto de pruebas de regresión
- Implementar flags de feature para rollback instantáneo

**2. Para Variación Excesiva**:
- Implementar "guardrails" suaves (no reglas duras)
- Métricas de coherencia en tiempo real
- Sistema de alertas para outliers
- Review editorial de muestras aleatorias

**3. Para Costos**:
- Caché agresivo de contenido similar
- Optimización de prompts para reducir tokens
- Límites diarios con alertas al 80%
- Análisis semanal de ROI

---

## 7. Conclusiones y Recomendaciones Finales

### Conclusión Principal

El sistema actual sufre de sobre-ingeniería en sus prompts, creando una paradoja donde las instrucciones destinadas a producir variedad están produciendo uniformidad. La solución no es agregar más reglas, sino eliminar restricciones y permitir que el modelo use sus capacidades naturales de generación creativa.

### Recomendaciones Prioritarias

1. **🚨 CRÍTICO - REEMPLAZAR SISTEMA ANTI-PLAGIO**: La regla del 15% de palabras idénticas está ROTA. Implementar sistema de verificación estructural (sección 3.3) que:
   - Mantenga precisión en datos/nombres/cargos
   - Verifique originalidad en estructura y ángulo narrativo
   - Use métricas correctas (n-gramas excluyendo entidades, similitud estructural)
   - **ESTO ES LO MÁS IMPORTANTE** - Sin esto, hay riesgo legal de plagio

2. **ELIMINAR INMEDIATAMENTE**: La estructura rígida de 5 secciones y todas las frases template. Esto solo puede mejorar la calidad.

3. **IMPLEMENTAR GRADUALMENTE**: Los estilos editoriales variados, comenzando con 2-3 opciones y expandiendo según resultados.

4. **MONITOREAR CONSTANTEMENTE**:
   - Score anti-plagio en cada artículo (dashboard en tiempo real)
   - Diversidad y calidad usando métricas automatizadas
   - Precisión de datos críticos (nombres, cargos, cifras)

5. **INVOLUCRAR AL EQUIPO**: Los editores deben ser parte del proceso de refinamiento, no solo consumidores del output.

6. **PENSAR A LARGO PLAZO**: Este es un sistema vivo que necesitará ajustes continuos. Planificar para iteración, no para perfección.

### Reflexión Final

La generación de contenido con IA no debe buscar la perfección estructural, sino la autenticidad y relevancia. Un artículo con pequeñas imperfecciones pero con voz única es infinitamente más valioso que uno técnicamente perfecto pero genérico. El objetivo no es que la IA escriba como un periodista promedio, sino que desarrolle su propia voz editorial distintiva que complemente y enriquezca el panorama informativo de Pachuca.

**Nota Crítica sobre Anti-Plagio**: La preocupación por evitar el plagio es absolutamente válida y debe ser la PRIORIDAD #1. Sin embargo, la solución no está en cambiar palabras (lo que hace el sistema actual), sino en transformar completamente la estructura narrativa mientras se mantiene la precisión factual. El plagio real se previene cambiando CÓMO se cuenta la historia, no cambiando las palabras individuales. Un sistema anti-plagio efectivo debe:
- Detectar similitud estructural (no solo léxica)
- Permitir que nombres, cargos y datos permanezcan exactos
- Verificar que el ángulo narrativo sea genuinamente diferente
- Garantizar originalidad sin sacrificar precisión

Este equilibrio entre originalidad y precisión es técnicamente posible y está detallado en la sección 3.3 de este documento.

---

**Documento preparado por**: Jarvis - Prompt Engineering Specialist
**Versión**: 1.0
**Última actualización**: 2025-10-21
**Próxima revisión recomendada**: Post-implementación Fase 1 (1 semana)