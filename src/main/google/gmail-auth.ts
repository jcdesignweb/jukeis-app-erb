import express from 'express';
import { BrowserWindow } from 'electron';
import { saveToken, saveUserData } from '../session';

const VERCEL_AUTH_URL = 'https://jukeis-authenticator.vercel.app/api/auth';
const GOOGLE_API_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const PORT = 51739;

export function startGoogleLoginFlow(
  mainWindow: BrowserWindow,
  download_drive_data: () => void,
) {
  mainWindow.webContents.send('show-loader', true);

  const app = express();
  const server = app.listen(PORT);

  app.get('/', async (req, res) => {
    const accessToken = req.query.access_token as string;

    await saveToken(accessToken);

    const { userInfo } = await getUserInfo(accessToken);

    await saveUserData(JSON.stringify(userInfo));

    if (accessToken) {
      download_drive_data();

      mainWindow!.webContents.send('login-success', {
        accessToken,
        userData: userInfo,
      });

      authWindow.close();
    }
  });

  const authWindow = new BrowserWindow({
    width: 500,
    height: 600,

    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  authWindow.on('closed', () => {
    server.close();
  });

  authWindow.loadURL(VERCEL_AUTH_URL);

  authWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('show-loader', false);
    authWindow.show();
  });
}

async function getUserInfo(access_token: string) {
  await saveToken(access_token);

  const userInfoResponse = await fetch(GOOGLE_API_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const userInfo = await userInfoResponse.json();

  return {
    userInfo,
    access_token,
  };
}
