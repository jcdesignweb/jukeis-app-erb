import { drive } from '@googleapis/drive';
import TokenManager from '../security/TokenManager';
import { DATA_AUTH_FILE_NAME, DATA_FILE_NAME } from '../utils';
import Cloud from './Cloud';
import { CloudStorage } from './CloudStorage';
import { OAuth2Client } from 'google-auth-library';

export default class GoogleDriveAuthStorage
  extends Cloud
  implements CloudStorage
{
  constructor() {
    super();
  }

  async downloadFile() {
    return this.tryWithRefresh(async () => {
      const access_token = TokenManager.getInstance().getAccessToken();

      const authClient = new OAuth2Client();
      authClient.setCredentials({ access_token });
      const driveV3 = drive({ version: 'v3', auth: authClient });

      const listResponse = await driveV3.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        access_token,
      });

      const existingFiles = listResponse.data.files;
      const existsFile = existingFiles?.filter(
        (f) => f.name === DATA_AUTH_FILE_NAME,
      );

      if (!existsFile || existsFile.length == 0) return null;

      const fileId = existsFile[0].id as string;

      try {
        const res = await driveV3.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' },
        );

        const buffer = Buffer.from(res.data as ArrayBuffer);

        return buffer;
      } catch (error) {
        console.error('Error downloading file from Drive:', error);
        throw error;
      }
    });
  }

  async uploadFile(encryptedData: string) {
    const access_token = TokenManager.getInstance().getAccessToken();

    const fileId =
      (await this.getFileId(access_token, DATA_AUTH_FILE_NAME)) ?? undefined;

    await this.updateOrCreateFile(
      access_token,
      DATA_AUTH_FILE_NAME,
      encryptedData,
      fileId,
    );
  }

  async removeFile() {
    const access_token = TokenManager.getInstance().getAccessToken();

    const driveV3 = drive({ version: 'v3', auth: access_token });

    const listResponse = await driveV3.files.list({
      q: `name='${DATA_AUTH_FILE_NAME}' and appProperties has { key='appSpecific' and value='true' } and trashed=false`,
      fields: 'files(id, name)',
      access_token,
      spaces: 'appDataFolder',
    });

    const files = listResponse.data.files;

    const existsFile = files?.filter((f) => f.name === DATA_AUTH_FILE_NAME);

    if (!existsFile || existsFile.length == 0) return null;

    const fileId = existsFile[0].id as string;

    await driveV3.files.delete({
      fileId: fileId!,
      access_token,
    });
  }
}
