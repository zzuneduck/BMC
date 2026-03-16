import { Link } from 'react-router-dom'

export default function AdminVods() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/admin" style={{ fontSize: 13, color: '#888' }}>← 대시보드</Link>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>📺 VOD 관리</h1>
      <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>VOD 관리 페이지 준비 중입니다.</p>
    </div>
  )
}
