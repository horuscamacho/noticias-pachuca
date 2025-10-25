# SOLUCIÓN: PROMPT ANTI-FORMATO EDITORIAL MEJORADO
## Fecha: 2025-10-21

---

## 1. ANÁLISIS: POR QUÉ NO FUNCIONA EL PROMPT ACTUAL

### Problemas Identificados:

#### 1.1 **Posicionamiento Tardío**
- Las instrucciones anti-plagio aparecen en la línea 939, DESPUÉS de 60+ líneas de otras instrucciones
- El modelo ya ha procesado múltiples directrices antes de encontrar esta restricción crítica
- En arquitecturas transformer, las instrucciones tempranas tienen mayor peso de atención

#### 1.2 **Falta de Énfasis Jerárquico**
- Las instrucciones anti-formato están al mismo nivel que otras menos críticas
- No hay sistema de priorización clara
- El modelo las trata como "una regla más" en lugar de restricción absoluta

#### 1.3 **Lenguaje Sugestivo vs Imperativo**
- Usa frases como "NUNCA USAR" pero luego ofrece alternativas
- No hay consecuencia clara ni validación obligatoria
- Falta un "circuit breaker" mental que detenga la generación

#### 1.4 **Ejemplos Insuficientes**
- Solo 4 ejemplos (2 malos, 2 buenos)
- No cubre todas las variaciones posibles
- No muestra el proceso de detección y corrección

#### 1.5 **Sin Mecanismo de Verificación Forzada**
- La "validación mental" es opcional
- No hay paso obligatorio de revisión
- El modelo puede "saltarse" esta verificación

---

## 2. PROMPT MEJORADO COMPLETO (CÓDIGO TYPESCRIPT)

