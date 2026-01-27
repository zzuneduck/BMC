// src/pages/Student/Ranking.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { useAuth, useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { getTreeLevel } from '../../utils/helpers';
import { supabase } from '../../supabase';

const Ranking = () => {
  const { user } = useAuth();
  const { students, loading, fetchStudents } = useStudents();
  const [activeTab, setActiveTab] = useState('individual'); // individual, team
  const [myRank, setMyRank] = useState(null);
  const [prevRanks, setPrevRanks] = useState({});

  useEffect(() => {
    fetchStudents();
    loadPrevRanks();
  }, []);

  // 이전 랭킹 데이터 로드 (포인트 로그 기반 - 간단한 시뮬레이션)
  const loadPrevRanks = async () => {
    try {
      // 실제로는 별도 테이블에서 이전 랭킹을 저장/조회해야 함
      // 여기서는 임시로 랜덤 변동 표시
      const { data } = await supabase
        .from('students')
        .select('id');

      if (data) {
        const ranks = {};
        data.forEach(s => {
          // 랜덤 변동: -2 ~ +2
          ranks[s.id] = Math.floor(Math.random() * 5) - 2;
        });
        setPrevRanks(ranks);
      }
    } catch (err) {
      console.error('이전 랭킹 로드 실패:', err);
    }
  };

  // 개인 랭킹 정렬 (포인트순)
  const sortedStudents = [...students].sort((a, b) =>
    (b.total_points || 0) - (a.total_points || 0)
  );

  // 내 순위 찾기
  useEffect(() => {
    if (user?.id && sortedStudents.length > 0) {
      const myIndex = sortedStudents.findIndex(s => s.id === user.id);
      if (myIndex !== -1) {
        setMyRank({
          rank: myIndex + 1,
          student: sortedStudents[myIndex],
          change: prevRanks[user.id] || 0,
        });
      }
    }
  }, [user?.id, sortedStudents, prevRanks]);

  // 조별 랭킹 계산
  const teamRanking = Object.entries(
    students.reduce((acc, s) => {
      if (!s.team) return acc;
      if (!acc[s.team]) {
        acc[s.team] = { team: s.team, points: 0, members: [], avgPoints: 0 };
      }
      acc[s.team].points += s.total_points || 0;
      acc[s.team].members.push(s);
      return acc;
    }, {})
  )
    .map(([_, data]) => ({
      ...data,
      avgPoints: Math.round(data.points / data.members.length),
    }))
    .sort((a, b) => b.points - a.points);

  // 내 조 찾기
  const myTeam = user?.id ? students.find(s => s.id === user.id)?.team : null;
  const myTeamRank = myTeam ? teamRanking.findIndex(t => t.team === myTeam) + 1 : null;

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { backgroundColor: '#ffd700', color: '#000' };
    if (rank === 2) return { backgroundColor: '#c0c0c0', color: '#000' };
    if (rank === 3) return { backgroundColor: '#cd7f32', color: '#000' };
    return { backgroundColor: COLORS.surfaceLight, color: COLORS.text };
  };

  const getRankChangeDisplay = (change) => {
    if (change > 0) return { text: `+${change}`, color: COLORS.secondary };
    if (change < 0) return { text: `${change}`, color: COLORS.error };
    return { text: '-', color: COLORS.textMuted };
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>랭킹</h1>

      {/* 탭 */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'individual' ? COLORS.primary : 'transparent',
            color: activeTab === 'individual' ? '#000' : COLORS.text,
          }}
          onClick={() => setActiveTab('individual')}
        >
          개인 랭킹
        </button>
        <button
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'team' ? COLORS.primary : 'transparent',
            color: activeTab === 'team' ? '#000' : COLORS.text,
          }}
          onClick={() => setActiveTab('team')}
        >
          조별 랭킹
        </button>
      </div>

      {/* 개인 랭킹 */}
      {activeTab === 'individual' && (
        <>
          {/* 내 순위 카드 */}
          {myRank && (
            <div style={styles.myRankCard}>
              <div style={styles.myRankHeader}>
                <span style={styles.myRankLabel}>내 순위</span>
                {myRank.change !== 0 && (
                  <span style={{
                    ...styles.rankChange,
                    color: getRankChangeDisplay(myRank.change).color,
                  }}>
                    {myRank.change > 0 ? '↑' : '↓'} {Math.abs(myRank.change)}
                  </span>
                )}
              </div>
              <div style={styles.myRankContent}>
                <span style={styles.myRankNumber}>{myRank.rank}위</span>
                <span style={styles.myRankTotal}>/ {sortedStudents.length}명</span>
              </div>
              <div style={styles.myRankPoints}>
                {myRank.student.total_points || 0}P
              </div>
            </div>
          )}

          {/* TOP 10 */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>TOP 10</span>
          </div>
          <div style={styles.rankingList}>
            {sortedStudents.slice(0, 10).map((student, idx) => {
              const rank = idx + 1;
              const treeLevel = getTreeLevel(student.post_count || 0);
              const isMe = student.id === user?.id;
              const change = prevRanks[student.id] || 0;

              return (
                <div
                  key={student.id}
                  style={{
                    ...styles.rankCard,
                    backgroundColor: isMe ? COLORS.surfaceLight : COLORS.surface,
                    borderColor: isMe ? COLORS.primary : 'transparent',
                  }}
                >
                  <div style={styles.rankLeft}>
                    <div style={{
                      ...styles.rankBadge,
                      ...getRankBadgeStyle(rank),
                    }}>
                      {rank}
                    </div>
                    <span style={styles.treeEmoji}>{treeLevel.emoji}</span>
                    <div style={styles.studentInfo}>
                      <span style={styles.studentName}>
                        {student.name}
                        {isMe && <span style={styles.meTag}> (나)</span>}
                      </span>
                      <span style={styles.studentTeam}>{student.team || '미배정'}</span>
                    </div>
                  </div>
                  <div style={styles.rankRight}>
                    <span style={styles.rankPoints}>{student.total_points || 0}P</span>
                    {change !== 0 && (
                      <span style={{
                        ...styles.changeIndicator,
                        color: getRankChangeDisplay(change).color,
                      }}>
                        {change > 0 ? '↑' : '↓'}{Math.abs(change)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 내 순위가 10위 밖이면 표시 */}
          {myRank && myRank.rank > 10 && (
            <>
              <div style={styles.divider}>
                <span style={styles.dividerText}>...</span>
              </div>
              <div style={{
                ...styles.rankCard,
                backgroundColor: COLORS.surfaceLight,
                borderColor: COLORS.primary,
              }}>
                <div style={styles.rankLeft}>
                  <div style={{
                    ...styles.rankBadge,
                    ...getRankBadgeStyle(myRank.rank),
                  }}>
                    {myRank.rank}
                  </div>
                  <span style={styles.treeEmoji}>
                    {getTreeLevel(myRank.student.post_count || 0).emoji}
                  </span>
                  <div style={styles.studentInfo}>
                    <span style={styles.studentName}>
                      {myRank.student.name}
                      <span style={styles.meTag}> (나)</span>
                    </span>
                    <span style={styles.studentTeam}>{myRank.student.team || '미배정'}</span>
                  </div>
                </div>
                <div style={styles.rankRight}>
                  <span style={styles.rankPoints}>{myRank.student.total_points || 0}P</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* 조별 랭킹 */}
      {activeTab === 'team' && (
        <>
          {/* 내 조 순위 카드 */}
          {myTeamRank && (
            <div style={styles.myRankCard}>
              <div style={styles.myRankHeader}>
                <span style={styles.myRankLabel}>우리 조 ({myTeam})</span>
              </div>
              <div style={styles.myRankContent}>
                <span style={styles.myRankNumber}>{myTeamRank}위</span>
                <span style={styles.myRankTotal}>/ {teamRanking.length}조</span>
              </div>
            </div>
          )}

          {/* 조별 순위 */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>조별 순위</span>
          </div>
          <div style={styles.rankingList}>
            {teamRanking.map((team, idx) => {
              const rank = idx + 1;
              const isMyTeam = team.team === myTeam;

              return (
                <div
                  key={team.team}
                  style={{
                    ...styles.teamRankCard,
                    backgroundColor: isMyTeam ? COLORS.surfaceLight : COLORS.surface,
                    borderColor: isMyTeam ? COLORS.primary : 'transparent',
                  }}
                >
                  <div style={styles.rankLeft}>
                    <div style={{
                      ...styles.rankBadge,
                      ...getRankBadgeStyle(rank),
                    }}>
                      {rank}
                    </div>
                    <div style={styles.teamInfo}>
                      <span style={styles.teamName}>
                        {team.team}
                        {isMyTeam && <span style={styles.meTag}> (우리 조)</span>}
                      </span>
                      <span style={styles.teamMembers}>{team.members.length}명</span>
                    </div>
                  </div>
                  <div style={styles.teamStats}>
                    <div style={styles.teamStat}>
                      <span style={styles.statValue}>{team.points.toLocaleString()}</span>
                      <span style={styles.statLabel}>총 포인트</span>
                    </div>
                    <div style={styles.teamStat}>
                      <span style={styles.statValue}>{team.avgPoints}</span>
                      <span style={styles.statLabel}>평균</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {teamRanking.length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>아직 조가 배정되지 않았습니다.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    paddingBottom: '100px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  myRankCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: `2px solid ${COLORS.primary}`,
  },
  myRankHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  myRankLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  rankChange: {
    fontSize: '14px',
    fontWeight: '600',
  },
  myRankContent: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  myRankNumber: {
    color: COLORS.primary,
    fontSize: '36px',
    fontWeight: 'bold',
  },
  myRankTotal: {
    color: COLORS.textMuted,
    fontSize: '16px',
  },
  myRankPoints: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '8px',
  },
  sectionHeader: {
    marginBottom: '12px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rankCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    border: '2px solid transparent',
  },
  rankLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rankBadge: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontSize: '13px',
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
    fontSize: '15px',
    fontWeight: '600',
  },
  meTag: {
    color: COLORS.primary,
    fontSize: '13px',
  },
  studentTeam: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  rankRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  rankPoints: {
    color: COLORS.primary,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  changeIndicator: {
    fontSize: '12px',
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    padding: '10px 0',
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: '20px',
    letterSpacing: '4px',
  },
  teamRankCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    border: '2px solid transparent',
  },
  teamInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  teamName: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  teamMembers: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  teamStats: {
    display: 'flex',
    gap: '20px',
  },
  teamStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '10px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
};

export default Ranking;
