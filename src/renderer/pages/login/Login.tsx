import React, { useEffect } from 'react';
import { Button, Col, Row } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import logo from '../../../../assets/logo.png';
import { t } from 'i18next';
import './Login.css';
import { LoginWithPassword } from './components/LoginWithPassword';
import { CreatePassword } from './components/CreatePassword';
import { GoogleSession } from '../../../main/services/session.service';
import { Channels } from '../../../main/ipc/channels';

const Login: React.FC<{}> = () => {
  const [flipped, setFlipped] = React.useState(false);

  const [isRegistered, setIsRegistered] = React.useState(false);

  const flipCardInnerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '300px',
    textAlign: 'center',
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d',
    transform: flipped ? 'rotateY(180deg)' : 'none',
  };

  const flipCardFaceStyle: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    padding: 24,
    background: '#fff',
  };

  const flipCardBackStyle: React.CSSProperties = {
    ...flipCardFaceStyle,
    transform: 'rotateY(180deg)',
  };

  const { setAuthenticated } = useAuth();

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer.on(Channels.LOGIN_SUCCESS, (_event, data) => {
      const { isRegistered } = data as {
        userSessionData: GoogleSession;
        isRegistered: boolean;
      };

      setIsRegistered(isRegistered);

      setFlipped(true);
    });
  }, []);

  const handleGoogleLogin = () => {
    window.electron.initLogin();
  };

  function callback(status: boolean) {
    if (status) {
      setAuthenticated();
      navigate('/home');
    }
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={40} sm={50} md={40} lg={25}>
        <div id="flipCard">
          <div style={flipCardInnerStyle}>
            <div style={{ ...flipCardFaceStyle, position: 'absolute' }}>
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
                {t('login.initWithGmail')}
              </Button>
              <br />
            </div>

            <div style={flipCardBackStyle}>
              <h3>
                {isRegistered
                  ? t('login.titleForLogin')
                  : t('login.titleForRegister')}
              </h3>

              {isRegistered && <LoginWithPassword callback={callback} />}

              {!isRegistered && <CreatePassword callback={callback} />}

              <br />
              <Button
                type="link"
                onClick={toggleFlip}
                style={{ marginTop: 12 }}
              >
                Volver
              </Button>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default Login;
