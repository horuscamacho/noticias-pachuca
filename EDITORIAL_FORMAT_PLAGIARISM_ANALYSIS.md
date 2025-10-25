# Análisis: Plagio de Formatos Editoriales en Inicios de Noticias

## 1. Diagnóstico del Problema

### ¿Por qué se copian los formatos?

El problema ocurre porque la IA (probablemente GPT o Claude) está tratando de mantener la "estructura informativa" del contenido original sin entender que esos formatos son **firmas editoriales propietarias** de cada medio.

**Causas raíz identificadas:**

1. **Falta de instrucciones explícitas**: El prompt actual no prohíbe específicamente copiar formatos editoriales
2. **Preservación excesiva de contexto**: La IA intenta mantener la información de lugar y fecha tal como aparece
3. **Patrones aprendidos**: El modelo ha visto miles de noticias con este formato y lo considera "estándar"
4. **Ausencia de ejemplos alternativos**: No se proporcionan formatos propios para usar

### Patrones Editoriales Detectados

#### Formatos de Quadratin / Criterio Hidalgo
```
PACHUCA, Hgo., 21 de octubre de 2025.- [Contenido]
MINERAL DE LA REFORMA, Hgo., 21 de octubre de 2025.- [Contenido]
TULANCINGO, Hgo., 21 de octubre de 2025.- [Contenido]
```
**Características**: Ciudad en mayúsculas, "Hgo." abreviado, fecha completa, guión y punto.

#### Formatos de El Sol de Hidalgo / Milenio
```
Pachuca / 21 de octubre. - [Contenido]
Pachuca, Hidalgo / 21 Oct 2025 - [Contenido]
```
**Características**: Ciudad en título, barra diagonal, fecha simplificada.

#### Formatos de Plaza Juárez
```
PACHUCA.— [Contenido]
MINERAL DE LA REFORMA.— [Contenido]
```
**Características**: Ciudad en mayúsculas, punto, guión largo.

#### Formatos de La Silla Rota / Independiente de Hidalgo
```
Pachuca.- [Contenido]
Pachuca, Hgo.- [Contenido]
```
**Características**: Ciudad con capitalización normal, punto y guión.

### Impacto del Problema

**Nivel de riesgo: ALTO** ⚠️

1. **Legal**: Posible infracción de derechos de autor por copiar formato editorial
2. **Reputacional**: Fácilmente identificable como contenido copiado
3. **SEO**: Google puede detectar contenido duplicado/plagiado
4. **Credibilidad**: Pérdida de identidad editorial propia
5. **Detección automática**: Los medios originales pueden detectar el plagio fácilmente

## 2. Soluciones Propuestas

### Opción A: Instrucciones Explícitas en Prompt

**Descripción**: Agregar reglas claras que prohíban copiar formatos editoriales y proporcionen alternativas.

**Implementación**: Modificar el prompt de generación de noticias con instrucciones anti-plagio específicas.

### El Prompt Actualizado

```typescript
const ANTI_PLAGIARISM_NEWS_PROMPT = `
Eres un periodista profesional especializado en crear contenido original para Noticias Pachuca.

REGLAS CRÍTICAS ANTI-PLAGIO (OBLIGATORIAS):

1. NUNCA copies los formatos de inicio de otros medios. Específicamente PROHIBIDO:
   - NO uses: "CIUDAD, Hgo., [fecha].-" (formato de Quadratin/Criterio)
   - NO uses: "Ciudad / [fecha].-" (formato de El Sol/Milenio)
   - NO uses: "CIUDAD.—" (formato de Plaza Juárez)
   - NO uses: "Ciudad.-" o "Ciudad, Hgo.-" (formato de La Silla Rota)
   - NO uses ningún formato que comience con ubicación-fecha-guión

2. DETECCIÓN DE FORMATO EDITORIAL:
   Si el contenido fuente comienza con alguno de estos patrones:
   - Patrón 1: [MAYÚSCULAS], [abrev]., [fecha].-
   - Patrón 2: [Ciudad] / [fecha].-
   - Patrón 3: [MAYÚSCULAS].—

   DEBES reformular completamente el inicio sin copiar esa estructura.

3. FORMATOS PERMITIDOS PARA TUS INICIOS:
   Usa ÚNICAMENTE uno de estos formatos alternativos:

   a) Inicio con contexto temporal:
      "Este [día de la semana], autoridades de Hidalgo confirmaron..."
      "Durante la jornada de hoy, en Pachuca se reportó..."

   b) Inicio con la acción principal:
      "Autoridades estatales anunciaron..."
      "Un grupo de manifestantes bloqueó..."

   c) Inicio con impacto o consecuencia:
      "Más de 500 familias resultaron afectadas por..."
      "La economía local se vio impactada cuando..."

   d) Inicio con declaración o cita (reformulada):
      "De acuerdo con fuentes oficiales..."
      "Según informes preliminares..."

   e) Inicio con contexto geográfico integrado:
      "En la capital hidalguense se registró..."
      "La zona metropolitana de Pachuca amaneció con..."

4. INFORMACIÓN DE UBICACIÓN Y TIEMPO:
   - Integra la ubicación de manera natural en el primer o segundo párrafo
   - NO la pongas como encabezado editorial
   - La fecha debe mencionarse contextualmente, no como dateline

5. VALIDACIÓN ANTES DE GENERAR:
   Antes de escribir, verifica:
   ☐ ¿Mi inicio es diferente al formato del medio original?
   ☐ ¿Evité usar ubicación-fecha-guión?
   ☐ ¿La información está integrada naturalmente?
   ☐ ¿Usé uno de los formatos permitidos?

