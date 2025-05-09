import { BrowserWindow } from 'electron';
import {
  getUserInfo,
  openLoginWindow,
  UserInfo,
  waitForOAuthResponse,
} from '../google/gmail-auth';
import {
  getRefreshToken,
  getStore,
  getToken,
  getUserData,
  saveRefreshToken,
  saveToken,
  saveUserData,
} from '../session';

export type Session = {
  token: string;
  userData: UserInfo;
};

export async function clearSessionsStored() {
  (await getStore()).delete('auth.token');
  (await getStore()).delete('auth.user');
}

export async function startGoogleLoginFlow(): Promise<UserInfo> {
  const refreshToken = await getRefreshToken();

  const authWindow = openLoginWindow(refreshToken, () => {});

  authWindow.webContents.on('did-finish-load', () => {
    authWindow.show();
  });

  const { access_token, refresh_token } = await waitForOAuthResponse();

  const userInfo = await getUserInfo(access_token);

  await saveToken(access_token);
  if (refresh_token) await saveRefreshToken(refresh_token);
  await saveUserData(JSON.stringify(userInfo));

  authWindow.close();
  return userInfo;
}

export async function getSession(): Promise<Session | undefined> {
  const token = await getToken();
  const userDataStr = await getUserData();

  if (userDataStr) {
    const userData: UserInfo = JSON.parse(userDataStr);

    if (token && userData) {
      return { token, userData };
    }
  }
}
