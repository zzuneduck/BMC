// src/utils/helpers.js
// BMC 프로젝트 헬퍼 함수

import { TREE_LEVELS, TREE_DECORATIONS, POINT_MULTIPLIERS } from './constants';

// =============================================
// 날짜 관련
// =============================================

// 오늘 날짜 (YYYY-MM-DD)
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

// 날짜 포맷 (M월 D일)
export function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 날짜 포맷 (YYYY.MM.DD)
export function formatDateFull(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 요일 구하기
export function getDayOfWeek(dateString) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateString);
  return days[date.getDay()];
}

// 며칠 전인지 계산
export function getDaysAgo(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// =============================================
// 나무 관련
// =============================================

// 포스팅 개수로 나무 레벨 계산
export function getTreeLevel(postCount) {
  const level = TREE_LEVELS.find(
    l => postCount >= l.minPosts && postCount <= l.maxPosts
  );
  return level || TREE_LEVELS[0];
}

// 포인트로 장식 목록 계산
export function getTreeDecorations(points) {
  return TREE_DECORATIONS.filter(d => points >= d.minPoints);
}

// 다음 레벨까지 필요한 포스팅 수
export function getPostsToNextLevel(postCount) {
  const currentLevel = getTreeLevel(postCount);
  if (currentLevel.level >= 7) return 0; // 최대 레벨
  
  const nextLevel = TREE_LEVELS.find(l => l.level === currentLevel.level + 1);
  return nextLevel ? nextLevel.minPosts - postCount : 0;
}

// 레벨 진행률 (%)
export function getLevelProgress(postCount) {
  const currentLevel = getTreeLevel(postCount);
  if (currentLevel.level >= 7) return 100;
  
  const levelRange = currentLevel.maxPosts - currentLevel.minPosts + 1;
  const progress = postCount - currentLevel.minPosts;
  return Math.round((progress / levelRange) * 100);
}

// =============================================
// 포인트 관련
// =============================================

// 주차별 배율 적용
export function applyMultiplier(points, week) {
  const multiplier = POINT_MULTIPLIERS[week] || 1.0;
  return Math.round(points * multiplier);
}

// 포인트 포맷 (1,234점)
export function formatPoints(points) {
  return `${points.toLocaleString()}점`;
}

// 순위 변동 표시
export function getRankChange(current, previous) {
  if (previous === null || previous === undefined) return null;
  const diff = previous - current; // 순위는 낮을수록 좋음
  if (diff > 0) return { direction: 'up', value: diff };
  if (diff < 0) return { direction: 'down', value: Math.abs(diff) };
  return { direction: 'same', value: 0 };
}

// =============================================
// 문자열 관련
// =============================================

// 이름 마스킹 (홍*동)
export function maskName(name) {
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

// 휴대폰 번호 포맷 (010-****-1234)
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`;
  }
  return phone;
}

// 휴대폰 번호 유효성 검사
export function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return /^01[0-9]{8,9}$/.test(cleaned);
}

// URL 유효성 검사
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// =============================================
// 배열 관련
// =============================================

// 배열을 그룹으로 나누기
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

// 배열 셔플 (랜덤 배치)
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 배열을 n개씩 나누기
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// =============================================
// 기타
// =============================================

// 딜레이
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 클립보드 복사
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// 로컬 스토리지
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

// 랜덤 ID 생성
export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// 조건부 클래스 결합
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
