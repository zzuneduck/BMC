// src/pages/Admin/Forest.jsx
import React, { useState, useEffect } from 'react';
import { Loading, Modal } from '../../components/Common';
import { MiniTree } from '../../components/Tree';
import { useStudents } from '../../hooks';
import { COLORS, TREE_LEVELS } from '../../utils/constants';
import { getTreeLevel } from '../../utils/helpers';

const Forest = () => {
  const { students, loading, fetchStudents } = useStudents();
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedTree, setSelectedTree] = useState(null);
  const [sortBy, setSortBy] = useState('posts'); // posts, points, name

  useEffect(() => {
    fetchStudents();
  }, []);

  // 팀 목록 추출
  const teams = [...new Set(students.map(s => s.team).filter(Boolean))].sort();

  // 필터링 & 정렬
  const filteredStudents = students
    .filter(s => {
      if (filterTeam !== 'all' && s.team !== filterTeam) return false;
      if (filterLevel !== 'all') {
        const level = getTreeLevel(s.post_count || 0);
        if (level.level !== parseInt(filterLevel)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return (b.total_points || 0) - (a.total_points || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default: // posts
          return (b.post_count || 0) - (a.post_count || 0);
      }
    });

  // 레벨별 통계
  const levelStats = TREE_LEVELS.map(level => ({
    ...level,
    count: students.filter(s => {
      const l = getTreeLevel(s.post_count || 0);
      return l.level === level.level;
    }).length,
  }));

  // 전체 통계
  const totalStats = {
    students: students.length,
    totalPosts: students.reduce((sum, s) => sum + (s.post_count || 0), 0),
    avgPosts: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.post_count || 0), 0) / students.length)
      : 0,
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>성장 나무 숲</h1>
          <p style={styles.subtitle}>
            총 {totalStats.students}그루 | 전체 포스팅 {totalStats.totalPosts}개 | 평균 {totalStats.avgPosts}개
          </p>
        </div>
      </div>

      {/* 레벨별 통계 */}
      <div style={styles.levelStats}>
        <div
          style={{
            ...styles.levelCard,
            backgroundColor: filterLevel === 'all' ? COLORS.primary : COLORS.surface,
          }}
          onClick={() => setFilterLevel('all')}
        >
          <span style={styles.levelEmoji}>🌳</span>
          <span style={{
            ...styles.levelCount,
            color: filterLevel === 'all' ? '#000' : COLORS.text,
          }}>
            전체
          </span>
        </div>
        {levelStats.map(level => (
          <div
            key={level.level}
            style={{
              ...styles.levelCard,
              backgroundColor: filterLevel === String(level.level) ? COLORS.primary : COLORS.surface,
            }}
            onClick={() => setFilterLevel(
              filterLevel === String(level.level) ? 'all' : String(level.level)
            )}
          >
            <span style={styles.levelEmoji}>{level.emoji}</span>
            <span style={{
              ...styles.levelCount,
              color: filterLevel === String(level.level) ? '#000' : COLORS.text,
            }}>
              {level.count}
            </span>
          </div>
        ))}
      </div>

      {/* 필터 바 */}
      <div style={styles.filterBar}>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          style={styles.select}
        >
          <option value="all">전체 조</option>
          {teams.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.select}
        >
          <option value="posts">포스팅순</option>
          <option value="points">포인트순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {/* 필터 상태 표시 */}
      {(filterTeam !== 'all' || filterLevel !== 'all') && (
        <div style={styles.filterInfo}>
          <span>
            {filterTeam !== 'all' && `${filterTeam} `}
            {filterLevel !== 'all' && `Lv.${filterLevel} `}
            나무 {filteredStudents.length}그루
          </span>
          <button
            style={styles.clearFilter}
            onClick={() => {
              setFilterTeam('all');
              setFilterLevel('all');
            }}
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* 나무 숲 Grid - MiniTree 사용 */}
      <div style={styles.forest}>
        {filteredStudents.map(student => (
          <MiniTree
            key={student.id}
            postCount={student.post_count || 0}
            points={student.total_points || 0}
            name={student.name}
            onClick={() => setSelectedTree(student)}
          />
        ))}
        {filteredStudents.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🌲</span>
            <p style={styles.emptyText}>해당 조건의 나무가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 나무 상세 모달 */}
      <Modal
        isOpen={!!selectedTree}
        onClose={() => setSelectedTree(null)}
        title={selectedTree?.name || ''}
      >
        {selectedTree && (
          <div style={styles.modalContent}>
            {/* 나무 이미지 */}
            <div style={styles.modalTree}>
              <span style={styles.modalEmoji}>
                {getTreeLevel(selectedTree.post_count || 0).emoji}
              </span>
            </div>

            {/* 레벨 정보 */}
            <p style={styles.modalLevel}>
              {getTreeLevel(selectedTree.post_count || 0).name}
            </p>

            {/* 통계 */}
            <div style={styles.modalStats}>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>
                  {selectedTree.post_count || 0}
                </span>
                <span style={styles.modalStatLabel}>포스팅</span>
              </div>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>
                  Lv.{selectedTree.tree_level || 1}
                </span>
                <span style={styles.modalStatLabel}>레벨</span>
              </div>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>
                  {selectedTree.total_points || 0}
                </span>
                <span style={styles.modalStatLabel}>포인트</span>
              </div>
            </div>

            {/* 상세 정보 */}
            <div style={styles.modalInfo}>
              <div style={styles.modalInfoRow}>
                <span style={styles.infoLabel}>조</span>
                <span style={styles.infoValue}>
                  {selectedTree.team || '미배정'}
                </span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.infoLabel}>수업 유형</span>
                <span style={styles.infoValue}>
                  {selectedTree.class_type || '온라인'}
                </span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.infoLabel}>연속 출석</span>
                <span style={styles.infoValue}>
                  {selectedTree.streak_days || 0}일
                </span>
              </div>
            </div>

            {/* 블로그 링크 */}
            {selectedTree.blog1 && (
              <a
                href={selectedTree.blog1}
                target="_blank"
                rel="noreferrer"
                style={styles.blogLink}
              >
                블로그 바로가기 →
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  levelStats: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  levelCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    minWidth: '60px',
    transition: 'all 0.2s',
  },
  levelEmoji: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  levelCount: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  select: {
    padding: '10px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  },
  filterInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    marginBottom: '20px',
    color: COLORS.text,
    fontSize: '14px',
  },
  clearFilter: {
    padding: '6px 12px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '4px',
    color: COLORS.primary,
    fontSize: '13px',
    cursor: 'pointer',
  },
  forest: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '12px',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
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
  modalContent: {
    textAlign: 'center',
  },
  modalTree: {
    marginBottom: '8px',
  },
  modalEmoji: {
    fontSize: '80px',
  },
  modalLevel: {
    color: COLORS.primary,
    fontSize: '14px',
    margin: '0 0 24px 0',
  },
  modalStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '24px',
  },
  modalStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modalStatValue: {
    color: COLORS.text,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  modalStatLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
    marginTop: '4px',
  },
  modalInfo: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  modalInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  blogLink: {
    display: 'block',
    padding: '14px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 'bold',
  },
};

export default Forest;
