import crypto from 'crypto';
import { Encrypter } from './Encripter';
import { config } from '../config';

const IV_LENGTH = 16; // for aes-256-cbc, the IV length is 16 bytes
const ALGORITHM = 'aes-256-cbc';

export class CryptoAdapter implements Encrypter {
  private readonly key: Buffer;

  constructor(secretKey: string = config.encriptionKey) {
    this.key = Buffer.from(secretKey, 'utf-8');
  }

  encrypt(keyword: string): string {
    return keyword;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(keyword, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    return encryptedText;
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }
}
