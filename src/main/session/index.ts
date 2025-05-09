import { EncripterCryptoSingleton } from '../security/encrypter.singleton';

const encrypter = EncripterCryptoSingleton.getInstance();

const getStore = async () => {
  const mod = await import('electron-store');
  const Store = mod.default;
  const store = new Store();

  return store;
};

export async function saveToken(token: string) {
  (await getStore()).set('auth.token', encrypter.encrypt(token));
}

export async function saveRefreshToken(token: string) {
  (await getStore()).set('auth.refresh_token', encrypter.encrypt(token));
}

export async function getRefreshToken() {
  const refreshTokenCoded = (await getStore()).get(
    'auth.refresh_token',
  ) as string;
  return refreshTokenCoded ? encrypter.decrypt(refreshTokenCoded) : null;
}

export async function saveUserData(user: string) {
  (await getStore()).set('auth.user', encrypter.encrypt(user));
}

export async function getUserData(): Promise<string | null> {
  const encrypted = (await getStore()).get('auth.user') as string;
  return encrypted ? encrypter.decrypt(encrypted) : null;
}

export async function getToken(): Promise<string> {
  const encrypted = (await getStore()).get('auth.token') as string;

  if (!encrypted) throw new Error('token is missing');

  return encrypter.decrypt(encrypted);
}

export async function clearSessionsStored() {
  (await getStore()).delete('auth.token');
  (await getStore()).delete('auth.user');
}
