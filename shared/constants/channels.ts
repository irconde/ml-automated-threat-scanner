export enum Channels {
  // ends with 'update' when it's a message from electron to angular
  CurrentFileUpdate = 'CurrentFileUpdate',
  // ends with 'request' when it's a message from angular to electron
  // ends with 'invoke' when it's a message from angular to electron and back
  InitFilesInvoke = 'InitFilesInvoke',
  NewFileInvoke = 'NewFileInvoke',
  FolderPickerInvoke = 'FolderPickerInvoke',
  SaveCurrentFileInvoke = 'SaveCurrentFileInvoke',
}
