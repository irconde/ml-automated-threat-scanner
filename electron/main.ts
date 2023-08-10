import {getSettings, updateSettings} from "./settingsFileUtils";
const { app, BrowserWindow } = require('electron');

const path = require("path");
const isDev = require('electron-is-dev');


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  const htmlPath = isDev ?
        "http://localhost:4200" :
        `file://${path.join(__dirname, "..", "www", "index.html")}`;

  win.loadURL(htmlPath).then(() => console.log("Loaded file successfully"))
}

app.whenReady().then(async () => {

  const settings = await getSettings();
  console.log("SETTINGS", settings)
  await updateSettings({selectedAnnotationFile: "hello", selectedImagesDirPath: "world"})
  console.log(settings)

  createWindow()

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
