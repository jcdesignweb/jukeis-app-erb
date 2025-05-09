import { ipcMain } from 'electron';
import { eventBus } from './event-bus';
import GoogleDriveStorage from '../google/google-drive-storage';
import { localStorage } from '../data/local-storage';

export function registerAppHandlers() {
  ipcMain.handle('cloud-sync', async () => {
    console.log('Cloud sync started.');

    eventBus.emit('sync-requested');
  });

  ipcMain.handle('erase-data', async () => {
    const googleDrive = new GoogleDriveStorage();
    await googleDrive.removeFile();

    localStorage.deleteLocalFile();
  });
}
