// src/pages/Student/StudentPlaceholder.jsx
// 아직 구현되지 않은 페이지들의 placeholder
import { useLocation } from 'react-router-dom';
import { COLORS, STUDENT_MENUS } from '../../utils/constants';

export default function StudentPlaceholder() {
  const location = useLocation();

  // 현재 경로에 해당하는 메뉴 찾기
  const currentMenu = STUDENT_MENUS.find(m => m.path === location.pathname) || {
    name: '페이지',
    icon: '📄',
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <span style={styles.icon}>{currentMenu.icon}</span>
        <h1 style={styles.title}>{currentMenu.name}</h1>
        <p style={styles.message}>준비 중입니다</p>
        <p style={styles.subMessage}>빠른 시일 내에 오픈 예정입니다!</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 140px)',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
  },
  message: {
    color: COLORS.primary,
    fontSize: '18px',
    margin: '0 0 8px 0',
  },
  subMessage: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
};
