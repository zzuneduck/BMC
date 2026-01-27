import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header, NavBar, Loading } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../utils/constants';

const StudentLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();

  // 현재 페이지 ID 추출
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/student' || path === '/student/') return 'home';
    const match = path.match(/\/student\/(\w+)/);
    return match ? match[1] : 'home';
  };

  const handleNavigate = (pageId) => {
    if (pageId === 'home') {
      navigate('/student');
    } else {
      navigate(`/student/${pageId}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loading size={50} />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div style={styles.container}>
      <Header
        userName={user.name}
        userRole="student"
        onLogout={handleLogout}
      />
      <main style={styles.main}>
        {children}
      </main>
      <NavBar
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  main: {
    paddingBottom: '70px',
    width: '100%',
    boxSizing: 'border-box',
  },
};

export default StudentLayout;
