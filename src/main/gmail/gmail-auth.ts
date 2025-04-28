import axios from 'axios';
import path from 'path';
import express from 'express';
import { BrowserWindow } from 'electron';
import { saveToken, saveUserData } from '../session';
import { downloadUserFileFromDrive } from './drive-storage';
import { localStorage } from '../data/storage';

import { rootFolder } from '../utils';
import { google, isDev } from '../config';

let authWindow: BrowserWindow;

const PORT = 51739;

const googleClientId = google.googleClientId;
const googleClientSecret = google.googleClientSecret;
export const redirectUri = google.googleRedirectUri;

const oathCallbackFile = isDev
  ? path.join(rootFolder(), './assets/html/oauth_callback.html')
  : path.join(process.resourcesPath, 'assets/html/oauth_callback.html');

export function startGoogleLoginFlow(mainWindow: BrowserWindow) {
  const app = express();
  const server = app.listen(PORT);

  app.get('/', async (req, res) => {
    const code = req.query.code as string;

    res.sendFile(oathCallbackFile);
    const { userInfo, tokens } = await exchangeCodeForToken(code, mainWindow);

    await saveUserData(JSON.stringify(userInfo));
    const fileData = await downloadUserFileFromDrive(tokens.access_token);
    if (fileData) {
      await localStorage.saveFromDrive(fileData);
    }

    setTimeout(() => {
      mainWindow!.webContents.send('login-success', {
        tokens,
        user: userInfo.data,
      });
      authWindow.close();
      server.close();
    }, 500);
  });

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${googleClientId}` +
    `&redirect_uri=http://localhost:${PORT}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile%20https://www.googleapis.com/auth/drive.appdata%20https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/drive.file` +
    `&access_type=offline`;

  authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: true,

    webPreferences: {
      nodeIntegration: false,
    },
  });

  authWindow.loadURL(authUrl);
}

async function exchangeCodeForToken(
  code: string,
  mainWindow: BrowserWindow,
): Promise<{ userInfo: any; tokens: any }> {
  const res = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: googleClientId,
    client_secret: googleClientSecret,
    redirect_uri: `http://localhost:${PORT}`,
    grant_type: 'authorization_code',
  });

  const tokens = res.data;

  const accessToken = tokens.access_token;
  await saveToken(accessToken);

  const userInfo = await axios.get(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );

  return {
    userInfo: userInfo.data,
    tokens,
  };
}

export const handleAuthorizationCode = async (authorizationCode: string) => {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  params.append('client_id', googleClientId);
  params.append('client_secret', googleClientSecret);
  params.append('redirect_uri', redirectUri);

  try {
    await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (error) {
    console.error('GoogleToken error', error);
  }
};
