export interface BaseFile {
  status: FileStatus;
  fileName: string;
  filesCount: number;
  file: string;
}

export interface CurrentLocalDirectoryPayload extends BaseFile {
  // pixelData?: ArrayBuffer;
}

export interface CurrentRemoteServerPayload extends BaseFile {}

export type FilePayload =
  | CurrentLocalDirectoryPayload
  | CurrentRemoteServerPayload;

export enum FileStatus {
  Ok = 'Ok',
  Error = 'Error',
}
