import { drive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';
import { DATA_FILE_NAME } from '../utils';
import { refreshAccessToken } from './gmail-auth';
import { getToken, saveToken } from '../session';
import { CloudStorage } from './CloudStorage';
import Cloud from './Cloud';

export default class GoogleDriveStorage extends Cloud implements CloudStorage {
  constructor() {
    super();
  }

  protected async getAccessToken() {
    const accessToken = await getToken();
    return accessToken;
  }

  downloadFile() {
    return this.tryWithRefresh(async () => {
      const access_token = await this.getAccessToken();

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
        (f) => f.name === DATA_FILE_NAME,
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

  uploadFile(encryptedData: string) {
    return this.tryWithRefresh(async () => {
      const access_token = await this.getAccessToken();

      const driveV3 = drive({ version: 'v3', auth: access_token });

      /*
      const driveV3 = drive({ version: 'v3', auth: access_token });

      const listResponse = await driveV3.files.list({
        q: `name='${DATA_FILE_NAME}' and appProperties has { key='appSpecific' and value='true' } and trashed=false`,
        fields: 'files(id, name, appProperties)',
        access_token,
        spaces: 'appDataFolder',
      });

      const existingFiles = listResponse.data.files;
      let fileIdToUpdate: string | null | undefined;

      if (existingFiles && existingFiles.length > 0) {
        fileIdToUpdate = existingFiles[0].id;
      }
      */

      const fileIdToUpdate = await this.getFileId(access_token, DATA_FILE_NAME);

      const requestBody: {
        name: string;
        parents?: string[];
        appProperties: {
          appSpecific: string;
        };
      } = {
        name: DATA_FILE_NAME,
        parents: ['appDataFolder'],
        appProperties: {
          appSpecific: 'true',
        },
      };

      if (fileIdToUpdate) {
        delete requestBody.parents;
      }
      const media = {
        mimeType: 'application/json',
        body: encryptedData,
      };

      const requestOptions = {
        media: media,
        requestBody,
        fields: 'id',
        access_token,
      };

      const response = fileIdToUpdate
        ? await driveV3.files.update({
            ...requestOptions,
            ...{ fileId: fileIdToUpdate },
          })
        : await driveV3.files.create(requestOptions);

      return response.data.id;
    });
  }

  removeFile() {
    return this.tryWithRefresh(async () => {
      const access_token = await this.getAccessToken();

      const driveV3 = drive({ version: 'v3', auth: access_token });

      const listResponse = await driveV3.files.list({
        q: `name='${DATA_FILE_NAME}' and appProperties has { key='appSpecific' and value='true' } and trashed=false`,
        fields: 'files(id, name)',
        access_token,
        spaces: 'appDataFolder',
      });

      const files = listResponse.data.files;

      if (files && files.length > 0 && files[0].id !== undefined) {
        const fileId = files[0].id;

        await driveV3.files.delete({
          fileId: fileId!,
          access_token,
        });

        console.log(`file ${fileId} was deleted from Google Drive`);
      }
    });
  }
}
