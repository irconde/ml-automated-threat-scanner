export interface Settings {
  selectedImagesDirPath?: string;
  selectedAnnotationFile?: string;
}

export interface CachedSettings extends Settings {
  update: (settings: Settings) => void;
}

