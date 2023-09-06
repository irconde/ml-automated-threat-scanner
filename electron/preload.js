const { contextBridge, ipcRenderer } = require("electron");

const API = {
  send: (channel, arg) => {
    ipcRenderer.send(channel, arg);
  },
  on: (channel, listener) => {
    ipcRenderer.on(channel, (e, data) => {
      listener(data);
    });
  },
  invoke: (channel: string, arg: any, callback: (result: any) => void) => {
    ipcRenderer.invoke(channel, arg).then(callback);
  },
};

contextBridge.exposeInMainWorld("electronAPI", API);
