export interface CloudStorage {
  downloadFile(): void;
  uploadFile(encryptedData: string): void;
  removeFile(): void;
}
