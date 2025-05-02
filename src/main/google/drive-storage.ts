import { writeFile } from 'fs/promises';
import { drive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';
import { DATA_FILE_NAME, getDataFilePath } from '../utils';

export async function downloadUserFileFromDrive(
  accessToken: string,
): Promise<void> {
  const authClient = new OAuth2Client();
  authClient.setCredentials({ access_token: accessToken });

  const driveV3 = drive({ version: 'v3', auth: authClient });

  const listResponse = await driveV3.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    access_token: accessToken,
  });

  const existingFiles = listResponse.data.files;

  if (existingFiles![0]) {
    const file = existingFiles![0];
    const fileIdToUpdate: any = file?.id;
    try {
      const res: any = await driveV3.files.get(
        { fileId: fileIdToUpdate, alt: 'media' },
        { responseType: 'arraybuffer' },
      );

      const buffer = Buffer.from(res.data as ArrayBuffer);
      await writeFile(getDataFilePath(), buffer);
    } catch (error) {
      console.error('Error downloading file from Drive:', error);
      throw error;
    }
  }
}

export async function uploadToDrive(
  accessToken: string,
  encryptedData: string,
) {
  const driveV3 = drive({ version: 'v3', auth: accessToken });

  const listResponse = await driveV3.files.list({
    q: `name='${DATA_FILE_NAME}' and appProperties has { key='appSpecific' and value='true' } and trashed=false`,
    fields: 'files(id, name, appProperties)',
    access_token: accessToken,
    spaces: 'appDataFolder',
  });

  const existingFiles = listResponse.data.files;
  let fileIdToUpdate: string | null | undefined;

  if (existingFiles && existingFiles.length > 0) {
    fileIdToUpdate = existingFiles[0].id;
  }

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
    access_token: accessToken,
  };

  const response = fileIdToUpdate
    ? await driveV3.files.update({
        ...requestOptions,
        ...{ fileId: fileIdToUpdate },
      })
    : await driveV3.files.create(requestOptions);

  return response.data.id;
}
