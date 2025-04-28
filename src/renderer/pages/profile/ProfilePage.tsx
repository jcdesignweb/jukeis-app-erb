import { Button, Image, Modal } from 'antd';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoutModal from '../../utils/modal-logout';

import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; picture: string } | null>(
    null,
  );

  const navigate = useNavigate();

  const { logout } = useAuth();

  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    const checkSession = async () => {
      const session: { userData: any } =
        await window.electron.ipcRenderer.invoke('get-session');

      setUser({
        name: session.userData?.name || 'Usuario',
        picture: session.userData?.picture || '', // URL de Google
      });
    };

    checkSession();
  }, []);

  const onLogOutClick = () => {
    logoutModal(modal, () => {
      logout();
      navigate('/');
    });
  };

  return (
    <div id="profile-page">
      <h1>{t('profile.title')}</h1>

      {user && (
        <div id="wrap">
          <Image
            src={user.picture}
            width={140}
            height={140}
            style={{ borderRadius: '50%' }}
            preview={false}
          />

          {contextHolder}
          <Button
            color="danger"
            variant="solid"
            onClick={onLogOutClick}
            id="logoutBtn"
          >
            {t('logout')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
