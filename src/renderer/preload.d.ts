import { Channels } from '../main/ipc/channels';
import { StoreKey } from '../main/models';

declare global {
  interface Window {
    electron: {
      googleClientId: string;
      initLogin: () => void;

      ipcRenderer: {
        removeAllListeners(arg0: string): unknown;
        sendMessage(channel: Channels, ...args: unknown[]): void;
        on(channel: Channels, func: (...args: unknown[]) => void): () => void;
        once(channel: Channels, func: (...args: unknown[]) => void): void;
        sendNewKey(newKey: Partial<StoreKey>): Promise<void>;
        sendDeleteKey(key: string): void;

        invoke<T>(channel: Channels, ...args: unknown[]): T;
      };
    };
  }
}
export {};
