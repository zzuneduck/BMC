import React from 'react';

const navItems = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'mission', label: '미션', icon: '🎯' },
  { id: 'vod', label: 'VOD', icon: '🎬' },
  { id: 'ranking', label: '랭킹', icon: '🏆' },
  { id: 'schedule', label: '일정', icon: '📅' },
  { id: 'consultation', label: '상담', icon: '💬' },
  { id: 'qna', label: 'Q&A', icon: '❓' },
  { id: 'revenue', label: '수익인증', icon: '💰' },
  { id: 'blog', label: '블로그', icon: '📝' },
];

const NavBar = ({ currentPage, onNavigate }) => {
  return (
    <nav style={styles.nav}>
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
  },
  scrollContainer: {
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    minWidth: '70px',
    transition: 'all 0.2s',
  },
  icon: {
    fontSize: '20px',
    marginBottom: '4px',
  },
  label: {
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
};

export default NavBar;
