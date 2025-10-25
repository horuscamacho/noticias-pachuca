import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  ContentAgent,
  ContentAgentDocument,
} from '../schemas/content-agent.schema';
import { ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';

/**
 * 🛠️ GeneratorProPromptBuilderService
 * Construye prompts optimizados para generación de contenido con copys sociales
 */
@Injectable()
export class GeneratorProPromptBuilderService {
  private readonly logger = new Logger(GeneratorProPromptBuilderService.name);

  constructor(
    @InjectModel(ContentAgent.name)
    private readonly agentModel: Model<ContentAgentDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Construir prompts completos para generación de contenido + copys sociales
   */
  async buildPrompt(params: {
    extractedNoticia: ExtractedNoticiaDocument;
    agentId: string;
    referenceContent?: string;
  }): Promise<{
    systemPrompt: string;
    userPrompt: string;
    expectedFormat: object;
    agentConfig: object;
  }> {
    // 1. Obtener ContentAgent por agentId
    const agent = await this.agentModel.findById(params.agentId).exec();
    if (!agent) {
      throw new NotFoundException(
        `Content Agent with ID ${params.agentId} not found`,
      );
    }

    // 2. Construir input con estructura FIJA
    const input = {
      title: params.extractedNoticia.title || 'Sin título',
      content: params.extractedNoticia.content || '',
      ...(params.referenceContent && {
        referenceContent: params.referenceContent,
      }),
    };

    // 3. Construir systemPrompt con personalidad del agente + instrucciones sociales
    const systemPrompt = this.buildSystemPrompt(agent);

    // 4. Construir userPrompt con el contenido a procesar
    const userPrompt = this.buildUserPrompt(input, agent.agentType);

    // 5. Definir expectedFormat con estructura de output
    const expectedFormat = this.buildExpectedFormat();

    // 6. Configuración del agente para metadata
    const agentConfig = {
      agentId: params.agentId,
      agentName: agent.name,
      agentType: agent.agentType,
      editorialLean: agent.editorialLean,
      writingStyle: agent.writingStyle,
    };

    // 🚨 LOGS DE DEBUGGING
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn('🛑 SYSTEM PROMPT CONSTRUIDO:');
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn(`Longitud: ${systemPrompt.length} caracteres`);
    this.logger.warn(`Primeros 500 caracteres:`);
    this.logger.warn(systemPrompt.substring(0, 500));
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn('📝 USER PROMPT CONSTRUIDO:');
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn(`Longitud: ${userPrompt.length} caracteres`);
    this.logger.warn(`Contenido original (primeros 300 chars):`);
    this.logger.warn(input.content.substring(0, 300));
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Emitir evento de construcción de prompt
    this.eventEmitter.emit('generator-pro.prompt.built', {
      agentId: params.agentId,
      extractedNoticiaId: params.extractedNoticia._id,
      timestamp: new Date(),
    });

    return {
      systemPrompt,
      userPrompt,
      expectedFormat,
      agentConfig,
    };
  }

  /**
   * Construir System Prompt con personalidad del agente + instrucciones copys sociales
   */
  private buildSystemPrompt(agent: ContentAgentDocument): string {
    const antiFormatRestriction = this.buildAntiFormatRestriction();
    const agentPersonalitySection = this.buildAgentPersonalitySection(agent);
    const enrichedGuidelines = this.buildEnrichedGuidelines();
    const socialMediaInstructions = this.buildSocialMediaInstructions();

    return `${antiFormatRestriction}

${agentPersonalitySection}

${enrichedGuidelines}

${socialMediaInstructions}`;
  }

  /**
   * 🛑 RESTRICCIÓN ABSOLUTA #1: ANTI-PLAGIO DE FORMATOS EDITORIALES
   */
  private buildAntiFormatRestriction(): string {
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑🛑🛑 RESTRICCIÓN ABSOLUTA #1 - ANTI-PLAGIO DE FORMATOS 🛑🛑🛑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ PASO OBLIGATORIO ANTES DE GENERAR CONTENIDO:

1. ANALIZA el contenido original: ¿Comienza con [CIUDAD + FECHA + PUNTUACIÓN]?
2. Si detectas CUALQUIERA de estos patrones → IGNÓRALOS COMPLETAMENTE:

PATRONES PROHIBIDOS (JAMÁS COPIES):
❌ "PACHUCA, Hgo., [fecha].-"
❌ "TULANCINGO, Hgo., [fecha].-"
❌ "CIUDAD SAHAGÚN, Hgo., [fecha].-"
❌ "MINERAL DE LA REFORMA, Hgo., [fecha].-"
❌ "[CIUDAD], Hgo., [fecha].-"
❌ "[Ciudad], Hidalgo, a [fecha]."
❌ "[CIUDAD].—"
❌ "[Ciudad].–"

3. GENERA tu propio inicio SIEMPRE con formato único de "Noticias Pachuca":
   ✅ Comenzar directo con el lead informativo
   ✅ Primer párrafo con la información más relevante
   ✅ SIN incluir ciudad/fecha/puntuación al inicio

EJEMPLOS DE INICIO CORRECTO:
✅ "Las autoridades estatales anunciaron hoy..."
✅ "Un grupo de vecinos de la colonia..."
✅ "El gobierno municipal presentó el nuevo programa..."
✅ "Durante la sesión de cabildo se aprobó..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 VERIFICACIÓN DE 3 CAPAS (OBLIGATORIA):

CAPA 1 - DETECCIÓN:
□ ¿El contenido original comienza con [CIUDAD + FECHA]?
□ Si SÍ → Marcar como "formato editorial ajeno" y NO copiarlo

CAPA 2 - GENERACIÓN:
□ ¿Tu contenido generado comienza con [CIUDAD + FECHA]?
□ Si SÍ → REINICIAR y generar un inicio diferente
□ Debe comenzar directo con el lead informativo

CAPA 3 - VALIDACIÓN FINAL:
□ Lee los primeros 100 caracteres de tu contenido generado
□ ¿Contiene algún patrón prohibido?
□ Si SÍ → RECHAZAR y volver a generar
□ Si NO → Aprobar para envío

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ESTA RESTRICCIÓN ES ABSOLUTA Y NO ADMITE EXCEPCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  /**
   * SECCIÓN 1: IDENTIDAD Y PERSONALIDAD DEL AGENTE
   */
  private buildAgentPersonalitySection(agent: ContentAgentDocument): string {
    return `🎭 IDENTIDAD PRINCIPAL - ERES ${agent.name.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${agent.personality}

🎯 PERFIL PERIODÍSTICO:
• Tipo: ${agent.agentType}
• Línea Editorial: ${agent.editorialLean}
• Especialidades: ${agent.specializations.join(', ')}

✍️ ESTILO DE REDACCIÓN:
• Tono: ${agent.writingStyle.tone}
• Vocabulario: ${agent.writingStyle.vocabulary}
• Audiencia: ${agent.writingStyle.audience}

⚠️ Tu voz, criterio y naturalidad SON prioridad sobre cualquier formato técnico.
Eres un periodista humano con criterio, no un bot ni un redactor automático.`;
  }

  /**
   * SECCIÓN 2: Instrucciones MINIMALISTAS (anti-robotización)
   */
  private buildEnrichedGuidelines(/* agentType: string */): string {
    return `
REESCRIBE ESTO COMO TÚ LO CONTARÍAS:

Reglas básicas:
- Empieza directo, sin rodeos
- Párrafos de longitud DIFERENTE (unos cortos, otros largos)
- Si mencionas fuentes, hazlo casual: "según me comentaron" o "documentos a los que tuve acceso"
- PROHIBIDO usar: "expertos señalan", "analistas indican", "en resumen", "en síntesis", "cabe mencionar"
- Termina cuando ya dijiste lo importante, no cuando "debas concluir"
- Si usas HTML, que sea mínimo: <p> para párrafos, <strong> solo para nombres propios la primera vez
- Longitud: Lo que necesites para contar la historia bien (puede ser 400 palabras o 800, tú decides)`;
  }

  /**
   * SECCIÓN 3: Copys de redes sociales (minimalista)
   */
  private buildSocialMediaInstructions(): string {
    return `
COPYS DE REDES SOCIALES:

Facebook (40-80 palabras):
- Hook interesante con datos específicos
- OBLIGATORIO incluir campo "hashtag": un hashtag único como #TemaPachuca2025
- 2-3 emojis relevantes al inicio

Twitter (200-240 caracteres):
- Tweet directo con lo más importante
- OBLIGATORIO incluir campo "hashtags": array de 1-2 hashtags como ["#Tema", "#Hidalgo"]
- 1-2 emojis máximo

IMPORTANTE: Los campos hashtag (Facebook) y hashtags (Twitter) son OBLIGATORIOS en el JSON.`;
  }

  /**
   * Construir User Prompt con contenido a procesar
   */
  private buildUserPrompt(
    input: { title: string; content: string; referenceContent?: string },
    agentType: string,
  ): string {
    let prompt = `Tengo esto:

"${input.title}"

${input.content}
`;

    if (input.referenceContent) {
      prompt += `\n(Referencia adicional: ${input.referenceContent})\n`;
    }

    prompt += `
Reescríbelo completamente a tu manera. Mantén los hechos, pero cambia TODO lo demás.

Categoría (elige UNA): Política | Deportes | Cultura | Economía | Seguridad | Salud | Educación | Tecnología

Responde con JSON:

{
  "title": "Nuevo título creativo y original para este artículo",
  "content": "Artículo completo en HTML con redacción fluida, enriquecida y 100% original.",
  "keywords": ["Palabras clave relevantes (3-5 keywords)"],
  "tags": ["Etiquetas contextuales (4-6 tags)"],
  "category": "OBLIGATORIO: Política | Deportes | Cultura | Economía | Seguridad | Salud | Educación | Tecnología",
  "summary": "Resumen conciso en 3-4 líneas (MÁXIMO 300 caracteres)",
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
}`;
    return prompt;
  }

  /**
   * Definir estructura esperada del output
   */
  private buildExpectedFormat(): object {
    return {
      title: 'string - Título transformado',
      content: 'string - Contenido principal transformado',
      keywords: 'string[] - Keywords SEO relevantes',
      tags: 'string[] - Tags del contenido',
      category: 'string - Categoría principal',
      summary: 'string - Resumen breve del contenido',
      socialMediaCopies: {
        facebook: {
          hook: 'string - Hook viral 10-15 palabras',
          copy: 'string - Copy completo 40-80 palabras',
          emojis: 'string[] - Máximo 4 emojis',
          hookType: 'Scary | FreeValue | Strange | Sexy | Familiar',
          estimatedEngagement: 'high | medium | low',
        },
        twitter: {
          tweet: 'string - Tweet 200-240 caracteres',
          hook: 'string - Hook viral',
          emojis: 'string[] - Máximo 2 emojis',
          hookType: 'string - Tipo de hook usado',
          threadIdeas: 'string[] - 3-4 ideas para thread',
        },
      },
    };
  }
}
