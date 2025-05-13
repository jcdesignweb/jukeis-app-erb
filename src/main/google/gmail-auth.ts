// google-auth.ts

import express from 'express';
import { BrowserWindow } from 'electron';
import {
  getRefreshToken,
  saveRefreshToken,
  saveToken,
  saveUserData,
} from '../session';
import TokenManager from '../security/TokenManager';

export const VERCEL_AUTH_URL =
  'https://jukeis-authenticator.vercel.app/api/auth';
export const VERCEL_AUTH_TOKEN_URL =
  'https://jukeis-authenticator.vercel.app/api/get-token';
export const GOOGLE_API_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
export const PORT = 51739;

export type UserInfo = {
  name: string;
  picture: string;
};

export async function refreshAccessToken(): Promise<string> {
  const refresh_token = await getRefreshToken();
  const url = VERCEL_AUTH_TOKEN_URL + `?refresh_token=${refresh_token}`;
  const response = await fetch(url);
  const responseBody = await response.json();

  const accessToken = responseBody.access_token;
  await TokenManager.getInstance().setAccessToken(accessToken).persistence();

  return accessToken;
}

export async function getUserInfo(access_token: string): Promise<UserInfo> {
  const res = await fetch(GOOGLE_API_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return await res.json();
}

export function openLoginWindow(
  refreshToken: string | null,
  onClose: () => void,
): BrowserWindow {
  const win = new BrowserWindow({
    width: 500,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.on('closed', onClose);

  let loginUrl = VERCEL_AUTH_URL;
  if (!refreshToken) {
    loginUrl += '?request_consent=true';
  }

  win.loadURL(loginUrl);
  return win;
}

export function waitForOAuthResponse(): Promise<{
  access_token: string;
  refresh_token?: string;
}> {
  return new Promise((resolve) => {
    const app = express();
    const server = app.listen(PORT);

    app.get('/', (req, res) => {
      const access_token = req.query.access_token as string;
      const refresh_token = req.query.refresh_token as string | undefined;

      res.send('Login successful. You may close this window.');

      resolve({ access_token, refresh_token });
      server.close();
    });
  });
}
