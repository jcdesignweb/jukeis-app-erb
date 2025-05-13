import { ipcMain } from 'electron';
import { StoreKey } from '../models';
import { eventBus } from './event-bus';
import { Channels } from './channels';
import { addNewKey, getAllKeys, removeKey } from '../services/key.service';

export function registerKeyHandlers() {
  ipcMain.handle(Channels.ADD_KEY, async (_, newKey: StoreKey) => {
    await addNewKey(newKey);
    eventBus.emit('sync-requested');
  });

  ipcMain.handle(Channels.DELETE_KEY, async (_, keyId: string) => {
    await removeKey(keyId);
    eventBus.emit('sync-requested');
  });

  ipcMain.handle(Channels.LOAD_KEYS, async () => {
    return await getAllKeys();
  });
}
