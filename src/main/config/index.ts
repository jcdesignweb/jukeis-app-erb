export const getConfig = () => {
  return {
    isDev: process.env.NODE_ENV !== 'production',

    /**
     * @TODO
     * ¡¡¡¡this is temporary!!!!!. this must be replaced by the new flow, each user will have their own key
     * this is a shit, I know. but great things require more time.. I am sorry XD
     */
    encriptionKey: 'aBcDeFgHiJKLmNooqZsTuVwXyZ092125',
  };
};

let config: ReturnType<typeof getConfig>;
export const initConfig = () => {
  config = getConfig();
};

export { config };
