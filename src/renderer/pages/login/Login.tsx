import React, { useEffect } from 'react';
import { Button, Col, Row } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import logo from '../../../../assets/logo.png';

const Login: React.FC<{}> = () => {
  const { login } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer.on('login-success', (_event) => {
      login();
      navigate('/home');
    });
  }, []);

  const handleGoogleLogin = () => {
    window.electron.initLogin();
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
