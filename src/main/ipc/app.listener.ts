import { ipcMain } from 'electron';
import { eventBus } from './event-bus';
import GoogleDriveStorage from '../google/google-drive-storage';
import { LocalFileType, localStorage } from '../data/local-storage';
import { Channels } from './channels';
import GoogleDriveAuthStorage from '../google/google-drive-auth-storage';
import TokenManager from '../security/TokenManager';

export function registerAppHandlers() {
  ipcMain.handle('cloud-sync', async () => {
    eventBus.emit('sync-requested');
  });

  ipcMain.handle('erase-data', async () => {
    const storage = new GoogleDriveStorage();
    await storage.removeFile();

    localStorage.deleteLocalFile();
  });

  ipcMain.handle(Channels.ERASE_MASTER_PASSWORD, async () => {
    const accesstoken = TokenManager.getInstance().getAccessToken();
    const storageAuth = new GoogleDriveAuthStorage();
    await storageAuth.removeFile();
    localStorage.deleteLocalFile(LocalFileType.AUTH_FILE);
  });
}
