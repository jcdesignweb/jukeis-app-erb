import { BrowserWindow, ipcMain } from 'electron';
import { Channels } from './channels';
import {
  clearSessionsStored,
  getSession,
  GoogleSession,
  isRegistered,
  startGoogleLoginFlow,
  passwordVerify,
  masterPassword,
} from '../services/session.service';

import { sync_drive_data } from '../data/sync';
import TokenManager from '../security/TokenManager';
import { saveToken } from '../session';
import GoogleDriveAuthStorage from '../google/google-drive-auth-storage';
import { authDataInitializor } from '../models';
import { EncripterCryptoSingleton } from '../security/EncripterSingleton';
import { localStorage } from '../data/local-storage';

const createOrUpdateAuthLocalFile = async () => {
  const googleStorage = new GoogleDriveAuthStorage();
  const authFileBuffer = await googleStorage.downloadFile();

  let driveAuthData = !authFileBuffer
    ? authDataInitializor
    : JSON.parse(
        EncripterCryptoSingleton.getInstance().decrypt(
          authFileBuffer.toString(),
        ),
      );

  driveAuthData = await localStorage.saveAuth(driveAuthData);
};

const syncKeysDataProcess = async (mainWindow: BrowserWindow) => {
  mainWindow.webContents.send('show-loader', true);

  await sync_drive_data();
  mainWindow.webContents.send('show-loader', false);
};

const syncAndFinishOnboarding = async (
  onboardingStatus: boolean,
  mainWindow: BrowserWindow,
) => {
  if (onboardingStatus) {
    const accessToken = TokenManager.getInstance().getAccessToken();
    await saveToken(accessToken);
    await syncKeysDataProcess(mainWindow);
  }
};

export function registerSessionHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle(Channels.LOGOUT, async (_) => {
    await clearSessionsStored();
  });

  ipcMain.on(Channels.LOGIN, async (_) => {
    mainWindow.webContents.send('show-loader', true);
    const userSessionData: GoogleSession = await startGoogleLoginFlow();

    await createOrUpdateAuthLocalFile();

    await sync_drive_data();
    mainWindow.webContents.send('show-loader', false);

    mainWindow.webContents.send(Channels.LOGIN_SUCCESS, {
      userSessionData,
      isRegistered: await isRegistered(),
    });
  });

  ipcMain.handle(Channels.PASSWORD_VERIFY, async (_, password: string) => {
    console.log('[PASSWORD VERIY]', password);

    const verify = await passwordVerify(password);
    await syncAndFinishOnboarding(verify, mainWindow);
    return verify;
  });

  ipcMain.handle(Channels.REGISTER, async (_, password: string) => {
    console.info('[PASSWORD REGISTER]');
    mainWindow.webContents.send('show-loader', true);

    const { authData } = await masterPassword(password);

    if (authData) {
      const googleStorage = new GoogleDriveAuthStorage();

      const encriptionKey = EncripterCryptoSingleton.getInstance().encrypt(
        JSON.stringify(authData),
      );

      await googleStorage.uploadFile(encriptionKey);
    }

    const accessToken = TokenManager.getInstance().getAccessToken();
    await saveToken(accessToken);
    //await syncAndFinishOnboarding(status, mainWindow);
    mainWindow.webContents.send('show-loader', false);
    return true;
  });

  ipcMain.handle(Channels.GET_SESSION, getSession);
}
