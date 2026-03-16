import { useParams, Link } from 'react-router-dom'

export default function ChallengeDone() {
  const { id } = useParams()
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: 64 }}>🎉</span>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 16 }}>챌린지 완주!</h1>
      <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>챌린지 #{id} 완주 페이지 준비 중입니다.</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: 24, padding: '12px 24px', background: '#FEE500', color: '#3C1E1E', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
        홈으로 돌아가기
      </Link>
    </div>
  )
}
