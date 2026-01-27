// src/pages/Admin/MissionStatus.jsx
// 미션 현황 페이지

import { useState, useEffect, useMemo } from 'react';
import { Card, Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';
import { formatDate } from '../../utils/helpers';

const MissionStatus = () => {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 미션 목록
      const { data: missionData } = await supabase
        .from('missions')
        .select('*')
        .order('due_date', { ascending: false });

      // 제출 현황
      const { data: submissionData } = await supabase
        .from('mission_submissions')
        .select('*');

      // 학생 목록
      const { data: studentData } = await supabase
        .from('students')
        .select('id, name, team')
        .order('team')
        .order('name');

      setMissions(missionData || []);
      setSubmissions(submissionData || []);
      setStudents(studentData || []);

      if (missionData?.length > 0) {
        setSelectedMission(missionData[0].id);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 팀 목록
  const teams = useMemo(() => {
    const teamSet = new Set(students.map(s => s.team).filter(Boolean));
    return ['all', ...Array.from(teamSet).sort((a, b) => a - b)];
  }, [students]);

  // 선택된 미션의 제출 현황
  const missionSubmissions = useMemo(() => {
    if (!selectedMission) return {};
    const submissionMap = {};
    submissions
      .filter(s => s.mission_id === selectedMission)
      .forEach(s => {
        submissionMap[s.student_id] = s;
      });
    return submissionMap;
  }, [selectedMission, submissions]);

  // 필터링된 학생
  const filteredStudents = useMemo(() => {
    if (selectedTeam === 'all') return students;
    return students.filter(s => String(s.team) === selectedTeam);
  }, [students, selectedTeam]);

  // 통계
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const submitted = filteredStudents.filter(s => missionSubmissions[s.id]).length;
    const excellent = filteredStudents.filter(s => missionSubmissions[s.id]?.is_excellent).length;
    return { total, submitted, excellent, rate: total > 0 ? Math.round((submitted / total) * 100) : 0 };
  }, [filteredStudents, missionSubmissions]);

  // 현재 선택된 미션 정보
  const currentMission = missions.find(m => m.id === selectedMission);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>미션 현황</h1>

      {/* 미션 선택 */}
      <Card>
        <div style={styles.missionSelector}>
          <label style={styles.label}>미션 선택</label>
          <select
            value={selectedMission || ''}
            onChange={(e) => setSelectedMission(e.target.value)}
            style={styles.select}
          >
            {missions.map(mission => (
              <option key={mission.id} value={mission.id}>
                {mission.title} ({formatDate(mission.due_date)})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* 통계 카드 */}
      <div style={styles.statsRow}>
        <Card>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{stats.submitted}/{stats.total}</span>
            <span style={styles.statLabel}>제출 현황</span>
          </div>
        </Card>
        <Card>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: COLORS.primary }}>{stats.rate}%</span>
            <span style={styles.statLabel}>제출률</span>
          </div>
        </Card>
        <Card>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: COLORS.secondary }}>{stats.excellent}</span>
            <span style={styles.statLabel}>우수</span>
          </div>
        </Card>
      </div>

      {/* 팀 필터 */}
      <div style={styles.teamFilter}>
        {teams.map(team => (
          <button
            key={team}
            style={{
              ...styles.teamTab,
              ...(selectedTeam === team ? styles.teamTabActive : {}),
            }}
            onClick={() => setSelectedTeam(team)}
          >
            {team === 'all' ? '전체' : `${team}조`}
          </button>
        ))}
      </div>

      {/* 제출 현황 테이블 */}
      <Card title={currentMission?.title || '미션 선택'}>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={styles.colTeam}>조</span>
            <span style={styles.colName}>이름</span>
            <span style={styles.colStatus}>제출</span>
            <span style={styles.colExcellent}>우수</span>
            <span style={styles.colDate}>제출일</span>
          </div>
          {filteredStudents.map(student => {
            const submission = missionSubmissions[student.id];
            return (
              <div key={student.id} style={styles.tableRow}>
                <span style={styles.colTeam}>{student.team || '-'}</span>
                <span style={styles.colName}>{student.name}</span>
                <span style={styles.colStatus}>
                  {submission ? (
                    <span style={styles.submittedBadge}>O</span>
                  ) : (
                    <span style={styles.notSubmittedBadge}>X</span>
                  )}
                </span>
                <span style={styles.colExcellent}>
                  {submission?.is_excellent && (
                    <span style={styles.excellentBadge}>★</span>
                  )}
                </span>
                <span style={styles.colDate}>
                  {submission ? formatDate(submission.submitted_at) : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
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
    margin: '0 0 24px 0',
  },
  missionSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  select: {
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    margin: '16px 0',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: '13px',
    color: COLORS.textMuted,
  },
  teamFilter: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  teamTab: {
    padding: '8px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '20px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
  teamTabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  tableRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: `1px solid ${COLORS.surface}`,
    alignItems: 'center',
  },
  colTeam: {
    width: '50px',
    textAlign: 'center',
    color: COLORS.text,
  },
  colName: {
    flex: 1,
    color: COLORS.text,
  },
  colStatus: {
    width: '60px',
    textAlign: 'center',
  },
  colExcellent: {
    width: '60px',
    textAlign: 'center',
  },
  colDate: {
    width: '100px',
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  submittedBadge: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    lineHeight: '24px',
    borderRadius: '50%',
    backgroundColor: COLORS.success,
    color: '#000',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  notSubmittedBadge: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    lineHeight: '24px',
    borderRadius: '50%',
    backgroundColor: COLORS.surface,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontSize: '12px',
  },
  excellentBadge: {
    color: COLORS.primary,
    fontSize: '18px',
  },
};

export default MissionStatus;
