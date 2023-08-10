import {getSettings, updateSettings} from "./file-managers/settings-manager";
import UserFilesManager from "./file-managers/user-files-manager";
// const { app, BrowserWindow } = require('electron');
import {app, BrowserWindow } from 'electron'

const path = require("path");
const isDev = require('electron-is-dev');
let userFilesManager : null | UserFilesManager = null;


const createWindow = async () : Promise<BrowserWindow> => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  })

  const htmlPath = isDev ?
        "http://localhost:4200" :
        `file://${path.join(__dirname, "..", "www", "index.html")}`;

  try {
    await mainWindow.loadURL(htmlPath)
    return mainWindow;
  } catch (e) {
    throw e;
  }
}

app.whenReady().then(async () => {

  const mainWindow = await createWindow()
  const settings = await getSettings();
  console.log("SETTINGS", settings)
  await updateSettings({selectedAnnotationFile: "", selectedImagesDirPath: "C:\\Users\\dako_\\Downloads\\testPictures"})
  console.log(settings)
  userFilesManager = new UserFilesManager(settings, mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
