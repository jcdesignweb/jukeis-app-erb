import React, { useEffect, useState } from 'react';
import { Image, Layout, Menu, Modal } from 'antd';
import { GroupOutlined, HomeOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import iconPath from '../../../assets/icon.png';
import { useAuth } from '../contexts/AuthContext';

import './SideBar.css';
import logoutModal from '../utils/modal-logout';

const { Sider } = Layout;

interface SidebarProps {
  expanded: boolean;
}

enum MenuItem {
  HOME,
  LOG_OUT,
  GROUPS,
  PROFILE,
}

const Sidebar: React.FC<SidebarProps> = ({ expanded }) => {
  const [user, setUser] = useState<{ name: string; picture: string } | null>(
    null,
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const clear = () => setSelectedKeys([]);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [modal, contextHolder] = Modal.useModal();

  const { logout: authLogout } = useAuth();

  const onLogOutConfirm = () => {
    authLogout();
    navigate('/');
  };

  const onMenuItemClick = (item: MenuItem) => {
    switch (item) {
      case MenuItem.GROUPS:
        navigate('/groups');
        break;
      case MenuItem.HOME:
        navigate('/home');
        break;
      case MenuItem.PROFILE:
        clear();
        navigate('/profile');
        break;
      case MenuItem.LOG_OUT:
        logoutModal(modal, onLogOutConfirm);

        break;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const session: { userData: any } =
        await window.electron.ipcRenderer.invoke('get-session');

      setUser({
        name: session.userData?.name || 'Usuario',
        picture: session.userData?.picture || '',
      });
    };

    checkSession();
  }, []);

  return (
    <Sider
      width={expanded ? 200 : 0}
      collapsedWidth={0}
      style={{
        overflowX: 'hidden',
        transition: 'width 0.3s ease-in-out',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      {expanded && (
        <>
          <div
            className="logo"
            style={{
              height: '64px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '16px 0',
              color: 'white',
            }}
          >
            <Image src={iconPath} width={50} preview={false} />
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKeys}
            onClick={({ key }) => setSelectedKeys([key])}
          >
            <Menu.Item
              key={MenuItem.HOME}
              icon={<HomeOutlined />}
              onClick={() => onMenuItemClick(MenuItem.HOME)}
            >
              {t('sidebar.home')}
            </Menu.Item>

            <Menu.Item
              key={MenuItem.GROUPS}
              icon={<GroupOutlined />}
              onClick={() => onMenuItemClick(MenuItem.GROUPS)}
            >
              {t('sidebar.groups')}
            </Menu.Item>

            {contextHolder}

            <Menu.Item
              key={MenuItem.LOG_OUT}
              icon={<LogoutOutlined />}
              onClick={() => onMenuItemClick(MenuItem.LOG_OUT)}
            >
              {t('logout')}
            </Menu.Item>
          </Menu>

          {user && (
            <div
              onClick={() => onMenuItemClick(MenuItem.PROFILE)}
              className="profile-item"
            >
              <Image
                src={user.picture}
                width={32}
                height={32}
                style={{ borderRadius: '50%' }}
                preview={false}
              />
              <div
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </div>
            </div>
          )}
        </>
      )}
    </Sider>
  );
};

export default Sidebar;
