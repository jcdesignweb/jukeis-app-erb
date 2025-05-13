import { sync_drive_data } from '../data/sync';
import { Channels } from './channels';
import { eventBus } from './event-bus';

export function registerSyncHandlers(
  sendToRenderer: (channel: string, isSync: boolean) => void,
) {
  let isSync = false;

  eventBus.on('sync-requested', async () => {
    if (isSync) return;

    isSync = true;
    sendToRenderer(Channels.SYNCHRONIZING, isSync);

    await sync_drive_data();

    isSync = false;
    sendToRenderer(Channels.SYNCHRONIZING, isSync);
  });
}
