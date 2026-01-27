import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Loading } from '../../components/Common';
import { useStudents, usePoints, useAttendance } from '../../hooks';
import { COLORS, SCHEDULE } from '../../utils/constants';

const Dashboard = () => {
  const navigate = useNavigate();
  const { students, fetchStudents } = useStudents();
  const { getIndividualRanking, getTeamRanking, getPointsLog } = usePoints();
  const { getTodayAttendance } = useAttendance();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
  });
  const [topStudents, setTopStudents] = useState([]);
  const [teamRanking, setTeamRanking] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 전체 수강생 조회
      const studentsResult = await fetchStudents();
      let totalCount = 0;
      if (studentsResult.success) {
        totalCount = studentsResult.data.length;
      }

      // 개인 랭킹 TOP 5
      const rankingResult = await getIndividualRanking();
      if (rankingResult.success) {
        setTopStudents(rankingResult.data.slice(0, 5));
      }

      // 조별 랭킹
      const teamResult = await getTeamRanking();
      if (teamResult.success) {
        setTeamRanking(teamResult.data);
      }

      // 오늘 출석 현황
      const attendanceResult = await getTodayAttendance();
      let todayCount = 0;
      if (attendanceResult.success) {
        todayCount = attendanceResult.data.length;
      }

      // 통계 업데이트
      setStats({
        totalStudents: totalCount,
        todayAttendance: todayCount,
        attendanceRate: totalCount > 0 ? Math.round((todayCount / totalCount) * 100) : 0,
      });

      // 최근 포인트 활동 (모든 학생의 로그)
      // 첫 번째 학생 ID로 조회하거나 전체 조회가 필요
      // 여기서는 간단히 빈 배열로 시작
      setRecentActivities([]);

    } catch (err) {
      console.error('대시보드 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 빠른 실행 핸들러
  const handleQuickAction = (path) => {
    navigate(path);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentWeek = Math.max(0, SCHEDULE.findIndex(s => s.date > today));
  const todaySchedule = SCHEDULE.find(s => s.date === today);
  const nextSchedule = SCHEDULE.find(s => s.date > today);

  return (
    <div style={styles.container}>
      {/* 오늘 일정 배너 */}
      {todaySchedule ? (
        <div style={styles.todayBanner}>
          <span style={styles.bannerBadge}>오늘 강의</span>
          <span style={styles.bannerTitle}>{todaySchedule.title}</span>
          <span style={styles.bannerTime}>{todaySchedule.time}</span>
        </div>
      ) : nextSchedule && (
        <div style={{ ...styles.todayBanner, backgroundColor: COLORS.surface }}>
          <span style={{ ...styles.bannerBadge, backgroundColor: COLORS.primary, color: '#000' }}>다음 강의</span>
          <span style={{ ...styles.bannerTitle, color: COLORS.text }}>{nextSchedule.title}</span>
          <span style={{ ...styles.bannerTime, color: COLORS.textMuted }}>{nextSchedule.date}</span>
        </div>
      )}

      {/* 통계 카드 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} onClick={() => handleQuickAction('/admin/students')}>
          <span style={styles.statIcon}>👥</span>
          <span style={styles.statNumber}>{stats.totalStudents}</span>
          <span style={styles.statLabel}>전체 수강생</span>
        </div>
        <div style={styles.statCard} onClick={() => handleQuickAction('/admin/attendance')}>
          <span style={styles.statIcon}>✅</span>
          <span style={styles.statNumber}>{stats.todayAttendance}</span>
          <span style={styles.statLabel}>오늘 출석</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📊</span>
          <span style={styles.statNumber}>{stats.attendanceRate}%</span>
          <span style={styles.statLabel}>출석률</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📅</span>
          <span style={styles.statNumber}>{currentWeek}</span>
          <span style={styles.statLabel}>현재 주차</span>
        </div>
      </div>

      {/* 개인 랭킹 TOP 5 */}
      <Card title="개인 랭킹 TOP 5">
        <div style={styles.rankingList}>
          {topStudents.map((student, idx) => (
            <div key={student.id} style={styles.rankingItem}>
              <span style={{
                ...styles.rankBadge,
                backgroundColor: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : COLORS.surfaceLight,
                color: idx < 3 ? '#000' : COLORS.text,
              }}>
                {idx + 1}
              </span>
              <span style={styles.rankName}>{student.name}</span>
              <span style={styles.rankTeam}>{student.team}</span>
              <span style={styles.rankPoints}>{student.total_points || 0}P</span>
            </div>
          ))}
          {topStudents.length === 0 && (
            <p style={styles.emptyText}>등록된 수강생이 없습니다.</p>
          )}
        </div>
      </Card>

      {/* 조별 랭킹 */}
      <Card title="조별 랭킹">
        <div style={styles.teamRankingList}>
          {teamRanking.map((team, idx) => (
            <div key={team.team} style={styles.teamRankingItem}>
              <span style={{
                ...styles.teamRankBadge,
                backgroundColor: idx === 0 ? COLORS.primary : COLORS.surfaceLight,
                color: idx === 0 ? '#000' : COLORS.text,
              }}>
                {idx + 1}위
              </span>
              <span style={styles.teamName}>{team.team}</span>
              <div style={styles.teamBar}>
                <div style={{
                  ...styles.teamBarFill,
                  width: `${(team.totalPoints / (teamRanking[0]?.totalPoints || 1)) * 100}%`,
                }} />
              </div>
              <span style={styles.teamPoints}>{team.totalPoints}P</span>
            </div>
          ))}
          {teamRanking.length === 0 && (
            <p style={styles.emptyText}>조 배치가 필요합니다.</p>
          )}
        </div>
      </Card>

      {/* 출석 현황 요약 */}
      <Card title="오늘 출석 현황">
        <div style={styles.attendanceSummary}>
          <div style={styles.attendanceCircle}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={COLORS.surfaceLight}
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={COLORS.primary}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${stats.attendanceRate * 3.14} 314`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={styles.attendanceCircleText}>
              <span style={styles.attendancePercent}>{stats.attendanceRate}%</span>
              <span style={styles.attendanceLabel}>출석률</span>
            </div>
          </div>
          <div style={styles.attendanceDetails}>
            <div style={styles.attendanceRow}>
              <span style={styles.attendanceRowLabel}>출석</span>
              <span style={styles.attendanceRowValue}>{stats.todayAttendance}명</span>
            </div>
            <div style={styles.attendanceRow}>
              <span style={styles.attendanceRowLabel}>미출석</span>
              <span style={styles.attendanceRowValue}>{stats.totalStudents - stats.todayAttendance}명</span>
            </div>
            <div style={styles.attendanceRow}>
              <span style={styles.attendanceRowLabel}>전체</span>
              <span style={styles.attendanceRowValue}>{stats.totalStudents}명</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 빠른 실행 */}
      <div style={styles.quickActions}>
        <div
          style={styles.quickActionBtn}
          onClick={() => handleQuickAction('/admin/attendance')}
        >
          <span style={styles.quickActionIcon}>✅</span>
          <span>출석 관리</span>
        </div>
        <div
          style={styles.quickActionBtn}
          onClick={() => handleQuickAction('/admin/register')}
        >
          <span style={styles.quickActionIcon}>➕</span>
          <span>수강생 등록</span>
        </div>
        <div
          style={styles.quickActionBtn}
          onClick={() => handleQuickAction('/admin/ranking')}
        >
          <span style={styles.quickActionIcon}>🏆</span>
          <span>랭킹 관리</span>
        </div>
        <div
          style={styles.quickActionBtn}
          onClick={() => handleQuickAction('/admin/forest')}
        >
          <span style={styles.quickActionIcon}>🌲</span>
          <span>숲 보기</span>
        </div>
      </div>

      {/* 관리 메뉴 */}
      <Card title="관리 메뉴">
        <div style={styles.menuGrid}>
          <div style={styles.menuItem} onClick={() => handleQuickAction('/admin/students')}>
            <span style={styles.menuIcon}>👥</span>
            <span style={styles.menuLabel}>수강생 목록</span>
          </div>
          <div style={styles.menuItem} onClick={() => handleQuickAction('/admin/teams')}>
            <span style={styles.menuIcon}>🔀</span>
            <span style={styles.menuLabel}>조 배치</span>
          </div>
          <div style={styles.menuItem} onClick={() => handleQuickAction('/admin/mission')}>
            <span style={styles.menuIcon}>📋</span>
            <span style={styles.menuLabel}>미션 현황</span>
          </div>
          <div style={styles.menuItem} onClick={() => handleQuickAction('/admin/vod')}>
            <span style={styles.menuIcon}>📺</span>
            <span style={styles.menuLabel}>VOD 관리</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    paddingBottom: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  todayBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: COLORS.primary,
    borderRadius: '12px',
    color: '#000',
  },
  bannerBadge: {
    padding: '4px 8px',
    backgroundColor: '#000',
    color: COLORS.primary,
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  bannerTitle: {
    flex: 1,
    fontWeight: '600',
  },
  bannerTime: {
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  statIcon: {
    fontSize: '20px',
    marginBottom: '4px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: '11px',
    color: COLORS.textMuted,
    marginTop: '4px',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rankingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
  rankBadge: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  rankName: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '500',
  },
  rankTeam: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  rankPoints: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  teamRankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  teamRankingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  teamRankBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '36px',
    textAlign: 'center',
  },
  teamName: {
    color: COLORS.text,
    fontWeight: '500',
    minWidth: '40px',
  },
  teamBar: {
    flex: 1,
    height: '8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  teamBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  teamPoints: {
    color: COLORS.textMuted,
    fontSize: '13px',
    minWidth: '50px',
    textAlign: 'right',
  },
  attendanceSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  attendanceCircle: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  attendanceCircleText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  attendancePercent: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  attendanceLabel: {
    fontSize: '12px',
    color: COLORS.textMuted,
  },
  attendanceDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  attendanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceRowLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  attendanceRowValue: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: '20px',
    margin: 0,
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  quickActionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    cursor: 'pointer',
    color: COLORS.text,
    fontSize: '12px',
    transition: 'transform 0.2s',
  },
  quickActionIcon: {
    fontSize: '24px',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  menuIcon: {
    fontSize: '20px',
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: '14px',
  },
};

export default Dashboard;
