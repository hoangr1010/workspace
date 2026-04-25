import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './ipc-channels';
import type { WindowApi } from '../src/types/ipc';

const api: WindowApi = {
  // Workspace
  pickWorkspace: () => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_PICK),
  listFiles: (workspacePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_LIST_FILES, workspacePath),
  readAllFilesAsText: (workspacePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_READ_ALL_AS_TEXT, workspacePath),

  // File IO
  openExcel: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_EXCEL, filePath),
  saveExcel: (filePath, snapshot) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_EXCEL, filePath, snapshot),
  openWord: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_WORD, filePath),
  saveWord: (filePath, buffer) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_WORD, filePath, buffer),
  openPptx: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_PPTX, filePath),
  savePptxEdit: (args) => ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_PPTX_EDIT, args),

  // Settings
  getLastWorkspace: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_LAST_WORKSPACE),
  setLastWorkspace: (path) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET_LAST_WORKSPACE, path),
};

contextBridge.exposeInMainWorld('api', api);
