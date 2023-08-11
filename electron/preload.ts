const { contextBridge, ipcRenderer } = require('electron')


const API  = {
  send: ((channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  }),
  on: ((channel: string, listener: (payload: any) => void) => {
    ipcRenderer.on(channel, (e, data)=> {
      listener(data);
    })
  })
}

contextBridge.exposeInMainWorld('electronAPI', API)

