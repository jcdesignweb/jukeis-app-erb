// download-upload-drive.spec.ts
import { downloadUserFileFromDrive, uploadToDrive } from './drive-storage';
import { drive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';

jest.mock('@googleapis/drive');
jest.mock('google-auth-library');

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/mocked/user/data/path'),
  },
}));

describe('Google Drive functions', () => {
  let driveMock: any;
  let authClientMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    authClientMock = {
      setCredentials: jest.fn(),
    };
    (OAuth2Client as unknown as jest.Mock).mockImplementation(
      () => authClientMock,
    );

    driveMock = {
      files: {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    (drive as jest.Mock).mockReturnValue(driveMock);
  });

  describe('downloadUserFileFromDrive', () => {
    it('should download and return file content as Buffer when file exists', async () => {
      driveMock.files.list.mockResolvedValue({
        data: {
          files: [{ id: 'fileId123', name: 'myfile.json' }],
        },
      });

      const mockFileData = new ArrayBuffer(8);
      driveMock.files.get.mockResolvedValue({
        data: mockFileData,
      });

      const buffer = await downloadUserFileFromDrive('mockAccessToken');

      expect(OAuth2Client).toHaveBeenCalled();
      expect(authClientMock.setCredentials).toHaveBeenCalledWith({
        access_token: 'mockAccessToken',
      });
      expect(driveMock.files.list).toHaveBeenCalled();
      expect(driveMock.files.get).toHaveBeenCalledWith(
        { fileId: 'fileId123', alt: 'media' },
        { responseType: 'arraybuffer' },
      );
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should do nothing if no files found', async () => {
      driveMock.files.list.mockResolvedValue({
        data: {
          files: [],
        },
      });

      const result = await downloadUserFileFromDrive('mockAccessToken');

      expect(result).toBeUndefined();
      expect(driveMock.files.get).not.toHaveBeenCalled();
    });

    it('should throw error if get fails', async () => {
      driveMock.files.list.mockResolvedValue({
        data: {
          files: [{ id: 'fileId123', name: 'myfile.json' }],
        },
      });

      driveMock.files.get.mockRejectedValue(new Error('Download error'));

      await expect(
        downloadUserFileFromDrive('mockAccessToken'),
      ).rejects.toThrow('Download error');
    });
  });

  describe('uploadToDrive', () => {
    it('should create a new file when no existing file is found', async () => {
      driveMock.files.list.mockResolvedValue({
        data: { files: [] },
      });

      driveMock.files.create.mockResolvedValue({
        data: { id: 'newFileId123' },
      });

      const result = await uploadToDrive('mockAccessToken', 'encrypted-data');

      expect(driveMock.files.list).toHaveBeenCalled();
      expect(driveMock.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          media: expect.any(Object),
          requestBody: expect.objectContaining({
            name: expect.any(String),
            appProperties: { appSpecific: 'true' },
            parents: ['appDataFolder'],
          }),
          access_token: 'mockAccessToken',
        }),
      );
      expect(result).toBe('newFileId123');
    });

    it('should update an existing file when a file is found', async () => {
      driveMock.files.list.mockResolvedValue({
        data: { files: [{ id: 'existingFileId123' }] },
      });

      driveMock.files.update.mockResolvedValue({
        data: { id: 'updatedFileId456' },
      });

      const result = await uploadToDrive('mockAccessToken', 'encrypted-data');

      expect(driveMock.files.list).toHaveBeenCalled();
      expect(driveMock.files.update).toHaveBeenCalledWith(
        expect.objectContaining({
          media: expect.any(Object),
          requestBody: expect.objectContaining({
            name: expect.any(String),
            appProperties: { appSpecific: 'true' },
          }),
          fileId: 'existingFileId123',
          access_token: 'mockAccessToken',
        }),
      );
      expect(result).toBe('updatedFileId456');
    });
  });
});
