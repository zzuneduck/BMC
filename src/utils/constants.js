// src/utils/constants.js
// BMC 프로젝트 공통 상수

// 테마 색상
export const COLORS = {
  primary: '#ffc500',      // 금색
  secondary: '#00ff9d',    // 민트
  background: '#000000',   // 검정
  surface: '#1a1a1a',      // 어두운 회색
  surfaceLight: '#2a2a2a', // 밝은 회색
  text: '#ffffff',         // 흰색
  textMuted: '#888888',    // 회색 텍스트
  error: '#ff4444',        // 빨간색
  success: '#00ff9d',      // 민트 (성공)
  warning: '#ffc500',      // 금색 (경고)
};

// 나무 레벨 설정 (타이탄 시작일 기준, 101포=최종)
export const TREE_LEVELS = [
  { level: 1, minPosts: 0, maxPosts: 5, name: '씨앗에서 막 싹텄어요', emoji: '🌱' },
  { level: 2, minPosts: 6, maxPosts: 15, name: '작지만 단단해요', emoji: '🌿' },
  { level: 3, minPosts: 16, maxPosts: 30, name: '쑥쑥 자라는 중!', emoji: '🌲' },
  { level: 4, minPosts: 31, maxPosts: 50, name: '이제 제법 나무다워요', emoji: '🌳' },
  { level: 5, minPosts: 51, maxPosts: 70, name: '잎이 무성해요', emoji: '🌴' },
  { level: 6, minPosts: 71, maxPosts: 100, name: '숲의 주인공!', emoji: '🎄' },
  { level: 7, minPosts: 101, maxPosts: Infinity, name: '전설의 나무', emoji: '🏆' },
];

// 타이탄 시작일 (이 날짜 이후 포스팅만 카운트)
export const TITAN_START_DATE = '2025-02-02';

// 나무 장식 (포인트 기준)
export const TREE_DECORATIONS = [
  { minPoints: 100, name: 'flower_1', emoji: '🌸' },
  { minPoints: 300, name: 'flower_3', emoji: '🌸🌸' },
  { minPoints: 500, name: 'fruit_1', emoji: '🍎' },
  { minPoints: 800, name: 'fruit_3', emoji: '🍎🍎' },
  { minPoints: 1200, name: 'star', emoji: '⭐' },
  { minPoints: 1800, name: 'glow', emoji: '🌟' },
  { minPoints: 2500, name: 'crown', emoji: '👑' },
];

// 포인트 설정
export const POINTS = {
  // 출석
  attendance: 5,
  streak_3: 10,
  streak_7: 30,
  streak_14: 50,
  perfect_attendance: 200,
  
  // 미션
  mission: 10,
  mission_streak_3: 15,
  mission_streak_7: 40,
  mission_excellent: 5,
  
  // VOD
  vod_watch: 10,
  vod_summary: 10,
  vod_practice: 15,
  vod_question: 5,
  vod_feedback: 5,
  
  // 블로그
  blog_growth_5: 20,
  tree_levelup: 50,
  
  // 이벤트
  weekly_mvp: 100,
  weekly_growth: 80,
  team_first: 30,
  
  // Q&A
  qna_question: 5,
  qna_answer: 10,
  
  // 수익 인증
  revenue: 30,
};

// 포인트 배율 (주차별)
export const POINT_MULTIPLIERS = {
  1: 1.0,
  2: 1.0,
  3: 1.2,
  4: 1.5,
  5: 2.0,
};

// 포인트 사유 타입
export const POINT_TYPES = {
  ATTENDANCE: 'attendance',
  ATTENDANCE_BONUS: 'attendance_bonus',
  MISSION: 'mission',
  MISSION_BONUS: 'mission_bonus',
  MISSION_EXCELLENT: 'mission_excellent',
  VOD: 'vod',
  VOD_FEEDBACK: 'vod_feedback',
  BLOG_GROWTH: 'blog_growth',
  TREE_LEVELUP: 'tree_levelup',
  WEEKLY_MVP: 'weekly_mvp',
  WEEKLY_GROWTH: 'weekly_growth',
  TEAM_FIRST: 'team_first',
  QNA: 'qna',
  REVENUE: 'revenue',
};

