import { TimestampSync } from './TimeStampSync';

describe('Sync data tests', () => {
  it('should compare local data with its stored on google drive and update it successfully', () => {
    const localData = {
      keys: [
        {
          id: 'uuid1',
          description: 'gmail account',
          key: 'my-accountXXXX',
          groupId: 'uuid-group-1',
          ts: '1746543226',
        },
      ],
      groups: [
        {
          id: 'uuid-group-1',
          name: 'Group name',
          ts: '1746543216',
        },
      ],
    };

    const driveData = {
      keys: [
        {
          id: 'uuid1',
          description: 'gmail account',
          key: 'my-accountXXXX-new',
          groupId: 'uuid-group-1',
          ts: '1746543126',
        },
      ],
      groups: [
        {
          id: 'uuid-group-1',
          name: 'Group name',
          ts: '1746543216',
        },
      ],
    };

    const sync = new TimestampSync();
    const merged = sync.syncData(driveData, localData);

    // driveData
    expect(merged.keys.at(0)?.key).toEqual(localData.keys.at(0)?.key);
  });
});
