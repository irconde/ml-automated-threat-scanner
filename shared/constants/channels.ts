export enum Channels {
  // ends with 'update' when it's a message from electron to angular
  CurrentFileUpdate = 'CurrentFileUpdate',
  SettingsUpdate = 'SettingsUpdate',
  // end with 'request' when it's a message from angular to electron
  NewFileRequest = 'NewFileRequest',
  // ends with 'invoke' when it's a message from angular to electron and back
  FolderPickerInvoke = 'FolderPickerInvoke',
}
