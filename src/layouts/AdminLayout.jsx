import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header, AdminNavBar, Loading } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../utils/constants';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout, isAdmin } = useAuth();

  // 현재 페이지 ID 추출
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    const match = path.match(/\/admin\/(\w+)/);
    return match ? match[1] : 'dashboard';
  };

  const handleNavigate = (pageId) => {
    if (pageId === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${pageId}`);
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

  if (!user || !isAdmin) {
    navigate('/login');
    return null;
  }

  return (
    <div style={styles.container}>
      <Header
        userName={user.name}
        userRole="admin"
        onLogout={handleLogout}
      />
      <AdminNavBar
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
      />
      <main style={styles.main}>
        {children}
      </main>
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
    minHeight: 'calc(100vh - 110px)',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    width: '100%',
    boxSizing: 'border-box',
  },
};

export default AdminLayout;
