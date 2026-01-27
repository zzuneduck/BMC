// src/hooks/useMissions.js
import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useMissions() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(false)

  // 주차별 미션 목록 조회
  const getMissions = useCallback(async (week) => {
    try {
      setLoading(true)
      let query = supabase
        .from('missions')
        .select('*')
        .order('week')
        .order('order_num')

      if (week !== undefined && week !== null) {
        query = query.eq('week', week)
      }

      const { data, error } = await query

      if (error) throw error
      setMissions(data || [])
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // 수강생의 미션 완료 현황 조회
  const getStudentMissions = useCallback(async (studentId, week) => {
    try {
      let query = supabase
        .from('mission_logs')
        .select(`
          *,
          missions (id, week, title, description, type, points)
        `)
        .eq('student_id', studentId)

      if (week !== undefined && week !== null) {
        query = query.eq('missions.week', week)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 미션 완료 처리
  const completeMission = useCallback(async (studentId, missionId, evidence = null) => {
    try {
      // 이미 완료했는지 확인
      const { data: existing } = await supabase
        .from('mission_logs')
        .select('id')
        .eq('student_id', studentId)
        .eq('mission_id', missionId)
        .single()

      if (existing) {
        return { success: false, error: '이미 완료한 미션입니다.' }
      }

      // 미션 완료 기록
      const { data, error } = await supabase
        .from('mission_logs')
        .insert([{
          student_id: studentId,
          mission_id: missionId,
          completed_at: new Date().toISOString(),
          evidence: evidence
        }])
        .select(`
          *,
          missions (id, week, title, points)
        `)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      // PGRST116: 결과 없음 (아직 안한 상태 - 정상)
      if (err.code === 'PGRST116') {
        const { data, error } = await supabase
          .from('mission_logs')
          .insert([{
            student_id: studentId,
            mission_id: missionId,
            completed_at: new Date().toISOString(),
            evidence: evidence
          }])
          .select(`
            *,
            missions (id, week, title, points)
          `)
          .single()

        if (error) return { success: false, error: error.message }
        return { success: true, data }
      }
      return { success: false, error: err.message }
    }
  }, [])

  // 미션 완료 취소 (관리자용)
  const cancelMission = useCallback(async (logId) => {
    try {
      const { error } = await supabase
        .from('mission_logs')
        .delete()
        .eq('id', logId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 주차별 미션 완료 현황 (전체 통계)
  const getMissionStats = useCallback(async (week) => {
    try {
      const { data: missions, error: missionError } = await supabase
        .from('missions')
        .select('id, title, points')
        .eq('week', week)

      if (missionError) throw missionError

      const { data: logs, error: logError } = await supabase
        .from('mission_logs')
        .select(`
          mission_id,
          students (id, name, team)
        `)
        .in('mission_id', missions.map(m => m.id))

      if (logError) throw logError

      // 미션별 완료 수 계산
      const stats = missions.map(mission => ({
        ...mission,
        completedCount: logs.filter(l => l.mission_id === mission.id).length,
        completedStudents: logs
          .filter(l => l.mission_id === mission.id)
          .map(l => l.students)
      }))

      return { success: true, data: stats }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 수강생의 전체 미션 진행률
  const getStudentProgress = useCallback(async (studentId) => {
    try {
      // 전체 미션 수
      const { count: totalMissions, error: totalError } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })

      if (totalError) throw totalError

      // 완료한 미션 수
      const { count: completedMissions, error: completedError } = await supabase
        .from('mission_logs')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)

      if (completedError) throw completedError

      return {
        success: true,
        data: {
          total: totalMissions || 0,
          completed: completedMissions || 0,
          rate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0
        }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 미션 생성
  const createMission = useCallback(async (missionData) => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .insert([missionData])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 미션 수정
  const updateMission = useCallback(async (missionId, updates) => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .update(updates)
        .eq('id', missionId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 미션 삭제
  const deleteMission = useCallback(async (missionId) => {
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', missionId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  return {
    missions,
    loading,
    getMissions,
    getStudentMissions,
    completeMission,
    cancelMission,
    getMissionStats,
    getStudentProgress,
    createMission,
    updateMission,
    deleteMission
  }
}
