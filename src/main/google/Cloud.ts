import { drive } from '@googleapis/drive';
import { refreshAccessToken } from './gmail-auth';
import { saveToken } from '../session';

export default class Cloud {
  async getFileId(access_token: string, filename: string) {
    const driveV3 = drive({ version: 'v3', auth: access_token });

    const listResponse = await driveV3.files.list({
      q: `name='${filename}' and appProperties has { key='appSpecific' and value='true' } and trashed=false`,
      fields: 'files(id, name, appProperties)',
      access_token,
      spaces: 'appDataFolder',
    });

    const existingFiles = listResponse.data.files;

    if (existingFiles && existingFiles.length > 0) {
      return existingFiles[0].id;
    }

    return null;
  }

  protected async tryWithRefresh<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('Access token expired, refreshing...');
        await refreshAccessToken();

        return await fn();
      }
      throw error;
    }
  }

  protected async updateOrCreateFile(
    access_token: string,
    filename: string,
    data: string,
    fileId?: string,
  ) {
    const driveV3 = drive({ version: 'v3', auth: access_token });
    const requestBody: {
      name: string;
      parents?: string[];
      appProperties: {
        appSpecific: string;
      };
    } = {
      name: filename,
      parents: ['appDataFolder'],
      appProperties: {
        appSpecific: 'true',
      },
    };

    const media = {
      mimeType: 'application/json',
      body: data,
    };

    const requestOptions = {
      media: media,
      requestBody,
      fields: 'id',
      access_token,
    };

    if (fileId) {
      await driveV3.files.update({
        fileId,
        media,
      });
    } else {
      await driveV3.files.create(requestOptions);
    }
  }
}
