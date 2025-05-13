import { Button, Image, Modal } from 'antd';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoutModal from '../../utils/modal-logout';

import './ProfilePage.css';
import { UserInfo } from '../../../main/google/gmail-auth';
import {
  DeleteColumnOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Channel } from 'diagnostics_channel';
import { Channels } from '../../../main/ipc/channels';

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
        await window.electron.ipcRenderer.invoke(Channels.GET_SESSION);

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

  const sync = () => {
    //window.electron.ipcRenderer.sendMessage('cloud-sync');
  };

  const onEraseClick = () => {
    modal.confirm({
      title: 'Blanquear Contraseña',
      icon: <ExclamationCircleOutlined />,
      content: t('modal.delete-item.message'),
      okText: t('ok'),
      onOk: async () => {
        window.electron.ipcRenderer.sendMessage(Channels.ERASE_MASTER_PASSWORD);

        logout();
        navigate('/');
      },
      cancelText: t('cancel'),
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

          <br />
          {
            <Button
              color="blue"
              variant="solid"
              icon={<DeleteOutlined />}
              onClick={onEraseClick}
              id="erasePasswordBtn"
            >
              {t('profile.erase-password')}
            </Button>
          }

          <br />
          <Button icon={<SyncOutlined />} variant="solid" onClick={sync}>
            {t('sync')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
