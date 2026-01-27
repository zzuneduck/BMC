// src/components/Tree/ForestView.jsx
// 전체 수강생 나무 Grid 표시

import { useState, useMemo } from 'react';
import MiniTree from './MiniTree';
import TreeDisplay from './TreeDisplay';
import { COLORS } from '../../utils/constants';
import { groupBy } from '../../utils/helpers';

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: COLORS.background,
    minHeight: '100vh',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '1rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: `1px solid ${COLORS.surfaceLight}`,
    backgroundColor: 'transparent',
    color: COLORS.textMuted,
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    border: `1px solid ${COLORS.primary}`,
    fontWeight: 'bold',
  },
  groupSection: {
    marginBottom: '2rem',
  },
  groupTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '1rem',
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.textMuted,
    padding: '3rem',
  },
  // 모달 스타일
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    position: 'relative',
    maxWidth: '400px',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: '-40px',
    right: '0',
    background: 'none',
    border: 'none',
    color: COLORS.text,
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
  },
};

export default function ForestView({ students = [], teams = [] }) {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // 조별로 그룹핑
  const groupedStudents = useMemo(() => {
    if (!students.length) return {};
    return groupBy(students, 'team');
  }, [students]);

  // 필터링된 학생들
  const filteredStudents = useMemo(() => {
    if (selectedTeam === 'all') return students;
    return students.filter(s => String(s.team) === selectedTeam);
  }, [students, selectedTeam]);

  // 필터링된 그룹
  const filteredGroups = useMemo(() => {
    if (selectedTeam === 'all') return groupedStudents;
    return { [selectedTeam]: groupedStudents[selectedTeam] || [] };
  }, [groupedStudents, selectedTeam]);

  // 탭 목록 생성
  const tabList = useMemo(() => {
    const tabs = [{ id: 'all', name: '전체' }];

    // teams 배열이 있으면 사용, 없으면 groupedStudents에서 추출
    if (teams.length > 0) {
      teams.forEach(team => {
        tabs.push({ id: String(team.id || team), name: team.name || `${team}조` });
      });
    } else {
      Object.keys(groupedStudents)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(teamId => {
          tabs.push({ id: teamId, name: `${teamId}조` });
        });
    }

    return tabs;
  }, [teams, groupedStudents]);

  const handleTreeClick = (student) => {
    setSelectedStudent(student);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
  };

  if (!students.length) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          아직 등록된 수강생이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 헤더 & 탭 */}
      <div style={styles.header}>
        <div style={styles.title}>🌲 우리의 숲</div>
        <div style={styles.tabs}>
          {tabList.map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(selectedTeam === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setSelectedTeam(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 그룹별 나무 그리드 */}
      {Object.entries(filteredGroups)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([teamId, teamStudents]) => (
          <div key={teamId} style={styles.groupSection}>
            {selectedTeam === 'all' && (
              <div style={styles.groupTitle}>{teamId}조</div>
            )}
            <div style={styles.grid}>
              {teamStudents.map(student => (
                <MiniTree
                  key={student.id}
                  postCount={student.postCount || 0}
                  points={student.points || 0}
                  name={student.name}
                  onClick={() => handleTreeClick(student)}
                />
              ))}
            </div>
          </div>
        ))}

      {/* 상세 보기 모달 */}
      {selectedStudent && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={handleCloseModal}>
              ✕
            </button>
            <TreeDisplay
              postCount={selectedStudent.postCount || 0}
              points={selectedStudent.points || 0}
              name={selectedStudent.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
