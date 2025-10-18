import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIContentGeneration, AIContentGenerationDocument } from '../schemas/ai-content-generation.schema';
import { ProviderFactoryService } from './provider-factory.service';

/**
 * 📱 Servicio para mejorar copy de redes sociales con agente especializado
 *
 * Se utiliza antes de publicar en redes sociales para:
 * - Mejorar hooks de Facebook y Twitter
 * - Agregar URL canónica al copy
 * - Optimizar engagement
 * - Ajustar emojis
 */
@Injectable()
export class CopyImproverService {
  private readonly logger = new Logger(CopyImproverService.name);

  constructor(
    @InjectModel(AIContentGeneration.name)
    private readonly aiContentModel: Model<AIContentGenerationDocument>,
    private readonly providerFactory: ProviderFactoryService,
  ) {
    this.logger.log('📱 CopyImproverService initialized');
  }

  /**
   * 🔧 Mejora los copys de redes sociales de un contenido generado
   *
   * @param contentId - ID del AIContentGeneration
   * @param canonicalUrl - URL canónica de la noticia publicada (opcional)
   * @returns Copys mejorados para Facebook y Twitter
   */
  async improveSocialMediaCopy(
    contentId: string,
    canonicalUrl?: string,
  ): Promise<{
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: string;
      estimatedEngagement: 'high' | 'medium' | 'low';
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      hookType: string;
      threadIdeas: string[];
    };
  }> {
    this.logger.log(`📱 Improving social media copy for content ${contentId}`);

    try {
      // 1️⃣ Obtener contenido generado
      const content = await this.aiContentModel.findById(contentId);
      if (!content) {
        throw new NotFoundException(`Content ${contentId} not found`);
      }

      if (!content.socialMediaCopies) {
        throw new NotFoundException(`Content ${contentId} has no social media copies to improve`);
      }

      // 2️⃣ Construir prompt para mejorar copy
      const prompt = this.buildImproveCopyPrompt(content, canonicalUrl);

      // 3️⃣ Obtener adapter de OpenAI
      const adapter = this.providerFactory.getProvider('OpenAI');

      // 4️⃣ Llamar a proveedor de IA para mejorar copy
      const improvedCopyResponse = await adapter.generateContent({
        systemPrompt: 'Eres un experto en social media y copywriting.',
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 3000, // GPT-5 usa reasoning tokens (~1000) + content tokens (~2000)
      });

      // 5️⃣ Parsear respuesta
      const improvedCopy = this.parseImprovedCopyResponse(improvedCopyResponse.content);

      // 6️⃣ Actualizar contenido con copys mejorados
      content.socialMediaCopies = {
        facebook: improvedCopy.facebook ? {
          ...improvedCopy.facebook,
          hookType: improvedCopy.facebook.hookType as 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar',
        } : content.socialMediaCopies.facebook,
        twitter: improvedCopy.twitter || content.socialMediaCopies.twitter,
        instagram: content.socialMediaCopies.instagram,
        linkedin: content.socialMediaCopies.linkedin,
      };

      await content.save();

      this.logger.log(`✅ Social media copy improved for content ${contentId}`);

      return {
        facebook: improvedCopy.facebook,
        twitter: improvedCopy.twitter,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to improve copy for content ${contentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔨 Construye el prompt para mejorar copy
   */
  private buildImproveCopyPrompt(
    content: AIContentGenerationDocument,
    canonicalUrl?: string,
  ): string {
    const { socialMediaCopies, generatedTitle, generatedSummary } = content;

    return `
Eres un experto en social media y copywriting. Tu tarea es mejorar los copys para Facebook y Twitter de una noticia.

**NOTICIA:**
Título: ${generatedTitle}
Resumen: ${generatedSummary || 'Sin resumen'}
${canonicalUrl ? `URL: ${canonicalUrl}` : ''}

**COPYS ACTUALES:**

Facebook:
- Hook: ${socialMediaCopies?.facebook?.hook || 'Sin hook'}
- Copy: ${socialMediaCopies?.facebook?.copy || 'Sin copy'}
- Emojis: ${socialMediaCopies?.facebook?.emojis?.join(' ') || 'Sin emojis'}
- Hook Type: ${socialMediaCopies?.facebook?.hookType || 'Sin tipo'}

Twitter:
- Tweet: ${socialMediaCopies?.twitter?.tweet || 'Sin tweet'}
- Hook: ${socialMediaCopies?.twitter?.hook || 'Sin hook'}
- Emojis: ${socialMediaCopies?.twitter?.emojis?.join(' ') || 'Sin emojis'}

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

**FORMATO DE RESPUESTA (JSON):**

\`\`\`json
{
  "facebook": {
    "hook": "Hook mejorado aquí",
    "copy": "Copy mejorado aquí${canonicalUrl ? ` ${canonicalUrl}` : ''}",
    "emojis": ["🔥", "📰"],
    "hookType": "Scary",
    "estimatedEngagement": "high"
  },
  "twitter": {
    "tweet": "Tweet mejorado aquí${canonicalUrl ? ` ${canonicalUrl}` : ''}",
    "hook": "Hook mejorado para Twitter",
    "emojis": ["📰"],
    "hookType": "FreeValue",
    "threadIdeas": [
      "Idea 1 para thread",
      "Idea 2 para thread"
    ]
  }
}
\`\`\`

Responde SOLO con el JSON, sin texto adicional.
`;
  }

  /**
   * 📄 Parsea la respuesta de IA para extraer copys mejorados
   */
  private parseImprovedCopyResponse(response: string): {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: string;
      estimatedEngagement: 'high' | 'medium' | 'low';
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      hookType: string;
      threadIdeas: string[];
    };
  } {
    try {
      // Extraer JSON del response (puede venir con markdown)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/({[\s\S]*})/);

      if (!jsonMatch) {
        this.logger.warn('⚠️ No JSON found in response, returning empty object');
        return {};
      }

      const jsonString = jsonMatch[1];
      const parsed = JSON.parse(jsonString);

      return {
        facebook: parsed.facebook,
        twitter: parsed.twitter,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to parse improved copy response: ${error.message}`);
      this.logger.debug(`Response: ${response}`);
      return {};
    }
  }
}
