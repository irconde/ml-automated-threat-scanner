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
  invoke: (channel, arg, callback) => {
    ipcRenderer.invoke(channel, arg).then(callback);
  },
};

contextBridge.exposeInMainWorld("electronAPI", API);
