import React, { useContext, useState, useEffect, ReactNode } from 'react';
import { Spin } from 'antd';
import { SpinProps } from 'antd/es/spin';
import { LoadingOutlined } from '@ant-design/icons';

const LoaderContext = React.createContext<any>(null);

export const useLoader = () => {
  return useContext(LoaderContext);
};

const Loader: React.FC<SpinProps> = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showLoader = () => setVisible(true);
    const hideLoader = () => setVisible(false);

    window.electron.ipcRenderer.on('show-loader', (_, show) => {
      if (show) {
        showLoader();
      } else {
        hideLoader();
      }
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('show-loader');
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="loader-overlay">
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        fullscreen
      />
    </div>
  );
};

export const LoaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <LoaderContext.Provider value={{}}>
      <Loader className="white-spinner" />
      {children}
    </LoaderContext.Provider>
  );
};
