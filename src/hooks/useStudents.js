import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 전체 수강생 목록 조회
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setStudents(data || [])
      return { success: true, data: data || [] }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // 특정 수강생 조회
  const getStudent = useCallback(async (id) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 수강생 등록
  const createStudent = useCallback(async (studentData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single()

      if (insertError) throw insertError

      // 목록 갱신
      setStudents(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 수강생 수정
  const updateStudent = useCallback(async (id, updateData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // 목록 갱신
      setStudents(prev =>
        prev.map(s => s.id === id ? data : s)
      )
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 수강생 삭제
  const deleteStudent = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // 목록에서 제거
      setStudents(prev => prev.filter(s => s.id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 이름+전화번호로 비밀번호 찾기
  const findPassword = useCallback(async (name, phone) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('name, password')
        .eq('name', name)
        .eq('phone', phone)
        .single()

      if (fetchError || !data) {
        return { success: false, error: '일치하는 정보를 찾을 수 없습니다.' }
      }

      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 이름 중복 확인
  const checkNameExists = useCallback(async (name) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('name', name)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // 결과 없음 = 사용 가능
        return { success: true, exists: false }
      }

      return { success: true, exists: !!data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  return {
    students,
    loading,
    error,
    fetchStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    findPassword,
    checkNameExists
  }
}
