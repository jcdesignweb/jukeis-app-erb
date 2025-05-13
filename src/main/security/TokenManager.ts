import { getToken, saveToken } from '../session';

export default class TokenManager {
  static #instance: TokenManager;

  private constructor(
    private accessToken = '',
    private refreshToken?: string,
  ) {}

  static async initFromStorage(): Promise<TokenManager> {
    const token = await getToken();
    TokenManager.#instance = new TokenManager(token);
    return TokenManager.#instance;
  }

  static getInstance(): TokenManager {
    if (!TokenManager.#instance) {
      TokenManager.#instance = new TokenManager();
    }

    return TokenManager.#instance;
  }

  setAccessToken(access_token: string) {
    this.accessToken = access_token;
    return this;
  }

  getAccessToken() {
    return this.accessToken;
  }

  setRefreshToken(refresh_token: string) {
    this.refreshToken = refresh_token;
    return this;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  async persistence() {
    await saveToken(this.accessToken);
  }
}
