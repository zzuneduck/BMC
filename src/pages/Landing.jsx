import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

export default function Landing() {
  const { user, profile, loading, signInWithKakao, signOut, isAdmin } = useAuth()

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.loadingText}>로딩 중...</p>
      </div>
    )
  }

  // Not logged in — show Kakao login
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.title}>🌱 쭌이덕 블로그 챌린지</h1>
          <p style={styles.subtitle}>블로그로 수익을 만드는 21일 챌린지</p>
          <p style={styles.desc}>
            매일 미션을 수행하고, 나무를 키우고,<br />
            블로그 수익화의 첫 걸음을 시작하세요!
          </p>

          <button onClick={signInWithKakao} style={styles.kakaoBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
              <path d="M9 1C4.58 1 1 3.87 1 7.4c0 2.27 1.49 4.26 3.74 5.4l-.96 3.53c-.08.3.26.54.52.37L8.2 13.9c.27.02.53.04.8.04 4.42 0 8-2.87 8-6.4S13.42 1 9 1z" fill="#3C1E1E"/>
            </svg>
            카카오로 시작하기
          </button>
        </div>

        <div style={styles.features}>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📝</span>
            <h3 style={styles.featureTitle}>매일 블로그 챌린지</h3>
            <p style={styles.featureDesc}>21일간 매일 미션을 수행하며 블로그 습관을 만들어요</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🌳</span>
            <h3 style={styles.featureTitle}>나무 키우기</h3>
            <p style={styles.featureDesc}>포스팅할수록 나무가 자라요. 숲을 완성해보세요!</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>💰</span>
            <h3 style={styles.featureTitle}>수익화 노하우</h3>
            <p style={styles.featureDesc}>VOD 강의로 블로그 수익화 방법을 배워요</p>
          </div>
        </div>
      </div>
    )
  }

  // Logged in — show challenge list
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>🌱 쭌이덕 블로그 챌린지</h1>
          <p style={styles.welcome}>
            {profile?.nickname || user.user_metadata?.full_name || '챌린저'}님, 환영해요!
          </p>
        </div>
        <div style={styles.headerActions}>
          {isAdmin && (
            <Link to="/admin" style={styles.adminLink}>관리자</Link>
          )}
          <Link to="/my" style={styles.navLink}>마이페이지</Link>
          <button onClick={signOut} style={styles.logoutBtn}>로그아웃</button>
        </div>
      </header>

      <nav style={styles.nav}>
        <Link to="/vod" style={styles.navPill}>📺 VOD 강의</Link>
        <Link to="/my" style={styles.navPill}>👤 마이페이지</Link>
      </nav>

      {/* Challenge list placeholder */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>진행 중인 챌린지</h2>
        <div style={styles.emptyCard}>
          <span style={{ fontSize: 48 }}>🚀</span>
          <p style={styles.emptyText}>곧 새로운 챌린지가 열립니다!</p>
          <p style={styles.emptySubtext}>챌린지가 시작되면 알림을 보내드릴게요.</p>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>완료된 챌린지</h2>
        <p style={styles.muted}>아직 완료한 챌린지가 없어요.</p>
      </section>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '24px 16px',
    minHeight: '100vh',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  // Hero (logged out)
  hero: {
    textAlign: 'center',
    padding: '60px 0 40px',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  kakaoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 32px',
    backgroundColor: '#FEE500',
    color: '#3C1E1E',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    maxWidth: 320,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 24,
  },
  featureCard: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: 32,
    display: 'block',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#888',
  },
  // Header (logged in)
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#1a1a1a',
  },
  welcome: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  adminLink: {
    fontSize: 12,
    color: '#fff',
    background: '#e53e3e',
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 600,
  },
  navLink: {
    fontSize: 12,
    color: '#555',
  },
  logoutBtn: {
    fontSize: 12,
    color: '#888',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  navPill: {
    fontSize: 13,
    color: '#555',
    background: '#f5f5f5',
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyCard: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: 32,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  muted: {
    fontSize: 13,
    color: '#aaa',
  },
}