CONTENIDO A REESCRIBIR:
{contenido_original}

INSTRUCCIONES DE GENERACIÓN:
1. Lee el contenido original
2. Identifica si tiene un formato editorial prohibido
3. Extrae los hechos clave
4. Reescribe usando un formato permitido
5. Asegúrate de que el inicio sea completamente diferente

Genera la noticia siguiendo estas reglas estrictamente.`;
```

**Pros**:
- Fácil de implementar (solo cambiar el prompt)
- No requiere cambios de código
- Efecto inmediato

**Contras**:
- Depende de que la IA siga las instrucciones
- Puede no detectar todos los formatos

**Recomendación**: ⭐⭐⭐⭐☆

### Opción B: Detección y Limpieza Automática

**Descripción**: Sistema de pre-procesamiento que detecta y elimina formatos editoriales antes de enviar a la IA.

**Implementación**: Servicio TypeScript que limpia el contenido antes de la generación.

### Código TypeScript de Detección

```typescript
// editorial-format-detector.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class EditorialFormatDetectorService {

  // Patrones de formatos editoriales a detectar
  private readonly EDITORIAL_PATTERNS = [
    // Quadratin/Criterio: "PACHUCA, Hgo., 21 de octubre de 2025.-"
    /^[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\.,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\s*\.-/i,

    // El Sol/Milenio: "Pachuca / 21 de octubre.-"
    /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d{1,2}\s+de\s+\w+.*\.-/i,

    // Plaza Juárez: "PACHUCA.—"
    /^[A-ZÁÉÍÓÚÑ\s]+\.—/,

    // La Silla Rota: "Pachuca.-" o "Pachuca, Hgo.-"
    /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+,?\s*(Hgo\.)?\s*\.-/i,

    // Genérico: Cualquier inicio con ciudad y fecha
    /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+\d{1,2}\s+(de\s+)?\w+(\s+de\s+\d{4})?\s*[\.-]/i
  ];

  /**
   * Detecta si el texto contiene un formato editorial
   */
  hasEditorialFormat(text: string): boolean {
    const firstLine = text.split('\n')[0].trim();
    return this.EDITORIAL_PATTERNS.some(pattern => pattern.test(firstLine));
  }

  /**
   * Elimina el formato editorial del inicio del texto
   */
  removeEditorialFormat(text: string): string {
    let cleanedText = text;

    // Intenta eliminar cada patrón
    for (const pattern of this.EDITORIAL_PATTERNS) {
      cleanedText = cleanedText.replace(pattern, '');
    }

    // Limpieza adicional de espacios y puntuación residual
    cleanedText = cleanedText.trim();

    // Si empieza con guión o punto después de la limpieza, removerlos
    cleanedText = cleanedText.replace(/^[\.-—]+\s*/, '');

    return cleanedText.trim();
  }

  /**
   * Extrae información del formato editorial
   */
  extractEditorialInfo(text: string): {
    location?: string;
    date?: string;
    cleanContent: string;
  } {
    const firstLine = text.split('\n')[0];
    let location: string | undefined;
    let date: string | undefined;

    // Intenta extraer ubicación y fecha
    const quadratinMatch = firstLine.match(/^([A-ZÁÉÍÓÚÑ\s]+),\s*Hgo\.,\s*(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i);
    if (quadratinMatch) {
      location = quadratinMatch[1].trim();
      date = quadratinMatch[2].trim();
    }

    const elSolMatch = firstLine.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s*\/\s*(\d{1,2}\s+de\s+\w+)/i);
    if (elSolMatch) {
      location = elSolMatch[1].trim();
      date = elSolMatch[2].trim();
    }

    const cleanContent = this.removeEditorialFormat(text);

    return {
      location,
      date,
      cleanContent
    };
  }

  /**
   * Valida que el texto generado no contenga formatos editoriales
   */
  validateGeneratedContent(generatedText: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (this.hasEditorialFormat(generatedText)) {
      errors.push('El contenido generado contiene formato editorial prohibido');
    }

    // Verificaciones adicionales
    const prohibidedStarts = [
      /^PACHUCA,\s*Hgo\./i,
      /^[A-ZÁÉÍÓÚÑ]+,\s*Hgo\./i,
      /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d/i,
      /^[A-ZÁÉÍÓÚÑ]+\.—/
    ];

    for (const pattern of prohibidedStarts) {
      if (pattern.test(generatedText)) {
        errors.push(`Formato editorial detectado: ${pattern.source}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

**Integración en el servicio de generación:**

```typescript
// news-generation.service.ts (modificado)
import { EditorialFormatDetectorService } from './editorial-format-detector.service';

@Injectable()
export class NewsGenerationService {
  constructor(
    private readonly editorialDetector: EditorialFormatDetectorService,
    // ... otros servicios
  ) {}

  async generateNews(sourceContent: string): Promise<string> {
    // 1. Detectar y limpiar formato editorial
    const { location, date, cleanContent } = this.editorialDetector.extractEditorialInfo(sourceContent);

    // 2. Preparar contexto limpio para la IA
    const contextForAI = {
      content: cleanContent,
      metadata: {
        location,
        date,
        instruction: 'NO copies formatos editoriales. Usa tus propios formatos de inicio.'
      }
    };

    // 3. Generar contenido
    const generatedContent = await this.callOpenAI(contextForAI);

    // 4. Validar que no se copiaron formatos
    const validation = this.editorialDetector.validateGeneratedContent(generatedContent);

    if (!validation.isValid) {
      // Reintentar con instrucciones más estrictas
      console.warn('Formato editorial detectado, reintentando...', validation.errors);
      return this.regenerateWithStricterRules(generatedContent);
    }

    return generatedContent;
  }

  private async regenerateWithStricterRules(content: string): Promise<string> {
    // Forzar regeneración con inicio completamente diferente
    const strictPrompt = `
      El siguiente contenido tiene un formato editorial prohibido en su inicio.
      DEBES reescribirlo comenzando de manera completamente diferente.

      Contenido a corregir:
      ${content}

      OBLIGATORIO: Comienza con una de estas estructuras:
      - "Durante [tiempo], [acción]..."
      - "Autoridades [acción]..."
      - "[Número] personas/familias [acción]..."

      NO uses ubicación-fecha al inicio.
    `;

    return this.callOpenAI({ prompt: strictPrompt });
  }
}
```

