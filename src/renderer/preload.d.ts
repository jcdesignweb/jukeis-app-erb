import { Channels } from '../main/preload';
import { StoreKey } from '../main/data/storage';

declare global {
  interface Window {
    electron: {
      googleClientId: string;
      openExternal: (url: string) => void;

      ipcRenderer: {
        removeAllListeners(arg0: string): unknown;
        sendMessage(channel: Channels, ...args: unknown[]): void;
        on(channel: Channels, func: (...args: unknown[]) => void): () => void;
        once(channel: Channels, func: (...args: unknown[]) => void): void;
        sendNewKey(newKey: StoreKey): Promise<void>;

        sendDeleteKey(key: string): void;

        invoke<T>(channel: Channels, ...args: unknown[]): T;
      };
    };
  }
}
export {};
