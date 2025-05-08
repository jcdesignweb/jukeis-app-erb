import { Button, Image, Modal } from 'antd';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoutModal from '../../utils/modal-logout';

import './ProfilePage.css';
import { UserInfo } from '../../../main/google/gmail-auth';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; picture: string } | null>(
    null,
  );

  const navigate = useNavigate();

  const { logout } = useAuth();

  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    const checkSession = async () => {
      const session: { token: string; userData: UserInfo } =
        await window.electron.ipcRenderer.invoke('get-session');

      if (!session.userData) {
        throw new Error('user must log in');
      }

      setUser({
        name: session.userData.name,
        picture: session.userData.picture, // URL de Google
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

  const onEraseClick = () => {
    window.electron.ipcRenderer.sendMessage('erase-data');
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

          <Button
            color="danger"
            variant="solid"
            onClick={onEraseClick}
            id="logoutBtn"
          >
            {t('profile.erase')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
