import GoogleDriveStorage from './google-drive-storage';
import { drive } from '@googleapis/drive';
import { getToken } from '../session';
import { refreshAccessToken } from './gmail-auth';
import { DATA_FILE_NAME } from '../utils';

jest.mock('../config', () => ({
  config: {
    encriptionKey: '12345678901234567890123456789012',
  },
}));

jest.mock('@googleapis/drive');
jest.mock('google-auth-library');
jest.mock('../session');

jest.mock('./gmail-auth', () => ({
  refreshAccessToken: jest.fn().mockResolvedValue('refreshed-access-token'),
}));

const mockListFiles = jest.fn();
const mockGetFile = jest.fn();
const mockCreateFile = jest.fn();
const mockUpdateFile = jest.fn();
const mockDeleteFile = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (drive as jest.Mock).mockReturnValue({
    files: {
      list: mockListFiles,
      get: mockGetFile,
      create: mockCreateFile,
      update: mockUpdateFile,
      delete: mockDeleteFile,
    },
  });

  (getToken as jest.Mock).mockResolvedValue('mock-token');
});

describe('GoogleDriveStorage', () => {
  const storage = new GoogleDriveStorage();

  describe('downloadFile', () => {
    it('downloads file successfully', async () => {
      mockListFiles.mockResolvedValue({
        data: {
          files: [{ id: 'file-id', name: DATA_FILE_NAME }],
        },
      });

      const bufferContent = Buffer.from('test-data');

      mockGetFile.mockResolvedValue({
        data: bufferContent,
      });

      const result = await storage.downloadFile();

      expect(result).toEqual(bufferContent);
      expect(mockListFiles).toHaveBeenCalled();
      expect(mockGetFile).toHaveBeenCalledWith(
        { fileId: 'file-id', alt: 'media' },
        { responseType: 'arraybuffer' },
      );
    });
  });

  describe('uploadFile', () => {
    it('creates new file when none exists', async () => {
      mockListFiles.mockResolvedValue({ data: { files: [] } });
      mockCreateFile.mockResolvedValue({ data: { id: 'new-file-id' } });

      const result = await storage.uploadFile('encrypted-content');

      expect(mockCreateFile).toHaveBeenCalled();
      expect(result).toBe('new-file-id');
    });

    it('updates existing file', async () => {
      mockListFiles.mockResolvedValue({
        data: {
          files: [{ id: 'existing-id' }],
        },
      });

      mockUpdateFile.mockResolvedValue({ data: { id: 'updated-id' } });

      const result = await storage.uploadFile('updated-content');

      expect(mockUpdateFile).toHaveBeenCalled();
      expect(result).toBe('updated-id');
    });
  });

  describe('removeFile', () => {
    it('removes file if exists', async () => {
      mockListFiles.mockResolvedValue({
        data: {
          files: [{ id: 'delete-id' }],
        },
      });

      await storage.removeFile();

      expect(mockDeleteFile).toHaveBeenCalledWith({
        fileId: 'delete-id',
        access_token: 'mock-token',
      });
    });

    it('does nothing if no file exists', async () => {
      mockListFiles.mockResolvedValue({ data: { files: [] } });

      await storage.removeFile();

      expect(mockDeleteFile).not.toHaveBeenCalled();
    });
  });

  describe('tryWithRefresh', () => {
    it('retries after 401 and succeeds', async () => {
      const failingFn = jest
        .fn()
        .mockRejectedValueOnce({ response: { status: 401 } })
        .mockResolvedValueOnce('ok');

      (refreshAccessToken as jest.Mock).mockResolvedValue('new-token');

      const result = await (storage as any).tryWithRefresh(failingFn);

      expect(refreshAccessToken).toHaveBeenCalled();
      expect(result).toBe('ok');
    });

    it('throws non-401 error', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect((storage as any).tryWithRefresh(failingFn)).rejects.toThrow(
        'fail',
      );
    });
  });
});
