// src/utils/points.js
// 포인트 관련 Supabase 함수

import { supabase } from '../supabase';
import { POINTS, POINT_TYPES } from './constants';

// =============================================
// 포인트 추가 (RPC 함수 호출)
// =============================================

export async function addPoints(studentId, points, reason, reasonType, referenceId = null) {
  try {
    const { data, error } = await supabase.rpc('add_points', {
      p_student_id: studentId,
      p_points: points,
      p_reason: reason,
      p_reason_type: reasonType,
      p_reference_id: referenceId
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || '포인트 추가 실패');
    }

    return {
      success: true,
      logId: data.log_id,
      newTotal: data.new_total,
      newWeekly: data.new_weekly
    };
  } catch (error) {
    console.error('포인트 추가 오류:', error);
    return { success: false, error: error.message };
  }
}

// =============================================
// 출석 포인트
// =============================================

export async function addAttendancePoints(studentId, streakDays) {
  // 기본 출석 포인트
  await addPoints(studentId, POINTS.attendance, '일일 출석', POINT_TYPES.ATTENDANCE);

  // 연속 출석 보너스
  if (streakDays === 3) {
    await addPoints(studentId, POINTS.streak_3, '3일 연속 출석 보너스', POINT_TYPES.ATTENDANCE_BONUS);
  } else if (streakDays === 7) {
    await addPoints(studentId, POINTS.streak_7, '7일 연속 출석 보너스', POINT_TYPES.ATTENDANCE_BONUS);
  } else if (streakDays === 14) {
    await addPoints(studentId, POINTS.streak_14, '14일 연속 출석 보너스', POINT_TYPES.ATTENDANCE_BONUS);
  } else if (streakDays === 35) {
    await addPoints(studentId, POINTS.perfect_attendance, '전체 개근 보너스', POINT_TYPES.ATTENDANCE_BONUS);
  }
}

// =============================================
// 미션 포인트
// =============================================

export async function addMissionPoints(studentId, missionId, week, isExcellent = false) {
  // 주차별 배율 적용
  const multiplier = { 1: 1, 2: 1, 3: 1.2, 4: 1.5, 5: 2 }[week] || 1;
  const points = Math.round(POINTS.mission * multiplier);

  await addPoints(studentId, points, '미션 완료', POINT_TYPES.MISSION, missionId);

  // 우수 미션
  if (isExcellent) {
    await addPoints(studentId, POINTS.mission_excellent, '우수 미션 선정', POINT_TYPES.MISSION_EXCELLENT, missionId);
  }
}

// 미션 연속 클리어 보너스
export async function addMissionStreakBonus(studentId, streakDays) {
  if (streakDays === 3) {
    await addPoints(studentId, POINTS.mission_streak_3, '3일 연속 미션 클리어', POINT_TYPES.MISSION_BONUS);
  } else if (streakDays === 7) {
    await addPoints(studentId, POINTS.mission_streak_7, '7일 연속 미션 클리어', POINT_TYPES.MISSION_BONUS);
  }
}

// =============================================
// VOD 포인트
// =============================================

export async function addVodPoints(studentId, assignmentId, options = {}) {
  const { watched, hasSummary, hasPractice, hasQuestion, feedbackChecked } = options;
  let totalPoints = 0;

  if (watched) {
    await addPoints(studentId, POINTS.vod_watch, 'VOD 시청 완료', POINT_TYPES.VOD, assignmentId);
    totalPoints += POINTS.vod_watch;
  }

  if (hasSummary) {
    await addPoints(studentId, POINTS.vod_summary, '핵심 내용 정리', POINT_TYPES.VOD, assignmentId);
    totalPoints += POINTS.vod_summary;
  }

  if (hasPractice) {
    await addPoints(studentId, POINTS.vod_practice, '실습 인증', POINT_TYPES.VOD, assignmentId);
    totalPoints += POINTS.vod_practice;
  }

  if (hasQuestion) {
    await addPoints(studentId, POINTS.vod_question, '질문 작성', POINT_TYPES.VOD, assignmentId);
    totalPoints += POINTS.vod_question;
  }

  if (feedbackChecked) {
    await addPoints(studentId, POINTS.vod_feedback, '피드백 확인', POINT_TYPES.VOD_FEEDBACK, assignmentId);
    totalPoints += POINTS.vod_feedback;
  }

  return totalPoints;
}

// =============================================
// 블로그 성장 포인트
// =============================================

export async function addBlogGrowthPoints(studentId, growthCount, newLevel, previousLevel) {
  // 5개 이상 성장 시
  if (growthCount >= 5) {
    const bonusCount = Math.floor(growthCount / 5);
    await addPoints(
      studentId, 
      POINTS.blog_growth_5 * bonusCount, 
      `블로그 ${growthCount}개 성장`, 
      POINT_TYPES.BLOG_GROWTH
    );
  }

  // 레벨업 시
  if (newLevel > previousLevel) {
    await addPoints(
      studentId, 
      POINTS.tree_levelup, 
      `나무 레벨 ${newLevel} 달성!`, 
      POINT_TYPES.TREE_LEVELUP
    );
  }
}

// =============================================
// 이벤트 포인트
// =============================================

export async function addWeeklyMvpPoints(studentId) {
  await addPoints(studentId, POINTS.weekly_mvp, '주간 MVP 선정', POINT_TYPES.WEEKLY_MVP);
}

export async function addWeeklyGrowthPoints(studentId) {
  await addPoints(studentId, POINTS.weekly_growth, '주간 성장왕 선정', POINT_TYPES.WEEKLY_GROWTH);
}

export async function addTeamFirstPoints(studentIds) {
  // 조별 1등 시 조원 전체에게 포인트
  for (const studentId of studentIds) {
    await addPoints(studentId, POINTS.team_first, '조별 1등 보너스', POINT_TYPES.TEAM_FIRST);
  }
}

// =============================================
// Q&A 포인트
// =============================================

export async function addQnaPoints(studentId, qnaId, isAnswer = false) {
  if (isAnswer) {
    await addPoints(studentId, POINTS.qna_answer, '동료 질문 답변', POINT_TYPES.QNA, qnaId);
  } else {
    await addPoints(studentId, POINTS.qna_question, 'Q&A 질문', POINT_TYPES.QNA, qnaId);
  }
}

// =============================================
// 수익 인증 포인트
// =============================================

export async function addRevenuePoints(studentId) {
  await addPoints(studentId, POINTS.revenue, '수익 인증', POINT_TYPES.REVENUE);
}

// =============================================
// 포인트 내역 조회
// =============================================

export async function getPointsLog(studentId, limit = 20) {
  const { data, error } = await supabase
    .from('points_log')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('포인트 내역 조회 오류:', error);
    return [];
  }

  return data;
}

// =============================================
// 랭킹 조회
// =============================================

// 개인 랭킹
export async function getIndividualRanking(limit = 10) {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, total_points, weekly_points, team_id')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('개인 랭킹 조회 오류:', error);
    return [];
  }

  return data.map((student, index) => ({
    ...student,
    rank: index + 1
  }));
}

// 조별 랭킹
export async function getTeamRanking() {
  const { data, error } = await supabase.rpc('get_team_rankings');

  if (error) {
    console.error('조별 랭킹 조회 오류:', error);
    return [];
  }

  return data.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}

// 내 순위 조회
export async function getMyRank(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('id, total_points')
    .order('total_points', { ascending: false });

  if (error) {
    console.error('내 순위 조회 오류:', error);
    return null;
  }

  const rank = data.findIndex(s => s.id === studentId) + 1;
  return { rank, total: data.length };
}
