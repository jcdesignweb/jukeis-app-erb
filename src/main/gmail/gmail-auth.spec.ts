jest.mock('express', () => {
  const appMock = {
    get: jest.fn(),
    listen: jest.fn().mockReturnValue({
      close: jest.fn(),
    }),
  };

  const expressMock = jest.fn(() => appMock);
  return expressMock;
});
import { handleAuthorizationCode, startGoogleLoginFlow } from './gmail-auth';
import { BrowserWindow } from 'electron';

jest.mock('../config');
jest.mock('../session');
jest.mock('./drive-storage');
jest.mock('../data/storage', () => ({
  localStorage: {
    saveFromDrive: jest.fn(),
  },
}));

jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    webContents: {
      send: jest.fn(),
    },
    close: jest.fn(),
  })),
}));

global.fetch = jest.fn();

import express from 'express';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

describe('google-login-flow', () => {
  let appMock: any;
  let serverMock: any;
  let authWindowMock: any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    appMock = (express as any)();
    serverMock = appMock.listen();

    authWindowMock = {
      loadURL: jest.fn(),
      close: jest.fn(),
    };

    (BrowserWindow as any) = jest.fn(() => authWindowMock);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start the login flow and handle success', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
    } as any;

    const fakeTokens = { access_token: 'fake-token' };
    const fakeUserInfo = { id: 'user123', email: 'test@example.com' };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ fakeTokens, fakeUserInfo }),
    });

    startGoogleLoginFlow(mainWindow);
    expect(appMock.get).toHaveBeenCalledWith('/', expect.any(Function));

    const routeHandler = appMock.get.mock.calls[0][1];

    const req = { query: { code: 'fake-code' } };
    const res = { sendFile: jest.fn() };

    await routeHandler(req, res);

    jest.runAllTimers();

    expect(res.sendFile).toHaveBeenCalled();

    expect(authWindowMock.close).toHaveBeenCalled();
    expect(serverMock.close).toHaveBeenCalled();
  });
});

describe('handleAuthorizationCode', () => {
  const authorizationCode = 'fake-authorization-code';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make a POST request to the token endpoint with the correct parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ access_token: 'fake-token' }),
    });

    await handleAuthorizationCode(authorizationCode);

    expect(fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.stringContaining('grant_type=authorization_code'),
      }),
    );
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await handleAuthorizationCode(authorizationCode);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'GoogleToken error',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should call fetch with the correct parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ access_token: 'fake-token' }),
    });

    const authorizationCode = 'fake-authorization-code';

    await handleAuthorizationCode(authorizationCode);

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authorizationCode);
    params.append('client_id', expect.any(String));
    params.append('client_secret', expect.any(String));
    params.append('redirect_uri', expect.any(String));

    expect(fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.stringContaining('grant_type=authorization_code'),
      }),
    );
  });
});
