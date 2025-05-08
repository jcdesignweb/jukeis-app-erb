import { StoredData } from '../../models';

export abstract class SyncTemplate {
  public syncData(remote: StoredData, local: StoredData): StoredData {
    return this.mergeData(remote, local);
  }

  protected abstract mergeData(
    remote: StoredData,
    local: StoredData,
  ): StoredData;
}
