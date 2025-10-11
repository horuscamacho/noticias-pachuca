export const IMAGE_GENERATION_EVENTS = {
  STARTED: 'image-generation.started',
  PROGRESS: 'image-generation.progress',
  COMPLETED: 'image-generation.completed',
  FAILED: 'image-generation.failed',
} as const;

export interface ImageGenerationStartedEvent {
  jobId: string | number;
  generationId: string;
  userId: string;
}

export interface ImageGenerationProgressEvent {
  jobId: string | number;
  generationId: string;
  userId: string;
  step: 'initializing' | 'analyzing' | 'building_prompt' | 'generating' | 'generated' | 'processing' | 'uploading' | 'updating' | 'completed';
  progress: number; // 0-100
  message: string;
}

export interface ImageGenerationCompletedEvent {
  jobId: string | number;
  generationId: string;
  generatedImageUrl: string;
  cost: number;
  userId: string;
}

export interface ImageGenerationFailedEvent {
  jobId: string | number;
  generationId: string;
  error: string;
  userId: string;
}
