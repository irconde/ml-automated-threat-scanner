export interface MinioFile {
  name: string;
  size: number;
  lastModified: Date;
}

export interface MinioBucket {
  name: string;
  creationDate: Date;
}
