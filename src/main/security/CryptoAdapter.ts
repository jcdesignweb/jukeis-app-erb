import crypto, { pbkdf2Sync, randomBytes } from 'crypto';
import { Encrypter } from './Encripter';
import { config } from '../config';

const IV_LENGTH = 16; // for aes-256-cbc, the IV length is 16 bytes
const ALGORITHM = 'aes-256-cbc';

const generateHash = (password: string, salt: Buffer) => {
  return pbkdf2Sync(password, salt, 100_000, 64, 'sha512');
};

export class CryptoAdapter implements Encrypter {
  private readonly key: Buffer;

  constructor(secretKey: string = config.encriptionKey) {
    this.key = Buffer.from(secretKey, 'utf-8');
  }

  encrypt(keyword: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(keyword, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
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

  createMasterKeyHash(password: string) {
    const salt = randomBytes(16);
    const hash = generateHash(password, salt);
    return {
      salt: salt.toString('base64'),
      hash: hash.toString('base64'),
    };
  }

  validatePassword(
    password: string,
    saltBase64: string,
    hashBase64: string,
  ): boolean {
    const salt = Buffer.from(saltBase64, 'base64');
    return generateHash(password, salt).toString('base64') === hashBase64;
  }
}
