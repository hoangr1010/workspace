import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Workspace
  pickWorkspace: () => ipcRenderer.invoke('workspace:pick'),
  listFiles: (workspacePath: string) => ipcRenderer.invoke('workspace:listFiles', workspacePath),
  readAllFilesAsText: (workspacePath: string) =>
    ipcRenderer.invoke('workspace:readAllFilesAsText', workspacePath),

  // File IO
  openExcel: (filePath: string) => ipcRenderer.invoke('file:openExcel', filePath),
  saveExcel: (filePath: string, snapshot: unknown) =>
    ipcRenderer.invoke('file:saveExcel', filePath, snapshot),
  openWord: (filePath: string) => ipcRenderer.invoke('file:openWord', filePath),
  saveWord: (filePath: string, buffer: ArrayBuffer) =>
    ipcRenderer.invoke('file:saveWord', filePath, buffer),
  openPptx: (filePath: string) => ipcRenderer.invoke('file:openPptx', filePath),
  savePptxEdit: (args: {
    filePath: string
    slideIndex: number
    shapeName: string
    newText: string
  }) => ipcRenderer.invoke('file:savePptxEdit', args),

  // Settings
  getLastWorkspace: () => ipcRenderer.invoke('settings:getLastWorkspace'),
  setLastWorkspace: (path: string) => ipcRenderer.invoke('settings:setLastWorkspace', path),
})
