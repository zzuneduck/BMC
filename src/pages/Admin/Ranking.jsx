// src/pages/Admin/Ranking.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { getTreeLevel } from '../../utils/helpers';

const Ranking = () => {
  const { students, loading, fetchStudents } = useStudents();
  const [rankType, setRankType] = useState('points'); // points, posts
  const [viewType, setViewType] = useState('individual'); // individual, team

  useEffect(() => {
    fetchStudents();
  }, []);

  // 개인 랭킹 정렬
  const sortedStudents = [...students].sort((a, b) => {
    switch (rankType) {
      case 'posts':
        return (b.post_count || 0) - (a.post_count || 0);
      default:
        return (b.total_points || 0) - (a.total_points || 0);
    }
  });

  // 팀 랭킹 계산
  const teamRanking = Object.entries(
    students.reduce((acc, s) => {
      if (!s.team) return acc;
      if (!acc[s.team]) {
        acc[s.team] = { team: s.team, points: 0, posts: 0, members: 0 };
      }
      acc[s.team].points += s.total_points || 0;
      acc[s.team].posts += s.post_count || 0;
      acc[s.team].members += 1;
      return acc;
    }, {})
  )
    .map(([_, data]) => data)
    .sort((a, b) => {
      switch (rankType) {
        case 'posts':
          return b.posts - a.posts;
        default:
          return b.points - a.points;
      }
    });

  if (loading) {
    return <Loading fullScreen />;
  }

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return COLORS.surfaceLight;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>랭킹</h1>

      {/* 필터 */}
      <div style={styles.filterRow}>
        <div style={styles.toggleGroup}>
          <button
            style={{
              ...styles.toggleBtn,
              backgroundColor: viewType === 'individual' ? COLORS.primary : COLORS.surface,
              color: viewType === 'individual' ? '#000' : COLORS.text,
            }}
            onClick={() => setViewType('individual')}
          >
            개인
          </button>
          <button
            style={{
              ...styles.toggleBtn,
              backgroundColor: viewType === 'team' ? COLORS.primary : COLORS.surface,
              color: viewType === 'team' ? '#000' : COLORS.text,
            }}
            onClick={() => setViewType('team')}
          >
            조별
          </button>
        </div>

        <select
          value={rankType}
          onChange={(e) => setRankType(e.target.value)}
          style={styles.select}
        >
          <option value="points">포인트순</option>
          <option value="posts">포스팅순</option>
        </select>
      </div>

      {/* 개인 랭킹 */}
      {viewType === 'individual' && (
        <div style={styles.rankingList}>
          {sortedStudents.map((student, idx) => {
            const rank = idx + 1;
            const treeLevel = getTreeLevel(student.post_count || 0);

            return (
              <div key={student.id} style={styles.rankCard}>
                <div style={styles.rankLeft}>
                  <span style={{
                    ...styles.rankBadge,
                    backgroundColor: getRankBadgeColor(rank),
                    color: rank <= 3 ? '#000' : COLORS.text,
                  }}>
                    {rank}
                  </span>
                  <span style={styles.treeEmoji}>{treeLevel.emoji}</span>
                  <div style={styles.studentInfo}>
                    <span style={styles.studentName}>{student.name}</span>
                    <span style={styles.studentMeta}>
                      {student.team || '미배정'}
                    </span>
                  </div>
                </div>
                <div style={styles.rankRight}>
                  {rankType === 'points' && (
                    <span style={styles.mainValue}>{student.total_points || 0}P</span>
                  )}
                  {rankType === 'posts' && (
                    <span style={styles.mainValue}>{student.post_count || 0}개</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 팀 랭킹 */}
      {viewType === 'team' && (
        <div style={styles.rankingList}>
          {teamRanking.map((team, idx) => {
            const rank = idx + 1;
            return (
              <div key={team.team} style={styles.teamRankCard}>
                <div style={styles.rankLeft}>
                  <span style={{
                    ...styles.rankBadge,
                    backgroundColor: getRankBadgeColor(rank),
                    color: rank <= 3 ? '#000' : COLORS.text,
                  }}>
                    {rank}
                  </span>
                  <div style={styles.teamInfo}>
                    <span style={styles.teamName}>{team.team}</span>
                    <span style={styles.teamMembers}>{team.members}명</span>
                  </div>
                </div>
                <div style={styles.teamStats}>
                  <div style={styles.teamStat}>
                    <span style={styles.statValue}>{team.points}</span>
                    <span style={styles.statLabel}>포인트</span>
                  </div>
                  <div style={styles.teamStat}>
                    <span style={styles.statValue}>{team.posts}</span>
                    <span style={styles.statLabel}>포스팅</span>
                  </div>
                </div>
              </div>
            );
          })}
          {teamRanking.length === 0 && (
            <p style={styles.emptyText}>조 배치된 수강생이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '12px',
  },
  toggleGroup: {
    display: 'flex',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    padding: '4px',
  },
  toggleBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  select: {
    padding: '10px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rankCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  rankLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rankBadge: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  treeEmoji: {
    fontSize: '28px',
  },
  studentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  studentMeta: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  rankRight: {
    textAlign: 'right',
  },
  mainValue: {
    color: COLORS.primary,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  teamRankCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  teamInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  teamName: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  teamMembers: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  teamStats: {
    display: 'flex',
    gap: '24px',
  },
  teamStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: '40px',
  },
};

export default Ranking;
