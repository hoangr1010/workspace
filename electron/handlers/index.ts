import type { IpcMain } from 'electron';
import { IPC_CHANNELS } from '../ipc-channels';
import { listFiles, pickWorkspace, readAllFilesAsText } from './workspace.handler';
import { openWord, saveWord } from './word.handler';
import { openExcel, saveExcel } from './excel.handler';
import { openPptx, savePptxEdit } from './pptx.handler';
import { addRecentWorkspace, getRecentWorkspaces } from './settings.handler';
import type { UniverSnapshot } from '../../src/types/file';

export function registerIpcHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.WORKSPACE_PICK, () => pickWorkspace());
  ipcMain.handle(IPC_CHANNELS.WORKSPACE_LIST_FILES, (_e, workspacePath: string) =>
    listFiles(workspacePath),
  );
  ipcMain.handle(IPC_CHANNELS.WORKSPACE_READ_ALL_AS_TEXT, (_e, workspacePath: string) =>
    readAllFilesAsText(workspacePath),
  );

  ipcMain.handle(IPC_CHANNELS.FILE_OPEN_EXCEL, (_e, filePath: string) =>
    openExcel(filePath),
  );
  ipcMain.handle(
    IPC_CHANNELS.FILE_SAVE_EXCEL,
    (_e, filePath: string, snapshot: UniverSnapshot) =>
      saveExcel(filePath, snapshot),
  );
  ipcMain.handle(IPC_CHANNELS.FILE_OPEN_WORD, (_e, filePath: string) => openWord(filePath));
  ipcMain.handle(
    IPC_CHANNELS.FILE_SAVE_WORD,
    (_e, filePath: string, buffer: ArrayBuffer) => saveWord(filePath, buffer),
  );
  ipcMain.handle(IPC_CHANNELS.FILE_OPEN_PPTX, (_e, filePath: string) => openPptx(filePath));
  ipcMain.handle(
    IPC_CHANNELS.FILE_SAVE_PPTX_EDIT,
    (
      _e,
      args: {
        filePath: string;
        slideIndex: number;
        shapeName: string;
        newText: string;
      },
    ) => savePptxEdit(args),
  );

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_RECENT_WORKSPACES, () => getRecentWorkspaces());
  ipcMain.handle(IPC_CHANNELS.SETTINGS_ADD_RECENT_WORKSPACE, (_e, value: string) =>
    addRecentWorkspace(value),
  );
}