// 수강생 메뉴
export const STUDENT_MENUS = [
  { id: 'home', name: '홈', icon: '🏠', path: '/student' },
  { id: 'instructor', name: '강사소개', icon: '👨‍🏫', path: '/student/instructor' },
  { id: 'schedule', name: '일정', icon: '📅', path: '/student/schedule' },
  { id: 'mission', name: '미션', icon: '✅', path: '/student/mission' },
  { id: 'vod', name: 'VOD', icon: '📺', path: '/student/vod' },
  { id: 'blog', name: '블로그', icon: '📝', path: '/student/blog' },
  { id: 'resources', name: '자료실', icon: '📁', path: '/student/resources' },
  { id: 'consultation', name: '상담', icon: '💬', path: '/student/consultation' },
  { id: 'qna', name: 'Q&A', icon: '❓', path: '/student/qna' },
  { id: 'revenue', name: '수익인증', icon: '💰', path: '/student/revenue' },
];

// 관리자 메뉴
export const ADMIN_MENUS = [
  { id: 'dashboard', name: '대시보드', icon: '📊', path: '/admin' },
  { id: 'instructor', name: '강사소개', icon: '👨‍🏫', path: '/admin/instructor' },
  { id: 'students', name: '목록', icon: '👥', path: '/admin/students' },
  { id: 'register', name: '등록', icon: '➕', path: '/admin/register' },
  { id: 'attendance', name: '출석', icon: '✅', path: '/admin/attendance' },
  { id: 'teams', name: '조배치', icon: '🔀', path: '/admin/teams' },
  { id: 'mission', name: '미션', icon: '📋', path: '/admin/mission' },
  { id: 'vod', name: 'VOD관리', icon: '📺', path: '/admin/vod' },
  { id: 'ranking', name: '랭킹', icon: '🏆', path: '/admin/ranking' },
  { id: 'forest', name: '숲', icon: '🌲', path: '/admin/forest' },
];

// 강의 일정 (1기)
export const SCHEDULE = [
  { week: 0, date: '2026-01-24', type: 'offline', title: '오리엔테이션', time: '20:00-22:00', vodDate: '2026-01-26' },
  { week: 1, date: '2026-01-31', type: 'offline', title: '수익화 방법 0번', time: '10:00-13:00', vodDate: '2026-02-02' },
  { week: 2, date: '2026-02-07', type: 'offline', title: '수익화 방법 1번', time: '10:00-13:00', vodDate: '2026-02-09' },
  { week: 3, date: '2026-02-14', type: 'offline', title: '수익화 방법 2번', time: '10:00-13:00', vodDate: '2026-02-16' },
  { week: 4, date: '2026-02-21', type: 'offline', title: '수익화 방법 3번', time: '10:00-13:00', vodDate: '2026-02-23' },
  { week: 5, date: '2026-02-28', type: 'offline', title: '수익화 방법 4번', time: '10:00-13:00', vodDate: '2026-03-02' },
];

// 커리큘럼 내용
export const CURRICULUM = [
  { week: 0, title: '2026년 달라진 네이버 블로그 알고리즘' },
  { week: 1, title: '수익화 방법 0번 - 네이버 블로그 개념잡기' },
  { week: 2, title: '수익화 방법 1번 - 이것만 배우면 연 1000만원 가능' },
  { week: 3, title: '수익화 방법 2번 - 이 방법이 더해지면 월 100~200 가능' },
  { week: 4, title: '수익화 방법 3번 - 이 방법 배우면 안정적 월 200~300' },
  { week: 5, title: '수익화 방법 4번 - 이 방법 배우면 장기적 연 1억 가능' },
];

// 관리자 계정
export const ADMIN_CREDENTIALS = {
  id: 'admin',
  password: 'admin1234',
};
