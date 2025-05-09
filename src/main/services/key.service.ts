import { localStorage } from '../data/local-storage';
import { StoredData, StoreKey } from '../models';

export async function addNewKey(newKey: StoreKey) {
  const storedData: StoredData = (await localStorage.load()) || {
    groups: [],
    keys: [],
  };

  const updatedKeys = [...(storedData.keys ?? []), newKey];

  const updatedStoredData: StoredData = {
    ...storedData,
    keys: updatedKeys,
  };

  console.log('updatedStoredData', updatedStoredData);

  try {
    await localStorage.save(updatedStoredData);
  } catch (error) {
    console.error('Error stoing a new key:', error);
  }
}

export async function removeKey(keyId: string) {
  const result = await localStorage.deleteKey(keyId);

  return result;
}

export async function getAllKeys() {
  const loadedData = await localStorage.load();
  const storedData = loadedData ?? { groups: [], keys: [] };
  return storedData;
}
