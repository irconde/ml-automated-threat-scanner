const { contextBridge, ipcRenderer } = require('electron')


const API  = {
  send: ((channel: string, arg: any) => {
    ipcRenderer.send(channel, arg)
  }),
  on: ((channel: string, listener: (payload: any) => void) => {
    ipcRenderer.on(channel, (e, data)=> {
      listener(data);
    })
  })
}

contextBridge.exposeInMainWorld('electronAPI', API)