**Pros**:
- Detección garantizada de formatos
- Validación automatizada
- Puede reintentar si falla

**Contras**:
- Requiere más código
- Puede aumentar latencia (validación + reintento)

**Recomendación**: ⭐⭐⭐☆☆

### Opción C: Sistema de Variación Forzada con Templates

**Descripción**: Proporcionar templates específicos que la IA debe usar, rotando entre ellos.

**Implementación**: Sistema de templates con selección aleatoria.

### Sistema de Templates

```typescript
// news-template.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class NewsTemplateService {

  private readonly OPENING_TEMPLATES = [
    // Template 1: Inicio con tiempo
    {
      id: 'temporal',
      formats: [
        'Este {dayOfWeek}, {mainAction}',
        'Durante la jornada de {relativeTime}, {mainAction}',
        'En las últimas horas, {mainAction}',
        'A partir de {time}, {mainAction}'
      ]
    },

    // Template 2: Inicio con actor principal
    {
      id: 'actor',
      formats: [
        '{actor} {action} {complement}',
        'Representantes de {organization} {action}',
        'Un grupo de {collective} {action}'
      ]
    },

    // Template 3: Inicio con impacto
    {
      id: 'impact',
      formats: [
        'Más de {number} {affected} {consequence}',
        'Al menos {number} {unit} {result}',
        'Cerca de {number} {entity} se vieron afectados'
      ]
    },

    // Template 4: Inicio con contexto
    {
      id: 'context',
      formats: [
        'En el marco de {event}, {mainAction}',
        'Como parte de {program}, {mainAction}',
        'Tras {previousEvent}, {consequence}'
      ]
    },

    // Template 5: Inicio con ubicación integrada
    {
      id: 'location-integrated',
      formats: [
        'La zona {area} de {city} {action}',
        'En {neighborhood} se {action}',
        'El municipio de {municipality} {action}'
      ]
    }
  ];

  /**
   * Selecciona un template aleatorio y lo llena con datos
   */
  generateOpening(newsData: NewsDataDTO): string {
    // Seleccionar categoría de template aleatoriamente
    const templateCategory = this.OPENING_TEMPLATES[
      Math.floor(Math.random() * this.OPENING_TEMPLATES.length)
    ];

    // Seleccionar formato específico dentro de la categoría
    const format = templateCategory.formats[
      Math.floor(Math.random() * templateCategory.formats.length)
    ];

    // Llenar el template con datos reales
    return this.fillTemplate(format, newsData);
  }

  private fillTemplate(template: string, data: NewsDataDTO): string {
    const replacements: Record<string, string> = {
      dayOfWeek: this.getDayOfWeek(),
      relativeTime: this.getRelativeTime(),
      time: data.time || 'hoy',
      mainAction: data.mainAction,
      actor: data.mainActor,
      action: data.action,
      complement: data.complement,
      organization: data.organization,
      collective: data.collective,
      number: data.affectedNumber?.toString() || 'varios',
      affected: data.affectedEntity,
      consequence: data.consequence,
      unit: data.measureUnit,
      result: data.result,
      entity: data.entity,
      event: data.contextEvent,
      program: data.program,
      previousEvent: data.previousEvent,
      area: data.area || 'metropolitana',
      city: data.city || 'Pachuca',
      neighborhood: data.neighborhood,
      municipality: data.municipality || 'Pachuca de Soto'
    };

    let filled = template;
    for (const [key, value] of Object.entries(replacements)) {
      filled = filled.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return filled;
  }

  private getDayOfWeek(): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[new Date().getDay()];
  }

  private getRelativeTime(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'la madrugada';
    if (hour < 12) return 'la mañana';
    if (hour < 19) return 'la tarde';
    return 'la noche';
  }

  /**
   * Valida que el inicio NO sea un formato editorial
   */
  validateOpening(text: string): boolean {
    const prohibitedPatterns = [
      /^[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\./i,
      /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d/i,
      /^[A-ZÁÉÍÓÚÑ]+\.—/,
      /^[A-ZÁÉÍÓÚñ\s]+\.-/i
    ];

    return !prohibitedPatterns.some(pattern => pattern.test(text));
  }
}
```

### Prompt con Templates Obligatorios

```typescript
const TEMPLATE_BASED_PROMPT = `
Eres un periodista que DEBE usar templates específicos para evitar plagio.

CONTENIDO FUENTE:
{source_content}

TEMPLATE OBLIGATORIO PARA ESTE ARTÍCULO:
{selected_template}

DATOS EXTRAÍDOS:
- Actor principal: {main_actor}
- Acción principal: {main_action}
- Ubicación: {location}
- Impacto: {impact}

INSTRUCCIONES:
1. USA EXACTAMENTE el template proporcionado
2. NO modifiques la estructura del template
3. Llena los campos del template con la información extraída
4. Continúa el resto del artículo de manera natural

INICIO OBLIGATORIO:
{filled_template}

Ahora continúa el artículo desde ese inicio...
`;
```

