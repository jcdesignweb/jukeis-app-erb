import { ipcMain } from 'electron';
import { dataInitializor, StoredData, StoreKey } from '../models';
import { eventBus } from './event-bus';
import { IPC_CHANNELS } from './channels';
import { addNewKey, getAllKeys, removeKey } from '../services/key.service';

let storedData: StoredData = dataInitializor;

export function registerKeyHandlers() {
  const getData = async () => {
    const loadedData = await localStorage.load();
    storedData = loadedData ?? dataInitializor;
    return storedData;
  };

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

  /*
  ipcMain.handle('delete-key', async (_, keyId) => {
    const result = await localStorage.deleteKey(keyId);
    //await sync();
    return result;
  });

  ipcMain.handle('load-keys', async () => {
    return await getData();
  });
  */
}
