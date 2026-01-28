// src/pages/Admin/PointsManage.jsx
// 관리자 포인트 관리 페이지

import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const POINT_TYPES = [
  { id: 'manual', label: '수동 지급' },
  { id: 'mission', label: '미션' },
  { id: 'attendance', label: '출석' },
  { id: 'revenue', label: '수익인증' },
  { id: 'bonus', label: '보너스' },
  { id: 'penalty', label: '차감' },
];

const PointsManage = () => {
  const [students, setStudents] = useState([]);
  const [pointsLog, setPointsLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'history'
  const [searchTerm, setSearchTerm] = useState('');

  // 포인트 지급 모달
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointForm, setPointForm] = useState({
    points: 0,
    reason: '',
    type: 'manual',
  });
  const [saving, setSaving] = useState(false);

  // 일괄 지급 모달
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    points: 0,
    reason: '',
    type: 'bonus',
    targetTeam: 'all',
  });

  // 포인트 내역 모달
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [studentHistory, setStudentHistory] = useState([]);
  const [historyStudent, setHistoryStudent] = useState(null);

  // 통계
  const totalPoints = students.reduce((sum, s) => sum + (s.total_points || 0), 0);
  const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 수강생 목록
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, team_id, total_points, weekly_points')
        .order('total_points', { ascending: false });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // 최근 포인트 내역
      const { data: logData, error: logError } = await supabase
        .from('points_log')
        .select(`
          *,
          students:student_id (name, team_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logError) throw logError;
      setPointsLog(logData || []);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 지급 모달 열기
  const openPointModal = (student) => {
    setSelectedStudent(student);
    setPointForm({
      points: 10,
      reason: '',
      type: 'manual',
    });
    setShowModal(true);
  };

  // 포인트 지급
  const handleAddPoints = async () => {
    if (!selectedStudent || pointForm.points === 0) {
      alert('포인트를 입력해주세요.');
      return;
    }
    if (!pointForm.reason.trim()) {
      alert('지급 사유를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.rpc('add_points', {
        p_student_id: selectedStudent.id,
        p_points: pointForm.points,
        p_reason: pointForm.reason.trim(),
        p_type: pointForm.type,
      });

      if (error) throw error;

      alert(`${selectedStudent.name}님에게 ${pointForm.points > 0 ? '+' : ''}${pointForm.points}P ${pointForm.points > 0 ? '지급' : '차감'}되었습니다.`);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('포인트 지급 실패:', err);
      alert('포인트 지급에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 일괄 지급
  const handleBulkAdd = async () => {
    if (bulkForm.points === 0) {
      alert('포인트를 입력해주세요.');
      return;
    }
    if (!bulkForm.reason.trim()) {
      alert('지급 사유를 입력해주세요.');
      return;
    }

    const targetStudents = bulkForm.targetTeam === 'all'
      ? students
      : students.filter(s => s.team_id === parseInt(bulkForm.targetTeam));

    if (targetStudents.length === 0) {
      alert('대상 수강생이 없습니다.');
      return;
    }

    if (!confirm(`${targetStudents.length}명에게 ${bulkForm.points > 0 ? '+' : ''}${bulkForm.points}P를 지급하시겠습니까?`)) {
      return;
    }

    setSaving(true);
    try {
      for (const student of targetStudents) {
        await supabase.rpc('add_points', {
          p_student_id: student.id,
          p_points: bulkForm.points,
          p_reason: bulkForm.reason.trim(),
          p_type: bulkForm.type,
        });
      }

      alert(`${targetStudents.length}명에게 포인트가 지급되었습니다.`);
      setShowBulkModal(false);
      setBulkForm({
        points: 0,
        reason: '',
        type: 'bonus',
        targetTeam: 'all',
      });
      loadData();
    } catch (err) {
      console.error('일괄 지급 실패:', err);
      alert('일괄 지급 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 개인 포인트 내역 조회
  const openHistoryModal = async (student) => {
    setHistoryStudent(student);
    setShowHistoryModal(true);

    try {
      const { data, error } = await supabase
        .from('points_log')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStudentHistory(data || []);
    } catch (err) {
      console.error('포인트 내역 조회 실패:', err);
    }
  };

  // 팀 목록
  const teams = [...new Set(students.map(s => s.team_id).filter(Boolean))].sort((a, b) => a - b);

  // 필터링
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getTypeLabel = (type) => {
    return POINT_TYPES.find(t => t.id === type)?.label || type;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>포인트 관리</h1>
        <button style={styles.bulkButton} onClick={() => setShowBulkModal(true)}>
          일괄 지급
        </button>
      </div>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{students.length}</span>
          <span style={styles.statLabel}>총 수강생</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{totalPoints.toLocaleString()}</span>
          <span style={styles.statLabel}>총 포인트</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{avgPoints.toLocaleString()}</span>
          <span style={styles.statLabel}>평균 포인트</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{pointsLog.length}</span>
          <span style={styles.statLabel}>최근 내역</span>
        </div>
      </div>

      {/* 탭 */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'students' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('students')}
        >
          수강생 목록
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'history' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('history')}
        >
          포인트 내역
        </button>
      </div>

      {/* 수강생 목록 탭 */}
      {activeTab === 'students' && (
        <>
          <div style={styles.searchBar}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="수강생 검색..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.studentList}>
            {filteredStudents.map((student, index) => (
              <div key={student.id} style={styles.studentCard}>
                <div style={styles.studentRank}>
                  <span style={styles.rankNumber}>{index + 1}</span>
                </div>
                <div style={styles.studentInfo}>
                  <span style={styles.studentName}>{student.name}</span>
                  {student.team_id && (
                    <span style={styles.teamBadge}>{student.team_id}조</span>
                  )}
                </div>
                <div style={styles.studentPoints}>
                  <span style={styles.pointsValue}>{(student.total_points || 0).toLocaleString()}P</span>
                  {student.weekly_points > 0 && (
                    <span style={styles.weeklyPoints}>주간 +{student.weekly_points}</span>
                  )}
                </div>
                <div style={styles.studentActions}>
                  <button
                    style={styles.historyBtn}
                    onClick={() => openHistoryModal(student)}
                  >
                    내역
                  </button>
                  <button
                    style={styles.addPointsBtn}
                    onClick={() => openPointModal(student)}
                  >
                    지급
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 포인트 내역 탭 */}
      {activeTab === 'history' && (
        <div style={styles.historyList}>
          {pointsLog.map((log) => (
            <div key={log.id} style={styles.historyCard}>
              <div style={styles.historyMain}>
                <div style={styles.historyHeader}>
                  <span style={styles.historyName}>
                    {log.students?.name || '알 수 없음'}
                    {log.students?.team_id && ` (${log.students.team_id}조)`}
                  </span>
                  <span style={styles.historyDate}>{formatDate(log.created_at)}</span>
                </div>
                <div style={styles.historyBody}>
                  <span style={{
                    ...styles.historyPoints,
                    color: log.points >= 0 ? COLORS.success : COLORS.error,
                  }}>
                    {log.points >= 0 ? '+' : ''}{log.points}P
                  </span>
                  <span style={styles.historyType}>{getTypeLabel(log.type)}</span>
                </div>
                <p style={styles.historyReason}>{log.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 포인트 지급 모달 */}
      {showModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>포인트 지급</h2>
              <button style={styles.closeButton} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.targetInfo}>
                <span style={styles.targetName}>{selectedStudent.name}</span>
                <span style={styles.targetPoints}>
                  현재 {(selectedStudent.total_points || 0).toLocaleString()}P
                </span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>포인트</label>
                <div style={styles.pointsInput}>
                  <button
                    style={styles.pointsQuick}
                    onClick={() => setPointForm(prev => ({ ...prev, points: prev.points - 10 }))}
                  >-10</button>
                  <input
                    type="number"
                    value={pointForm.points}
                    onChange={(e) => setPointForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    style={styles.input}
                  />
                  <button
                    style={styles.pointsQuick}
                    onClick={() => setPointForm(prev => ({ ...prev, points: prev.points + 10 }))}
                  >+10</button>
                </div>
                <span style={styles.hint}>음수 입력 시 차감됩니다</span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>유형</label>
                <select
                  value={pointForm.type}
                  onChange={(e) => setPointForm(prev => ({ ...prev, type: e.target.value }))}
                  style={styles.select}
                >
                  {POINT_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>사유 *</label>
                <input
                  type="text"
                  value={pointForm.reason}
                  onChange={(e) => setPointForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="지급 사유를 입력하세요"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowModal(false)}>취소</button>
              <button
                style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }}
                onClick={handleAddPoints}
                disabled={saving}
              >
                {saving ? '처리 중...' : `${pointForm.points >= 0 ? '지급' : '차감'}하기`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 지급 모달 */}
      {showBulkModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBulkModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>일괄 포인트 지급</h2>
              <button style={styles.closeButton} onClick={() => setShowBulkModal(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>대상</label>
                <select
                  value={bulkForm.targetTeam}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, targetTeam: e.target.value }))}
                  style={styles.select}
                >
                  <option value="all">전체 수강생 ({students.length}명)</option>
                  {teams.map(team => (
                    <option key={team} value={team}>
                      {team}조 ({students.filter(s => s.team_id === team).length}명)
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>포인트</label>
                <input
                  type="number"
                  value={bulkForm.points}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>유형</label>
                <select
                  value={bulkForm.type}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, type: e.target.value }))}
                  style={styles.select}
                >
                  {POINT_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>사유 *</label>
                <input
                  type="text"
                  value={bulkForm.reason}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="일괄 지급 사유"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowBulkModal(false)}>취소</button>
              <button
                style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }}
                onClick={handleBulkAdd}
                disabled={saving}
              >
                {saving ? '처리 중...' : '일괄 지급'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인 내역 모달 */}
      {showHistoryModal && historyStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowHistoryModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{historyStudent.name} 포인트 내역</h2>
              <button style={styles.closeButton} onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.targetInfo}>
                <span style={styles.targetPoints}>
                  현재 {(historyStudent.total_points || 0).toLocaleString()}P
                </span>
              </div>

              <div style={styles.personalHistory}>
                {studentHistory.length > 0 ? (
                  studentHistory.map((log) => (
                    <div key={log.id} style={styles.personalHistoryItem}>
                      <div style={styles.historyItemLeft}>
                        <span style={styles.historyItemDate}>{formatDate(log.created_at)}</span>
                        <span style={styles.historyItemType}>{getTypeLabel(log.type)}</span>
                      </div>
                      <div style={styles.historyItemRight}>
                        <span style={{
                          ...styles.historyItemPoints,
                          color: log.points >= 0 ? COLORS.success : COLORS.error,
                        }}>
                          {log.points >= 0 ? '+' : ''}{log.points}P
                        </span>
                      </div>
                      <p style={styles.historyItemReason}>{log.reason}</p>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>포인트 내역이 없습니다.</p>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowHistoryModal(false)}>닫기</button>
              <button
                style={styles.saveButton}
                onClick={() => {
                  setShowHistoryModal(false);
                  openPointModal(historyStudent);
                }}
              >
                포인트 지급
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
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: 0,
  },
  bulkButton: {
    padding: '10px 20px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: COLORS.textMuted,
  },
  // 통계
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  // 탭
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
  },
  // 검색
  searchBar: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  // 수강생 목록
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
  },
  studentRank: {
    width: '32px',
    textAlign: 'center',
  },
  rankNumber: {
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '500',
  },
  teamBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  studentPoints: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  pointsValue: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  weeklyPoints: {
    color: COLORS.success,
    fontSize: '11px',
  },
  studentActions: {
    display: 'flex',
    gap: '8px',
  },
  historyBtn: {
    padding: '8px 12px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.textMuted,
    fontSize: '12px',
    cursor: 'pointer',
  },
  addPointsBtn: {
    padding: '8px 14px',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // 포인트 내역
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  historyCard: {
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
  },
  historyMain: {},
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  historyName: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  historyBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  historyPoints: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  historyType: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  historyReason: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
  },
  // 모달
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
    backgroundColor: COLORS.background,
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.textMuted,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  targetInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    marginBottom: '20px',
  },
  targetName: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  targetPoints: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  pointsInput: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  pointsQuick: {
    padding: '12px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  hint: {
    display: 'block',
    marginTop: '6px',
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    cursor: 'pointer',
  },
  saveButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // 개인 내역
  personalHistory: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  personalHistoryItem: {
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    marginBottom: '8px',
  },
  historyItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  historyItemDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  historyItemType: {
    padding: '2px 6px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '10px',
  },
  historyItemRight: {
    marginBottom: '4px',
  },
  historyItemPoints: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  historyItemReason: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: 0,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  },
};

export default PointsManage;
