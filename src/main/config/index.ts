const requiredEnvVars = ['ENCRYPTION_KEY'];

const verifyEnvVars = () => {
  for (const env of requiredEnvVars) {
    const value = process.env[env];
    if (!value || value.trim() === '')
      throw new Error(`${env} environment var is missing or empty`);
  }
};

export const getConfig = () => {
  verifyEnvVars();

  return {
    isDev: process.env.NODE_ENV !== 'production',
    encriptionKey: process.env.ENCRYPTION_KEY!,
  };
};

let config: ReturnType<typeof getConfig>;
export const initConfig = () => {
  config = getConfig();
};

export { config };
