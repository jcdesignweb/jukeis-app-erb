import React, { useEffect } from 'react';
import { Button, Col, Row } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import logo from '../../../../assets/logo.png';

const googleClientId =
  '523063375722-qae7sbfrl126g498ui9kdg2inprj9558.apps.googleusercontent.com';
const redirectUri = 'http://localhost:51739';
const scope =
  'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
// const scope = 'openid email profile';
const authorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
const responseType = 'code';
const accessType = 'offline';

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  const { login } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer.on('login-success', (_event, data: any) => {
      if (data) {
        login();
        navigate('/home');
      }
    });
  }, []);

  const handleGoogleLogin = () => {
    const authorizationUrl = `${authorizationEndpoint}?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&access_type=${accessType}`;

    window.electron.openExternal(authorizationUrl);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={40} sm={50} md={40} lg={25}>
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: 8,
          }}
        >
          <img src={logo} width={150} />
          <br />
          <br />

          <Button
            type="primary"
            icon={<GoogleOutlined />}
            size="large"
            onClick={handleGoogleLogin}
            style={{ marginTop: 16 }}
          >
            Iniciar sesión con Gmail
          </Button>
        </div>
      </Col>
    </Row>
  );
};

export default Login;
