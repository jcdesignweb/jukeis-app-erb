/* eslint import/prefer-default-export: off */
import { app } from 'electron';
import { URL } from 'url';
import path from 'path';
import { config } from './config';

export const DATA_FILE_NAME = 'encrypted_data.json';

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
  const projectRoot = process.cwd();

  return projectRoot;
};

export function getDataFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, DATA_FILE_NAME);
}

export function getEnvFilePath(isPackaged: boolean): string {
  return isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.resolve(process.cwd(), '.env');
}
