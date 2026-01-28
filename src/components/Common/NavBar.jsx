import React from 'react';

const navItems = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'notice', label: '공지', icon: '📢' },
  { id: 'mission', label: '미션', icon: '🎯' },
  { id: 'vod', label: 'VOD', icon: '🎬' },
  { id: 'blog', label: '블로그', icon: '📝' },
  { id: 'ranking', label: '랭킹', icon: '🏆' },
  { id: 'attendance', label: '출석', icon: '✅' },
  { id: 'schedule', label: '일정', icon: '📅' },
  { id: 'instructor', label: '강사', icon: '👨‍🏫' },
  { id: 'resources', label: '자료실', icon: '📁' },
  { id: 'consultation', label: '상담', icon: '🗓️' },
  { id: 'qna', label: 'Q&A', icon: '💬' },
  { id: 'revenue', label: '수익', icon: '💰' },
];

const NavBar = ({ currentPage, onNavigate }) => {
  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        <div style={styles.scrollContainer}>
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                style={{
                  ...styles.navItem,
                  color: isActive ? '#ffc500' : '#999',
                  borderTop: isActive ? '2px solid #ffc500' : '2px solid transparent',
                }}
                onClick={() => onNavigate(item.id)}
              >
                <span style={styles.icon}>{item.icon}</span>
                <span style={styles.label}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #2a2a2a',
    zIndex: 100,
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
  },
  navInner: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  scrollContainer: {
    display: 'flex',
    gap: '2px',
    padding: '0 4px',
    minWidth: 'max-content',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    minWidth: '40px',
    flex: '0 0 auto',
    transition: 'all 0.2s',
  },
  icon: {
    fontSize: '18px',
    marginBottom: '2px',
  },
  label: {
    fontSize: '9px',
    whiteSpace: 'nowrap',
  },
};

export default NavBar;
