import { CachedSettings } from './file-managers/cached-settings';
import UserFilesManager from './file-managers/user-files-manager';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { Channels } from '../shared/constants/channels';

const path = require('path');
const isDev = require('electron-is-dev');
let userFilesManager: null | UserFilesManager = null;

const createWindow = async (): Promise<BrowserWindow> => {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const htmlPath = isDev
    ? 'http://localhost:4200'
    : `file://${path.join(__dirname, '..', 'www', 'index.html')}`;

  await mainWindow.loadURL(htmlPath);
  return mainWindow;
};

app.whenReady().then(async () => {
  const mainWindow = await createWindow();
  const settings = await CachedSettings.create(mainWindow);
  console.log('SETTINGS', settings.get());
  console.log(settings.get());
  userFilesManager = new UserFilesManager(settings, mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle(Channels.FolderPickerInvoke, async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  // if the event is cancelled by the user
  if (result.canceled) return { path: '' };

  return { path: result.filePaths[0] };
});
