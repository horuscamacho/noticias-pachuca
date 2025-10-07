import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentAgent, ContentAgentDocument } from '../schemas/content-agent.schema';
import {
  CreateContentAgentDto,
  UpdateContentAgentDto,
  AgentStatisticsDto
} from '../dto/content-agent.dto';

/**
 * 👤 Servicio para gestión de Content Agents - Perfiles Editoriales
 */
@Injectable()
export class ContentAgentService {
  private readonly logger = new Logger(ContentAgentService.name);

  constructor(
    @InjectModel(ContentAgent.name)
    private readonly contentAgentModel: Model<ContentAgentDocument>,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger.log('👤 Content Agent Service initialized');
  }

  /**
   * Crear nuevo Content Agent
   */
  async createAgent(createDto: CreateContentAgentDto): Promise<ContentAgentDocument> {
    this.logger.log(`Creating new content agent: ${createDto.name}`);

    try {
      // Verificar si ya existe un agente con el mismo nombre
      const existingAgent = await this.contentAgentModel.findOne({ name: createDto.name });
      if (existingAgent) {
        throw new BadRequestException(`Agent with name "${createDto.name}" already exists`);
      }

      // Crear el agente
      const agent = new this.contentAgentModel({
        name: createDto.name,
        agentType: createDto.agentType,
        description: createDto.description,
        personality: createDto.personality,
        specializations: createDto.specializations,
        editorialLean: createDto.editorialLean,
        writingStyle: createDto.writingStyle,
        defaultTemplates: createDto.defaultTemplates?.map(id => new Types.ObjectId(id)) || [],
        isActive: createDto.isActive ?? true,
        configuration: createDto.configuration || {},
        constraints: createDto.constraints || {},
        sampleOutputs: createDto.sampleOutputs || [],
        workflow: createDto.workflow || {},
        performanceMetrics: {
          totalArticles: 0,
          averageQuality: 0,
          averageTime: 0,
          successRate: 0,
          userRatings: 0,
          lastActive: new Date()
        }
      });

      const savedAgent = await agent.save();

      // Emitir evento
      this.eventEmitter.emit('agent.created', {
        agentId: savedAgent._id,
        name: savedAgent.name,
        agentType: savedAgent.agentType,
        timestamp: new Date()
      });

      this.logger.log(`✅ Agent created successfully: ${savedAgent._id}`);
      return savedAgent;

    } catch (error) {
      this.logger.error(`❌ Error creating agent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Listar todos los agentes con filtros opcionales
   */
  async findAll(filters?: { agentType?: string; isActive?: boolean }): Promise<ContentAgentDocument[]> {
    this.logger.log(`Finding agents with filters: ${JSON.stringify(filters || {})}`);

    try {
      const query: Record<string, unknown> = {};

      if (filters?.agentType) {
        query.agentType = filters.agentType;
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const agents = await this.contentAgentModel
        .find(query)
        // .populate('defaultTemplates', 'name type') // Comentado: PromptTemplate no está registrado
        .sort({ createdAt: -1 })
        .exec();

      this.logger.log(`✅ Found ${agents.length} agents`);
      return agents;

    } catch (error) {
      this.logger.error(`❌ Error finding agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar agente por ID
   */
  async findById(id: string): Promise<ContentAgentDocument> {
    this.logger.log(`Finding agent by ID: ${id}`);

    try {
      const agent = await this.contentAgentModel
        .findById(id)
        // .populate('defaultTemplates', 'name type') // Comentado: PromptTemplate no está registrado
        .exec();

      if (!agent) {
        throw new NotFoundException(`Agent with ID "${id}" not found`);
      }

      return agent;

    } catch (error) {
      this.logger.error(`❌ Error finding agent ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar agente existente
   */
  async updateAgent(id: string, updateDto: UpdateContentAgentDto): Promise<ContentAgentDocument> {
    this.logger.log(`Updating agent: ${id}`);

    try {
      // Verificar que existe el agente
      const existingAgent = await this.contentAgentModel.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID "${id}" not found`);
      }

      // Si se actualiza el nombre, verificar que no exista otro con ese nombre
      if (updateDto.name && updateDto.name !== existingAgent.name) {
        const agentWithSameName = await this.contentAgentModel.findOne({ name: updateDto.name });
        if (agentWithSameName) {
          throw new BadRequestException(`Agent with name "${updateDto.name}" already exists`);
        }
      }

      // Preparar update data
      const updateData: Record<string, unknown> = { ...updateDto };

      // Convertir defaultTemplates a ObjectIds si existen
      if (updateDto.defaultTemplates) {
        updateData.defaultTemplates = updateDto.defaultTemplates.map(id => new Types.ObjectId(id));
      }

      // Actualizar agente
      const updatedAgent = await this.contentAgentModel
        .findByIdAndUpdate(
          id,
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        )
        // .populate('defaultTemplates', 'name type') // Comentado: PromptTemplate no está registrado
        .exec();

      if (!updatedAgent) {
        throw new NotFoundException(`Agent with ID "${id}" not found`);
      }

      // Emitir evento
      this.eventEmitter.emit('agent.updated', {
        agentId: updatedAgent._id,
        name: updatedAgent.name,
        timestamp: new Date()
      });

      this.logger.log(`✅ Agent updated successfully: ${id}`);
      return updatedAgent;

    } catch (error) {
      this.logger.error(`❌ Error updating agent ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar agente
   */
  async deleteAgent(id: string): Promise<void> {
    this.logger.log(`Deleting agent: ${id}`);

    try {
      const agent = await this.contentAgentModel.findById(id);
      if (!agent) {
        throw new NotFoundException(`Agent with ID "${id}" not found`);
      }

      await this.contentAgentModel.findByIdAndDelete(id);

      // Emitir evento
      this.eventEmitter.emit('agent.deleted', {
        agentId: id,
        name: agent.name,
        timestamp: new Date()
      });

      this.logger.log(`✅ Agent deleted successfully: ${id}`);

    } catch (error) {
      this.logger.error(`❌ Error deleting agent ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del agente
   */
  async getAgentStatistics(id: string): Promise<AgentStatisticsDto> {
    this.logger.log(`Getting statistics for agent: ${id}`);

    try {
      const agent = await this.findById(id);

      const statistics: AgentStatisticsDto = {
        agentId: (agent._id as Types.ObjectId).toString(),
        agentName: agent.name,
        totalArticlesGenerated: agent.performanceMetrics?.totalArticles || 0,
        averageQualityScore: agent.performanceMetrics?.averageQuality || 0,
        averageProcessingTime: agent.performanceMetrics?.averageTime || 0,
        successRate: agent.performanceMetrics?.successRate || 0,
        failureRate: 100 - (agent.performanceMetrics?.successRate || 0),
        averageUserRating: agent.performanceMetrics?.userRatings || 0,
        lastActiveDate: agent.performanceMetrics?.lastActive || agent.updatedAt,
        topSpecializations: agent.specializations.slice(0, 5),
        mostUsedTemplates: [], // TODO: Calcular desde AIContentGeneration
        contentDistribution: {
          [agent.agentType]: agent.performanceMetrics?.totalArticles || 0
        }
      };

      this.logger.log(`✅ Statistics retrieved for agent: ${id}`);
      return statistics;

    } catch (error) {
      this.logger.error(`❌ Error getting statistics for agent ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar métricas de performance del agente
   */
  async updatePerformanceMetrics(
    id: string,
    metrics: {
      totalArticles?: number;
      averageQuality?: number;
      averageTime?: number;
      successRate?: number;
      userRatings?: number;
    }
  ): Promise<ContentAgentDocument> {
    this.logger.log(`Updating performance metrics for agent: ${id}`);

    try {
      const agent = await this.findById(id);

      const updatedMetrics = {
        ...agent.performanceMetrics,
        ...metrics,
        lastActive: new Date()
      };

      const updatedAgent = await this.contentAgentModel
        .findByIdAndUpdate(
          id,
          { performanceMetrics: updatedMetrics, updatedAt: new Date() },
          { new: true }
        )
        .exec();

      if (!updatedAgent) {
        throw new NotFoundException(`Agent with ID "${id}" not found`);
      }

      this.logger.log(`✅ Performance metrics updated for agent: ${id}`);
      return updatedAgent;

    } catch (error) {
      this.logger.error(`❌ Error updating performance metrics for agent ${id}: ${error.message}`);
      throw error;
    }
  }
}
