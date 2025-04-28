import crypto from 'crypto';
import { encriptionKey } from '../config';

// ¡PELIGRO! En una aplicación real, NUNCA codifiques la clave directamente en el código.
// Esto es solo para simplificar en esta etapa de desarrollo.

const IV_LENGTH = 16; // Para aes-256-cbc, el IV length es 16 bytes

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encriptionKey, 'utf-8'),
    iv,
  );
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift() || '', 'hex');
  const encryptedData = Buffer.from(textParts.join(':'), 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encriptionKey, 'utf-8'),
    iv,
  );

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted.toString('utf-8');
};
