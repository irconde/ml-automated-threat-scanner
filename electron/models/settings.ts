export interface Settings {
  selectedImagesDirPath: string;
  selectedAnnotationFile: string;
}

export type CachedSettings = Settings | null;
