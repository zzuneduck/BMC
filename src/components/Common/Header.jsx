import React from 'react';

const Header = ({ userName, userRole, onLogout, onProfile }) => {
  const isAdmin = userRole === 'admin';

  return (
    <header style={styles.header}>
      {/* 좌측: 로고 */}
      <div style={styles.leftSection}>
        <span style={styles.logo}>BMC</span>
      </div>

      {/* 중앙: 사용자 이름 */}
      <div style={styles.centerSection}>
        <span style={styles.userName}>{userName}</span>
        <span style={{
          ...styles.badge,
          backgroundColor: isAdmin ? '#ffc500' : '#2a2a2a',
          color: isAdmin ? '#000' : '#fff',
        }}>
          {isAdmin ? '관리자' : '수강생'}
        </span>
      </div>

      {/* 우측: 로그아웃 */}
      <div style={styles.rightSection}>
        <button style={styles.logoutButton} onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#000',
    borderBottom: '1px solid #2a2a2a',
    minHeight: '56px',
  },
  leftSection: {
    position: 'absolute',
    left: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffc500',
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userName: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  rightSection: {
    position: 'absolute',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
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
