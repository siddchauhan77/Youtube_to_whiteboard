export enum VisualStyle {
  WHITEBOARD = 'Whiteboard',
  NOTEBOOK = 'Notebook',
  CUSTOM = 'Custom',
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface GenerationResult {
  imageUrl: string;
  summary: string;
  videoTitle?: string;
}

export interface AnalysisResponse {
  summary: string;
  imagePrompt: string;
  videoTitle?: string;
}