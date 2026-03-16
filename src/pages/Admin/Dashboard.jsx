import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/" style={{ fontSize: 13, color: '#888' }}>← 홈</Link>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>📊 관리자 대시보드</h1>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <Link to="/admin/challenges" style={cardStyle}>🏆 챌린지 관리</Link>
        <Link to="/admin/vod" style={cardStyle}>📺 VOD 관리</Link>
      </div>

      <p style={{ color: '#aaa', fontSize: 13, marginTop: 24 }}>관리자 대시보드 준비 중입니다.</p>
    </div>
  )
}

const cardStyle = {
  flex: '1 1 140px',
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 12,
  padding: 20,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 600,
  color: '#333',
}
