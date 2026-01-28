import { useCallback } from 'react'
import { supabase } from '../supabase'

// KST 기준 오늘 날짜 (YYYY-MM-DD)
const getKSTToday = () => {
  const now = new Date()
  const kstOffset = 9 * 60 // UTC+9
  const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000)
  return kst.toISOString().split('T')[0]
}

// KST 기준 어제 날짜 (YYYY-MM-DD)
const getKSTYesterday = () => {
  const now = new Date()
  const kstOffset = 9 * 60
  const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000)
  kst.setDate(kst.getDate() - 1)
  return kst.toISOString().split('T')[0]
}

export function useAttendance() {
  // 출석 체크 (포인트 및 연속출석 처리 포함)
  const checkIn = useCallback(async (studentId) => {
    try {
      const today = getKSTToday()
      const yesterday = getKSTYesterday()

      // 1. 오늘 이미 출석했는지 확인
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', today)
        .maybeSingle()

      if (existing) {
        return { success: false, error: '오늘 이미 출석했습니다.' }
      }

      // 2. 어제 출석 기록 확인 (연속 출석 계산용)
      const { data: yesterdayRecord } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', yesterday)
        .maybeSingle()

      // 3. 현재 streak_days 조회
      const { data: studentData } = await supabase
        .from('students')
        .select('streak_days')
        .eq('id', studentId)
        .single()

      // 4. 새 streak_days 계산
      let newStreakDays = 1
      if (yesterdayRecord && studentData) {
        newStreakDays = (studentData.streak_days || 0) + 1
      }

      // 5. attendance 테이블에 INSERT (created_at은 DB에서 자동 생성)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date: today,
          is_present: true
        }])
        .select()
        .single()

      if (attendanceError) throw attendanceError

      // 6. students.streak_days 업데이트
      await supabase
        .from('students')
        .update({ streak_days: newStreakDays })
        .eq('id', studentId)

      // 7. 기본 출석 포인트 +5점 지급
      await supabase.rpc('add_points', {
        p_student_id: studentId,
        p_points: 5,
        p_reason: '일일 출석 체크',
        p_type: 'attendance'
      })

      // 8. 연속 출석 보너스 포인트 지급
      let bonusPoints = 0
      let bonusReason = ''

      if (newStreakDays === 3) {
        bonusPoints = 10
        bonusReason = '3일 연속 출석 보너스'
      } else if (newStreakDays === 7) {
        bonusPoints = 30
        bonusReason = '7일 연속 출석 보너스'
      } else if (newStreakDays === 14) {
        bonusPoints = 50
        bonusReason = '14일 연속 출석 보너스'
      }

      if (bonusPoints > 0) {
        await supabase.rpc('add_points', {
          p_student_id: studentId,
          p_points: bonusPoints,
          p_reason: bonusReason,
          p_type: 'attendance_bonus'
        })
      }

      return {
        success: true,
        data: {
          attendance: attendanceData,
          streakDays: newStreakDays,
          basePoints: 5,
          bonusPoints
        }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 월별 출석 내역 조회
  const getAttendance = useCallback(async (studentId, month) => {
    try {
      // month 형식: 'YYYY-MM'
      const startDate = `${month}-01`
      const [year, mon] = month.split('-').map(Number)
      const lastDay = new Date(year, mon, 0).getDate()
      const endDate = `${month}-${lastDay}`

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 연속 출석일 계산 (KST 기준)
  const getStreak = useCallback(async (studentId) => {
    try {
      const todayStr = getKSTToday()

      // students 테이블에서 streak_days 조회
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('streak_days')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError

      // 오늘 출석 여부 확인
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', todayStr)
        .maybeSingle()

      const checkedInToday = !!todayAttendance

      return {
        success: true,
        data: {
          streak: studentData?.streak_days || 0,
          checkedInToday
        }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 오늘 전체 출석 현황 (KST 기준)
  const getTodayAttendance = useCallback(async () => {
    try {
      const today = getKSTToday()

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students (id, name, team)
        `)
        .eq('date', today)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 특정 날짜 출석 조회
  const getAttendanceByDate = useCallback(async (date) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date)

      if (error) throw error

      // student_id를 키로 하는 객체로 변환
      const attendanceMap = {}
      ;(data || []).forEach(a => {
        attendanceMap[a.student_id] = a
      })

      return { success: true, data: attendanceMap }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 출석 추가
  const addAttendance = useCallback(async (studentId, date) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date: date,
          is_present: true
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 출석 삭제
  const removeAttendance = useCallback(async (studentId, date) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('student_id', studentId)
        .eq('date', date)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // [관리자] 여러 명 출석 추가
  const addBulkAttendance = useCallback(async (studentIds, date) => {
    try {
      const records = studentIds.map(id => ({
        student_id: id,
        date: date,
        is_present: true
      }))

      const { data, error } = await supabase
        .from('attendance')
        .insert(records)
        .select()

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  return {
    checkIn,
    getAttendance,
    getStreak,
    getTodayAttendance,
    getAttendanceByDate,
    addAttendance,
    removeAttendance,
    addBulkAttendance
  }
}
