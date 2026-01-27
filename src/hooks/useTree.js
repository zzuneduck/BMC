import { useCallback } from 'react'
import { supabase } from '../supabase'

export function useTree() {
  // 블로그 현황 조회
  const getBlogStats = useCallback(async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('blog1, blog2, blog3, post_count, tree_level')
        .eq('id', studentId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: {
          blog1: data.blog1,
          blog2: data.blog2,
          blog3: data.blog3,
          postCount: data.post_count || 0,
          treeLevel: data.tree_level || 1
        }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 포스팅 업데이트
  const updatePostCount = useCallback(async (studentId, newCount, evidence) => {
    try {
      const treeLevel = calculateTreeLevel(newCount)

      const { data, error } = await supabase
        .from('students')
        .update({
          post_count: newCount,
          tree_level: treeLevel,
          last_evidence: evidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // 나무 레벨 계산
  const calculateTreeLevel = useCallback((postCount) => {
    if (postCount >= 50) return 5  // 대나무 (만개)
    if (postCount >= 30) return 4  // 성숙한 나무
    if (postCount >= 15) return 3  // 어린 나무
    if (postCount >= 5) return 2   // 새싹
    return 1                        // 씨앗
  }, [])

  // 장식 계산 (포인트 기반)
  const getDecorations = useCallback((points) => {
    const decorations = []

    // 포인트 구간별 장식 추가
    if (points >= 100) {
      decorations.push({ type: 'star', name: '별', count: Math.floor(points / 100) })
    }
    if (points >= 50) {
      decorations.push({ type: 'flower', name: '꽃', count: Math.floor((points % 100) / 50) })
    }
    if (points >= 30) {
      decorations.push({ type: 'butterfly', name: '나비', count: 1 })
    }
    if (points >= 20) {
      decorations.push({ type: 'bird', name: '새', count: 1 })
    }
    if (points >= 10) {
      decorations.push({ type: 'fruit', name: '열매', count: Math.floor((points % 50) / 10) })
    }

    return decorations
  }, [])

  return {
    getBlogStats,
    updatePostCount,
    calculateTreeLevel,
    getDecorations
  }
}
