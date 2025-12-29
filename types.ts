
export type VideoResolution = '720p' | '1080p';
export type AspectRatio = '16:9' | '9:16';

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  config: {
    resolution: VideoResolution;
    aspectRatio: AspectRatio;
    model: string;
  };
}

export interface VideoStudioState {
  isGenerating: boolean;
  statusMessage: string;
  history: GeneratedVideo[];
  activeVideoId: string | null;
}

export enum ReferenceType {
  CHARACTER = 'character',
  ENVIRONMENT = 'environment',
  ASSET = 'asset'
}

export interface RefImage {
  data: string;
  type: ReferenceType;
  id: string;
}

// Global aistudio types are pre-configured in the execution environment.
// Redundant declarations here were causing "Duplicate identifier" and "identical modifiers" errors.