**Pros**:
- Control total sobre formatos
- Imposible copiar formatos editoriales
- Variación garantizada
- Consistencia editorial propia

**Contras**:
- Puede sonar menos natural
- Requiere mantenimiento de templates
- Menos flexibilidad

**Recomendación**: ⭐⭐⭐⭐⭐

## 3. Solución Recomendada

### Opción Elegida: Combinación A + B + C

La mejor estrategia es implementar las tres opciones en capas:

1. **Capa 1**: Prompt mejorado (Opción A) - Prevención
2. **Capa 2**: Detección automática (Opción B) - Validación
3. **Capa 3**: Templates de respaldo (Opción C) - Garantía

### Implementación Detallada

#### Paso 1: Actualizar el Servicio Principal

```typescript
// news-generation-anti-plagiarism.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { EditorialFormatDetectorService } from './editorial-format-detector.service';
import { NewsTemplateService } from './news-template.service';

@Injectable()
export class NewsGenerationAntiPlagiarismService {
  private readonly openai: OpenAI;

  constructor(
    private readonly formatDetector: EditorialFormatDetectorService,
    private readonly templateService: NewsTemplateService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateOriginalNews(sourceContent: string): Promise<string> {
    // Paso 1: Limpiar formato editorial del contenido fuente
    const cleanedData = this.formatDetector.extractEditorialInfo(sourceContent);

    // Paso 2: Primer intento con prompt anti-plagio
    let generatedContent = await this.generateWithAntiPlagiarismPrompt(cleanedData);

    // Paso 3: Validar resultado
    const validation = this.formatDetector.validateGeneratedContent(generatedContent);

    if (!validation.isValid) {
      console.warn('Formato editorial detectado, usando template system...');

      // Paso 4: Si falla, usar sistema de templates
      generatedContent = await this.generateWithTemplate(cleanedData);
    }

    // Paso 5: Validación final
    const finalValidation = this.formatDetector.validateGeneratedContent(generatedContent);

    if (!finalValidation.isValid) {
      throw new Error('No se pudo generar contenido sin formato editorial');
    }

    return generatedContent;
  }

  private async generateWithAntiPlagiarismPrompt(data: any): Promise<string> {
    const prompt = `
Eres un periodista profesional de Noticias Pachuca. IMPORTANTE: Debes crear contenido completamente original.

REGLAS CRÍTICAS - PROHIBIDO COPIAR FORMATOS EDITORIALES:

❌ NUNCA inicies con estos formatos:
- "CIUDAD, Hgo., [fecha].-"
- "Ciudad / [fecha].-"
- "CIUDAD.—"
- "Ciudad.-"

✅ USA ESTOS INICIOS ALTERNATIVOS:
1. "Este [día], [acción principal]..."
2. "Autoridades de [lugar] [acción]..."
3. "[Número] personas [resultado]..."
4. "En [lugar contextual] se [acción]..."
5. "Durante [tiempo], [suceso]..."

CONTENIDO A REESCRIBIR:
${data.cleanContent}

INFORMACIÓN CONTEXTUAL:
- Ubicación: ${data.location || 'Pachuca, Hidalgo'}
- Fecha: ${data.date || 'hoy'}

INSTRUCCIONES:
1. NO copies el formato de inicio del texto original
2. Integra ubicación y fecha de manera natural en el texto
3. Comienza con uno de los formatos alternativos
4. Mantén el estilo periodístico profesional

Genera la noticia ahora:`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un periodista que NUNCA copia formatos editoriales. Siempre creas inicios originales.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content || '';
  }

  private async generateWithTemplate(data: any): Promise<string> {
    // Extraer datos clave para el template
    const newsData = this.extractNewsData(data.cleanContent);

    // Generar inicio con template
    const templateOpening = this.templateService.generateOpening(newsData);

    // Generar resto del contenido
    const prompt = `
Continúa esta noticia que YA tiene un inicio (no lo modifiques):

INICIO FIJO:
${templateOpening}

CONTENIDO A DESARROLLAR:
${data.cleanContent}

Continúa desde el inicio proporcionado, desarrollando el resto de la noticia de manera natural y profesional.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1800
    });

    return templateOpening + '\n\n' + response.choices[0].message.content;
  }

  private extractNewsData(content: string): any {
    // Lógica para extraer actores, acciones, números, etc.
    // Esto puede usar NLP o expresiones regulares
    return {
      mainActor: this.extractActor(content),
      mainAction: this.extractAction(content),
      affectedNumber: this.extractNumbers(content),
      location: this.extractLocation(content),
      // ... más extracciones
    };
  }

  private extractActor(content: string): string {
    // Buscar patrones comunes de actores
    const patterns = [
      /(?:Las?\s+)?(?:autoridades|gobierno|policía|secretaría)/i,
      /(?:Los?\s+)?(?:manifestantes|ciudadanos|vecinos|comerciantes)/i,
      /(?:El\s+)?(?:presidente|gobernador|alcalde|secretario)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[0];
    }

    return 'Las autoridades';
  }

  private extractAction(content: string): string {
    // Extraer verbo principal o acción
    const verbs = content.match(/\b(?:anunci|report|confirm|indic|señal|inform)\w*/i);
    return verbs ? verbs[0] : 'informaron';
  }

  private extractNumbers(content: string): number | null {
    const numbers = content.match(/\b\d+\b/);
    return numbers ? parseInt(numbers[0]) : null;
  }

  private extractLocation(content: string): string {
    const locations = content.match(/\b(?:Pachuca|Tulancingo|Tula|Mineral\s+de\s+la\s+Reforma)\b/i);
    return locations ? locations[0] : 'Pachuca';
  }
}
```

#### Paso 2: Integrar en el Módulo Principal

```typescript
// news.module.ts
import { Module } from '@nestjs/common';
import { NewsGenerationAntiPlagiarismService } from './services/news-generation-anti-plagiarism.service';
import { EditorialFormatDetectorService } from './services/editorial-format-detector.service';
import { NewsTemplateService } from './services/news-template.service';

