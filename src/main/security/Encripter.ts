export interface Encrypter {
  encrypt(keyword: string): string;
  decrypt(encryptedText: string): string;
}
