import { ipcMain } from 'electron';
import { StoreKey } from '../models';
import { eventBus } from './event-bus';
import { IPC_CHANNELS } from './channels';
import { addNewKey, getAllKeys, removeKey } from '../services/key.service';

export function registerKeyHandlers() {

  ipcMain.handle(IPC_CHANNELS.ADD_KEY, async (_, newKey: StoreKey) => {
    await addNewKey(newKey);
    eventBus.emit('sync-requested');
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_KEY, async (_, keyId: string) => {
    await removeKey(keyId);
    eventBus.emit('sync-requested');
  });

  ipcMain.handle(IPC_CHANNELS.LOAD_KEYS, async () => {
    return await getAllKeys();
  });

}