@Module({
  providers: [
    NewsGenerationAntiPlagiarismService,
    EditorialFormatDetectorService,
    NewsTemplateService,
    // ... otros servicios
  ],
  exports: [
    NewsGenerationAntiPlagiarismService
  ]
})
export class NewsModule {}
```

### Código Completo del Prompt Actualizado

```typescript
// prompts/anti-plagiarism-news.prompt.ts
export const ANTI_PLAGIARISM_NEWS_PROMPT = `
Sistema de Generación de Noticias - Noticias Pachuca
Versión: Anti-Plagio v2.0

IDENTIDAD EDITORIAL:
Eres un periodista senior de Noticias Pachuca con 10 años de experiencia en medios digitales.
Tu misión es crear contenido 100% original que NUNCA copie formatos de otros medios.

==== SECCIÓN CRÍTICA: ANTI-PLAGIO ====

FORMATOS EDITORIALES PROHIBIDOS (NUNCA USAR):
1. ❌ "PACHUCA, Hgo., 21 de octubre de 2025.-" (Quadratin/Criterio)
2. ❌ "Pachuca / 21 de octubre.-" (El Sol/Milenio)
3. ❌ "PACHUCA.—" (Plaza Juárez)
4. ❌ "Pachuca.-" o "Pachuca, Hgo.-" (La Silla Rota)
5. ❌ Cualquier formato [UBICACIÓN]-[FECHA]-[PUNTUACIÓN]

DETECCIÓN AUTOMÁTICA:
Si detectas CUALQUIERA de estos patrones en el contenido fuente:
- Patrón ubicación-fecha al inicio
- Ciudad en mayúsculas seguida de puntuación
- Fecha precedida por barra o coma
→ DEBES ignorar completamente esa estructura

NUESTROS FORMATOS EXCLUSIVOS (USAR ESTOS):

Categoría A - Inicio Temporal:
• "Este [día de semana], [suceso principal]..."
• "Durante la jornada de [momento del día], [acontecimiento]..."
• "En las últimas horas, [desarrollo]..."
• "Desde temprana hora, [situación]..."

Categoría B - Inicio con Actor:
• "Autoridades [tipo] [acción realizada]..."
• "Representantes de [organización] [anuncio]..."
• "Personal de [dependencia] [actividad]..."
• "Habitantes de [zona] [manifestación]..."

Categoría C - Inicio con Impacto:
• "Más de [número] [afectados] [consecuencia]..."
• "Al menos [cantidad] [unidad] [resultado]..."
• "Cerca de [cifra] [elementos] [situación]..."

Categoría D - Inicio con Contexto:
• "En el marco de [evento], [desarrollo]..."
• "Como parte de [programa], [acción]..."
• "Tras [acontecimiento previo], [consecuencia]..."
• "Debido a [causa], [efecto]..."

Categoría E - Ubicación Integrada (NO como encabezado):
• "La zona [área] de [ciudad] [verbo]..."
• "En [colonia/municipio] se [acción]..."
• "El centro de [ciudad] [situación]..."

==== PROCESO DE GENERACIÓN ====

PASO 1 - Análisis del Contenido Fuente:
□ Identificar formato editorial (si existe)
□ Eliminar mentalmente ese formato
□ Extraer hechos clave
□ Identificar: qué, quién, cuándo, dónde, por qué

PASO 2 - Selección de Formato Propio:
□ Elegir una categoría (A-E) apropiada
□ Seleccionar formato específico
□ Adaptar a los hechos

PASO 3 - Redacción Original:
□ Comenzar con formato seleccionado
□ Integrar ubicación naturalmente (no como dateline)
□ Mencionar tiempo contextualmente
□ Desarrollar con voz propia

PASO 4 - Validación Anti-Plagio:
□ ¿Mi inicio es diferente al original? ✓
□ ¿Evité formato ubicación-fecha-guión? ✓
□ ¿Usé un formato de Noticias Pachuca? ✓
□ ¿La información está integrada? ✓

==== EJEMPLOS PRÁCTICOS ====

MALO (Plagio de Quadratin):
"PACHUCA, Hgo., 21 de octubre de 2025.- El gobernador anunció..."

BUENO (Original Noticias Pachuca):
"Este lunes, el gobernador de Hidalgo anunció desde la capital del estado..."

MALO (Plagio de El Sol):
"Pachuca / 21 de octubre.- Manifestantes bloquearon..."

BUENO (Original Noticias Pachuca):
"Un grupo de manifestantes bloqueó las principales vialidades de Pachuca durante..."

==== INFORMACIÓN CONTEXTUAL ====
Ubicación detectada: {location}
Fecha detectada: {date}
Contenido limpio: {clean_content}

==== GENERACIÓN ====
Ahora, genera una noticia 100% original siguiendo estas reglas:`;
```

## 4. Ejemplos Antes/Después

### Caso 1: Noticia de Quadratin

**Original de Quadratin**:
```
PACHUCA, Hgo., 21 de octubre de 2025.- En Hidalgo continúan suspendidas las actividades en escuelas de nivel básico debido a las condiciones climáticas adversas que han afectado a la entidad durante las últimas 48 horas.
```

**Generado ANTES (malo - plagio)**:
```html
<p><strong>PACHUCA, Hgo., 21 de octubre de 2025.</strong> En Hidalgo continúan suspendidas las actividades escolares en nivel básico por las condiciones climáticas...</p>
```

**Generado AHORA (bueno - original)**:
```html
<p>Las actividades escolares en nivel básico permanecen suspendidas en todo el territorio hidalguense debido a las severas condiciones climáticas que han impactado la región durante las últimas 48 horas. La medida, confirmada por autoridades educativas estatales, busca salvaguardar la integridad de estudiantes y personal docente.</p>

