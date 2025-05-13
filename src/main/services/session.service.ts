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
import { localStorage } from '../data/local-storage';
import { EncripterCryptoSingleton } from '../security/EncripterSingleton';
import { AuthData, StoredData } from '../models';
import TokenManager from '../security/TokenManager';

export type GoogleSession = {
  access_token: string;
  refresh_token: string;
  userInfo: UserInfo;
};
startGoogleLoginFlow;

export type Session = {
  token: string;
  userData: UserInfo;
};

/**
 * deleted the user session stored previously
 */
export async function clearSessionsStored() {
  (await getStore()).delete('auth.token');
  (await getStore()).delete('auth.user');
}

/**
 * starts the google oauth
 * @returns Promise<GoogleSession>
 * @todo remove userInfo from this method, this should only returns the access and refresh token.
 */
export async function startGoogleLoginFlow(): Promise<GoogleSession> {
  const refreshToken = await getRefreshToken();

  const authWindow = openLoginWindow(refreshToken, () => {});

  authWindow.webContents.on('did-finish-load', () => {
    authWindow.show();
  });

  const { access_token, refresh_token } = await waitForOAuthResponse();

  /**@TODO remove userInfo from here */
  const userInfo = await getUserInfo(access_token);

  TokenManager.getInstance().setAccessToken(access_token);

  if (refresh_token) TokenManager.getInstance().setRefreshToken(refresh_token);

  //await saveToken(access_token);
  if (refresh_token) await saveRefreshToken(refresh_token);
  await saveUserData(JSON.stringify(userInfo));

  authWindow.close();
  return { userInfo, access_token, refresh_token: refresh_token! };
}

/**
 * check if the User was registered.
 * @returns Promise<boolean>
 */
export async function isRegistered(): Promise<boolean> {
  const data = await localStorage.loadAuthData();
  if (!data || !data.auth) {
    return false;
  }

  return data.auth.hash !== undefined && data.auth.hash !== '';
}

export async function passwordVerify(password: string): Promise<boolean> {
  const storedData = await localStorage.loadAuthData();
  if (!storedData.auth) {
    return false;
  }

  const { hash, salt } = storedData.auth;

  const encrypter = EncripterCryptoSingleton.getInstance();
  return encrypter.validatePassword(password, salt, hash);
}

/**
 * creates the user's master password, this is used in the onboarding
 * @param password master password
 */
export async function masterPassword(
  password: string,
): Promise<{ status: boolean; authData?: AuthData }> {
  const storedData = await localStorage.loadAuthData();
  if (!storedData) {
    return { status: false };
  }

  const encrypter = EncripterCryptoSingleton.getInstance();
  const encriptPassword = encrypter.createMasterKeyHash(password);

  const updatedStoredData: AuthData = {
    ...storedData,
    auth: encriptPassword,
  };

  try {
    await localStorage.saveAuth(updatedStoredData);

    const authData = await localStorage.loadAuthData();

    return { status: true, authData };
  } catch (error) {
    console.error('Error creating master password:', error);
    return { status: false };
  }
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
