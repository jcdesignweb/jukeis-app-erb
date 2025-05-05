import { CryptoAdapter } from './CryptoAdapter';

export class EncripterCryptoSingleton {
  static #instance: CryptoAdapter;

  static getInstance(): CryptoAdapter {
    if (!EncripterCryptoSingleton.#instance) {
      EncripterCryptoSingleton.#instance = new CryptoAdapter();
    }

    return EncripterCryptoSingleton.#instance;
  }
}