<p>Desde el pasado domingo, Pachuca y municipios aledaños han experimentado lluvias intensas que han provocado encharcamientos e inundaciones en diversas zonas...</p>
```

### Caso 2: Noticia de El Sol de Hidalgo

**Original de El Sol**:
```
Pachuca / 21 de octubre.- Comerciantes del centro histórico reportaron pérdidas millonarias tras el cierre temporal del primer cuadro de la ciudad.
```

**Generado ANTES (malo - plagio)**:
```html
<p><strong>Pachuca / 21 de octubre.-</strong> Los comerciantes del centro histórico han reportado pérdidas millonarias después del cierre temporal...</p>
```

**Generado AHORA (bueno - original)**:
```html
<p>Más de 300 comerciantes del centro histórico de la capital hidalguense enfrentan pérdidas que podrían superar los 5 millones de pesos tras el cierre temporal del primer cuadro de la ciudad. Los afectados, principalmente locatarios de pequeños negocios, señalaron que la medida ha impactado severamente sus ingresos diarios.</p>

<p>La restricción de acceso al centro, implementada desde hace tres días, responde a...</p>
```

### Caso 3: Noticia de Plaza Juárez

**Original de Plaza Juárez**:
```
MINERAL DE LA REFORMA.— Elementos de seguridad pública detuvieron a tres personas por presunto robo a transeúnte en la colonia Carboneras.
```

**Generado ANTES (malo - plagio)**:
```html
<p><strong>MINERAL DE LA REFORMA.—</strong> Elementos de seguridad pública lograron la detención de tres individuos por robo a transeúnte...</p>
```

**Generado AHORA (bueno - original)**:
```html
<p>Elementos de seguridad pública lograron la captura de tres presuntos delincuentes acusados de robo a transeúnte en la colonia Carboneras, municipio de Mineral de la Reforma. La detención se realizó tras una persecución que involucró a varias patrullas.</p>

