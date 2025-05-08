import express from 'express';
import { BrowserWindow } from 'electron';
import {
  getRefreshToken,
  saveRefreshToken,
  saveToken,
  saveUserData,
} from '../session';

const VERCEL_AUTH_URL = 'https://jukeis-authenticator.vercel.app/api/auth';
const VERCEL_AUTH_TOKEN_URL =
  'https://jukeis-authenticator.vercel.app/api/get-token';
const GOOGLE_API_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const PORT = 51739;

export type UserInfo = {
  name: string;
  picture: string;
};

export async function refreshAccessToken(): Promise<string> {
  const refresh_token = await getRefreshToken();

  const url = VERCEL_AUTH_TOKEN_URL + `?refresh_token=${refresh_token}`;
  const response = await fetch(url);
  const responseBody = await response.json();
  const { access_token } = responseBody;

  return access_token as string;
}

export async function startGoogleLoginFlow(
  mainWindow: BrowserWindow,
): Promise<UserInfo> {
  return new Promise(async (resolve, reject) => {
    mainWindow.webContents.send('show-loader', true);

    const app = express();
    const server = app.listen(PORT);

    app.get('/', async (req, res) => {
      const accessToken = req.query.access_token as string;

      await saveToken(accessToken);

      const { userInfo } = await getUserInfo(accessToken);

      if (req.query.refresh_token) {
        await saveRefreshToken(String(req.query.refresh_token));
      }

      await saveUserData(JSON.stringify(userInfo));

      resolve(userInfo);

      authWindow.close();
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

    const refresh_token = await getRefreshToken();

    let url_login = VERCEL_AUTH_URL;
    if (!refresh_token) {
      url_login += '?request_consent=true';
    }

    authWindow.loadURL(url_login);
    authWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('show-loader', false);
      authWindow.show();
    });
  });
}

async function getUserInfo(
  access_token: string,
): Promise<{ userInfo: UserInfo; access_token: string }> {
  const userInfoResponse = await fetch(GOOGLE_API_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const userInfo: UserInfo = await userInfoResponse.json();

  return {
    userInfo,
    access_token,
  };
}
