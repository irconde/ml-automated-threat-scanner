import { CachedSettings } from './file-managers/cached-settings';
import UserFilesManager from './file-managers/user-files-manager';
import { app, BrowserWindow } from 'electron';

import path from 'path';
import isDev from 'electron-is-dev';

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
    ? 'http://localhost:8100'
    : `file://${path.join(__dirname, '..', 'www', 'index.html')}`;

  try {
    await mainWindow.loadURL(htmlPath);
    return mainWindow;
  } catch (e) {
    throw e;
  }
};

app.whenReady().then(async () => {
  const mainWindow = await createWindow();
  const settings = await CachedSettings.create(mainWindow);
  console.log('SETTINGS', settings.get());
  await settings.update({
    selectedDetectionFile: '',
    selectedImagesDirPath: 'G:\\EAC\\dna-atr-socket.io-server\\static\\img',
  });
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