<p>De acuerdo con reportes oficiales, los hechos ocurrieron cerca de las 14:00 horas cuando...</p>
```

## 5. Reglas de Inicios Originales

### Formatos Permitidos (Usar Estos)

#### Temporales
- "Este [día de la semana], [evento]"
- "Durante las primeras horas de [período], [suceso]"
- "A partir de [momento], [situación]"
- "En las últimas [unidad de tiempo], [desarrollo]"

#### De Acción
- "[Actor] [verbo en pasado] [objeto/complemento]"
- "[Cantidad] [sujetos] [acción realizada]"
- "[Organización] [anuncio/decisión]"

#### De Impacto
- "Más de [número] [afectados] [consecuencia]"
- "Al menos [cantidad] [elementos] [situación]"
- "Cerca de [cifra] [unidades] [estado]"

#### Contextuales
- "En el marco de [evento mayor], [desarrollo específico]"
- "Como resultado de [causa], [efecto]"
- "Tras [antecedente], [consecuente]"

#### Geográficos Integrados
- "La zona [específica] de [ciudad] [situación]"
- "En [localidad específica] se [desarrollo]"
- "El [lugar emblemático] [acción o estado]"

### Formatos Prohibidos (Nunca Usar)

#### Datelines Clásicos
- ❌ "CIUDAD, Estado, fecha.-"
- ❌ "Ciudad / fecha.-"
- ❌ "CIUDAD.—"
- ❌ "Ciudad.-"
- ❌ "Ciudad, Edo.-"

#### Estructuras Copiadas
- ❌ Cualquier inicio idéntico al medio fuente
- ❌ Formato con ciudad-fecha-puntuación
- ❌ Mayúsculas completas para ubicación
- ❌ Fecha como elemento separado al inicio

### Variaciones Sugeridas (Pool Creativo)

```javascript
const CREATIVE_OPENINGS = [
  // Dramáticos
  "El silencio se rompió cuando...",
  "Lo que parecía una jornada normal se transformó cuando...",

  // Informativos directos
  "Datos oficiales confirman que...",
  "Fuentes gubernamentales revelaron...",

  // Con estadísticas
  "El 70% de los afectados por...",
  "Uno de cada tres habitantes...",

  // Narrativos
  "La mañana del [día] trajo consigo...",
  "Cuando el reloj marcaba las [hora]...",

  // De continuidad
  "Por segundo día consecutivo...",
  "La situación se mantiene después de...",

  // Declarativos
  "\"[Cita reformulada]\", expresó...",
  "De acuerdo con declaraciones de...",

  // Causales
  "Debido a [causa], ahora...",
  "La razón detrás de [evento] es...",

  // Proyectivos
  "Se espera que para [tiempo futuro]...",
  "Las proyecciones indican que..."
];
```

## 6. Validación y Testing

### Cómo Detectar el Problema

**Checklist de Validación Manual**:
- [ ] ¿El inicio de mi noticia es idéntico al del medio fuente?
- [ ] ¿Aparece "PACHUCA, Hgo." al principio?
- [ ] ¿Hay un formato ciudad-fecha-guión?
- [ ] ¿Se puede identificar fácilmente el medio original?
- [ ] ¿El formato es consistente con otros medios conocidos?

### Regex para Detectar Formatos Editoriales

```javascript
// regex-validators.js
const EDITORIAL_PATTERNS = {
  // Quadratin/Criterio pattern
  quadratin: /^[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\.,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\s*\.-/i,

  // El Sol/Milenio pattern
  elSol: /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d{1,2}\s+de\s+\w+.*\.-/i,

  // Plaza Juárez pattern
  plazaJuarez: /^[A-ZÁÉÍÓÚÑ\s]+\.—/,

  // La Silla Rota pattern
  laSillaRota: /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+,?\s*(Hgo\.)?\s*\.-/i,

  // Generic date-location pattern
  generic: /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+\d{1,2}\s+(de\s+)?\w+(\s+de\s+\d{4})?\s*[\.-]/i
};

function detectEditorialFormat(text) {
  for (const [source, pattern] of Object.entries(EDITORIAL_PATTERNS)) {
    if (pattern.test(text)) {
      return {
        detected: true,
        source: source,
        pattern: pattern.source
      };
    }
  }
  return { detected: false };
}
```

### Testing Automatizado

```typescript
// editorial-format.spec.ts
import { EditorialFormatDetectorService } from './editorial-format-detector.service';

describe('EditorialFormatDetectorService', () => {
  let service: EditorialFormatDetectorService;

  beforeEach(() => {
    service = new EditorialFormatDetectorService();
  });

  describe('hasEditorialFormat', () => {
    it('should detect Quadratin format', () => {
      const text = 'PACHUCA, Hgo., 21 de octubre de 2025.- Contenido de la noticia...';
      expect(service.hasEditorialFormat(text)).toBe(true);
    });

    it('should detect El Sol format', () => {
      const text = 'Pachuca / 21 de octubre.- Contenido...';
      expect(service.hasEditorialFormat(text)).toBe(true);
    });

    it('should detect Plaza Juárez format', () => {
      const text = 'PACHUCA.— Contenido de la noticia...';
      expect(service.hasEditorialFormat(text)).toBe(true);
    });

    it('should not detect clean content', () => {
      const text = 'Las autoridades municipales anunciaron hoy...';
      expect(service.hasEditorialFormat(text)).toBe(false);
    });
  });

  describe('removeEditorialFormat', () => {
    it('should remove Quadratin format', () => {
      const text = 'PACHUCA, Hgo., 21 de octubre de 2025.- El gobernador anunció...';
      const cleaned = service.removeEditorialFormat(text);
      expect(cleaned).toBe('El gobernador anunció...');
    });

    it('should remove El Sol format', () => {
      const text = 'Pachuca / 21 de octubre.- Manifestantes bloquearon...';
      const cleaned = service.removeEditorialFormat(text);
      expect(cleaned).toBe('Manifestantes bloquearon...');
    });
  });

  describe('validateGeneratedContent', () => {
    it('should reject content with editorial format', () => {
      const text = '<p><strong>PACHUCA, Hgo., 21 de octubre.</strong> Contenido...</p>';
      const validation = service.validateGeneratedContent(text);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El contenido generado contiene formato editorial prohibido');
    });

    it('should accept clean content', () => {
      const text = '<p>Durante la jornada de hoy, autoridades estatales confirmaron...</p>';
      const validation = service.validateGeneratedContent(text);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
```

### Suite de Pruebas E2E

```typescript
// news-generation-e2e.spec.ts
describe('News Generation Anti-Plagiarism E2E', () => {
  it('should generate news without editorial formats', async () => {
    const sources = [
      {
        name: 'Quadratin',
        content: 'PACHUCA, Hgo., 21 de octubre de 2025.- Contenido de prueba...'
      },
      {
        name: 'El Sol',
        content: 'Pachuca / 21 de octubre.- Otro contenido...'
      },
      {
        name: 'Plaza Juárez',
        content: 'PACHUCA.— Más contenido de prueba...'
      }
    ];

    for (const source of sources) {
      const generated = await newsService.generateNews(source.content);

      // No debe contener formatos editoriales
      expect(generated).not.toMatch(/^PACHUCA,\s*Hgo\./i);
      expect(generated).not.toMatch(/^Pachuca\s*\/\s*\d/i);
      expect(generated).not.toMatch(/^PACHUCA\.—/);

      // Debe contener el contenido reformulado
      expect(generated.toLowerCase()).toContain('contenido');

      console.log(`✅ ${source.name}: Sin formato editorial detectado`);
    }
  });
});
```

## 7. Implementación

### Archivos a Modificar

1. `/packages/api-nueva/src/services/news-generation.service.ts` (o equivalente)
2. `/packages/api-nueva/src/modules/news/news.module.ts`
3. `/packages/api-nueva/src/config/openai.config.ts`
4. `/packages/api-nueva/.env`

### Archivos a Crear

1. `/packages/api-nueva/src/services/editorial-format-detector.service.ts`
2. `/packages/api-nueva/src/services/news-template.service.ts`
3. `/packages/api-nueva/src/services/news-generation-anti-plagiarism.service.ts`
4. `/packages/api-nueva/src/prompts/anti-plagiarism-news.prompt.ts`
5. `/packages/api-nueva/src/services/__tests__/editorial-format-detector.spec.ts`
6. `/packages/api-nueva/src/services/__tests__/news-template.spec.ts`

### Plan de Rollout

#### Fase 1: Desarrollo (2-3 días)
1. Crear servicios de detección y templates
2. Actualizar prompts con reglas anti-plagio
3. Implementar sistema de validación
4. Escribir tests unitarios

#### Fase 2: Testing (1-2 días)
1. Pruebas con contenido real de cada medio
2. Validación de formatos generados
3. Ajuste de reglas y patterns
4. Pruebas de regresión

#### Fase 3: Deployment (1 día)
1. Deploy a staging/desarrollo
2. Monitoreo intensivo por 24 horas
3. Recolección de métricas
4. Ajustes finales

#### Fase 4: Producción (1 día)
1. Deploy a producción con feature flag
2. Activación gradual (10% → 50% → 100%)
3. Monitoreo de alertas
4. Rollback plan listo

### Configuración de Environment Variables

```bash
# .env
# Anti-Plagiarism Configuration
ENABLE_ANTI_PLAGIARISM=true
PLAGIARISM_DETECTION_LEVEL=strict
TEMPLATE_VARIATION_ENABLED=true
FALLBACK_TO_TEMPLATES=true

# OpenAI Configuration
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# Monitoring
LOG_PLAGIARISM_DETECTIONS=true
ALERT_ON_PLAGIARISM=true
PLAGIARISM_ALERT_WEBHOOK=https://hooks.slack.com/...
```

## 8. Monitoreo y Métricas

### KPIs a Trackear

```typescript
interface AntiPlagiarismMetrics {
  totalGenerations: number;
  plagiarismDetected: number;
  successfulRegeneration: number;
  templateUsage: number;
  averageGenerationTime: number;
  formatDistribution: {
    temporal: number;
    actor: number;
    impact: number;
    context: number;
    location: number;
  };
}
```

### Dashboard de Monitoreo

```javascript
// Métricas a visualizar en tiempo real
const DASHBOARD_METRICS = {
  // Tasa de detección de plagio
  plagiarismRate: (detected / total) * 100,

  // Efectividad del sistema
  successRate: (successful / total) * 100,

  // Uso de templates de respaldo
  templateFallbackRate: (templateUsed / total) * 100,

  // Distribución de formatos
  formatVariety: calculateShannonEntropy(formatDistribution),

  // Alertas
  alerts: {
    highPlagiarismRate: plagiarismRate > 10,
    lowVariety: formatVariety < 0.7,
    slowGeneration: avgTime > 5000
  }
};
```

### Logs de Auditoría

```typescript
// Estructura de logs para análisis
interface PlagiarismAuditLog {
  timestamp: Date;
  sourceUrl: string;
  sourceMedium: string;
  detectedFormat: string | null;
  generationMethod: 'prompt' | 'template' | 'retry';
  success: boolean;
  generationTime: number;
  finalFormat: string;
  validationPassed: boolean;
}
```

## 9. Conclusiones y Recomendaciones

### Implementación Inmediata (Día 1)
1. ✅ Actualizar el prompt con reglas anti-plagio (30 min)
2. ✅ Implementar validación básica con regex (1 hora)
3. ✅ Testing con 10 noticias reales (30 min)

### Implementación Completa (Semana 1)
1. ✅ Sistema completo de detección
2. ✅ Templates y variaciones
3. ✅ Testing exhaustivo
4. ✅ Documentación

### Mantenimiento Continuo
1. 📊 Monitorear métricas semanalmente
2. 🔄 Actualizar templates mensualmente
3. 📝 Agregar nuevos formatos detectados
4. 🎯 Ajustar según feedback

### Resultado Esperado
- **Eliminación del 100% de formatos editoriales copiados**
- **Creación de identidad editorial propia**
- **Protección contra reclamaciones de plagio**
- **Mejor posicionamiento SEO por contenido único**

---

**Documento preparado por**: Jarvis (Sistema de Análisis Anti-Plagio)
**Fecha**: 21 de octubre de 2025
**Versión**: 1.0
**Estado**: Listo para implementación

---

## Anexo: Código de Implementación Rápida

Para implementación inmediata, aquí está el código mínimo necesario:

```typescript
// quick-implementation.ts
// Copiar y pegar en el servicio de generación actual

const ANTI_PLAGIARISM_RULES = `
NUNCA inicies con:
- "PACHUCA, Hgo., [fecha].-"
- "Ciudad / [fecha].-"
- "CIUDAD.—"

SIEMPRE inicia con uno de estos:
- "Este [día], [evento]..."
- "Autoridades [acción]..."
- "[Número] personas [resultado]..."

NO copies el formato del texto original.
`;

function cleanEditorialFormat(text: string): string {
  // Eliminar formatos editoriales comunes
  return text
    .replace(/^[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\.,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\s*\.-/i, '')
    .replace(/^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d{1,2}\s+de\s+\w+.*\.-/i, '')
    .replace(/^[A-ZÁÉÍÓÚÑ\s]+\.—/, '')
    .replace(/^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+,?\s*(Hgo\.)?\s*\.-/i, '')
    .trim();
}

function validateNoEditorialFormat(text: string): boolean {
  const prohibitedPatterns = [
    /^[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\./i,
    /^<p><strong>[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\./i,
    /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d/i,
    /^[A-ZÁÉÍÓÚÑ]+\.—/
  ];

  return !prohibitedPatterns.some(pattern => pattern.test(text));
}

// Integrar en el método de generación existente
async function generateNews(sourceContent: string): Promise<string> {
  const cleanContent = cleanEditorialFormat(sourceContent);

  const prompt = ANTI_PLAGIARISM_RULES + '\n\nContenido: ' + cleanContent;

  const generated = await callOpenAI(prompt);

  if (!validateNoEditorialFormat(generated)) {
    // Reintentar con instrucciones más estrictas
    return regenerateWithStricterRules(generated);
  }

  return generated;
}
```

Este documento proporciona una solución completa, práctica e inmediatamente implementable para eliminar el plagio de formatos editoriales en el sistema de generación de noticias.