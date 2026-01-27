// src/pages/Student/StudentMenu.jsx
import { Link } from 'react-router-dom';
import { COLORS, STUDENT_MENUS } from '../../utils/constants';

export default function StudentMenu() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>전체 메뉴</h1>

      <div style={styles.menuGrid}>
        {STUDENT_MENUS.map((menu) => (
          <Link key={menu.id} to={menu.path} style={styles.menuItem}>
            <span style={styles.menuIcon}>{menu.icon}</span>
            <span style={styles.menuName}>{menu.name}</span>
          </Link>
        ))}
      </div>

      {/* 추가 링크들 */}
      <div style={styles.extraSection}>
        <h2 style={styles.sectionTitle}>고객 지원</h2>
        <div style={styles.extraLinks}>
          <Link to="/student/consultation" style={styles.extraLink}>
            <span>1:1 상담 신청</span>
            <span style={styles.arrow}>→</span>
          </Link>
          <a href="tel:010-0000-0000" style={styles.extraLink}>
            <span>전화 문의</span>
            <span style={styles.arrow}>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 16px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 24px 0',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 8px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    textDecoration: 'none',
  },
  menuIcon: {
    fontSize: '32px',
  },
  menuName: {
    color: COLORS.text,
    fontSize: '13px',
  },
  extraSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 12px 0',
  },
  extraLinks: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  extraLink: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    color: COLORS.text,
    textDecoration: 'none',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  arrow: {
    color: COLORS.textMuted,
  },
};
