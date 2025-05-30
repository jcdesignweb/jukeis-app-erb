/* eslint import/prefer-default-export: off */
import { app } from 'electron';
import { URL } from 'url';
import path from 'path';
import { DateTime } from 'luxon';
import { config } from '../config';

export const DATA_FILE_NAME = 'encrypted_data.json';
export const DATA_AUTH_FILE_NAME = 'encrypted_auth_data.json';

export function resolveHtmlPath(htmlFileName: string) {
  if (config.isDev) {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const rootFolder = (): string => {
  return process.cwd();
};

export function getFilePath(file = DATA_FILE_NAME): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, file);
}

export function getCurrentTimeStamp(): string {
  return DateTime.now().toMillis().toString();
}
