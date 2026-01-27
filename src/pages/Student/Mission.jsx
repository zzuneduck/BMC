// src/pages/Student/Mission.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { useAuth, useMissions, usePoints } from '../../hooks';
import { COLORS, SCHEDULE } from '../../utils/constants';

const Mission = () => {
  const { user } = useAuth();
  const { getMissions, getStudentMissions, completeMission, getStudentProgress } = useMissions();
  const { addPoints } = usePoints();

  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [completedMissions, setCompletedMissions] = useState({});
  const [progress, setProgress] = useState({ total: 0, completed: 0, rate: 0 });
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [completing, setCompleting] = useState(null);

  // 현재 주차 계산
  const getCurrentWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = SCHEDULE.length - 1; i >= 0; i--) {
      const scheduleDate = new Date(SCHEDULE[i].date);
      if (today >= scheduleDate) {
        return SCHEDULE[i].week;
      }
    }
    return 0;
  };

  useEffect(() => {
    const currentWeek = getCurrentWeek();
    setSelectedWeek(currentWeek);
  }, []);

  useEffect(() => {
    if (user?.id && selectedWeek !== null) {
      loadData();
    }
  }, [user, selectedWeek]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 해당 주차 미션 목록
      const missionsResult = await getMissions(selectedWeek);
      if (missionsResult.success) {
        setMissions(missionsResult.data);
      }

      // 수강생의 미션 완료 현황
      const studentMissionsResult = await getStudentMissions(user.id);
      if (studentMissionsResult.success) {
        const completed = {};
        studentMissionsResult.data.forEach(log => {
          completed[log.mission_id] = log;
        });
        setCompletedMissions(completed);
      }

      // 전체 진행률
      const progressResult = await getStudentProgress(user.id);
      if (progressResult.success) {
        setProgress(progressResult.data);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (mission) => {
    if (completing || completedMissions[mission.id]) return;

    setCompleting(mission.id);
    try {
      const result = await completeMission(user.id, mission.id);
      if (result.success) {
        // 포인트 지급
        if (mission.points > 0) {
          await addPoints(user.id, mission.points, `미션 완료: ${mission.title}`, 'mission');
        }

        // UI 업데이트
        setCompletedMissions(prev => ({
          ...prev,
          [mission.id]: result.data
        }));
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
          rate: Math.round(((prev.completed + 1) / prev.total) * 100)
        }));
      } else {
        alert(result.error || '미션 완료 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('미션 완료 실패:', err);
    } finally {
      setCompleting(null);
    }
  };

  const getMissionIcon = (type) => {
    switch (type) {
      case 'vod': return '📺';
      case 'blog': return '📝';
      case 'comment': return '💬';
      case 'share': return '🔗';
      case 'practice': return '✍️';
      default: return '✅';
    }
  };

  const getMissionTypeLabel = (type) => {
    switch (type) {
      case 'vod': return 'VOD';
      case 'blog': return '블로그';
      case 'comment': return '댓글';
      case 'share': return '공유';
      case 'practice': return '실습';
      default: return '기타';
    }
  };

  // 이번 주차 완료율
  const weeklyCompleted = missions.filter(m => completedMissions[m.id]).length;
  const weeklyRate = missions.length > 0
    ? Math.round((weeklyCompleted / missions.length) * 100)
    : 0;

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>미션</h1>

      {/* 전체 진행률 */}
      <div style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>전체 미션 진행률</span>
          <span style={styles.progressValue}>{progress.completed}/{progress.total}</span>
        </div>
        <div style={styles.progressBarBg}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${progress.rate}%`,
            }}
          />
        </div>
        <span style={styles.progressRate}>{progress.rate}% 완료</span>
      </div>

      {/* 주차 선택 */}
      <div style={styles.weekSelector}>
        {SCHEDULE.map((s) => (
          <button
            key={s.week}
            style={{
              ...styles.weekBtn,
              backgroundColor: selectedWeek === s.week ? COLORS.primary : COLORS.surface,
              color: selectedWeek === s.week ? '#000' : COLORS.text,
            }}
            onClick={() => setSelectedWeek(s.week)}
          >
            {s.week === 0 ? 'OT' : `${s.week}주차`}
          </button>
        ))}
      </div>

      {/* 주차별 진행률 */}
      <div style={styles.weeklyProgress}>
        <span style={styles.weeklyProgressText}>
          {selectedWeek === 0 ? 'OT' : `${selectedWeek}주차`} 미션: {weeklyCompleted}/{missions.length} 완료
        </span>
        {weeklyRate === 100 && (
          <span style={styles.completeBadge}>완료! 🎉</span>
        )}
      </div>

      {/* 미션 목록 */}
      <div style={styles.missionList}>
        {missions.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📋</span>
            <p style={styles.emptyText}>이번 주차 미션이 아직 없습니다.</p>
          </div>
        ) : (
          missions.map((mission) => {
            const isCompleted = !!completedMissions[mission.id];
            const isCompleting = completing === mission.id;

            return (
              <div
                key={mission.id}
                style={{
                  ...styles.missionCard,
                  opacity: isCompleted ? 0.7 : 1,
                  borderColor: isCompleted ? COLORS.secondary : 'transparent',
                }}
              >
                <div style={styles.missionHeader}>
                  <div style={styles.missionLeft}>
                    <span style={styles.missionIcon}>
                      {getMissionIcon(mission.type)}
                    </span>
                    <span style={{
                      ...styles.missionType,
                      backgroundColor: isCompleted ? COLORS.secondary : COLORS.surfaceLight,
                      color: isCompleted ? '#000' : COLORS.textMuted,
                    }}>
                      {getMissionTypeLabel(mission.type)}
                    </span>
                  </div>
                  <div style={styles.missionPoints}>
                    <span style={styles.pointsValue}>+{mission.points}</span>
                    <span style={styles.pointsLabel}>P</span>
                  </div>
                </div>

                <h3 style={styles.missionTitle}>{mission.title}</h3>
                {mission.description && (
                  <p style={styles.missionDesc}>{mission.description}</p>
                )}

                {isCompleted ? (
                  <div style={styles.completedBox}>
                    <span style={styles.completedIcon}>✅</span>
                    <span style={styles.completedText}>완료!</span>
                    <span style={styles.completedDate}>
                      {new Date(completedMissions[mission.id].completed_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ) : (
                  <button
                    style={{
                      ...styles.completeBtn,
                      opacity: isCompleting ? 0.7 : 1,
                    }}
                    onClick={() => handleComplete(mission)}
                    disabled={isCompleting}
                  >
                    {isCompleting ? '처리 중...' : '미션 완료하기'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 안내 */}
      <div style={styles.notice}>
        <p style={styles.noticeTitle}>💡 미션 안내</p>
        <p style={styles.noticeText}>• 미션을 완료하면 포인트를 획득할 수 있어요.</p>
        <p style={styles.noticeText}>• 연속으로 미션을 완료하면 보너스 포인트!</p>
        <p style={styles.noticeText}>• 해당 주차가 지나도 미션 완료가 가능해요.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  progressLabel: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  progressValue: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressRate: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  weekSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  weekBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  weeklyProgress: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  weeklyProgressText: {
    color: COLORS.text,
    fontSize: '14px',
  },
  completeBadge: {
    color: COLORS.secondary,
    fontSize: '14px',
    fontWeight: '600',
  },
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  missionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid transparent',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  missionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  missionIcon: {
    fontSize: '20px',
  },
  missionType: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  missionPoints: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },
  pointsValue: {
    color: COLORS.primary,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  missionTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  missionDesc: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  completeBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  completedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
  completedIcon: {
    fontSize: '16px',
  },
  completedText: {
    color: COLORS.secondary,
    fontSize: '14px',
    fontWeight: '600',
    flex: 1,
  },
  completedDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  notice: {
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  noticeText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 4px 0',
    lineHeight: 1.5,
  },
};

export default Mission;
