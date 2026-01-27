import { useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // 관리자 로그인
    if (loginId === 'admin' && password === 'admin1234') {
      setUser({ name: '관리자', role: 'admin' })
      return
    }

    // 수강생 로그인
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('login_id', loginId)
      .eq('password', password)
      .single()

    if (error || !data) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    setUser({ ...data, role: 'student' })
  }

  // 로그인 성공 시
  if (user) {
    return (
      <div className="container">
        <h1>환영합니다, {user.name}님!</h1>
        <p>역할: {user.role === 'admin' ? '관리자' : '수강생'}</p>
        <button onClick={() => setUser(null)}>로그아웃</button>
      </div>
    )
  }

  // 로그인 폼
  return (
    <div className="container">
      <h1>블로그 마스터 클래스</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="아이디"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">로그인</button>
      </form>
    </div>
  )
}

export default App
