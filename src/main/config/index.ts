import path from 'path';

export function getEnvFilePath(isPackaged: boolean): string {
  return isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.resolve(process.cwd(), '.env');
}

const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ENCRYPTION_KEY',
];

export const verifyEnvVars = () => {
  for (const env of requiredEnvVars) {
    if (process.env[env] === undefined)
      throw new Error(`${env} environment var is missing`);
  }
};

const googleClientId = process.env.GOOGLE_CLIENT_ID!;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI!;
const encriptionKey = process.env.ENCRYPTION_KEY!;

const isDev = process.env.NODE_ENV !== 'production';

const google = {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
};

export default { google, isDev, encriptionKey };
