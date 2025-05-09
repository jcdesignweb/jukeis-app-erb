import * as getUserInfoModule from './gmail-auth';
import request from 'supertest';
import { getUserInfo, waitForOAuthResponse } from './gmail-auth';
import * as session from '../session';

jest.mock('../config', () => ({
  config: {
    encriptionKey: '12345678901234567890123456789012',
  },
}));

jest.mock('../session');
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    webContents: {
      on: jest.fn(),
      send: jest.fn(),
    },
    loadURL: jest.fn(),
    show: jest.fn(),
    on: jest.fn(),
  })),
}));

global.fetch = jest.fn();

describe('getUserInfo', () => {
  it('should fetch and return user info and access token', async () => {
    const mockAccessToken = 'mock_access_token';
    const mockUserInfo = {
      name: 'John Doe',
      picture: 'http://example.com/pic.jpg',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockUserInfo),
    });

    const result = await getUserInfo(mockAccessToken);

    expect(result).toEqual(mockUserInfo);
  });
});

describe('waitForOAuthResponse', () => {
  const mockUserInfo = { name: 'Test User', picture: 'img' };

  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockUserInfo),
    });
  });

  it.skip('should respond and store tokens', async () => {
    // Simula la respuesta del servidor con una Promise
    const mockServerResponse = {
      access_token: 'abc123',
      refresh_token: 'ref123',
    };

    // Espera que waitForOAuthResponse se resuelva correctamente
    const serverResponse = await waitForOAuthResponse();

    // Simula la respuesta de la solicitud HTTP
    const res = await request(`http://localhost:51739`).get(
      '/?access_token=abc123&refresh_token=ref123',
    );

    // Verifica que la respuesta fue exitosa
    expect(res.status).toBe(200);

    // Verifica que las funciones de sesión se llamaron correctamente
    expect(session.saveToken).toHaveBeenCalledWith('abc123');
    expect(session.saveRefreshToken).toHaveBeenCalledWith('ref123');
    expect(session.saveUserData).toHaveBeenCalledWith(
      JSON.stringify(mockUserInfo),
    );

    // Aquí ya no es necesario cerrar nada
    // Si necesitas hacer algo con el "servidor", solo asegúrate de manejar la simulación correctamente
  });
});
