import { ipcMain } from 'electron';
import { Group } from '../models';
import { eventBus } from './event-bus';
import { addGroup } from '../services/group.service';
import { localStorage } from '../data/local-storage';
import { IPC_CHANNELS } from './channels';

export function registerGroupHandlers() {
  ipcMain.handle(IPC_CHANNELS.DELETE_GROUP, async (_, id: string) => {
    const result = await localStorage.deleteGroup(id);
    eventBus.emit('sync-requested');
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.ADD_GROUP, async (_, newGroup: Group) => {
    await addGroup(newGroup);
    eventBus.emit('sync-requested');
  });
}
