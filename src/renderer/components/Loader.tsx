// components/Loader.tsx
import React, { useContext, useState, useEffect, ReactNode } from 'react';
import { Spin } from 'antd';
import { SpinProps } from 'antd/es/spin';

// Crea un contexto para manejar el estado del loader
const LoaderContext = React.createContext<any>(null);

export const useLoader = () => {
  return useContext(LoaderContext);
};

// Componente que muestra el loader globalmente
const Loader: React.FC<SpinProps> = ({
  tip = 'Cargando...',
  size = 'large',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showLoader = () => setVisible(true);
    const hideLoader = () => setVisible(false);

    // Escuchar eventos de mostrar y ocultar el loader
    window.electron.ipcRenderer.on('show-loader', (_, show) => {
      if (show) {
        showLoader();
      } else {
        hideLoader();
      }
    });

    return () => {
      // Limpiar el event listener cuando el componente se desmonte
      window.electron.ipcRenderer.removeAllListeners('show-loader');
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="loader-overlay">
      <Spin tip={tip} size={size} />
    </div>
  );
};

export const LoaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <LoaderContext.Provider value={{}}>
      <Loader />
      {children}
    </LoaderContext.Provider>
  );
};
