/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */

import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron';
import { getEnvFilePath, resolveHtmlPath } from './utils';
import dotenv from 'dotenv';

import { config, initConfig } from './config';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: getEnvFilePath(app.isPackaged) });
}

initConfig();

import path from 'path';
import { autoUpdater } from 'electron-updater';
import * as electronLogger from 'electron-log';

import MenuBuilder from './menu';
import { Group, localStorage, StoredData } from './data/storage';
import { clearToken, getToken, getUserData } from './session';

import { startGoogleLoginFlow } from './google/gmail-auth';
import { encrypt } from './security/encryption';
import {
  downloadUserFileFromDrive,
  uploadToDrive,
} from './google/drive-storage';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

import { log } from './utils/logger';

process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`);
});

class AppUpdater {
  constructor() {
    electronLogger.transports.file.level = 'info';
    autoUpdater.logger = electronLogger;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let storedData: StoredData = { groups: [], keys: [] };

import es from '../../public/locales/es/translation.json';
import en from '../../public/locales/en/translation.json';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * this method will downdload the file from google drive if doesn't exists.
 */
async function download_drive_data() {
  const token = await getToken();

  if (!token) {
    throw new Error('user is not login.');
  }

  downloadUserFileFromDrive(token);
}

/**
 * sync keys into Google drive, this will we executed after add or remove some data
 */
async function sync_drive_data() {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('user is not log in.');
    }

    const loadedData = await localStorage.load();
    const data = encrypt(JSON.stringify(loadedData));
    //const data = JSON.stringify(loadedData);
    await uploadToDrive(token, data);

    return true;
  } catch (error) {
    console.error('Error storing in Drive', error);
    return false;
  }
}

ipcMain.handle('add-new-key', async (event, newKey) => {
  const storedData: StoredData = (await localStorage.load()) || {
    groups: [],
    keys: [],
  };

  const updatedKeys = [...(storedData.keys ?? []), newKey];

  const updatedStoredData: StoredData = {
    ...storedData,
    keys: updatedKeys,
  };

  try {
    await localStorage.save(updatedStoredData);
    sync_drive_data();
  } catch (error) {
    console.error('Error stoing a new key:', error);
  }
});

ipcMain.handle('delete-key', async (event, keyId) => {
  const result = await localStorage.deleteKey(keyId);
  sync_drive_data();
  return result;
});

const getData = async () => {
  const loadedData = await localStorage.load();
  storedData = loadedData || { groups: [], keys: [] };
  return storedData;
};

ipcMain.handle('load-keys', async () => {
  return await getData();
});

ipcMain.on('open-external', (_, url: string) => {
  shell.openExternal(url);
});

ipcMain.handle('log-out', async () => {
  await clearToken();
});

ipcMain.on('start-google-login', () => {
  if (!mainWindow) {
    throw new Error('windows is not defined');
  }

  startGoogleLoginFlow(mainWindow);
});

ipcMain.handle('delete-group', async (_, id: string) => {
  const result = await localStorage.deleteGroup(id);
  sync_drive_data();
  return result;
});

ipcMain.handle('add-group', async (_, newGroup: Group) => {
  const { groups } = await getData();

  if (groups !== undefined) {
    const existsGroup = groups.find((g) => g.name === newGroup.name);
    if (existsGroup) {
      throw new Error('Group Alredy exists');
    }
  }

  const updatedGroups = [...(storedData.groups ?? []), newGroup];
  const updatedStoredData: StoredData = {
    ...storedData,
    groups: updatedGroups,
  };

  try {
    await localStorage.save(updatedStoredData);

    sync_drive_data();
    return updatedGroups;
  } catch (error) {
    console.error('Storing Group Error', error);
  }
});

ipcMain.handle('get-session', async () => {
  const token = await getToken();
  const userData = await getUserData();

  if (token && userData) {
    return { token, userData };
  }
  return null;
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  app.setName('Jukeis');

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    title: 'Jukeis',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.setTitle('Jukeis');
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  /** Window reloaded */
  mainWindow.webContents.on('did-finish-load', async () => {
    const token = await getToken();

    if (token) {
      mainWindow!.webContents.send('login-success', {
        token,
        userData: await getUserData(),
      });
    }
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    /**
     * for debugging
     */
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Event listeners...
 */
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

protocol.registerSchemesAsPrivileged([
  { scheme: 'electron-app', privileges: { secure: true, standard: true } },
]);

app
  .whenReady()
  .then(() => {
    if (process.platform === 'win32') {
      app.setAsDefaultProtocolClient('electron-app');
    } else if (process.platform === 'darwin') {
      app.setAsDefaultProtocolClient('electron-app', process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }

    createWindow();

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
