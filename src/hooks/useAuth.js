import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

const STORAGE_KEY = 'bmc_user'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 초기 로드: localStorage에서 사용자 정보 복원
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  // 로그인
  const login = useCallback(async (name, password) => {
    try {
      // 관리자 계정 확인
      if (name === 'admin' && password === 'admin1234') {
        const adminUser = {
          id: 'admin',
          name: 'admin',
          isAdmin: true
        }
        setUser(adminUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser))
        return { success: true, user: adminUser }
      }

      // 일반 수강생 확인
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('name', name)
        .eq('password', password)
        .single()

      if (error || !data) {
        return {
          success: false,
          error: '이름 또는 비밀번호가 올바르지 않습니다.'
        }
      }

      const studentUser = {
        id: data.id,
        name: data.name,
        team: data.team,
        isAdmin: false
      }
      setUser(studentUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studentUser))
      return { success: true, user: studentUser }

    } catch (err) {
      return {
        success: false,
        error: '로그인 중 오류가 발생했습니다.'
      }
    }
  }, [])

  // 로그아웃
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // 관리자 여부 계산
  const isAdmin = user?.isAdmin === true

  return {
    user,
    loading,
    login,
    logout,
    isAdmin
  }
}
