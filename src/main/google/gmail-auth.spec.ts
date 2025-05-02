import { startGoogleLoginFlow } from './gmail-auth';

jest.mock('electron', () => {
  const mockWebContents = {
    send: jest.fn(),
    on: jest.fn(),
  };

  const mockAuthWindow = {
    loadURL: jest.fn(),
    show: jest.fn(),
    on: jest.fn(),
    webContents: mockWebContents,
  };

  return {
    BrowserWindow: jest.fn(() => mockAuthWindow),
    ipcMain: { on: jest.fn() },
    app: { whenReady: () => Promise.resolve() },
  };
});

jest.mock('../session', () => ({
  saveToken: jest.fn(),
  saveUserData: jest.fn(),
}));

global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({ id: '123', name: 'Test User' }),
}) as any;

describe('startGoogleLoginFlow', () => {
  let mockMainWindow: any;

  beforeEach(() => {
    mockMainWindow = {
      webContents: {
        send: jest.fn(),
      },
    };

    jest.clearAllMocks();
  });

  it('should sends show-loader to the mainWindow', () => {
    startGoogleLoginFlow(mockMainWindow, () => {});
    expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
      'show-loader',
      true,
    );
  });
});
