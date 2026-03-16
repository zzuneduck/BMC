import { useParams, Link } from 'react-router-dom'

export default function ChallengeDetail() {
  const { id } = useParams()
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/" style={{ fontSize: 13, color: '#888' }}>← 돌아가기</Link>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>챌린지 상세</h1>
      <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>챌린지 #{id} 페이지 준비 중입니다.</p>
    </div>
  )
}
