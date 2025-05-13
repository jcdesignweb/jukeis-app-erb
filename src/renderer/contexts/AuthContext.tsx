import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  setAuthenticated: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuthenticated = () => setIsAuthenticated(true);
  const logout = () => {
    setIsAuthenticated(false);
    window.electron.ipcRenderer.sendMessage('log-out');
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await window.electron.ipcRenderer.invoke('get-session');
        const authenticated = session !== null;
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error(error);
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
