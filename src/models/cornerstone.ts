import { AnnotationMode, CornerstoneMode } from '../enums/cornerstone';

export interface CornerstoneConfiguration {
  cornerstoneMode: CornerstoneMode;
  annotationMode: AnnotationMode;
}

export const CS_DEFAULT_CONFIGURATION: CornerstoneConfiguration = {
  cornerstoneMode: CornerstoneMode.Selection,
  annotationMode: AnnotationMode.NoTool,
} as const;
