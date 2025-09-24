import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContentAgent, ContentAgentDocument } from '../schemas/content-agent.schema';

/**
 * 👤 Servicio para gestión de agentes editoriales
 */
@Injectable()
export class ContentAgentService {
  private readonly logger = new Logger(ContentAgentService.name);

  constructor(
    @InjectModel(ContentAgent.name) private contentAgentModel: Model<ContentAgentDocument>,
  ) {}

  async findAll(): Promise<ContentAgent[]> {
    return this.contentAgentModel.find().exec();
  }

  async findById(id: string): Promise<ContentAgent> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid agent ID format');
    }

    const agent = await this.contentAgentModel.findById(id).exec();
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }
}