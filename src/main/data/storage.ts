import path from 'path';
import fs from 'fs/promises';

import { getDataFilePath } from '../utils';

import { EncripterCryptoSingleton } from '../security/encrypter.singleton';
import { CryptoAdapter } from '../security/CryptoAdapter';

const dataFilePath = path.resolve(getDataFilePath());

export type Group = { id: string; name: string };
export type StoreKey = {
  id: string;
  description: string;
  key: string;
  groupId: string;
};

export interface StoredData {
  groups: Group[];
  keys: StoreKey[];
}

export class LocalStorage {
  private encrypter: CryptoAdapter = EncripterCryptoSingleton.getInstance();

  async load(): Promise<StoredData | null> {
    try {
      const encryptedData = await fs.readFile(dataFilePath, 'utf-8');
      const decrypted = this.encrypter.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`[LocalStorage] Failed to load data:`, error);
      return null;
    }
  }

  async save(data: StoredData): Promise<void> {
    try {
      const json = JSON.stringify(data, null, 2);
      const encrypted = this.encrypter.encrypt(json);
      await fs.writeFile(dataFilePath, encrypted, 'utf-8');
    } catch (error) {
      console.error(`[LocalStorage] Failed to save data:`, error);
      throw error;
    }
  }

  async saveFromDrive(buffer: Buffer): Promise<void> {
    try {
      await fs.writeFile(dataFilePath, buffer);
    } catch (error) {
      console.error(`[LocalStorage] Failed to save file from Drive:`, error);
      throw error;
    }
  }

  async deleteGroup(id: string): Promise<boolean> {
    return this.deleteById('groups', id);
  }

  async deleteKey(id: string): Promise<boolean> {
    return this.deleteById('keys', id);
  }

  getFilePath(): string {
    return dataFilePath;
  }

  private async deleteById<K extends keyof StoredData>(
    type: K,
    id: string,
  ): Promise<boolean> {
    try {
      const data = await this.load();

      if (!data || !Array.isArray(data[type])) {
        console.warn(`[LocalStorage] No ${type} found to delete.`);
        return false;
      }

      const initialLength = data[type].length;
      data[type] = data[type].filter((item) => item.id !== id) as StoredData[K];

      if (data[type].length < initialLength) {
        await this.save(data);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[LocalStorage] Failed to delete from "${type}":`, error);
      return false;
    }
  }
}

export const localStorage = new LocalStorage();
