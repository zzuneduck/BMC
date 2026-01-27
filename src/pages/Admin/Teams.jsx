// src/pages/Admin/Teams.jsx
import React, { useState, useEffect } from 'react';
import { Card, Loading } from '../../components/Common';
import { useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { shuffleArray } from '../../utils/helpers';

const TEAM_NAMES = ['1조', '2조', '3조', '4조'];

const Teams = () => {
  const { students, loading, fetchStudents, updateStudent } = useStudents();
  const [saving, setSaving] = useState(false);
  const [draggedStudent, setDraggedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  // 조별 그룹핑
  const groupedByTeam = students.reduce((acc, s) => {
    const team = s.team || '미배정';
    if (!acc[team]) acc[team] = [];
    acc[team].push(s);
    return acc;
  }, {});

  // 랜덤 배치
  const autoAssign = async () => {
    if (!confirm('모든 수강생을 4개 조에 랜덤 배치하시겠습니까?')) return;

    setSaving(true);
    try {
      const shuffled = shuffleArray([...students]);

      for (let i = 0; i < shuffled.length; i++) {
        const teamIndex = i % 4;
        await updateStudent(shuffled[i].id, {
          team: TEAM_NAMES[teamIndex],
          is_leader: false, // 랜덤 배치 시 조장 초기화
        });
      }

      await fetchStudents();
    } catch (err) {
      console.error('자동 배치 실패:', err);
      alert('배치 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 조 변경
  const changeTeam = async (studentId, newTeam) => {
    try {
      await updateStudent(studentId, {
        team: newTeam || null,
        is_leader: newTeam ? undefined : false, // 미배정 시 조장 해제
      });
      await fetchStudents();
    } catch (err) {
      console.error('조 변경 실패:', err);
    }
  };

  // 조장 지정/해제
  const toggleLeader = async (student) => {
    if (!student.team) {
      alert('조에 배정된 수강생만 조장으로 지정할 수 있습니다.');
      return;
    }

    try {
      // 같은 조의 다른 조장 해제
      if (!student.is_leader) {
        const sameTeamStudents = students.filter(s => s.team === student.team && s.is_leader);
        for (const s of sameTeamStudents) {
          await updateStudent(s.id, { is_leader: false });
        }
      }

      await updateStudent(student.id, { is_leader: !student.is_leader });
      await fetchStudents();
    } catch (err) {
      console.error('조장 지정 실패:', err);
    }
  };

  // 전체 초기화
  const resetAll = async () => {
    if (!confirm('모든 조 배치를 초기화하시겠습니까?')) return;

    setSaving(true);
    try {
      for (const student of students) {
        await updateStudent(student.id, { team: null, is_leader: false });
      }
      await fetchStudents();
    } catch (err) {
      console.error('초기화 실패:', err);
    } finally {
      setSaving(false);
    }
  };

  // 드래그 시작
  const handleDragStart = (student) => {
    setDraggedStudent(student);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedStudent(null);
  };

  // 드롭
  const handleDrop = async (targetTeam) => {
    if (!draggedStudent || draggedStudent.team === targetTeam) {
      setDraggedStudent(null);
      return;
    }

    try {
      await updateStudent(draggedStudent.id, {
        team: targetTeam === '미배정' ? null : targetTeam,
        is_leader: targetTeam === '미배정' ? false : draggedStudent.is_leader,
      });
      await fetchStudents();
    } catch (err) {
      console.error('조 이동 실패:', err);
    }
    setDraggedStudent(null);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const assignedCount = students.filter(s => s.team).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>조 배치</h1>
      <p style={styles.subtitle}>
        배치됨 {assignedCount}/{students.length}명
      </p>

      {/* 액션 버튼 */}
      <Card>
        <div style={styles.actionRow}>
          <div style={styles.actionInfo}>
            <h3 style={styles.cardTitle}>조 관리</h3>
            <p style={styles.hint}>
              * 드래그하여 조를 이동하거나 셀렉트박스로 변경할 수 있습니다.
            </p>
          </div>
          <div style={styles.actionBtns}>
            <button
              style={styles.autoBtn}
              onClick={autoAssign}
              disabled={saving}
            >
              {saving ? '배치 중...' : '랜덤 배치'}
            </button>
            <button
              style={styles.resetBtn}
              onClick={resetAll}
              disabled={saving}
            >
              초기화
            </button>
          </div>
        </div>
      </Card>

      {/* 조별 현황 요약 */}
      <div style={styles.summaryGrid}>
        {TEAM_NAMES.map((teamName) => {
          const teamStudents = groupedByTeam[teamName] || [];
          const leader = teamStudents.find(s => s.is_leader);
          const teamPoints = teamStudents.reduce((sum, s) => sum + (s.total_points || 0), 0);

          return (
            <div key={teamName} style={styles.summaryCard}>
              <div style={styles.summaryHeader}>
                <span style={styles.summaryTeam}>{teamName}</span>
                <span style={styles.summaryCount}>{teamStudents.length}명</span>
              </div>
              <div style={styles.summaryBody}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>조장</span>
                  <span style={styles.summaryValue}>
                    {leader ? leader.name : '-'}
                  </span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>총 포인트</span>
                  <span style={styles.summaryPoints}>{teamPoints}P</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 미배정 수강생 */}
      {groupedByTeam['미배정'] && groupedByTeam['미배정'].length > 0 && (
        <div
          style={styles.teamSection}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop('미배정')}
        >
          <h3 style={styles.teamTitle}>
            미배정
            <span style={styles.teamCount}>({groupedByTeam['미배정'].length}명)</span>
          </h3>
          <div style={styles.studentGrid}>
            {groupedByTeam['미배정'].map(student => (
              <div
                key={student.id}
                style={styles.studentCard}
                draggable
                onDragStart={() => handleDragStart(student)}
                onDragEnd={handleDragEnd}
              >
                <span style={styles.studentName}>{student.name}</span>
                <select
                  value=""
                  onChange={(e) => changeTeam(student.id, e.target.value)}
                  style={styles.teamSelect}
                >
                  <option value="">조 선택</option>
                  {TEAM_NAMES.map((tn) => (
                    <option key={tn} value={tn}>{tn}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 조별 목록 */}
      {TEAM_NAMES.map((teamName) => {
        const teamStudents = groupedByTeam[teamName] || [];
        const teamPoints = teamStudents.reduce((sum, s) => sum + (s.total_points || 0), 0);
        const leader = teamStudents.find(s => s.is_leader);

        return (
          <div
            key={teamName}
            style={{
              ...styles.teamSection,
              backgroundColor: draggedStudent && draggedStudent.team !== teamName
                ? 'rgba(255, 197, 0, 0.1)'
                : 'transparent',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(teamName)}
          >
            <div style={styles.teamHeader}>
              <h3 style={styles.teamTitle}>
                {teamName}
                <span style={styles.teamCount}>({teamStudents.length}명)</span>
                {leader && (
                  <span style={styles.leaderBadge}>조장: {leader.name}</span>
                )}
              </h3>
              <span style={styles.teamPoints}>{teamPoints}P</span>
            </div>
            <div style={styles.studentGrid}>
              {teamStudents
                .sort((a, b) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0))
                .map(student => (
                  <div
                    key={student.id}
                    style={{
                      ...styles.studentCard,
                      borderColor: student.is_leader ? COLORS.primary : 'transparent',
                    }}
                    draggable
                    onDragStart={() => handleDragStart(student)}
                    onDragEnd={handleDragEnd}
                  >
                    <div style={styles.studentInfo}>
                      <div style={styles.studentNameRow}>
                        <span style={styles.studentName}>{student.name}</span>
                        {student.is_leader && (
                          <span style={styles.crownBadge}>👑</span>
                        )}
                      </div>
                      <span style={styles.studentPoints}>{student.total_points || 0}P</span>
                    </div>
                    <div style={styles.studentActions}>
                      <button
                        style={{
                          ...styles.leaderBtn,
                          backgroundColor: student.is_leader ? COLORS.primary : COLORS.surfaceLight,
                          color: student.is_leader ? '#000' : COLORS.text,
                        }}
                        onClick={() => toggleLeader(student)}
                      >
                        {student.is_leader ? '조장 해제' : '조장 지정'}
                      </button>
                      <select
                        value={student.team || ''}
                        onChange={(e) => changeTeam(student.id, e.target.value)}
                        style={styles.teamSelect}
                      >
                        <option value="">미배정</option>
                        {TEAM_NAMES.map((tn) => (
                          <option key={tn} value={tn}>{tn}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              {teamStudents.length === 0 && (
                <div style={styles.emptyTeam}>
                  <p style={styles.emptyText}>수강생을 드래그하여 배치하세요</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
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
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 20px 0',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  actionInfo: {},
  cardTitle: {
    color: COLORS.text,
    fontSize: '16px',
    margin: '0 0 4px 0',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: 0,
  },
  actionBtns: {
    display: 'flex',
    gap: '12px',
  },
  autoBtn: {
    padding: '10px 20px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  resetBtn: {
    padding: '10px 20px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  summaryTeam: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  summaryCount: {
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: 'bold',
  },
  summaryBody: {},
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: '13px',
    fontWeight: '500',
  },
  summaryPoints: {
    color: COLORS.primary,
    fontSize: '13px',
    fontWeight: 'bold',
  },
  teamSection: {
    marginBottom: '24px',
    padding: '16px',
    borderRadius: '12px',
    transition: 'background-color 0.2s',
  },
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  teamTitle: {
    color: COLORS.text,
    fontSize: '18px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  teamCount: {
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: 'normal',
  },
  leaderBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginLeft: '8px',
  },
  teamPoints: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  studentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  studentCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    border: '2px solid transparent',
    cursor: 'grab',
    transition: 'border-color 0.2s',
  },
  studentInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  crownBadge: {
    fontSize: '14px',
  },
  studentPoints: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  studentActions: {
    display: 'flex',
    gap: '8px',
  },
  leaderBtn: {
    flex: 1,
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  teamSelect: {
    padding: '6px 10px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '12px',
  },
  emptyTeam: {
    gridColumn: '1 / -1',
    padding: '40px 20px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    border: `2px dashed ${COLORS.surfaceLight}`,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
};

export default Teams;
