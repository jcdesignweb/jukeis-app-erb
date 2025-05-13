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
import { getToken, getUserData } from './session';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import { log } from './utils/logger';
import es from '../../public/locales/es/translation.json';
import en from '../../public/locales/en/translation.json';
import { registerKeyHandlers } from './ipc/keys.listener';
import { registerSessionHandlers } from './ipc/sessions.listener';
import { registerGroupHandlers } from './ipc/group.listener';
import { registerAppHandlers } from './ipc/app.listener';
import { registerSyncHandlers } from './ipc/sync.listener';
import { Channels } from './ipc/channels';

process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`);
});

let mainWindow: BrowserWindow | null = null;

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

function sendToRenderer(channel: string, value: any) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send(channel, value);
  }
}

ipcMain.on('open-external', (_, url: string) => {
  shell.openExternal(url);
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

  registerKeyHandlers();
  registerGroupHandlers();
  registerSessionHandlers(mainWindow);
  registerAppHandlers();
  registerSyncHandlers(sendToRenderer);

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
      sendToRenderer(Channels.LOGIN_SUCCESS, {
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
