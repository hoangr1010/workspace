import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './handlers'
import { IPC_CHANNELS } from './ipc-channels'

function createWindow(opts: { fresh?: boolean } = {}): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
    },
  })

  const base = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
  const url = opts.fresh ? `${base}?fresh=1` : base
  win.loadURL(url)
  win.webContents.openDevTools()
  return win
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => createWindow({ fresh: true }),
        },
        {
          label: 'Open Workspace…',
          accelerator: 'CmdOrCtrl+O',
          click: (_item, focused) => {
            if (focused instanceof BrowserWindow) {
              focused.webContents.send(IPC_CHANNELS.EVENT_OPEN_WORKSPACE)
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Close Workspace',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: (_item, focused) => {
            if (focused instanceof BrowserWindow) {
              focused.webContents.send(IPC_CHANNELS.EVENT_CLOSE_WORKSPACE)
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.on('ready', () => {
  registerIpcHandlers(ipcMain)
  buildMenu()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
