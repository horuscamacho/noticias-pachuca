import { Injectable, NotFoundException } from '@nestjs/common';
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
    const agentPersonalitySection = this.buildAgentPersonalitySection(agent);
    const enrichedGuidelines = this.buildEnrichedGuidelines();
    const socialMediaInstructions = this.buildSocialMediaInstructions();

    return `${agentPersonalitySection}

${enrichedGuidelines}

${socialMediaInstructions}`;
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
   * SECCIÓN 2: Instrucciones enriquecidas y adaptativas
   */
  private buildEnrichedGuidelines(/* agentType: string */): string {
    return `
🧠 DIRECTRICES ADAPTATIVAS DE REDACCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OBJETIVO:
Transforma el texto fuente en una versión NUEVA, ORIGINAL y ENRIQUECIDA, sin copiar estructuras ni frases del original.

💡 ESTILO SEGÚN TIPO DE CONTENIDO:
- **reportero** → Prioriza hechos, contexto y testimonio directo. Usa ritmo natural, párrafos variados y precisión informativa.
- **columnista** → Argumenta con voz propia, reflexión y matices analíticos. Varía estructuras narrativas, agrega comparaciones y citas conceptuales.
- **trascendido** → Juega con el misterio, fuentes veladas y ritmo pausado. Usa tono confidencial, pero siempre con sutileza periodística.
- **seo-specialist** → Fluidez conversacional con optimización natural. Inserta keywords sin rigidez y prioriza legibilidad humana.

✨ ENRIQUECIMIENTO SEMÁNTICO:
• Reformula siempre con lenguaje propio, sin copiar frases ni estructuras.
• Emplea sinónimos, cambios sintácticos, giros idiomáticos y reformulación conceptual.
• Incluye contexto, consecuencias, antecedentes y reacciones, según convenga.
• Usa conectores naturales ("sin embargo", "aun así", "por otra parte", "no obstante").
• Introduce ocasionalmente frases reflexivas o humanizadas: <em>“porque al final, toda historia tiene su trasfondo humano”</em>.
• Mantén coherencia narrativa: evita saltos bruscos o párrafos inconexos.

📜 USO INTELIGENTE DE FORMATO HTML:
• <strong> → Palabras clave o ideas relevantes.
• <em> → Reflexiones, modismos, o énfasis emocional.
• <blockquote> → Solo para citas textuales o testimoniales:
   <blockquote><p>"La situación nos tomó por sorpresa", expresó un funcionario local.</p></blockquote>

• No dividas por secciones artificiales (<h2>/<h3>) salvo 1 o 2 si es natural.
• Combina párrafos cortos y largos para un ritmo fluido, sin patrón fijo.

🚫 PROHIBIDO:
• Copiar texto o estructura del contenido original.
• Mantener mismo orden de párrafos o frases.
• Repetir inicios de párrafo o estructuras gramaticales iguales.
• Crear artículos mecánicos o monótonos.

✅ OBLIGATORIO:
• Mínimo 800 palabras con desarrollo real.
• Fluidez, voz humana y riqueza lingüística.
• Contenido totalmente original en expresión.`;
  }

  /**
   * SECCIÓN 3: Instrucciones para redes sociales
   */
  private buildSocialMediaInstructions(): string {
    return `
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

💬 Cada copy debe reflejar TU voz, no sonar genérico ni publicitario.`;
  }

  /**
   * Construir User Prompt con contenido a procesar
   */
  private buildUserPrompt(
    input: { title: string; content: string; referenceContent?: string },
    agentType: string,
  ): string {
    const styleNote =
      agentType === 'reportero'
        ? 'Enfócate en hechos, testimonios y contexto.'
        : agentType === 'columnista'
          ? 'Prioriza análisis, interpretación y tono personal.'
          : agentType === 'trascendido'
            ? 'Usa tono reservado y enigmático con ritmo pausado.'
            : 'Redacta con naturalidad y optimización SEO sin sonar artificial.';

    let prompt = `Procesa el siguiente contenido y créalo de nuevo desde cero, con lenguaje original y enriquecido:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 TÍTULO ORIGINAL:
${input.title}

📄 CONTENIDO ORIGINAL:
${input.content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    if (input.referenceContent) {
      prompt += `
📚 CONTENIDO DE REFERENCIA:
${input.referenceContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    prompt += `
🎯 MISIÓN:
Genera un nuevo artículo basado en la información, pero con redacción 100% original.
${styleNote}

🧩 REGLAS FUNDAMENTALES:
- NO copies frases ni reformules párrafos literales.
- Cambia el orden narrativo y las estructuras sintácticas.
- Usa expresiones equivalentes, pero NO idénticas.
- Mantén precisión en los hechos.
- Enriquece el texto con contexto, antecedentes y consecuencias.
- Varía ritmo, longitud y tono de párrafos naturalmente.

🏷️ CATEGORIZACIÓN - ¡MUY IMPORTANTE!:
- La categoría DEBE ser EXACTAMENTE UNA de estas 8 opciones:
  ✅ Política
  ✅ Deportes
  ✅ Cultura
  ✅ Economía
  ✅ Seguridad
  ✅ Salud
  ✅ Educación
  ✅ Tecnología

- 🚫 PROHIBIDO usar estas categorías genéricas:
  ❌ "Noticias"
  ❌ "General"
  ❌ "Actualidad"
  ❌ "Información"
  ❌ "Municipios"
  ❌ "Local"

- EJEMPLOS DE CLASIFICACIÓN CORRECTA:
  • Exalcalde condenado por corrupción → "Política" o "Seguridad"
  • Brigadas médicas del IMSS → "Salud"
  • Tormenta afecta municipio → "Seguridad"
  • Inauguración de museo → "Cultura"
  • Inversión empresarial → "Economía"
  • Torneo de fútbol → "Deportes"
  • Nueva universidad → "Educación"
  • Aplicación móvil → "Tecnología"

🧠 DETALLES:
- Usa HTML (<p>, <strong>, <em>, <blockquote>, <ul>/<ol>) de forma orgánica.
- <blockquote> solo para citas reales de personas.
- Crea una lectura fluida, tipo artículo periodístico.
- No uses subtítulos innecesarios (máximo 1-2 <h2> si es natural).
- Mínimo 800 palabras de desarrollo.

📦 RESPUESTA FINAL - JSON PURO (sin markdown, sin comillas adicionales):

{
  "title": "Nuevo título creativo y original para este artículo",
  "content": "Artículo completo en HTML con redacción fluida, enriquecida y 100% original.",
  "keywords": ["Palabras clave relevantes (3-5 keywords)"],
  "tags": ["Etiquetas contextuales (4-6 tags)"],
  "category": "OBLIGATORIO: Política | Deportes | Cultura | Economía | Seguridad | Salud | Educación | Tecnología",
  "summary": "Resumen conciso en 3-4 líneas",
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