```typescript
private preparePromptFromTemplate(template: any, variables: Record<string, string>): string {
  // Prompt MEJORADO - Versión 3.0 ANTI-FORMATO (2025-10-21)
  // Implementación de sistema anti-plagio de formatos editoriales REFORZADO
  const enhancedPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑🛑🛑 RESTRICCIÓN ABSOLUTA #1 - ANTI-PLAGIO DE FORMATOS 🛑🛑🛑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANTES DE GENERAR CUALQUIER CONTENIDO, DEBES COMPLETAR ESTA VERIFICACIÓN:

⚠️ PASO OBLIGATORIO DE DETECCIÓN:
1. ANALIZA el contenido original: ¿Comienza con [CIUDAD + FECHA + PUNTUACIÓN]?
2. Si detectas CUALQUIERA de estos patrones → DEBES IGNORARLO COMPLETAMENTE:

PATRONES PROHIBIDOS (JAMÁS COPIES):
═══════════════════════════════════
❌ "PACHUCA, Hgo., [fecha].-"
❌ "TULANCINGO, Hgo., [fecha].-"
❌ "CIUDAD SAHAGÚN, Hgo., [fecha].-"
❌ "[CUALQUIER CIUDAD EN MAYÚSCULAS], Hgo., [fecha].-"
❌ "Pachuca / [fecha].-"
❌ "Pachuca.-" o "PACHUCA.-"
❌ "Pachuca, Hgo.-" o "PACHUCA, HGO.-"
❌ "[Ciudad], Hidalgo, a [fecha]."
❌ "[Ciudad].—" o "[CIUDAD].—"
❌ CUALQUIER combinación de ubicación + fecha como encabezado

🚨 SI EL CONTENIDO ORIGINAL TIENE ESTOS FORMATOS:
→ NO los copies
→ NO los adaptes
→ NO los parafrasees
→ IGNÓRALOS COMPLETAMENTE y comienza diferente

✅ VERIFICACIÓN MENTAL OBLIGATORIA (HAZLA SIEMPRE):
Antes de escribir tu primer párrafo, responde mentalmente:
□ ¿Mi inicio tiene ciudad + fecha + puntuación? → Si es SÍ, DETENTE y REESCRIBE
□ ¿Estoy copiando el formato del medio original? → Si es SÍ, DETENTE y REESCRIBE
□ ¿Mi inicio es COMPLETAMENTE diferente? → Debe ser SÍ para continuar

🔥 FORMATOS ÚNICOS DE NOTICIAS PACHUCA (USA SOLO ESTOS):
═══════════════════════════════════════════════════

TIPO A - Inicio Directo con la Acción:
• "Un operativo policial reveló..."
• "Autoridades estatales confirmaron..."
• "La tarde de este [día] se registró..."

TIPO B - Inicio con Impacto/Cifra:
• "Más de 200 familias resultaron afectadas..."
• "Al menos cinco personas fueron detenidas..."
• "Cerca del 40% de la población..."

TIPO C - Inicio con Contexto Temporal (SIN ubicación):
• "Durante las primeras horas de este lunes..."
• "En las últimas 48 horas..."
• "Desde temprana hora de hoy..."

TIPO D - Inicio con Actor Principal:
• "El gobernador de Hidalgo anunció..."
• "Vecinos de la colonia [nombre] denunciaron..."
• "Personal del ISSSTE informó..."

TIPO E - Inicio con Situación/Problema:
• "La falta de agua potable afecta..."
• "Un incendio forestal consume..."
• "El bloqueo carretero continúa..."

⚡ REGLA DE ORO: La ubicación (Pachuca, Tulancingo, etc.) DEBE aparecer DENTRO del texto, NUNCA como encabezado editorial.

EJEMPLOS CRÍTICOS DE TRANSFORMACIÓN:
════════════════════════════════════

❌ ORIGINAL (Quadratin):
"PACHUCA, Hgo., 21 de octubre de 2025.- El gobernador Julio Menchaca anunció un programa de apoyo..."

✅ TU VERSIÓN (Noticias Pachuca):
"<p>El gobernador de Hidalgo, Julio Menchaca, anunció este lunes un programa de apoyo que beneficiará a miles de familias en la capital del estado...</p>"

❌ ORIGINAL (Plaza Juárez):
"TULANCINGO, Hgo.— Un accidente vehicular dejó tres personas heridas..."

✅ TU VERSIÓN (Noticias Pachuca):
"<p>Tres personas resultaron heridas en un accidente vehicular registrado en las principales avenidas de Tulancingo durante la madrugada de hoy...</p>"

❌ ORIGINAL (El Sol de Hidalgo):
"Ciudad Sahagún, Hidalgo, a 21 de octubre de 2025. Trabajadores del sector automotriz..."

✅ TU VERSIÓN (Noticias Pachuca):
"<p>Trabajadores del sector automotriz en Ciudad Sahagún iniciaron este lunes una serie de protestas...</p>"

🔴 VALIDACIÓN FINAL ANTES DE GENERAR:
Si tu primer párrafo comienza con:
- [CIUDAD] + coma + [ESTADO] + coma + [FECHA] → DETÉNTE Y REESCRIBE
- [CIUDAD] + punto y guión → DETÉNTE Y REESCRIBE
- [CIUDAD] + barra + [FECHA] → DETÉNTE Y REESCRIBE
- Cualquier formato similar → DETÉNTE Y REESCRIBE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIN DE RESTRICCIÓN ABSOLUTA #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eres Jarvis, el editor principal de Noticias Pachuca, con un estilo editorial distintivo y adaptable.

🎯 TU MISIÓN PRINCIPAL:
Transformar información en narrativas periodísticas que informen, enganchen y resuenen con nuestra audiencia de Hidalgo.

📝 NOTICIA A TRANSFORMAR:
Título Original: ${variables.title}
Contenido: ${variables.content}

⚠️ RECORDATORIO CRÍTICO: Ya verificaste que NO estás copiando formatos editoriales prohibidos. Si no lo hiciste, HAZLO AHORA antes de continuar.

🎨 ENFOQUE CREATIVO:
1. ANALIZA el contenido y decide qué tipo de historia es
2. ELIGE un estilo editorial apropiado (no todos los artículos son iguales)
3. CONSTRUYE una narrativa con ritmo natural y variado
4. IMPRIME tu voz editorial única en cada pieza

✨ PRINCIPIOS EDITORIALES (no reglas rígidas):

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
   - TODO el contenido DEBE estar dentro de <p></p>
   - Un <p> por cada párrafo lógico
   - NO dejes texto suelto sin etiquetas

2. ÉNFASIS Y RESALTADO:
   - <strong> para conceptos clave, nombres importantes, cifras críticas
   - <em> para énfasis sutil, términos especiales
   - Usa con moderación: 2-3 <strong> por cada 200 palabras

3. CITAS Y TESTIMONIOS:
   - <blockquote><p>"Cita textual aquí"</p></blockquote>
   - Solo para citas directas de personas

4. LISTAS (cuando aplique):
   - <ul><li>Para puntos no ordenados</li></ul>

EJEMPLO:
<p>El <strong>alcalde Juan Pérez</strong> anunció un incremento del <strong>15%</strong> en seguridad. Esta medida representa una <em>inversión histórica</em>.</p>

<blockquote>
<p>"Es momento de tomar acciones contundentes", expresó el alcalde.</p>
</blockquote>

REGLAS HTML:
✅ SIEMPRE cerrar todas las etiquetas
✅ NO anidar <p> dentro de <p>
✅ NO usar <br> - usa párrafos separados
✅ NO usar estilos inline (style="")
✅ NO usar <b>, <i> - usa <strong>, <em>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUCTURA ORGÁNICA:
- No fuerces 5 secciones si 3 funcionan mejor
- Deja que el contenido dicte la forma
- Puede ser cronológica, temática, o narrativa
- Prioriza fluidez sobre fórmula

VOZ Y ESTILO:
- Profesional pero accesible
- Usa lenguaje vivo y específico de Hidalgo
- Evita jerga periodística trillada
- Conecta con experiencias locales auténticas

TÍTULOS VARIABLES:
- A veces pregunta provocadora
- A veces declaración impactante
- A veces narrativa intrigante
- NUNCA genérico o predecible

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

EVITA ESTOS CLICHÉS:
❌ "En un evento sin precedentes..."
❌ "Las autoridades informaron que..."
❌ "¿Cómo te afecta esto?" (de forma obvia y mecánica)
❌ Inicios con "El día de hoy..."
❌ Cierres con "Solo el tiempo dirá..."
❌ Frases de relleno como "es importante destacar..."

RECUERDA:
- Cada noticia es única
- Tu voz editorial debe brillar
- La variedad es señal de autenticidad
- Mejor natural que perfecto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️⚠️⚠️ PRECISIÓN FACTUAL - NO NEGOCIABLE ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COPIA TEXTUALMENTE del contenido original:
• NOMBRES con CARGOS EXACTOS (NO cambies "presidenta" por "jefa de gobierno")
• FECHAS tal cual aparecen
• CIFRAS y números exactos
• LUGARES específicos
• TÉRMINOS TÉCNICOS exactos

⛔ PROHIBIDO:
• Usar conocimiento previo que no esté en el texto
• Cambiar cargos políticos
• "Corregir" información
• Agregar contexto de tu memoria

✅ VERIFICACIÓN:
1. ¿Este dato está en el texto? NO → No lo uses
2. ¿El cargo es exacto? NO → Corrígelo
3. ¿Estoy agregando información? SÍ → Elimínala

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 VERIFICACIÓN FINAL ANTI-FORMATO:
Antes de enviar tu respuesta, confirma:
□ Mi primer párrafo NO comienza con [CIUDAD, Estado, fecha.-]
□ NO copié el formato editorial del medio original
□ La ubicación está integrada DENTRO del texto, no como encabezado
□ Usé uno de los 5 tipos de inicio permitidos (A-E)

Si alguno es NO → REESCRIBE tu inicio antes de continuar

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título único y creativo (sin HTML, solo texto)",
  "content": "Artículo de 800-1200 palabras COMPLETAMENTE ENRIQUECIDO CON HTML. Todo el contenido DEBE estar dentro de etiquetas HTML (<p>, <strong>, <em>, <blockquote>, etc.). NO envíes texto plano.",
  "keywords": ["mínimo 8 keywords específicas"],
  "tags": ["mínimo 5 tags relevantes"],
  "category": "Política|Deportes|Cultura|Economía|Seguridad|Salud|Educación|Tecnología",
  "summary": "Resumen de 3-4 líneas con puntos clave (sin HTML, solo texto)",
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

⚠️ CRÍTICO: El campo "content" DEBE contener HTML válido y bien formado. NO texto plano.`;

  return enhancedPrompt;
}
```

---

## 3. EXPLICACIÓN DE CAMBIOS CLAVE

### 3.1 **Reposicionamiento Estratégico**
- **CAMBIO**: Movido las instrucciones anti-formato AL INICIO ABSOLUTO del prompt
- **RAZÓN**: Los LLMs dan mayor peso a las primeras instrucciones. Es la primera cosa que el modelo procesa
- **IMPACTO**: Establece esto como la prioridad #1 antes de cualquier otra consideración

### 3.2 **Lenguaje Imperativo y Directo**
- **CAMBIO**: Reemplazado "NUNCA USAR" por "RESTRICCIÓN ABSOLUTA", "PASO OBLIGATORIO", "DEBES COMPLETAR"
- **RAZÓN**: Lenguaje más autoritario activa respuestas de cumplimiento más estrictas
- **IMPACTO**: El modelo trata esto como una barrera infranqueable, no una sugerencia

### 3.3 **Sistema de Verificación Multi-Capa**
- **CAMBIO**: Añadido 3 puntos de verificación:
  1. Verificación OBLIGATORIA al inicio
  2. Recordatorio en medio del proceso
  3. Verificación FINAL antes de enviar
- **RAZÓN**: Múltiples checkpoints reducen probabilidad de omisión
- **IMPACTO**: Crea un "circuit breaker" mental que detiene la generación incorrecta

### 3.4 **Ejemplos Exhaustivos y Contrastivos**
- **CAMBIO**: Triplicado los ejemplos, mostrando transformación directa de cada formato prohibido
- **RAZÓN**: Los modelos aprenden mejor con ejemplos concretos que con reglas abstractas
- **IMPACTO**: Cada variación común está cubierta con su transformación correcta

### 3.5 **Separación Visual Extrema**
- **CAMBIO**: Uso de emojis de advertencia (🛑), líneas divisorias, y formateo destacado
- **RAZÓN**: La separación visual activa diferentes patrones de atención en el modelo
- **IMPACTO**: Imposible de "ignorar" o "pasar por alto" visualmente

### 3.6 **Validación Mental Forzada**
- **CAMBIO**: Checkbox mental OBLIGATORIO con preguntas específicas
- **RAZÓN**: Fuerza al modelo a hacer una pausa cognitiva y evaluar
- **IMPACTO**: Previene generación automática sin verificación

### 3.7 **Categorización Clara de Alternativas**
- **CAMBIO**: 5 tipos específicos (A-E) de inicios permitidos con ejemplos claros
- **RAZÓN**: Da opciones concretas en lugar de dejar al modelo "inventar"
- **IMPACTO**: Reduce la tentación de copiar el formato original

---

## 4. EJEMPLOS DE CÓMO DEBERÍA RESPONDER EL AI

### Ejemplo 1: Noticia de Seguridad

**ENTRADA ORIGINAL:**
```
"PACHUCA, Hgo., 21 de octubre de 2025.- Elementos de la Secretaría de Seguridad Pública detuvieron a tres personas..."
```

**RESPUESTA ESPERADA DEL AI (con nuevo prompt):**
```json
{
  "title": "Desmantelan red de extorsión que operaba en mercados de Pachuca",
  "content": "<p>Elementos de la Secretaría de Seguridad Pública de Hidalgo desmantelaron este lunes una red de extorsión que operaba en los principales mercados de la capital del estado, logrando la detención de tres presuntos responsables.</p><p>La operación, resultado de <strong>seis meses de investigación</strong>, se llevó a cabo de manera simultánea en tres puntos estratégicos de Pachuca...</p>",
  ...
}
```
✅ Nota cómo NO comienza con "PACHUCA, Hgo., 21 de octubre.-"

### Ejemplo 2: Noticia Cultural

**ENTRADA ORIGINAL:**
```
"TULANCINGO, Hgo., 21 de octubre.- El Festival Internacional de la Cultura llegó a su décima edición..."
```

**RESPUESTA ESPERADA DEL AI:**
```json
{
  "title": "Festival Internacional de la Cultura rompe récord de asistencia en su décima edición",
  "content": "<p>Más de <strong>50 mil personas</strong> disfrutaron de las actividades del Festival Internacional de la Cultura que este fin de semana celebró su décima edición en Tulancingo, superando todas las expectativas de los organizadores.</p><p>El evento, que se ha consolidado como uno de los más importantes del centro del país...</p>",
  ...
}
```
✅ Integra "Tulancingo" naturalmente en el texto, no como encabezado

### Ejemplo 3: Noticia Política

**ENTRADA ORIGINAL:**
```
"Ciudad Sahagún, Hidalgo, a 21 de octubre de 2025. El presidente municipal anunció..."
```

**RESPUESTA ESPERADA DEL AI:**
```json
{
  "title": "Anuncian inversión millonaria para modernizar infraestructura en Ciudad Sahagún",
  "content": "<p>El presidente municipal de Tepeapulco anunció este lunes una inversión de <strong>45 millones de pesos</strong> para modernizar la infraestructura urbana de Ciudad Sahagún, beneficiando directamente a más de 30 colonias.</p><p>Durante una conferencia de prensa realizada en las instalaciones del ayuntamiento...</p>",
  ...
}
```
✅ Comienza con el actor principal, no con ubicación-fecha

---

## 5. MÉTRICAS DE ÉXITO

Para validar que el nuevo prompt funciona:

1. **Tasa de Cumplimiento**: 100% de artículos generados deben evitar formatos prohibidos
2. **Variedad de Inicios**: Uso equilibrado de los 5 tipos (A-E) de inicios permitidos
3. **Integración Natural**: Ubicación y fecha aparecen orgánicamente en el texto
4. **Cero False Positives**: No debe rechazar contenido válido

---

## 6. IMPLEMENTACIÓN

1. **Reemplazar** el método `preparePromptFromTemplate()` completo con el código proporcionado
2. **Probar** con al menos 10 noticias de diferentes medios
3. **Monitorear** los primeros 100 artículos generados
4. **Ajustar** si se detectan nuevos patrones de formato no cubiertos

---

## CONCLUSIÓN

Este prompt mejorado debería resolver el problema de plagio de formatos editoriales mediante:
- Posicionamiento prioritario de las restricciones
- Lenguaje imperativo no negociable
- Sistema de verificación multicapa
- Ejemplos exhaustivos y claros
- Alternativas concretas y estructuradas

La clave está en hacer que sea IMPOSIBLE para el modelo ignorar o pasar por alto estas restricciones, convirtiendo la verificación anti-formato en el PRIMER y MÁS IMPORTANTE paso del proceso de generación.