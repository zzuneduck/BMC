import React from 'react';

const adminNavItems = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'students', label: '수강생' },
  { id: 'register', label: '등록' },
  { id: 'attendance', label: '출석' },
  { id: 'teams', label: '조편성' },
  { id: 'mission', label: '미션현황' },
  { id: 'mission-manage', label: '미션관리' },
  { id: 'vod', label: 'VOD' },
  { id: 'notice', label: '공지' },
  { id: 'qna', label: 'Q&A' },
  { id: 'consulting', label: '상담' },
  { id: 'revenue', label: '수익인증' },
  { id: 'slots', label: '상담슬롯' },
  { id: 'schedule', label: '일정' },
  { id: 'resources', label: '자료실' },
  { id: 'points', label: '포인트' },
  { id: 'ranking', label: '랭킹' },
  { id: 'forest', label: '숲' },
  { id: 'instructor', label: '강사' },
  { id: 'simulation', label: '시뮬' },
];

const AdminNavBar = ({ currentPage, onNavigate }) => {
  return (
    <nav style={styles.nav}>
      <div style={styles.tabContainer}>
        {adminNavItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              style={{
                ...styles.tab,
                color: isActive ? '#ffc500' : '#999',
                borderBottom: isActive ? '2px solid #ffc500' : '2px solid transparent',
              }}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  tabContainer: {
    display: 'flex',
    minWidth: 'max-content',
  },
  tab: {
    padding: '14px 18px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
};

export default AdminNavBar;
