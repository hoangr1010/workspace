export const IPC_CHANNELS = {
  WORKSPACE_PICK: 'workspace:pick',
  WORKSPACE_LIST_FILES: 'workspace:listFiles',
  WORKSPACE_READ_ALL_AS_TEXT: 'workspace:readAllFilesAsText',

  FILE_OPEN_EXCEL: 'file:openExcel',
  FILE_SAVE_EXCEL: 'file:saveExcel',
  FILE_OPEN_WORD: 'file:openWord',
  FILE_SAVE_WORD: 'file:saveWord',
  FILE_OPEN_PPTX: 'file:openPptx',
  FILE_SAVE_PPTX_EDIT: 'file:savePptxEdit',

  SETTINGS_GET_RECENT_WORKSPACES: 'settings:getRecentWorkspaces',
  SETTINGS_ADD_RECENT_WORKSPACE: 'settings:addRecentWorkspace',

  // Main → renderer events
  EVENT_CLOSE_WORKSPACE: 'event:closeWorkspace',
  EVENT_OPEN_WORKSPACE: 'event:openWorkspace',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
