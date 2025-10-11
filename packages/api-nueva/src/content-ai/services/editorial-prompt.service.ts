import { Injectable, Logger } from '@nestjs/common';
import {
  EditorialPromptTemplate,
  EditorialPromptInput,
  EditorialPromptOptions,
  EditorialPromptResult,
  EditorialTemplateType,
  CameraSetup,
  LightingSetup,
  CompositionStyle,
  ShotType,
  EditorialAesthetic,
} from '../interfaces/editorial-prompt.interface';

/**
 * 📸 Editorial Prompt Service
 * Construye prompts profesionales para generación de imágenes editoriales
 * estilo TIME Magazine, The Economist, National Geographic
 *
 * RESPONSABILIDAD:
 * - Seleccionar template apropiado según análisis de contenido
 * - Construir prompts con mejores prácticas 2025/2026
 * - Aplicar especificaciones técnicas profesionales
 * - Optimizar para calidad editorial máxima
 *
 * TEMPLATES DISPONIBLES:
 * 1. Portrait: Para personas (políticos, funcionarios, profesionales)
 * 2. Scene: Para eventos/situaciones (conferencias, protestas, inauguraciones)
 * 3. Conceptual: Para ideas abstractas (economía, tecnología, salud)
 * 4. Documentary: Para estilo documental/reportaje (investigación, social)
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ NO usa forwardRef (servicio standalone)
 * ✅ Types explícitos en todos los métodos
 *
 * @example
 * const result = await editorialPrompt.build({
 *   contentAnalysis: { mainSubject: 'Municipal mayor', action: 'announcing', ... },
 *   originalTitle: 'Alcalde anuncia 68 obras'
 * });
 * // result.prompt = "Editorial magazine cover photograph: Distinguished municipal mayor..."
 */
@Injectable()
export class EditorialPromptService {
  private readonly logger = new Logger(EditorialPromptService.name);

