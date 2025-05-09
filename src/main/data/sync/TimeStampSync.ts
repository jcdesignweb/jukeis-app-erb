import { SyncTemplate } from './SyncTemplate';
import { StoredData, Tombstone } from '../../models';

export class TimestampSync extends SyncTemplate {
  protected mergeData(remote: StoredData, local: StoredData): StoredData {
    return {
      groups: this.mergeById(
        remote.groups,
        local.groups,
        this.mergeTombstones(remote.deletedGroups, local.deletedGroups),
      ),
      keys: this.mergeById(
        remote.keys,
        local.keys,
        this.mergeTombstones(remote.deletedKeys, local.deletedKeys),
      ),
      deletedGroups: this.mergeTombstones(
        remote.deletedGroups,
        local.deletedGroups,
      ),
      deletedKeys: this.mergeTombstones(remote.deletedKeys, local.deletedKeys),
    };
  }

  private mergeTombstones(
    remote: Tombstone[] = [],
    local: Tombstone[] = [],
  ): Tombstone[] {
    const map = new Map<string, Tombstone>();

    for (const tomb of remote) {
      map.set(tomb.id, tomb);
    }

    for (const tomb of local) {
      const existing = map.get(tomb.id);
      if (!existing || Number(tomb.ts) > Number(existing.ts)) {
        map.set(tomb.id, tomb);
      }
    }

    return Array.from(map.values());
  }

  private mergeById<T extends { id: string; ts: string }>(
    remoteList: T[],
    localList: T[],
    deletedList: Tombstone[] = [],
  ): T[] {
    const map = new Map<string, T>();

    // 1. Agrega elementos del remoto, respetando tombstones
    for (const item of remoteList) {
      const tombstone = deletedList.find((d) => d.id === item.id);
      const tombstoneTS = tombstone ? Number(tombstone.ts) : 0;
      const remoteTS = Number(item.ts);

      if (!tombstone || remoteTS > tombstoneTS) {
        map.set(item.id, item);
      }
    }

    // 2. Recorre el local y sobrescribe si tiene ts mayor, pero también respeta tombstones
    for (const item of localList) {
      const tombstone = deletedList.find((d) => d.id === item.id);
      const tombstoneTS = tombstone ? Number(tombstone.ts) : 0;
      const localTS = Number(item.ts);

      // Si fue eliminado con timestamp mayor, no lo agregamos
      if (tombstone && tombstoneTS >= localTS) {
        map.delete(item.id); // por si estaba del remoto
        continue;
      }

      const existing = map.get(item.id);
      const existingTS = Number(existing?.ts ?? 0);

      if (!existing || localTS > existingTS) {
        map.set(item.id, item);
      }
    }

    return Array.from(map.values());
  }
}
