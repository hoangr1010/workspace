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
  getRecentWorkspaces: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_RECENT_WORKSPACES),
  addRecentWorkspace: (path) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_ADD_RECENT_WORKSPACE, path),

  // Events from main → renderer
  onCloseWorkspace: (handler) => {
    const listener = (): void => handler();
    ipcRenderer.on(IPC_CHANNELS.EVENT_CLOSE_WORKSPACE, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_CLOSE_WORKSPACE, listener);
  },
  onOpenWorkspace: (handler) => {
    const listener = (): void => handler();
    ipcRenderer.on(IPC_CHANNELS.EVENT_OPEN_WORKSPACE, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_OPEN_WORKSPACE, listener);
  },
};

contextBridge.exposeInMainWorld('api', api);
