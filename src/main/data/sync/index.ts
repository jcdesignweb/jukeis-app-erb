import { localStorage } from '../local-storage';
import GoogleDriveStorage from '../../google/google-drive-storage';
import { EncripterCryptoSingleton } from '../../security/encrypter.singleton';
import { TimestampSync } from './TimeStampSync';
import { dataInitializor, StoredData } from '../../models';

const INIT_VALUE_DATA = EncripterCryptoSingleton.getInstance().encrypt(
  JSON.stringify(dataInitializor),
);

/**
 * sync keys into Google drive, this will we executed after adding or removing a key or group
 */
export async function sync_drive_data(): Promise<boolean> {
  console.info('Cloud sync data process');
  try {
    const googleDrive = new GoogleDriveStorage();

    const driveFile = await googleDrive.downloadFile();

    const driveData: StoredData = JSON.parse(
      EncripterCryptoSingleton.getInstance().decrypt(
        driveFile?.toString() ?? INIT_VALUE_DATA,
      ),
    );

    const localData =
      (await localStorage.load()) ??
      (JSON.parse(
        EncripterCryptoSingleton.getInstance().decrypt(INIT_VALUE_DATA),
      ) as StoredData);

    const sync = new TimestampSync();
    const merged = sync.syncData(driveData, localData);

    const storagedDataSrt = EncripterCryptoSingleton.getInstance().encrypt(
      JSON.stringify(merged),
    );

    // updates locally
    await localStorage.save(merged);

    // updates data in Gdrive
    await googleDrive.uploadFile(storagedDataSrt);

    return true;
  } catch (error) {
    console.error('[Sync]', error);
    return false;
  }
}
