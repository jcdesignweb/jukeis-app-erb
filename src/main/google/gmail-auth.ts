import path from 'path';
import express from 'express';
import { BrowserWindow, app } from 'electron';
import { saveToken, saveUserData } from '../session';
import { rootFolder } from '../utils';
import { config } from '../config';

/*
const oathCallbackFile = config.isDev
  ? path.join(rootFolder(), './assets/html/oauth_callback.html')
  : path.join(process.resourcesPath, 'assets/html/oauth_callback.html');
*/

let authWindow: BrowserWindow;

const PORT = 51739;
const vercelAuthUrl = 'https://jukeis-authenticator.vercel.app/api/auth';
export function startGoogleLoginFlow(mainWindow: BrowserWindow) {
  if (mainWindow) {
    console.log('Enviando evento show-loader a mainWindow', mainWindow);
    mainWindow.webContents.send('show-loader', true);
  } else {
    console.log('mainWindow es undefined');
  }

  const expressApp = express();
  const server = expressApp.listen(PORT);

  expressApp.get('/', async (req, res) => {
    const accessToken = req.query.access_token as string;

    console.log('access_token', accessToken);
    await saveToken(accessToken);

    const { userInfo } = await getUserInfo(accessToken);

    console.log('userInfo', userInfo);
    await saveUserData(JSON.stringify(userInfo));

    if (accessToken) {
      // Enviar los datos a la ventana principal
      mainWindow!.webContents.send('login-success', {
        accessToken,
        userData: userInfo,
      });

      authWindow.close();
    }
  });

  authWindow = new BrowserWindow({
    width: 500,
    height: 600,

    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  authWindow.webContents.on('did-finish-load', () => {
    console.log('authWindow terminó de cargar');
    mainWindow.webContents.send('show-loader', false);
    authWindow.show();
  });

  authWindow.on('closed', () => {
    server.close();
  });

  // Redirigir a la página de autenticación de Google a través de Vercel
  authWindow.loadURL(vercelAuthUrl);

  authWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('show-loader', false);
    authWindow.show(); // Mostrar la ventana una vez cargada
  });
}

async function getUserInfo(access_token: string) {
  await saveToken(access_token);

  const userInfoResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  const userInfo = await userInfoResponse.json();

  return {
    userInfo,
    access_token,
  };
}

/*
export function startGoogleLoginFlow2(mainWindow: BrowserWindow) {
  const app = express();
  const server = app.listen(PORT);

  app.get('/', async (req, res) => {
    const code = req.query.code as string;

    res.sendFile(oathCallbackFile);
    const { userInfo, tokens } = await exchangeCodeForToken(code);

    await saveUserData(JSON.stringify(userInfo));

    const fileData = await downloadUserFileFromDrive(tokens.access_token);
    if (fileData) {
      await localStorage.saveFromDrive(fileData);
    }

    setTimeout(() => {
      mainWindow!.webContents.send('login-success', {
        tokens,
        user: userInfo.data,
      });
      authWindow.close();
      server.close();
    }, 500);
  });

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${googleClientId}` +
    `&redirect_uri=http://localhost:${PORT}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile%20https://www.googleapis.com/auth/drive.appdata%20https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/drive.file` +
    `&access_type=offline`;

  authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: true,

    webPreferences: {
      nodeIntegration: false,
    },
  });

  authWindow.on('closed', () => {
    server.close();
  });
  authWindow.loadURL(authUrl);
}
*/

/*
async function exchangeCodeForToken(
  code: string,
): Promise<{ userInfo: any; tokens: any }> {


  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('client_id', googleClientId);
  params.append('client_secret', googleClientSecret);
  params.append('redirect_uri', `http://localhost:${PORT}`);



  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const tokens = await res.json();
  const accessToken = tokens.access_token;
  await saveToken(accessToken);

  const userInfoResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );

  const userInfo = await userInfoResponse.json();

  return {
    userInfo,
    tokens,
  };
}
*/

/*
export const handleAuthorizationCode = async (authorizationCode: string) => {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  params.append('client_id', googleClientId);
  params.append('client_secret', googleClientSecret);
  params.append('redirect_uri', googleRedirectUri);

  try {
    await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (error) {
    console.error('GoogleToken error', error);
  }
};

*/
