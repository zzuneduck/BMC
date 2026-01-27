// src/pages/Student/MainPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Loading } from '../../components/Common';
import { TreeDisplay, MiniTree } from '../../components/Tree';
import { useAuth, useStudents, usePoints, useAttendance } from '../../hooks';
import { COLORS, SCHEDULE } from '../../utils/constants';
import { supabase } from '../../supabase';

const MainPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStudent } = useStudents();
  const { getMyRank } = usePoints();
  const { getStreak, checkIn } = useAttendance();

  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [blogStats, setBlogStats] = useState(null);
  const [ranking, setRanking] = useState({ rank: '-', total: '-', change: 0 });
  const [streak, setStreak] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamRanking, setTeamRanking] = useState({ rank: '-', firstTeam: null });
  const [todoList, setTodoList] = useState({
    attendance: false,
    mission: false,
    vod: false,
  });

  useEffect(() => {
    if (user?.id && user.id !== 'admin') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      // 학생 데이터 로드
      const studentResult = await getStudent(user.id);
      if (studentResult.success) {
        setStudentData(studentResult.data);
      }

      // blogStats는 studentData에서 직접 사용
      if (studentResult.success) {
        setBlogStats({
          post_count: studentResult.data?.post_count || 0,
          tree_level: studentResult.data?.tree_level || 1,
        });
      }

      // 랭킹 계산
      const rankResult = await getMyRank(user.id);
      if (rankResult.success) {
        setRanking({
          rank: rankResult.data.rank,
          total: rankResult.data.totalStudents,
          change: rankResult.data.change || 0,
        });
      }

      // 연속 출석일 및 오늘 출석 여부
      const streakResult = await getStreak(user.id);
      if (streakResult.success) {
        setStreak(streakResult.data.streak);
        setCheckedIn(streakResult.data.checkedInToday || false);
        setTodoList(prev => ({ ...prev, attendance: streakResult.data.checkedInToday || false }));
      }

      // 조 정보 및 조원 로드
      if (studentResult.success && studentResult.data?.team) {
        await loadTeamData(studentResult.data.team);
      }

      // 오늘 할일 체크
      await loadTodoStatus();

    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 조 데이터 로드
  const loadTeamData = async (teamName) => {
    try {
      // 같은 조 멤버들
      const { data: members } = await supabase
        .from('students')
        .select('*')
        .eq('team', teamName)
        .order('total_points', { ascending: false });

      if (members) {
        setTeamMembers(members);
      }

      // 조별 랭킹 계산
      const { data: allStudents } = await supabase
        .from('students')
        .select('team, total_points')
        .not('team', 'is', null);

      if (allStudents) {
        const teamTotals = allStudents.reduce((acc, s) => {
          if (!acc[s.team]) acc[s.team] = 0;
          acc[s.team] += s.total_points || 0;
          return acc;
        }, {});

        const sortedTeams = Object.entries(teamTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([team, points], idx) => ({ team, points, rank: idx + 1 }));

        const myTeamRank = sortedTeams.find(t => t.team === teamName);
        const firstTeam = sortedTeams[0];

        setTeamRanking({
          rank: myTeamRank?.rank || '-',
          firstTeam: firstTeam?.team || null,
        });
      }
    } catch (err) {
      console.error('조 데이터 로드 실패:', err);
    }
  };

  // 오늘 할일 상태 로드
  const loadTodoStatus = async () => {
    const today = new Date().toISOString().split('T')[0];

    try {
      // 미션 완료 여부
      const { data: missionData } = await supabase
        .from('mission_submissions')
        .select('id')
        .eq('student_id', user.id)
        .eq('date', today)
        .single();

      // VOD 숙제 완료 여부
      const { data: vodData } = await supabase
        .from('vod_progress')
        .select('id')
        .eq('student_id', user.id)
        .eq('completed_date', today)
        .single();

      setTodoList(prev => ({
        ...prev,
        mission: !!missionData,
        vod: !!vodData,
      }));
    } catch (err) {
      // 에러 무시 (데이터 없음)
    }
  };

  // 출석 체크
  const handleCheckIn = async () => {
    if (checkingIn || checkedIn) return;

    setCheckingIn(true);
    try {
      const result = await checkIn(user.id);
      if (result.success) {
        setCheckedIn(true);
        setStreak(result.data.streakDays);
        setTodoList(prev => ({ ...prev, attendance: true }));

        // 학생 데이터 새로고침 (포인트 반영)
        const studentResult = await getStudent(user.id);
        if (studentResult.success) {
          setStudentData(studentResult.data);
        }

        // 포인트 획득 알림 (보너스 포함)
        const totalEarned = result.data.basePoints + result.data.bonusPoints;
        if (result.data.bonusPoints > 0) {
          alert(`출석 완료! +${result.data.basePoints}점\n${result.data.streakDays}일 연속 출석 보너스 +${result.data.bonusPoints}점\n총 ${totalEarned}점 획득!`);
        }
      } else {
        if (result.error === '오늘 이미 출석했습니다.') {
          setCheckedIn(true);
          setTodoList(prev => ({ ...prev, attendance: true }));
        }
      }
    } catch (err) {
      console.error('출석 체크 실패:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const postCount = blogStats?.post_count || 0;
  const totalPoints = studentData?.total_points || 0;

  return (
    <div style={styles.container}>
      {/* 상단 환영 메시지 */}
      <div style={styles.welcomeSection}>
        <p style={styles.memberBadge}>1기 평생 멤버</p>
        <h1 style={styles.welcomeTitle}>
          <span style={styles.highlight}>{user?.name}</span>님, 환영합니다 👋
        </h1>
      </div>

      {/* 나의 성장 나무 */}
      <TreeDisplay
        postCount={postCount}
        points={totalPoints}
        name={user?.name}
      />

      {/* 오늘 할 일 체크리스트 */}
      <Card title="오늘 할 일">
        <div style={styles.todoList}>
          <div
            style={{
              ...styles.todoItem,
              backgroundColor: todoList.attendance ? COLORS.surfaceLight : COLORS.surface,
              cursor: todoList.attendance ? 'default' : 'pointer',
            }}
            onClick={!checkedIn ? handleCheckIn : undefined}
          >
            <span style={styles.todoCheck}>
              {todoList.attendance ? '✅' : '⬜'}
            </span>
            <span style={{
              ...styles.todoText,
              textDecoration: todoList.attendance ? 'line-through' : 'none',
              color: todoList.attendance ? COLORS.textMuted : COLORS.text,
            }}>
              {todoList.attendance ? '출석 완료 ✅' : '출석체크'}
            </span>
            {!todoList.attendance && (
              <span style={styles.todoAction}>
                {checkingIn ? '처리중...' : '체크하기'}
              </span>
            )}
          </div>

          <div
            style={{
              ...styles.todoItem,
              backgroundColor: todoList.mission ? COLORS.surfaceLight : COLORS.surface,
            }}
            onClick={() => !todoList.mission && navigate('/student/mission')}
          >
            <span style={styles.todoCheck}>
              {todoList.mission ? '✅' : '⬜'}
            </span>
            <span style={{
              ...styles.todoText,
              textDecoration: todoList.mission ? 'line-through' : 'none',
              color: todoList.mission ? COLORS.textMuted : COLORS.text,
            }}>
              미션완료
            </span>
            {!todoList.mission && (
              <span style={styles.todoAction}>제출하기</span>
            )}
          </div>

          <div
            style={{
              ...styles.todoItem,
              backgroundColor: todoList.vod ? COLORS.surfaceLight : COLORS.surface,
            }}
            onClick={() => !todoList.vod && navigate('/student/vod')}
          >
            <span style={styles.todoCheck}>
              {todoList.vod ? '✅' : '⬜'}
            </span>
            <span style={{
              ...styles.todoText,
              textDecoration: todoList.vod ? 'line-through' : 'none',
              color: todoList.vod ? COLORS.textMuted : COLORS.text,
            }}>
              VOD숙제
            </span>
            {!todoList.vod && (
              <span style={styles.todoAction}>학습하기</span>
            )}
          </div>
        </div>
      </Card>

      {/* 내 순위 카드 */}
      <Card>
        <div style={styles.rankCard}>
          <div style={styles.rankLeft}>
            <span style={styles.rankIcon}>🏆</span>
            <div style={styles.rankInfo}>
              <span style={styles.rankLabel}>내 순위</span>
              <span style={styles.rankValue}>
                {ranking.rank}위 <span style={styles.rankTotal}>/ {ranking.total}명</span>
              </span>
            </div>
          </div>
          <div style={styles.rankRight}>
            <span style={styles.rankPoints}>{totalPoints.toLocaleString()}점</span>
            {ranking.change !== 0 && (
              <span style={{
                ...styles.rankChange,
                color: ranking.change > 0 ? COLORS.secondary : COLORS.error,
              }}>
                {ranking.change > 0 ? `↑${ranking.change}` : `↓${Math.abs(ranking.change)}`}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 우리 조 카드 */}
      {studentData?.team && (
        <Card title={`우리 조 - ${studentData.team}`}>
          <div style={styles.teamCard}>
            <div style={styles.teamHeader}>
              <span style={styles.teamRank}>조 순위: {teamRanking.rank}등</span>
            </div>
            <div style={styles.teamMembers}>
              {teamMembers.slice(0, 5).map((member) => (
                <MiniTree
                  key={member.id}
                  postCount={member.post_count || 0}
                  points={member.total_points || 0}
                  name={member.name}
                />
              ))}
            </div>
            {teamMembers.length > 5 && (
              <p style={styles.moreMembers}>+{teamMembers.length - 5}명 더</p>
            )}
          </div>
        </Card>
      )}

      {/* 조별 1등 보상 안내 */}
      <div style={styles.rewardBanner}>
        <div style={styles.rewardIcon}>🏆</div>
        <div style={styles.rewardContent}>
          <p style={styles.rewardTitle}>조별 1등 보상</p>
          <p style={styles.rewardText}>미슐랭 출신 셰프 매장 식사!</p>
          {teamRanking.firstTeam && (
            <p style={styles.rewardCurrent}>
              현재 1위: <span style={styles.highlight}>{teamRanking.firstTeam}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    paddingBottom: '100px',
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  welcomeSection: {
    textAlign: 'center',
    padding: '10px 0 20px',
  },
  memberBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  welcomeTitle: {
    fontSize: '22px',
    color: COLORS.text,
    margin: 0,
    fontWeight: '600',
  },
  highlight: {
    color: COLORS.primary,
  },
  // 오늘 할 일
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  todoCheck: {
    fontSize: '20px',
    marginRight: '12px',
  },
  todoText: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '500',
  },
  todoAction: {
    fontSize: '13px',
    color: COLORS.primary,
    fontWeight: '600',
  },
  // 내 순위 카드
  rankCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rankIcon: {
    fontSize: '36px',
  },
  rankInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  rankLabel: {
    fontSize: '12px',
    color: COLORS.textMuted,
    marginBottom: '2px',
  },
  rankValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rankTotal: {
    fontSize: '14px',
    color: COLORS.textMuted,
    fontWeight: 'normal',
  },
  rankRight: {
    textAlign: 'right',
  },
  rankPoints: {
    display: 'block',
    fontSize: '22px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rankChange: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '4px',
    display: 'block',
  },
  // 우리 조 카드
  teamCard: {},
  teamHeader: {
    marginBottom: '16px',
  },
  teamRank: {
    fontSize: '14px',
    color: COLORS.textMuted,
  },
  teamMembers: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  moreMembers: {
    textAlign: 'center',
    fontSize: '13px',
    color: COLORS.textMuted,
    marginTop: '8px',
  },
  // 보상 배너
  rewardBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    border: `2px solid ${COLORS.primary}`,
  },
  rewardIcon: {
    fontSize: '48px',
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: '14px',
    color: COLORS.textMuted,
    margin: '0 0 4px 0',
  },
  rewardText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: COLORS.text,
    margin: '0 0 8px 0',
  },
  rewardCurrent: {
    fontSize: '13px',
    color: COLORS.textMuted,
    margin: 0,
  },
};

export default MainPage;
