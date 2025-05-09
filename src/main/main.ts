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
import { resolveHtmlPath } from './utils';

import { config } from './config';

import path from 'path';
import MenuBuilder from './menu';
import { localStorage } from './data/local-storage';
import { dataInitializor, Group, StoredData } from './models';
import { clearSessionsStored, getToken, getUserData } from './session';

import { startGoogleLoginFlow, UserInfo } from './google/gmail-auth';
import GoogleDriveStorage from './google/google-drive-storage';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

import { log } from './utils/logger';

import es from '../../public/locales/es/translation.json';
import en from '../../public/locales/en/translation.json';

import { sync_drive_data } from './data/sync';

process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`);
});

let mainWindow: BrowserWindow | null = null;
let storedData: StoredData = dataInitializor;

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

const sync = async () => {
  if (!mainWindow) return;
  mainWindow.webContents.send('cloud-synchronizing', true);
  await sync_drive_data();

  mainWindow.webContents.send('cloud-synchronizing', false);
};

ipcMain.handle('cloud-sync', async () => {
  console.log('Cloud sync started.');

  await sync();
});

ipcMain.handle('erase-data', async () => {
  const googleDrive = new GoogleDriveStorage();
  await googleDrive.removeFile();

  localStorage.deleteLocalFile();
});

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
    await sync();
  } catch (error) {
    console.error('Error stoing a new key:', error);
  }
});

ipcMain.handle('delete-key', async (event, keyId) => {
  const result = await localStorage.deleteKey(keyId);
  await sync();
  return result;
});

const getData = async () => {
  const loadedData = await localStorage.load();
  storedData = loadedData ?? { groups: [], keys: [] };
  return storedData;
};

ipcMain.handle('load-keys', async () => {
  return await getData();
});

ipcMain.on('open-external', (_, url: string) => {
  shell.openExternal(url);
});

ipcMain.handle('log-out', async () => {
  await clearSessionsStored();
});

ipcMain.on('start-google-login', async () => {
  if (!mainWindow) {
    throw new Error('windows is not defined');
  }

  console.log('start-google-login');

  const userInfo = await startGoogleLoginFlow(mainWindow);

  await sync();
  mainWindow.webContents.send('login-success', {
    userData: userInfo,
  });
});

ipcMain.handle('delete-group', async (_, id: string) => {
  const result = await localStorage.deleteGroup(id);
  await sync();
  return result;
});

ipcMain.handle('add-group', async (_, newGroup: Group) => {
  const { groups } = await getData();

  if (groups !== undefined) {
    const existsGroup = groups.find((g: Group) => g.name === newGroup.name);
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

    await sync();
    return updatedGroups;
  } catch (error) {
    console.error('Storing Group Error', error);
  }
});

ipcMain.handle('get-session', async () => {
  try {
    const token = await getToken();
    const userDataStr = await getUserData();

    if (userDataStr) {
      const userData: UserInfo = JSON.parse(userDataStr);

      if (token && userData) {
        return { token, userData };
      }
    }
  } catch (error) {
    console.error(error);
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

  app.setName(config.appTitle);

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
    title: config.appTitle,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.setTitle(config.appTitle);
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
