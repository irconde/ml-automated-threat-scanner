const { contextBridge, ipcRenderer } = require('electron');

const API = {
  send: (channel: string, arg: any) => {
    ipcRenderer.send(channel, arg);
  },
  on: (channel: string, listener: (payload: any) => void) => {
    ipcRenderer.on(channel, (e, data) => {
      listener(data);
    });
  },
  invoke: (channel: string, arg: any, callback: (result: any) => void) => {
    ipcRenderer.invoke(channel, arg).then(callback);
  },
};

contextBridge.exposeInMainWorld('electronAPI', API);
