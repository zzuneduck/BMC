// src/pages/Admin/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { formatPhone, getTreeLevel } from '../../utils/helpers';

const StudentList = () => {
  const { students, loading, fetchStudents, deleteStudent } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  // 필터링 & 정렬
  const filteredStudents = students
    .filter(s => {
      if (searchTerm && !s.name.includes(searchTerm)) return false;
      if (filterTeam !== 'all' && s.team !== filterTeam) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return (b.total_points || 0) - (a.total_points || 0);
        case 'posts':
          return (b.post_count || 0) - (a.post_count || 0);
        case 'team':
          return (a.team || 'ZZZ').localeCompare(b.team || 'ZZZ');
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // 팀 목록 추출
  const teams = [...new Set(students.map(s => s.team).filter(Boolean))].sort();

  // 수강생 삭제
  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeleting(true);
    const result = await deleteStudent(id);
    setDeleting(false);

    if (result.success) {
      setSelectedStudent(null);
    } else {
      alert('삭제 실패: ' + result.error);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>수강생 목록</h1>
      <p style={styles.subtitle}>총 {students.length}명</p>

      {/* 필터/검색 */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="이름 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
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
          <option value="name">이름순</option>
          <option value="points">포인트순</option>
          <option value="posts">포스팅순</option>
          <option value="team">조순</option>
        </select>
      </div>

      {/* 수강생 목록 */}
      <div style={styles.studentList}>
        {filteredStudents.map((student) => {
          const treeLevel = getTreeLevel(student.post_count || 0);
          return (
            <div
              key={student.id}
              style={styles.studentCard}
              onClick={() => setSelectedStudent(student)}
            >
              <div style={styles.studentMain}>
                <span style={styles.treeEmoji}>{treeLevel.emoji}</span>
                <div style={styles.studentInfo}>
                  <div style={styles.studentNameRow}>
                    <span style={styles.studentName}>{student.name}</span>
                    {student.team && (
                      <span style={styles.teamBadge}>{student.team}</span>
                    )}
                  </div>
                  <span style={styles.studentMeta}>
                    {student.class_type || '온라인'} | 포스팅 {student.post_count || 0}개
                  </span>
                </div>
              </div>
              <div style={styles.studentPoints}>
                <span style={styles.pointsValue}>{student.total_points || 0}</span>
                <span style={styles.pointsLabel}>P</span>
              </div>
            </div>
          );
        })}
        {filteredStudents.length === 0 && (
          <p style={styles.emptyText}>검색 결과가 없습니다.</p>
        )}
      </div>

      {/* 수강생 상세 모달 */}
      {selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{selectedStudent.name}</h2>
              <button
                style={styles.closeBtn}
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>휴대폰</span>
                <span style={styles.detailValue}>
                  {selectedStudent.phone ? formatPhone(selectedStudent.phone) : '-'}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>수업유형</span>
                <span style={styles.detailValue}>{selectedStudent.class_type || '온라인'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>조</span>
                <span style={styles.detailValue}>{selectedStudent.team || '미배정'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>총 포인트</span>
                <span style={styles.detailValue}>{selectedStudent.total_points || 0}P</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>포스팅 수</span>
                <span style={styles.detailValue}>{selectedStudent.post_count || 0}개</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>나무 레벨</span>
                <span style={styles.detailValue}>Lv.{selectedStudent.tree_level || 1}</span>
              </div>
              {selectedStudent.blog1 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>블로그 1</span>
                  <a
                    href={selectedStudent.blog1}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    바로가기
                  </a>
                </div>
              )}
              {selectedStudent.blog2 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>블로그 2</span>
                  <a
                    href={selectedStudent.blog2}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    바로가기
                  </a>
                </div>
              )}
              {selectedStudent.blog3 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>블로그 3</span>
                  <a
                    href={selectedStudent.blog3}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    바로가기
                  </a>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(selectedStudent.id)}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
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
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 20px 0',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '150px',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  studentMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  treeEmoji: {
    fontSize: '32px',
  },
  studentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  studentNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  teamBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  studentMeta: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  studentPoints: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },
  pointsValue: {
    color: COLORS.primary,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: '40px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: '20px',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: COLORS.textMuted,
    fontSize: '20px',
    cursor: 'pointer',
  },
  modalContent: {
    padding: '20px',
  },
  modalFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  detailValue: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  link: {
    color: COLORS.primary,
    textDecoration: 'none',
  },
  deleteBtn: {
    padding: '10px 20px',
    backgroundColor: COLORS.error,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default StudentList;
