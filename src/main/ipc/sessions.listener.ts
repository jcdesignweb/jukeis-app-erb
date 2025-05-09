import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import {
  clearSessionsStored,
  getSession,
  startGoogleLoginFlow,
} from '../services/session.service';

import { eventBus } from './event-bus';
import { sync_drive_data } from '../data/sync';

export function registerSessionHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle(IPC_CHANNELS.LOGOUT, async (_) => {
    await clearSessionsStored();
  });

  ipcMain.on(IPC_CHANNELS.LOGIN, async (_) => {
    mainWindow.webContents.send('show-loader', true);
    const userInfo = await startGoogleLoginFlow();
    await sync_drive_data();
    mainWindow.webContents.send('show-loader', false);

    mainWindow.webContents.send('login-success', {
      userData: userInfo,
    });
  });

  ipcMain.handle(IPC_CHANNELS.GET_SESSION, async () => {
    return getSession();
  });
}
