export const config = {
  isDev: process.env.NODE_ENV !== 'production',
  appTitle: process.env.NODE_ENV !== 'production' ? 'Jukeis-Dev' : 'Jukeis',

  /**
   * @TODO
   * ¡¡¡¡this is temporary!!!!!. this must be replaced by the new flow, each user will have their own key
   * this is a shit, I know. but great things require more time.. I am sorry XD
   */
  encriptionKey: 'aBcDeFgHiJKLmNooqZsTuVwXyZ092125',
};