  // Templates registry
  private readonly templates: Map<EditorialTemplateType, EditorialPromptTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
    this.logger.log('📸 Editorial Prompt Service initialized with 4 templates');
  }

  /**
   * Construir prompt editorial profesional
   *
   * @param input - Análisis de contenido + configuración
   * @param options - Opciones de construcción
   * @returns Prompt editorial completo + metadata
   */
  build(
    input: EditorialPromptInput,
    options?: EditorialPromptOptions,
  ): EditorialPromptResult {
    const startTime = Date.now();

    try {
      this.logger.log(`📸 Building editorial prompt for: "${input.originalTitle.substring(0, 50)}..."`);

      // Seleccionar template
      const templateType = input.templateType || this.selectTemplate(input.contentAnalysis);
      const template = this.templates.get(templateType);

      if (!template) {
        throw new Error(`Template "${templateType}" not found`);
      }

      this.logger.debug(`Selected template: ${templateType} (${template.name})`);

      // Configuración final (defaults + overrides)
      const config = {
        camera: input.overrides?.camera || template.defaultCamera,
        lighting: input.overrides?.lighting || template.defaultLighting,
        composition: input.overrides?.composition || template.defaultComposition,
        shot: input.overrides?.shot || template.defaultShot,
        aesthetic: input.overrides?.aesthetic || template.aesthetic,
      };

      // Construir prompt según template
      const prompt = this.buildPromptFromTemplate(
        template,
        input.contentAnalysis,
        config,
        options,
      );

      // Metadata
      const metadata = {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4), // Aproximación simple
        autoSelected: !input.templateType,
        selectionReason: this.getSelectionReason(templateType, input.contentAnalysis),
        builtAt: new Date(),
      };

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Prompt built successfully: ${prompt.length} chars, ` +
        `${metadata.estimatedTokens} tokens est., ${processingTime}ms`,
      );

      return {
        prompt,
        templateUsed: templateType,
        configuration: config,
        visualElements: input.contentAnalysis.visualElements,
        metadata,
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to build prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Seleccionar template apropiado según análisis de contenido
   */
  private selectTemplate(analysis: EditorialPromptInput['contentAnalysis']): EditorialTemplateType {
    // Portrait: Si mainSubject es persona específica
    const personKeywords = ['mayor', 'official', 'director', 'minister', 'president', 'leader', 'entrepreneur', 'doctor', 'teacher'];
    if (personKeywords.some(kw => analysis.mainSubject.toLowerCase().includes(kw))) {
      return 'portrait';
    }

    // Scene: Si hay acción y ubicación específica
    const sceneActions = ['announcing', 'protesting', 'celebrating', 'inaugurating', 'demonstrating', 'meeting'];
    if (sceneActions.some(action => analysis.action.toLowerCase().includes(action)) && analysis.location) {
      return 'scene';
    }

    // Conceptual: Para categorías abstractas
    const conceptualCategories = ['economy', 'technology', 'health'];
    if (conceptualCategories.includes(analysis.category)) {
      return 'conceptual';
    }

    // Documentary: Default para reportajes y social
    return 'documentary';
  }

  /**
   * Construir prompt desde template
   */
  private buildPromptFromTemplate(
    template: EditorialPromptTemplate,
    analysis: EditorialPromptInput['contentAnalysis'],
    config: EditorialPromptResult['configuration'],
    options?: EditorialPromptOptions,
  ): string {
    const opts = {
      includeTechnicalSpecs: options?.includeTechnicalSpecs !== false,
      includeAestheticReference: options?.includeAestheticReference !== false,
      includeCompositionGuide: options?.includeCompositionGuide !== false,
      includeNegativeSpace: options?.includeNegativeSpace !== false,
      maxLength: options?.maxLength || 500,
    };

    let parts: string[] = [];

    // 1. Tipo de fotografía + Sujeto + Acción
    parts.push(this.buildSubjectAction(template, analysis, config));

    // 2. Ubicación (si existe)
    if (analysis.location) {
      parts.push(`in ${analysis.location}`);
    }

    // 3. Lighting
    parts.push(this.buildLighting(config.lighting));

    // 4. Composition + Shot type
    if (opts.includeCompositionGuide) {
      parts.push(this.buildComposition(config.composition, config.shot));
    }

    // 5. Visual elements específicos
    if (analysis.visualElements.length > 0) {
      const visualPart = analysis.visualElements.slice(0, 3).join(', ');
      parts.push(`featuring ${visualPart}`);
    }

    // 6. Negative space (para headlines editoriales)
    if (opts.includeNegativeSpace) {
      parts.push('generous negative space at top for headlines');
    }

    // 7. Especificaciones técnicas de cámara
    if (opts.includeTechnicalSpecs) {
      parts.push(this.buildCameraSpecs(config.camera));
    }

    // 8. Technical keywords del template
    parts.push(template.technicalKeywords.join(', '));

    // 9. Estética de referencia
    if (opts.includeAestheticReference) {
      parts.push(this.buildAestheticReference(config.aesthetic));
    }

    // 10. Quality markers
    parts.push('4K quality, professional editorial photography');

    // Unir todas las partes
    let prompt = parts.join(', ');

    // Truncar si excede maxLength
    if (prompt.length > opts.maxLength) {
      prompt = prompt.substring(0, opts.maxLength - 3) + '...';
    }

    return prompt;
  }

  /**
   * Construir sección de sujeto + acción
   */
  private buildSubjectAction(
    template: EditorialPromptTemplate,
    analysis: EditorialPromptInput['contentAnalysis'],
    config: EditorialPromptResult['configuration'],
  ): string {
    const typePrefix = this.getTypePrefix(template.type, config.shot);
    const toneAdj = this.getToneAdjective(analysis.tone);

    return `${typePrefix}: ${toneAdj} ${analysis.mainSubject} ${analysis.action}`;
  }

  /**
   * Prefijo según tipo de fotografía
   */
  private getTypePrefix(type: EditorialTemplateType, shot: ShotType): string {
    const prefixes: Record<EditorialTemplateType, Record<ShotType, string>> = {
      portrait: {
        'close-up': 'Editorial portrait headshot',
        'medium-shot': 'Editorial magazine portrait',
        'full-body': 'Full-length editorial portrait',
        'wide-angle': 'Environmental editorial portrait',
        'environmental-portrait': 'Editorial environmental portrait',
      },
      scene: {
        'close-up': 'Editorial documentary photograph',
        'medium-shot': 'Editorial news photograph',
        'full-body': 'Editorial scene photograph',
        'wide-angle': 'Wide-angle editorial scene',
        'environmental-portrait': 'Editorial situational photograph',
      },
      conceptual: {
        'close-up': 'Conceptual editorial image',
        'medium-shot': 'Editorial conceptual photograph',
        'full-body': 'Conceptual editorial composition',
        'wide-angle': 'Wide conceptual editorial image',
        'environmental-portrait': 'Conceptual editorial scene',
      },
      documentary: {
        'close-up': 'Documentary editorial detail',
        'medium-shot': 'Documentary editorial photograph',
        'full-body': 'Full-frame documentary photograph',
        'wide-angle': 'Wide documentary editorial scene',
        'environmental-portrait': 'Documentary environmental photograph',
      },
    };

    return prefixes[type][shot];
  }

  /**
   * Adjetivo según tono
   */
  private getToneAdjective(tone: string): string {
    const adjectives: Record<string, string> = {
      serious: 'distinguished',
      hopeful: 'inspiring',
      urgent: 'compelling',
      celebratory: 'jubilant',
      neutral: 'professional',
      dramatic: 'striking',
      inspiring: 'uplifting',
    };

    return adjectives[tone] || 'professional';
  }

  /**
   * Construir descripción de lighting
   */
  private buildLighting(lighting: LightingSetup): string {
    const descriptions: Record<LightingSetup, string> = {
      'three-point': 'professional three-point studio lighting with softbox',
      'softbox': 'soft diffused lighting with large softbox',
      'natural-window': 'natural window light, soft and directional',
      'dramatic-side': 'dramatic side lighting with strong shadows',
      'flat-even': 'flat even lighting, minimal shadows',
      'golden-hour': 'warm golden hour natural light',
    };

    return descriptions[lighting];
  }

  /**
   * Construir descripción de composición
   */
  private buildComposition(composition: CompositionStyle, shot: ShotType): string {
    const compositionDesc: Record<CompositionStyle, string> = {
      'rule-of-thirds': 'rule of thirds composition',
      'centered': 'centered symmetrical composition',
      'dynamic-diagonal': 'dynamic diagonal composition',
      'leading-lines': 'leading lines composition',
      'frame-within-frame': 'frame within frame composition',
    };

    const shotDesc: Record<ShotType, string> = {
      'close-up': 'close-up shot',
      'medium-shot': 'medium shot from waist up',
      'full-body': 'full-body shot',
      'wide-angle': 'wide-angle establishing shot',
      'environmental-portrait': 'environmental portrait shot',
    };

    return `${shotDesc[shot]}, ${compositionDesc[composition]}`;
  }

  /**
   * Construir especificaciones de cámara
   */
  private buildCameraSpecs(camera: CameraSetup): string {
    const parts = [`shot with ${camera.camera} ${camera.lens}`];
    if (camera.settings) {
      parts.push(camera.settings);
    }
    return parts.join(', ');
  }

  /**
   * Construir referencia estética
   */
  private buildAestheticReference(aesthetic: EditorialAesthetic): string {
    const references: Record<EditorialAesthetic, string> = {
      'time-magazine': 'TIME Magazine aesthetic',
      'the-economist': 'The Economist editorial style',
      'national-geographic': 'National Geographic photojournalism style',
      'reuters-news': 'Reuters news photography style',
    };

    return references[aesthetic];
  }

  /**
   * Obtener razón de selección de template
   */
  private getSelectionReason(type: EditorialTemplateType, analysis: EditorialPromptInput['contentAnalysis']): string {
    const reasons: Record<EditorialTemplateType, string> = {
      portrait: `Selected portrait template because mainSubject "${analysis.mainSubject}" appears to be a person`,
      scene: `Selected scene template because action "${analysis.action}" suggests an event at location "${analysis.location}"`,
      conceptual: `Selected conceptual template because category "${analysis.category}" is abstract`,
      documentary: `Selected documentary template as default for category "${analysis.category}"`,
    };

    return reasons[type];
  }

  /**
   * Inicializar templates con configuraciones profesionales
   */
  private initializeTemplates(): void {
    // Template 1: PORTRAIT (Personas)
    this.templates.set('portrait', {
      type: 'portrait',
      name: 'Professional Portrait',
      description: 'For photographs of specific people (politicians, officials, professionals)',
      defaultCamera: {
        camera: 'Canon R5',
        lens: '85mm f/1.8',
        settings: 'shallow depth of field',
      },
      defaultLighting: 'three-point',
      defaultComposition: 'rule-of-thirds',
      defaultShot: 'medium-shot',
      aesthetic: 'time-magazine',
      technicalKeywords: ['photorealistic', 'professional headshot', 'sharp focus', 'bokeh background'],
      appropriateCategories: ['politics', 'social', 'health', 'culture'],
    });

    // Template 2: SCENE (Eventos/Situaciones)
    this.templates.set('scene', {
      type: 'scene',
      name: 'Editorial Scene',
      description: 'For events, situations, and action-based photography',
      defaultCamera: {
        camera: 'Sony A7R IV',
        lens: '24-70mm f/2.8',
        settings: 'wide depth of field',
      },
      defaultLighting: 'natural-window',
      defaultComposition: 'dynamic-diagonal',
      defaultShot: 'wide-angle',
      aesthetic: 'reuters-news',
      technicalKeywords: ['photojournalism', 'documentary style', 'candid moment', 'environmental context'],
      appropriateCategories: ['politics', 'social', 'sports', 'general'],
    });

    // Template 3: CONCEPTUAL (Ideas Abstractas)
    this.templates.set('conceptual', {
      type: 'conceptual',
      name: 'Conceptual Editorial',
      description: 'For abstract ideas, concepts, and metaphorical representations',
      defaultCamera: {
        camera: 'Nikon Z9',
        lens: '50mm f/1.4',
        settings: 'creative depth of field',
      },
      defaultLighting: 'dramatic-side',
      defaultComposition: 'centered',
      defaultShot: 'medium-shot',
      aesthetic: 'the-economist',
      technicalKeywords: ['conceptual photography', 'symbolic composition', 'editorial illustration', 'clean aesthetic'],
      appropriateCategories: ['economy', 'technology', 'health', 'general'],
    });

    // Template 4: DOCUMENTARY (Documental/Reportaje)
    this.templates.set('documentary', {
      type: 'documentary',
      name: 'Documentary Editorial',
      description: 'For investigative journalism, social reportage, and realistic documentation',
      defaultCamera: {
        camera: 'Canon R6',
        lens: '35mm f/1.4',
        settings: 'moderate depth of field',
      },
      defaultLighting: 'golden-hour',
      defaultComposition: 'leading-lines',
      defaultShot: 'full-body',
      aesthetic: 'national-geographic',
      technicalKeywords: ['documentary photography', 'photojournalism', 'authentic moment', 'storytelling composition'],
      appropriateCategories: ['social', 'culture', 'general'],
    });

    this.logger.log('✅ Initialized 4 editorial templates: portrait, scene, conceptual, documentary');
  }

  /**
   * Obtener template por tipo (para inspección)
   */
  getTemplate(type: EditorialTemplateType): EditorialPromptTemplate | undefined {
    return this.templates.get(type);
  }

  /**
   * Listar todos los templates disponibles
   */
  getAllTemplates(): EditorialPromptTemplate[] {
    return Array.from(this.templates.values());
  }
}
