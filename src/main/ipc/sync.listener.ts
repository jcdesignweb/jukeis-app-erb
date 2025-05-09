import { sync_drive_data } from '../data/sync';
import { IPC_CHANNELS } from './channels';
import { eventBus } from './event-bus';

export function registerSyncHandlers(
  sendToRenderer: (channel: string, isSync: boolean) => void,
) {
  let isSync = false;

  eventBus.on('sync-requested', async () => {
    if (isSync) return;

    isSync = true;
    sendToRenderer(IPC_CHANNELS.SYNCHRONIZING, isSync);

    await sync_drive_data();

    isSync = false;
    sendToRenderer(IPC_CHANNELS.SYNCHRONIZING, isSync);
  });
}
