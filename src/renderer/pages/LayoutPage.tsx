import {
  LoadingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Button, Layout, Spin, Tooltip } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/SideBar';
import logo from '../../../assets/logo.png';
import { t } from 'i18next';

function LayoutPage() {
  const [expanded, setExpanded] = useState(false);

  const [isSynchronizing, setIsSynchronizing] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.on(
      'cloud-synchronizing',
      (_event, isLoading: unknown) => {
        setIsSynchronizing(isLoading as boolean);
      },
    );
  }, []);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar expanded={expanded} />
      <Layout
        className="site-layout"
        style={{
          marginLeft: expanded ? 200 : 0,
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Header
          style={{
            backgroundColor: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            icon={expanded ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={toggleExpanded}
            style={{ fontSize: '16px', marginRight: 16 }}
          />

          <img src={logo} alt="Jukeis Logo" className="logo-header" />

          <div style={{ float: 'right' }}>
            {isSynchronizing && (
              <Tooltip placement="left" title={t('synchronizing')}>
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
                />
              </Tooltip>
            )}
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Jukeis ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}

export default LayoutPage;
