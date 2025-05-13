// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { StoreKey } from './models';
import { Channels } from './ipc/channels';

const electronHandler = {
  initLogin: () => {
    ipcRenderer.send('start-google-login');
  },

  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },

    on: (channel: Channels, func: any) => {
      ipcRenderer.on(channel, (_event, ...args) => {
        func(_event, ...args);
      });
    },

    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },

    async sendNewKey(newKey: Partial<StoreKey>) {
      return ipcRenderer.invoke('add-new-key', newKey);
    },
    sendDeleteKey(key: string) {
      ipcRenderer.send('delete-key', key);
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },

    removeAllListeners: (channel?: string) => {
      (ipcRenderer as any).removeAllListeners(channel);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
