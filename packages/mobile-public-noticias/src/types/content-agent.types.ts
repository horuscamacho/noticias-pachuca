/**
 * 🎭 Content Agent Types
 * Tipos para agentes editoriales de generación de contenido
 */

export interface WritingStyle {
  tone: 'formal' | 'informal' | 'humor' | 'academic' | 'conversational';
  vocabulary: 'simple' | 'intermediate' | 'advanced' | 'technical';
  length: 'short' | 'medium' | 'long' | 'variable';
  structure: 'linear' | 'narrative' | 'analytical' | 'opinion';
  audience: 'general' | 'specialized' | 'academic' | 'youth' | 'senior';
}

export interface PerformanceMetrics {
  totalArticles: number;
  averageQuality: number;
  successRate: number;
}

export interface ContentAgent {
  id: string;
  name: string;
  agentType: 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist';
  description: string;
  personality: string;
  specializations: string[];
  editorialLean: 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical';
  writingStyle: WritingStyle;
  defaultTemplates?: string[];
  isActive: boolean;
  performanceMetrics?: PerformanceMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFilters {
  agentType?: 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist';
  isActive?: boolean;
}

// API Request types
export interface CreateContentAgentRequest {
  name: string;
  agentType: 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist';
  description: string;
  personality: string;
  specializations: string[];
  editorialLean: 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical';
  writingStyle: WritingStyle;
  isActive: boolean;
}

export type UpdateContentAgentRequest = Partial<CreateContentAgentRequest>;

// API Response types
export interface ContentAgentListResponse {
  agents: ContentAgent[];
  total?: number;
}

export interface ContentAgentResponse {
  agent: ContentAgent;
  message?: string;
}
