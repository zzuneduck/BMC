import { useCallback } from 'react'
import { supabase } from '../supabase'

export function usePoints() {
  // 포인트 추가 (RPC 호출)
  const addPoints = useCallback(async (studentId, points, reason, type) => {
    try {
      const { data, error } = await supabase.rpc('add_points', {
        p_student_id: studentId,
        p_points: points,
        p_reason: reason,
        p_type: type
      })

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 포인트 내역 조회
  const getPointsLog = useCallback(async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('points_log')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 개인 랭킹 조회
  const getIndividualRanking = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, team, total_points')
        .order('total_points', { ascending: false })

      if (error) throw error

      // 순위 부여
      const ranked = (data || []).map((student, index) => ({
        ...student,
        rank: index + 1
      }))

      return { success: true, data: ranked }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 조별 랭킹 조회
  const getTeamRanking = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('team, total_points')

      if (error) throw error

      // 조별 합산
      const teamTotals = (data || []).reduce((acc, student) => {
        if (student.team) {
          acc[student.team] = (acc[student.team] || 0) + (student.total_points || 0)
        }
        return acc
      }, {})

      // 배열로 변환 및 정렬
      const ranked = Object.entries(teamTotals)
        .map(([team, totalPoints]) => ({ team, totalPoints }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((item, index) => ({ ...item, rank: index + 1 }))

      return { success: true, data: ranked }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 내 순위 조회
  const getMyRank = useCallback(async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, total_points')
        .order('total_points', { ascending: false })

      if (error) throw error

      const index = (data || []).findIndex(s => s.id === studentId)

      if (index === -1) {
        return { success: false, error: '수강생을 찾을 수 없습니다.' }
      }

      return {
        success: true,
        data: {
          rank: index + 1,
          totalStudents: data.length,
          myPoints: data[index].total_points
        }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  return {
    addPoints,
    getPointsLog,
    getIndividualRanking,
    getTeamRanking,
    getMyRank
  }
}
