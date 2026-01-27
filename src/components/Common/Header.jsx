import React from 'react';

const Header = ({ userName, userRole, onLogout }) => {
  const isAdmin = userRole === 'admin';

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <span style={styles.logo}>BMC</span>
        <span style={styles.title}>블로그 마스터 클래스</span>
      </div>
      <div style={styles.rightSection}>
        <span style={styles.userName}>{userName}</span>
        <span style={{
          ...styles.badge,
          backgroundColor: isAdmin ? '#ffc500' : '#2a2a2a',
          color: isAdmin ? '#000' : '#fff',
        }}>
          {isAdmin ? '관리자' : '수강생'}
        </span>
        <button style={styles.logoutButton} onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#000',
    borderBottom: '1px solid #2a2a2a',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffc500',
  },
  title: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: '500',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    color: '#fff',
    fontSize: '14px',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#999',
    border: '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
};

export default Header;
