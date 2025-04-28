import path from 'path';
import fs from 'fs/promises';
import { encrypt, decrypt } from '../security/encryption';
import { getDataFilePath } from '../utils';

const dataFilePath = path.join(getDataFilePath());

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
  async load(): Promise<StoredData | null> {
    try {
      const data = await fs.readFile(dataFilePath, 'utf-8');

      const decryptedData = decrypt(data);
      return JSON.parse(decryptedData);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      return null;
    }
  }

  async save(data: StoredData): Promise<void> {
    try {
      const jsonData = JSON.stringify(data, null, 2);

      //await fs.writeFile(dataFilePath, jsonData, 'utf-8');

      const encryptedData = encrypt(jsonData);
      await fs.writeFile(dataFilePath, encryptedData, 'utf-8');
    } catch (error: unknown) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async saveFromDrive(data: Buffer): Promise<void> {
    try {
      await fs.writeFile(dataFilePath, data);

      // @TODO esto debe ir
      // const encryptedData = encrypt(jsonData);
      // await fs.writeFile(dataFilePath, encryptedData, 'utf-8');
    } catch (error: unknown) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async deleteGroup(id: string): Promise<boolean> {
    try {
      const existingData = await this.load();

      if (existingData && existingData.groups) {
        const initialLength = existingData.groups.length;
        existingData.groups = existingData.groups.filter(
          (key) => key.id !== id,
        );

        if (existingData.groups.length < initialLength) {
          await this.save(existingData);
          return true;
        }
        return false;
      }

      console.warn('No data or groups found to delete from.');
      return false;
    } catch (error: unknown) {
      console.error(`Error deleting group "${id}":`, error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const existingData = await this.load();
      if (existingData && existingData.keys) {
        const initialKeysLength = existingData.keys.length;
        existingData.keys = existingData.keys.filter((key) => key.id !== id);
        if (existingData.keys.length < initialKeysLength) {
          await this.save(existingData);
          return true;
        }
        return false;
      }
      console.warn('No data or keys found to delete from.');
      return false;
    } catch (error: unknown) {
      console.error(`Error deleting key "${id}":`, error);
      return false;
    }
  }

  getFilePath(): string {
    return dataFilePath;
  }
}

export const localStorage = new LocalStorage();
