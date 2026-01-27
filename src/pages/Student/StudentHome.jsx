// src/pages/Student/StudentHome.jsx
import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { COLORS, SCHEDULE, CURRICULUM } from '../../utils/constants';
import { getTreeLevel, formatDate, getDayOfWeek, getToday } from '../../utils/helpers';

export default function StudentHome() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentPosts: 0,
    attendanceStreak: 0,
    rank: '-',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      // 수강생 최신 정보 조회
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setStats({
          totalPoints: data.total_points || 0,
          currentPosts: data.current_posts || 0,
          attendanceStreak: data.attendance_streak || 0,
          rank: '-',
        });
      }
    } catch (err) {
      console.error('Stats load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 나무 레벨 계산
  const treeLevel = getTreeLevel(stats.currentPosts);

  // 다음 수업 찾기
  const today = getToday();
  const nextClass = SCHEDULE.find(s => s.date >= today) || SCHEDULE[SCHEDULE.length - 1];
  const nextCurriculum = CURRICULUM.find(c => c.week === nextClass?.week);

  // D-day 계산
  const getDday = (dateString) => {
    const target = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  return (
    <div style={styles.container}>
      {/* 인사 섹션 */}
      <section style={styles.greetingSection}>
        <h1 style={styles.greeting}>
          안녕하세요, <span style={styles.highlight}>{user.name}</span>님!
        </h1>
        <p style={styles.subGreeting}>오늘도 블로그 성장을 응원합니다</p>
      </section>

      {/* 나무 카드 */}
      <section style={styles.treeCard}>
        <div style={styles.treeEmoji}>{treeLevel.emoji}</div>
        <div style={styles.treeInfo}>
          <div style={styles.treeLevelBadge}>Lv.{treeLevel.level}</div>
          <p style={styles.treeName}>{treeLevel.name}</p>
          <p style={styles.treeStats}>
            포스팅 <span style={styles.highlight}>{stats.currentPosts}</span>개
          </p>
        </div>
        <Link to="/student/blog" style={styles.treeButton}>
          내 나무 보기
        </Link>
      </section>

      {/* 통계 카드들 */}
      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🏆</span>
          <span style={styles.statValue}>{stats.totalPoints.toLocaleString()}</span>
          <span style={styles.statLabel}>총 포인트</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🔥</span>
          <span style={styles.statValue}>{stats.attendanceStreak}</span>
          <span style={styles.statLabel}>연속 출석</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📝</span>
          <span style={styles.statValue}>{stats.currentPosts}</span>
          <span style={styles.statLabel}>포스팅</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📊</span>
          <span style={styles.statValue}>{stats.rank}</span>
          <span style={styles.statLabel}>랭킹</span>
        </div>
      </section>

      {/* 다음 수업 카드 */}
      {nextClass && (
        <section style={styles.nextClassCard}>
          <div style={styles.nextClassHeader}>
            <span style={styles.nextClassTitle}>다음 수업</span>
            <span style={styles.dday}>{getDday(nextClass.date)}</span>
          </div>
          <div style={styles.nextClassContent}>
            <div style={styles.nextClassDate}>
              <span style={styles.dateText}>
                {formatDate(nextClass.date)} ({getDayOfWeek(nextClass.date)})
              </span>
              <span style={styles.timeText}>{nextClass.time}</span>
            </div>
            <p style={styles.nextClassTopic}>
              {nextCurriculum?.title || nextClass.title}
            </p>
            <span style={{
              ...styles.classTypeBadge,
              backgroundColor: nextClass.type === '오프라인' ? COLORS.primary : COLORS.secondary,
            }}>
              {nextClass.type === 'offline' ? '오프라인' : '온라인'}
            </span>
          </div>
        </section>
      )}

      {/* 퀵 메뉴 */}
      <section style={styles.quickMenuSection}>
        <h2 style={styles.sectionTitle}>바로가기</h2>
        <div style={styles.quickMenuGrid}>
          <Link to="/student/mission" style={styles.quickMenuItem}>
            <span style={styles.quickMenuIcon}>✅</span>
            <span style={styles.quickMenuLabel}>오늘의 미션</span>
          </Link>
          <Link to="/student/vod" style={styles.quickMenuItem}>
            <span style={styles.quickMenuIcon}>📺</span>
            <span style={styles.quickMenuLabel}>VOD 학습</span>
          </Link>
          <Link to="/student/schedule" style={styles.quickMenuItem}>
            <span style={styles.quickMenuIcon}>📅</span>
            <span style={styles.quickMenuLabel}>일정 확인</span>
          </Link>
          <Link to="/student/resources" style={styles.quickMenuItem}>
            <span style={styles.quickMenuIcon}>📁</span>
            <span style={styles.quickMenuLabel}>자료실</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 16px',
  },
  greetingSection: {
    marginBottom: '24px',
  },
  greeting: {
    color: COLORS.text,
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  highlight: {
    color: COLORS.primary,
  },
  subGreeting: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  treeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  treeEmoji: {
    fontSize: '48px',
  },
  treeInfo: {
    flex: 1,
  },
  treeLevelBadge: {
    display: 'inline-block',
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  treeName: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '4px 0',
  },
  treeStats: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  treeButton: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textDecoration: 'none',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statIcon: {
    fontSize: '24px',
  },
  statValue: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  nextClassCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
  },
  nextClassHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  nextClassTitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  dday: {
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  nextClassContent: {},
  nextClassDate: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  dateText: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: '16px',
  },
  nextClassTopic: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  classTypeBadge: {
    display: 'inline-block',
    color: COLORS.background,
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  quickMenuSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
  },
  quickMenuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  quickMenuItem: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  quickMenuIcon: {
    fontSize: '28px',
  },
  quickMenuLabel: {
    color: COLORS.text,
    fontSize: '12px',
    textAlign: 'center',
  },
};
