import { localStorage } from '../data/local-storage';
import { dataInitializor, Group, StoredData } from '../models';

let storedData: StoredData = dataInitializor;

const getData = async () => {
  const loadedData = await localStorage.load();
  storedData = loadedData ?? { groups: [], keys: [] };
  return storedData;
};

export async function removeGroup(groupId: string) {
  const result = await localStorage.deleteGroup(groupId);

  return result;
}

export async function addGroup(group: Group) {
  const { groups } = await getData();

  if (groups !== undefined) {
    const existsGroup = groups.find((g: Group) => g.name === group.name);
    if (existsGroup) {
      throw new Error('Group Alredy exists');
    }
  }

  const updatedGroups = [...(storedData.groups ?? []), group];
  const updatedStoredData: StoredData = {
    ...storedData,
    groups: updatedGroups,
  };

  try {
    await localStorage.save(updatedStoredData);

    return updatedGroups;
  } catch (error) {
    console.error('Storing Group Error', error);
  }
}
