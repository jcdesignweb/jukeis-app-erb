import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import SplashScreen from './pages/login/SplashScreen';
import HomeScreen from './pages/home/HomePage';
import GroupPage from './pages/groups/GroupPage';
import LayoutPage from './pages/LayoutPage';
import ProfileScreen from './pages/profile/ProfilePage';
import HomePage from './pages/home/HomePage';
import ProfilePage from './pages/profile/ProfilePage';
import { LoaderProvider } from './components/Loader';

function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <HashRouter>
      <LoaderProvider>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/splash" />} />
            <Route path="/splash" element={<SplashScreen />} />

            <Route path="/" element={<LayoutPage />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/groups"
                element={
                  isAuthenticated ? <GroupPage /> : <Navigate to="/splash" />
                }
              />
            </Route>
          </Routes>
        </div>
      </LoaderProvider>
    </HashRouter>
  );
}

export default AppRouter;
