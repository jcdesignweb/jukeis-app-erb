export type Updated = {
  ts: string;
};

/**
 * used for delete purposes
 */
export type Tombstone = {
  id: string;
  ts: string;
};

export type Group = { id: string; name: string } & Updated;
export type StoreKey = {
  id: string;
  description: string;
  key: string;
  groupId: string;
} & Updated;

export interface StoredData {
  groups: Group[];
  keys: StoreKey[];
  deletedKeys?: Tombstone[];
  deletedGroups?: Tombstone[];
}

export const dataInitializor: StoredData = { groups: [], keys: [] };
