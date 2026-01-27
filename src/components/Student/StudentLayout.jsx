// src/components/Student/StudentLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { COLORS, STUDENT_MENUS } from '../../utils/constants';
import { storage } from '../../utils/helpers';

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = storage.get('bmc_user');
    if (!savedUser || savedUser.type !== 'student') {
      navigate('/login');
      return;
    }
    setUser(savedUser);
  }, [navigate]);

  const handleLogout = () => {
    storage.remove('bmc_user');
    navigate('/login');
  };

  if (!user) return null;

  // 현재 활성 메뉴 확인
  const currentPath = location.pathname;
  const isActive = (path) => {
    if (path === '/student') {
      return currentPath === '/student';
    }
    return currentPath.startsWith(path);
  };

  // 하단 네비게이션에 표시할 메뉴 (5개)
  const bottomMenus = STUDENT_MENUS.filter(m =>
    ['home', 'mission', 'vod', 'blog', 'qna'].includes(m.id)
  );

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>BMC</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user.name}님</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            로그아웃
          </button>
        </div>
      </header>

      {/* 컨텐츠 영역 */}
      <main style={styles.main}>
        <Outlet context={{ user, setUser }} />
      </main>

      {/* 하단 네비게이션 */}
      <nav style={styles.bottomNav}>
        {bottomMenus.map((menu) => (
          <Link
            key={menu.id}
            to={menu.path}
            style={{
              ...styles.navItem,
              color: isActive(menu.path) ? COLORS.primary : COLORS.textMuted,
            }}
          >
            <span style={styles.navIcon}>{menu.icon}</span>
            <span style={styles.navLabel}>{menu.name}</span>
          </Link>
        ))}
        <Link
          to="/student/menu"
          style={{
            ...styles.navItem,
            color: isActive('/student/menu') ? COLORS.primary : COLORS.textMuted,
          }}
        >
          <span style={styles.navIcon}>☰</span>
          <span style={styles.navLabel}>더보기</span>
        </Link>
      </nav>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '6px 10px',
    borderRadius: '4px',
    letterSpacing: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    color: COLORS.text,
    fontSize: '14px',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: COLORS.textMuted,
    border: `1px solid ${COLORS.surfaceLight}`,
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    paddingBottom: '70px', // 하단 네비게이션 높이
    overflowY: 'auto',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderTop: `1px solid ${COLORS.surfaceLight}`,
    padding: '8px 0',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    padding: '4px 12px',
    gap: '4px',
  },
  navIcon: {
    fontSize: '20px',
  },
  navLabel: {
    fontSize: '11px',
  },
};
