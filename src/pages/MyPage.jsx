import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function MyPage() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div style={{ padding: 24, color: '#888' }}>로딩 중...</div>
  if (!user) return <div style={{ padding: 24 }}>로그인이 필요합니다. <Link to="/">로그인</Link></div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/" style={{ fontSize: 13, color: '#888' }}>← 홈</Link>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>마이페이지</h1>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20, marginTop: 16 }}>
        {profile?.avatar_url && (
          <img src={profile.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 12 }} />
        )}
        <p style={{ fontSize: 16, fontWeight: 700 }}>{profile?.nickname || user.user_metadata?.full_name || '챌린저'}</p>
        <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{user.email || '카카오 로그인'}</p>
        {profile?.blog_url && (
          <p style={{ fontSize: 13, color: '#3182ce', marginTop: 4 }}>{profile.blog_url}</p>
        )}
      </div>

      <p style={{ fontSize: 13, color: '#aaa', marginTop: 24 }}>상세 마이페이지는 준비 중입니다.</p>
    </div>
  )
}
