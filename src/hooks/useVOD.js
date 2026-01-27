// src/hooks/useVOD.js
// VOD 관련 훅

import { useState, useCallback } from 'react';
import { supabase } from '../supabase';

export function useVOD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // VOD 강의 목록 조회
  const getCourses = useCallback(async (courseType = 'basic') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('vod_courses')
        .select('*')
        .eq('course_type', courseType)
        .order('category', { ascending: true })
        .order('order_num', { ascending: true });

      if (fetchError) throw fetchError;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('VOD 강의 조회 실패:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 학생의 VOD 진행률 조회
  const getProgress = useCallback(async (studentId, courseType = 'basic') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('vod_progress')
        .select(`
          *,
          vod_courses!inner(course_type)
        `)
        .eq('student_id', studentId)
        .eq('vod_courses.course_type', courseType);

      if (fetchError) throw fetchError;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('VOD 진행률 조회 실패:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 강의 완료 처리
  const markComplete = useCallback(async (studentId, courseId) => {
    setLoading(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('vod_progress')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single();

      if (existing) {
        // 이미 완료됨
        return { success: true, data: existing };
      }

      const { data, error: insertError } = await supabase
        .from('vod_progress')
        .insert([{
          student_id: studentId,
          course_id: courseId,
          completed_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data };
    } catch (err) {
      console.error('VOD 완료 처리 실패:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 이번 주 VOD 과제 조회
  const getCurrentAssignment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('vod_assignments')
        .select('*')
        .lte('start_date', today)
        .gte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      return { success: true, data: data || null };
    } catch (err) {
      console.error('VOD 과제 조회 실패:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 과제 제출 여부 확인
  const getSubmission = useCallback(async (studentId, assignmentId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('vod_submissions')
        .select('*')
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      return { success: true, data: data || null };
    } catch (err) {
      console.error('제출 여부 확인 실패:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 과제 제출
  const submitAssignment = useCallback(async (studentId, assignmentId, submissionData) => {
    setLoading(true);
    setError(null);

    try {
      // 이미 제출했는지 확인
      const { data: existing } = await supabase
        .from('vod_submissions')
        .select('id')
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentId)
        .single();

      if (existing) {
        // 기존 제출 업데이트
        const { data, error: updateError } = await supabase
          .from('vod_submissions')
          .update({
            ...submissionData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return { success: true, data };
      }

      // 새로 제출
      const { data, error: insertError } = await supabase
        .from('vod_submissions')
        .insert([{
          student_id: studentId,
          assignment_id: assignmentId,
          ...submissionData,
          submitted_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data };
    } catch (err) {
      console.error('과제 제출 실패:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getCourses,
    getProgress,
    markComplete,
    getCurrentAssignment,
    getSubmission,
    submitAssignment,
  };
}
