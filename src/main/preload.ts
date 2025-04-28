// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

export type Channels =
  | 'add-new-key'
  | 'load-keys'
  | 'login-success'
  | 'log-out'
  | 'get-session'
  | 'delete-key'
  | 'add-group'
  | 'load-groups'
  | 'delete-group';

const googleClientIdArg = process.argv.find((arg) =>
  arg.startsWith('--googleClientId='),
);
const googleClientId = googleClientIdArg ? googleClientIdArg.split('=')[1] : '';

const electronHandler = {
  googleClientId,
  openExternal: (url: string) => {
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
    async sendNewKey(newKey: { description: string; key: string }) {
      return ipcRenderer.invoke('add-new-key', newKey);
    },
    sendDeleteKey(key: string) {
      ipcRenderer.send('delete-key', key);
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
