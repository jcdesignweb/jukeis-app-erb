import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import logo from '../../../../assets/logo.png';
import Login from './Login';
import { useAuth } from '../../contexts/AuthContext';

import './SplashScreen.css';

interface SplashScreenProps {}

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/home');
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('show-loader', (event, show) => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setShowLogin(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Row justify="center" align="middle" className="splash-container">
        <Col>
          <div className="logo-animation-container">
            <div className="logo-background-oval">
              {' '}
              <img src={logo} alt="Jukeis Logo" className="logo-splash" />
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  if (showLogin) {
    return (
      <Row justify="center" align="middle" className="splash-container">
        <Col xs={60} sm={16} md={12} lg={8}>
          <Login />
        </Col>
      </Row>
    );
  }

  return null;
};

export default SplashScreen;
