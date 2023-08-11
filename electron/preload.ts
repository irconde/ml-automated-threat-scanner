// import {Channels} from "../shared/constants/channels";

const { contextBridge, ipcRenderer } = require('electron')
// import {CurrentFileUpdatePayload, ElectronAPI} from "../shared/modals/channels-payloads";
// const { CurrentFileUpdatePayload, ElectronAPI } = require('../shared/modals/channels-payloads')

console.log(contextBridge, ipcRenderer)

const API  = {
  listenToCurrentFileUpdate: (callback: (payload : any) => void) => {
    ipcRenderer.on("CurrentFileUpdate",
      (e: Electron.IpcRendererEvent, data : any) => callback(data))
  }
}

contextBridge.exposeInMainWorld('electronAPI', API)

console.log("Preload.ts")
