import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './AppRouter';

import './styles/App.global.css';
import { KeysProvider } from './contexts/DataContext';

export const App: React.FC<{}> = ({}) => {
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoadingSession(false);
    };

    checkSession();
  }, []);

  if (loadingSession) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthProvider>
      <KeysProvider>
        <AppRouter />
      </KeysProvider>
    </AuthProvider>
  );
};

export default App;
