import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PromptTemplate, PromptTemplateDocument } from '../schemas/prompt-template.schema';
import {
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest,
  PromptTemplateResponse,
  TemplateTestRequest,
  TemplateTestResponse,
  ContentType,
  AgentConfiguration,
  StaticPromptStructure
} from '../interfaces';
import { ProviderFactoryService } from './provider-factory.service';

/**
 * 📝 Servicio para gestión de templates de prompts
 * Variable parsing, validation, testing y quality metrics
 */
@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);

  constructor(
    @InjectModel(PromptTemplate.name) private promptTemplateModel: Model<PromptTemplateDocument>,
    private readonly providerFactory: ProviderFactoryService,
  ) {}

  /**
   * 📋 Obtener todos los templates
   */
  async findAll(): Promise<PromptTemplateResponse[]> {
    const templates = await this.promptTemplateModel.find().exec();
    return templates.map(template => this.toResponse(template));
  }

  /**
   * 🔍 Obtener template por ID
   */
  async findById(id: string): Promise<PromptTemplateResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID format');
    }

    const template = await this.promptTemplateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return this.toResponse(template);
  }

  /**
   * 🎯 Obtener templates por tipo
   */
  async findByType(type: ContentType): Promise<PromptTemplateResponse[]> {
    const templates = await this.promptTemplateModel
      .find({ type, isActive: true })
      .sort({ 'qualityMetrics.averageQualityScore': -1 })
      .exec();

    return templates.map(template => this.toResponse(template));
  }

  /**
   * 🎪 Obtener templates por agente
   */
  async findByAgentType(agentType: string): Promise<PromptTemplateResponse[]> {
    const templates = await this.promptTemplateModel
      .find({
        $or: [
          { category: agentType },
          { name: { $regex: agentType, $options: 'i' } }
        ],
        isActive: true
      })
      .sort({ 'qualityMetrics.usageCount': -1 })
      .exec();

    return templates.map(template => this.toResponse(template));
  }

  /**
   * ✅ Obtener solo templates activos
   */
  async findActive(): Promise<PromptTemplateResponse[]> {
    const templates = await this.promptTemplateModel
      .find({ isActive: true })
      .sort({ 'qualityMetrics.averageQualityScore': -1 })
      .exec();

    return templates.map(template => this.toResponse(template));
  }

  /**
   * 🆕 Crear nuevo template
   */
  async create(createTemplateDto: CreatePromptTemplateRequest): Promise<PromptTemplateResponse> {
    // Validar variables en el template
    const validationResult = this.validatePromptTemplate(createTemplateDto.promptTemplate, createTemplateDto.variables);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Template validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Verificar que no existe template con el mismo nombre
    const existingTemplate = await this.promptTemplateModel.findOne({ name: createTemplateDto.name }).exec();
    if (existingTemplate) {
      throw new BadRequestException(`Template with name ${createTemplateDto.name} already exists`);
    }

    // Crear template con métricas iniciales
    const templateData = {
      ...createTemplateDto,
      qualityMetrics: {
        averageQualityScore: 0,
        usageCount: 0,
        successRate: 0,
        averageProcessingTime: 0,
        userRatings: [],
      },
    };

    const createdTemplate = new this.promptTemplateModel(templateData);
    const savedTemplate = await createdTemplate.save();

    this.logger.log(`Created new prompt template: ${savedTemplate.name}`);
    return this.toResponse(savedTemplate);
  }

  /**
   * 🔄 Actualizar template
   */
  async update(id: string, updateTemplateDto: UpdatePromptTemplateRequest): Promise<PromptTemplateResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID format');
    }

    const template = await this.promptTemplateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Validar variables si se actualiza el template
    if (updateTemplateDto.promptTemplate && updateTemplateDto.variables) {
      const validationResult = this.validatePromptTemplate(updateTemplateDto.promptTemplate, updateTemplateDto.variables);
      if (!validationResult.isValid) {
        throw new BadRequestException(`Template validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    const updatedTemplate = await this.promptTemplateModel
      .findByIdAndUpdate(id, updateTemplateDto, { new: true })
      .exec();

    this.logger.log(`Updated prompt template: ${updatedTemplate!.name}`);
    return this.toResponse(updatedTemplate!);
  }

  /**
   * 🗑️ Eliminar template
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID format');
    }

    const template = await this.promptTemplateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    await this.promptTemplateModel.findByIdAndDelete(id).exec();
    this.logger.log(`Deleted prompt template: ${template.name}`);
  }

  /**
   * 🧪 Probar template con datos de muestra
   */
  async testTemplate(testRequest: TemplateTestRequest): Promise<TemplateTestResponse> {
    const template = await this.promptTemplateModel.findById(testRequest.templateId).exec();
    if (!template) {
      throw new NotFoundException(`Template with ID ${testRequest.templateId} not found`);
    }

    // Validar que todas las variables requeridas están presentes
    const missingVariables = template.variables.filter(variable =>
      !testRequest.sampleData.hasOwnProperty(variable)
    );

    if (missingVariables.length > 0) {
      throw new BadRequestException(`Missing required variables: ${missingVariables.join(', ')}`);
    }

    try {
      // Renderizar template con datos de muestra
      const renderedPrompt = this.renderTemplate(template.promptTemplate, testRequest.sampleData);
      const systemPrompt = this.renderTemplate(template.systemPrompt, testRequest.sampleData);

      // Obtener proveedor para el test
      const provider = testRequest.providerId
        ? this.providerFactory.getProvider(testRequest.providerId)
        : await this.providerFactory.getOptimalProvider({
            maxTokens: template.configuration?.maxTokens || 4000,
            requiresStreaming: false,
          });

      const startTime = Date.now();

      // Ejecutar generación de prueba
      const response = await provider.generateContent({
        systemPrompt,
        userPrompt: renderedPrompt,
        maxTokens: template.configuration?.maxTokens || 1000,
        temperature: template.configuration?.temperature || 0.7,
        topP: template.configuration?.topP,
        frequencyPenalty: template.configuration?.frequencyPenalty,
        presencePenalty: template.configuration?.presencePenalty,
      });

      const processingTime = Date.now() - startTime;
      const cost = provider.calculateCost(response.usage);

      // Parsear el contenido generado según el formato esperado
      const parsedContent = this.parseGeneratedContent(response.content, template.staticOutputFormat || {});

      const structuredContent = {
        title: (parsedContent.title as string) || '',
        content: (parsedContent.content as string) || response.content,
        keywords: (parsedContent.keywords as string[]) || [],
        tags: (parsedContent.tags as string[]) || [],
        category: parsedContent.category as string,
        summary: parsedContent.summary as string,
      };

      return {
        success: true,
        generatedContent: structuredContent,
        processingTime,
        tokenUsage: response.usage,
        cost,
        warnings: [],
      };

    } catch (error) {
      this.logger.error(`Template test failed for ${template.name}: ${error.message}`);

      return {
        success: false,
        processingTime: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        error: error.message,
        warnings: [],
      };
    }
  }

  /**
   * 📊 Actualizar métricas de calidad
   */
  async updateQualityMetrics(
    templateId: string,
    metrics: {
      qualityScore?: number;
      processingTime?: number;
      success?: boolean;
      userRating?: number;
    }
  ): Promise<void> {
    const template = await this.promptTemplateModel.findById(templateId).exec();
    if (!template) {
      this.logger.warn(`Template ${templateId} not found for metrics update`);
      return;
    }

    const currentMetrics = template.qualityMetrics || {
      averageQualityScore: 0,
      usageCount: 0,
      successRate: 0,
      averageProcessingTime: 0,
      userRatings: [],
    };

    const newUsageCount = (currentMetrics.usageCount || 0) + 1;
    let newSuccessRate = currentMetrics.successRate || 0;
    let newAverageQualityScore = currentMetrics.averageQualityScore || 0;
    let newAverageProcessingTime = currentMetrics.averageProcessingTime || 0;
    let newUserRatings = currentMetrics.userRatings || [];

    // Actualizar success rate
    if (metrics.success !== undefined) {
      const currentSuccessCount = Math.round((currentMetrics.successRate || 0) * (currentMetrics.usageCount || 0));
      const newSuccessCount = currentSuccessCount + (metrics.success ? 1 : 0);
      newSuccessRate = newUsageCount > 0 ? newSuccessCount / newUsageCount : 0;
    }

    // Actualizar quality score promedio
    if (metrics.qualityScore !== undefined) {
      newAverageQualityScore = (
        ((currentMetrics.averageQualityScore || 0) * (currentMetrics.usageCount || 0)) + metrics.qualityScore
      ) / newUsageCount;
    }

    // Actualizar processing time promedio
    if (metrics.processingTime !== undefined) {
      newAverageProcessingTime = (
        ((currentMetrics.averageProcessingTime || 0) * (currentMetrics.usageCount || 0)) + metrics.processingTime
      ) / newUsageCount;
    }

    // Actualizar user ratings
    if (metrics.userRating !== undefined) {
      newUserRatings = [...newUserRatings.slice(-99), metrics.userRating]; // Mantener últimos 100 ratings
    }

    await this.promptTemplateModel.findByIdAndUpdate(templateId, {
      'qualityMetrics.usageCount': newUsageCount,
      'qualityMetrics.successRate': newSuccessRate,
      'qualityMetrics.averageQualityScore': newAverageQualityScore,
      'qualityMetrics.averageProcessingTime': newAverageProcessingTime,
      'qualityMetrics.userRatings': newUserRatings,
      'qualityMetrics.lastUsed': new Date(),
    }).exec();
  }

  /**
   * 🔍 Buscar templates
   */
  async search(query: {
    text?: string;
    type?: ContentType;
    category?: string;
    minQualityScore?: number;
  }): Promise<PromptTemplateResponse[]> {
    const filter: Record<string, unknown> = { isActive: true };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.minQualityScore) {
      filter['qualityMetrics.averageQualityScore'] = { $gte: query.minQualityScore };
    }

    if (query.text) {
      filter.$or = [
        { name: { $regex: query.text, $options: 'i' } },
        { agentPersona: { $regex: query.text, $options: 'i' } },
        { category: { $regex: query.text, $options: 'i' } },
      ];
    }

    const templates = await this.promptTemplateModel
      .find(filter)
      .sort({ 'qualityMetrics.averageQualityScore': -1 })
      .exec();

    return templates.map(template => this.toResponse(template));
  }

  /**
   * ✅ Validar template de prompt
   */
  private validatePromptTemplate(
    promptTemplate: string,
    declaredVariables: string[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extraer variables del template usando regex
    const variableRegex = /\{\{(\w+)\}\}/g;
    const foundVariables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(promptTemplate)) !== null) {
      foundVariables.add(match[1]);
    }

    // Verificar que todas las variables declaradas están siendo usadas
    const unusedVariables = declaredVariables.filter(variable => !foundVariables.has(variable));
    if (unusedVariables.length > 0) {
      warnings.push(`Unused variables: ${unusedVariables.join(', ')}`);
    }

    // Verificar que todas las variables usadas están declaradas
    const undeclaredVariables = Array.from(foundVariables).filter(variable => !declaredVariables.includes(variable));
    if (undeclaredVariables.length > 0) {
      errors.push(`Undeclared variables: ${undeclaredVariables.join(', ')}`);
    }

    // Validaciones adicionales
    if (promptTemplate.length < 10) {
      errors.push('Template is too short (minimum 10 characters)');
    }

    if (promptTemplate.length > 10000) {
      errors.push('Template is too long (maximum 10,000 characters)');
    }

    if (foundVariables.size === 0) {
      warnings.push('Template has no variables - it will generate static content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 🎨 Renderizar template con variables
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const variableRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(variableRegex, value || '');
    }

    return rendered;
  }

  /**
   * 📄 Parsear contenido generado según formato esperado
   */
  private parseGeneratedContent(content: string, outputFormat: Record<string, unknown>): Record<string, unknown> {
    try {
      // Intentar parsear como JSON primero
      return JSON.parse(content);
    } catch {
      // Si no es JSON válido, crear estructura basada en el formato esperado
      const parsed: Record<string, unknown> = {};

      // Extraer título si está definido en el formato
      if (outputFormat.title) {
        const titleMatch = content.match(/^(.+)$/m);
        if (titleMatch) {
          parsed.title = titleMatch[1].trim();
        }
      }

      // El resto del contenido como content
      parsed.content = content;

      // Generar keywords básicos si está definido en el formato
      if (outputFormat.keywords) {
        const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const uniqueWords = [...new Set(words)].slice(0, 5);
        parsed.keywords = uniqueWords;
      }

      return parsed;
    }
  }

  /**
   * 🤖 Generar prompt completo usando IA basado en configuración del wizard
   */
  async generatePromptWithAI(wizardData: {
    agentType: string;
    specialization: string;
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica';
    politicalIntensity: number;
    agentPersonality: string;
    canHandlePolitics: boolean;
    requiresReference: boolean;
    examples?: Array<{ input: string; expectedOutput: string; description?: string }>;
    additionalInstructions?: string;
  }): Promise<{
    promptTemplate: string;
    systemPrompt: string;
    agentConfiguration: AgentConfiguration;
    staticInputStructure: any;
    staticOutputFormat: any;
  }> {

    // Obtener proveedor para generar el prompt
    const provider = await this.providerFactory.getOptimalProvider({
      maxTokens: 4000,
      requiresStreaming: false,
    });

    const metaPrompt = `
Eres un experto en diseño de prompts para agentes editoriales de noticias. Tu trabajo es crear un prompt completo y profesional basado en esta configuración:

CONFIGURACIÓN DEL AGENTE:
- Tipo: ${wizardData.agentType}
- Especialización: ${wizardData.specialization}
- Línea Editorial: ${wizardData.editorialLine}
- Intensidad Política: ${wizardData.politicalIntensity}%
- Personalidad: ${wizardData.agentPersonality}
- Puede manejar política: ${wizardData.canHandlePolitics ? 'SÍ' : 'NO'}
- Requiere contenido de referencia: ${wizardData.requiresReference ? 'SÍ' : 'NO'}

${wizardData.examples ? `EJEMPLOS PROPORCIONADOS:
${wizardData.examples.map((ex, i) => `
Ejemplo ${i + 1}:
Input: ${ex.input}
Output esperado: ${ex.expectedOutput}
${ex.description ? `Descripción: ${ex.description}` : ''}
`).join('\n')}` : ''}

${wizardData.additionalInstructions ? `INSTRUCCIONES ADICIONALES:
${wizardData.additionalInstructions}` : ''}

ESTRUCTURA FIJA DE INPUT (SIEMPRE IGUAL):
- title: string (título de la noticia original)
- content: string (contenido de la noticia original)
- referenceContent?: string (contenido de referencia político - opcional)

ESTRUCTURA FIJA DE OUTPUT (SIEMPRE IGUAL - JSON):
{
  "title": "string - título reescrito por el agente",
  "content": "string - contenido transformado por el agente",
  "keywords": ["array", "de", "strings"] - keywords SEO (mínimo 3, máximo 10),
  "tags": ["array", "de", "strings"] - tags relevantes (mínimo 2, máximo 8),
  "category": "string - categoría asignada automáticamente",
  "summary": "string - resumen ejecutivo (máximo 200 caracteres)"
}

RESPONDE EN JSON con esta estructura exacta:
{
  "promptTemplate": "El prompt principal que usará variables {{title}}, {{content}}, {{referenceContent}}",
  "systemPrompt": "Las instrucciones del sistema para el modelo de IA",
  "reasoning": "Breve explicación de por qué este prompt funciona para este agente"
}

El prompt debe ser profesional, específico y optimizado para generar contenido de calidad según la personalidad y línea editorial del agente.
`;

    try {
      const response = await provider.generateContent({
        systemPrompt: 'Eres un experto en diseño de prompts editoriales. Responde SOLO con JSON válido, sin texto adicional.',
        userPrompt: metaPrompt,
        maxTokens: 3000,
        temperature: 0.3,
      });

      const parsedResponse = JSON.parse(response.content);

      // Validar que la respuesta tenga la estructura correcta
      if (!parsedResponse.promptTemplate || !parsedResponse.systemPrompt) {
        throw new Error('La IA no generó un prompt válido');
      }

      const result = {
        promptTemplate: parsedResponse.promptTemplate,
        systemPrompt: parsedResponse.systemPrompt,
        agentConfiguration: {
          editorialLine: wizardData.editorialLine,
          politicalIntensity: wizardData.politicalIntensity,
          agentPersonality: wizardData.agentPersonality,
          canHandlePolitics: wizardData.canHandlePolitics,
          requiresReference: wizardData.requiresReference,
        },
        staticInputStructure: {
          title: 'string',
          content: 'string',
          referenceContent: 'string?',
        },
        staticOutputFormat: {
          title: 'string',
          content: 'string',
          keywords: ['string'],
          tags: ['string'],
          category: 'string',
          summary: 'string',
        },
      };

      this.logger.log(`Generated prompt for agent: ${wizardData.agentType} - ${wizardData.specialization}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to generate prompt with AI: ${error.message}`);
      throw new BadRequestException(`Error generating prompt: ${error.message}`);
    }
  }

  /**
   * ✅ Validar estructura estática del template
   */
  validateStaticStructure(template: PromptTemplateDocument): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar que tiene estructura de input estática
    if (!template.staticInputStructure) {
      errors.push('Template must have staticInputStructure defined');
    } else {
      if (!template.staticInputStructure.title) {
        errors.push('staticInputStructure must include title field');
      }
      if (!template.staticInputStructure.content) {
        errors.push('staticInputStructure must include content field');
      }
    }

    // Validar que tiene estructura de output estática
    if (!template.staticOutputFormat) {
      errors.push('Template must have staticOutputFormat defined');
    } else {
      const requiredFields = ['title', 'content', 'keywords', 'tags', 'category', 'summary'];
      for (const field of requiredFields) {
        if (!template.staticOutputFormat[field]) {
          errors.push(`staticOutputFormat must include ${field} field`);
        }
      }
    }

    // Validar configuración del agente
    if (!template.agentConfiguration) {
      errors.push('Template must have agentConfiguration defined');
    } else {
      if (!template.agentConfiguration.editorialLine) {
        errors.push('agentConfiguration must include editorialLine');
      }
      if (template.agentConfiguration.politicalIntensity === undefined) {
        errors.push('agentConfiguration must include politicalIntensity');
      }
    }

    // Verificar que las variables son solo las permitidas para estructura estática
    const allowedVariables = ['title', 'content', 'referenceContent'];
    const invalidVariables = template.variables?.filter(v => !allowedVariables.includes(v)) || [];
    if (invalidVariables.length > 0) {
      warnings.push(`Template uses non-standard variables: ${invalidVariables.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 🔄 Convertir document a response DTO
   */
  private toResponse(template: PromptTemplateDocument): PromptTemplateResponse {
    return {
      id: (template._id as Types.ObjectId).toString(),
      name: template.name,
      type: template.type,
      agentPersona: template.agentPersona,
      promptTemplate: template.promptTemplate,
      systemPrompt: template.systemPrompt,
      outputFormat: template.staticOutputFormat || {},
      staticInputStructure: template.staticInputStructure,
      staticOutputFormat: template.staticOutputFormat,
      variables: template.variables,
      isActive: template.isActive,
      politicalLean: undefined, // Deprecated field
      agentConfiguration: template.agentConfiguration,
      configuration: template.configuration,
      qualityMetrics: template.qualityMetrics,
      examples: template.examples,
      category: template.category,
      compatibleProviders: template.compatibleProviders,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}