import path from 'path';
import fs from 'fs/promises';
import {
  DATA_AUTH_FILE_NAME,
  getCurrentTimeStamp,
  getFilePath,
} from '../utils';
import { EncripterCryptoSingleton } from '../security/EncripterSingleton';
import { CryptoAdapter } from '../security/CryptoAdapter';
import {
  AuthData,
  dataInitializor,
  authDataInitializor,
  StoredData,
} from '../models';

const dataFilePath = path.resolve(getFilePath());
const authFilePath = path.resolve(getFilePath(DATA_AUTH_FILE_NAME));

export enum LocalFileType {
  AUTH_FILE,
  DATA_FILE,
}

class LocalStorage {
  private encrypter: CryptoAdapter = EncripterCryptoSingleton.getInstance();

  async load(): Promise<StoredData> {
    try {
      const encryptedData = await fs.readFile(dataFilePath, 'utf-8');
      const decrypted = this.encrypter.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`[LocalStorage] Failed to load data:`, error);
      return dataInitializor;
    }
  }

  async loadAuthData(): Promise<AuthData> {
    try {
      const encryptedData = await fs.readFile(authFilePath, 'utf-8');
      const decrypted = this.encrypter.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`[LocalStorage] Failed to load data:`, error);
      return authDataInitializor;
    }
  }

  async saveAuth(data: AuthData): Promise<void> {
    try {
      const str = JSON.stringify(data, null, 2);
      const encrypted = this.encrypter.encrypt(str);
      await fs.writeFile(authFilePath, encrypted, 'utf-8');
    } catch (error) {
      console.error(`[LocalStorage] Failed to save data:`, error);
      throw error;
    }
  }

  async save(data: StoredData): Promise<void> {
    try {
      const str = JSON.stringify(data, null, 2);
      const encrypted = this.encrypter.encrypt(str);
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

  deleteLocalFile(fileType = LocalFileType.DATA_FILE) {
    const filepath =
      fileType === LocalFileType.DATA_FILE ? dataFilePath : authFilePath;

    try {
      fs.rm(filepath);
    } catch (error) {
      console.error(`[LocalStorage] Failed to save file from Drive:`, error);
      throw error;
    }
  }

  /**
   * deletes the item from the array
   * @param type
   * @param id
   * @returns true if was deleted
   */
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

      if (Array.isArray(data[type]) && data[type].length < initialLength) {
        if (type === 'keys') {
          const deletedTombs = data['deletedKeys'] ?? [];
          data['deletedKeys'] = [
            ...deletedTombs,
            { id, ts: getCurrentTimeStamp() },
          ];
        } else if (type === 'groups') {
          const deletedTombs = data['deletedGroups'] ?? [];
          data['deletedGroups'] = [
            ...deletedTombs,
            { id, ts: getCurrentTimeStamp() },
          ];
        }

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
