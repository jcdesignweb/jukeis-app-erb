const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ENCRYPTION_KEY',
];

const verifyEnvVars = () => {
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

export const getConfig = () => {
  verifyEnvVars();

  return {
    google: {
      googleClientId: process.env.GOOGLE_CLIENT_ID!,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
    },
    isDev: process.env.NODE_ENV !== 'production',
    encriptionKey: process.env.ENCRYPTION_KEY!,
  };
};

let config: ReturnType<typeof getConfig>;
export const initConfig = () => {
  config = getConfig();
};

export { config };
