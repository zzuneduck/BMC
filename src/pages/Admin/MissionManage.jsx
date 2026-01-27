// src/pages/Admin/MissionManage.jsx
// 미션 관리 페이지

import { useState, useEffect } from 'react';
import { Card, Loading, Button, Modal } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const MissionManage = () => {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [editingMission, setEditingMission] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    week: 1,
    type: 'daily',
    points: 10,
    start_date: '',
    due_date: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 미션 목록
      const { data: missionData } = await supabase
        .from('missions')
        .select('*')
        .order('week', { ascending: true })
        .order('due_date', { ascending: true });

      // 수강생 목록
      const { data: studentData } = await supabase
        .from('students')
        .select('id, name, team')
        .order('name');

      // 미션 제출 현황
      const { data: submissionData } = await supabase
        .from('mission_submissions')
        .select('*');

      setMissions(missionData || []);
      setStudents(studentData || []);
      setSubmissions(submissionData || []);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.due_date) {
      alert('제목과 마감일을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (editingMission) {
        const { error } = await supabase
          .from('missions')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('missions')
          .insert([formData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingMission(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('이 미션을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (mission) => {
    try {
      const { error } = await supabase
        .from('missions')
        .update({ is_active: !mission.is_active })
        .eq('id', mission.id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('상태 변경 실패:', err);
    }
  };

  const openEdit = (mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description || '',
      week: mission.week || 1,
      type: mission.type || 'daily',
      points: mission.points || 10,
      start_date: mission.start_date || '',
      due_date: mission.due_date || '',
      is_active: mission.is_active !== false,
    });
    setShowModal(true);
  };

  const openStatus = (mission) => {
    setSelectedMission(mission);
    setShowStatusModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      week: 1,
      type: 'daily',
      points: 10,
      start_date: '',
      due_date: '',
      is_active: true,
    });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'daily': return { text: '일일', color: COLORS.primary };
      case 'weekly': return { text: '주간', color: COLORS.secondary };
      case 'special': return { text: '특별', color: '#ff6b6b' };
      default: return { text: type, color: COLORS.textMuted };
    }
  };

  // 미션별 완료 현황
  const getMissionStatus = (missionId) => {
    const missionSubmissions = submissions.filter(s => s.mission_id === missionId);
    return {
      completed: missionSubmissions.length,
      total: students.length,
      submissions: missionSubmissions,
    };
  };

  // 주차별 그룹핑
  const groupedMissions = missions.reduce((acc, mission) => {
    const week = mission.week || 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(mission);
    return acc;
  }, {});

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>미션 관리</h1>
          <p style={styles.subtitle}>총 {missions.length}개 미션</p>
        </div>
        <Button onClick={() => {
          setEditingMission(null);
          resetForm();
          setShowModal(true);
        }}>
          + 미션 추가
        </Button>
      </div>

      {/* 주차별 미션 목록 */}
      {Object.entries(groupedMissions)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, weekMissions]) => (
          <Card key={week} title={week === '0' ? '공통 미션' : `${week}주차 미션`}>
            <div style={styles.missionList}>
              {weekMissions.map(mission => {
                const typeBadge = getTypeBadge(mission.type);
                const status = getMissionStatus(mission.id);
                const completionRate = status.total > 0
                  ? Math.round((status.completed / status.total) * 100)
                  : 0;

                return (
                  <div key={mission.id} style={styles.missionItem}>
                    <div style={styles.missionInfo}>
                      <div style={styles.missionHeader}>
                        <span style={{
                          ...styles.typeBadge,
                          backgroundColor: typeBadge.color,
                        }}>
                          {typeBadge.text}
                        </span>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: mission.is_active ? COLORS.success : COLORS.surface,
                          color: mission.is_active ? '#000' : COLORS.textMuted,
                        }}>
                          {mission.is_active ? '활성' : '비활성'}
                        </span>
                        <span style={styles.pointsBadge}>+{mission.points}P</span>
                      </div>
                      <h3 style={styles.missionTitle}>{mission.title}</h3>
                      {mission.description && (
                        <p style={styles.missionDesc}>{mission.description}</p>
                      )}
                      <p style={styles.missionDates}>
                        {mission.start_date && `${mission.start_date} ~ `}
                        {mission.due_date}
                      </p>

                      {/* 완료 현황 */}
                      <div style={styles.completionBar}>
                        <div style={styles.completionInfo}>
                          <span style={styles.completionText}>
                            완료: {status.completed}/{status.total}명
                          </span>
                          <span style={styles.completionRate}>{completionRate}%</span>
                        </div>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${completionRate}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.missionActions}>
                      <button
                        style={styles.statusBtn}
                        onClick={() => openStatus(mission)}
                      >
                        현황 보기
                      </button>
                      <button
                        style={styles.toggleBtn}
                        onClick={() => handleToggleActive(mission)}
                      >
                        {mission.is_active ? '비활성화' : '활성화'}
                      </button>
                      <button style={styles.editBtn} onClick={() => openEdit(mission)}>수정</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(mission.id)}>삭제</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      {missions.length === 0 && (
        <Card>
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>등록된 미션이 없습니다.</p>
          </div>
        </Card>
      )}

      {/* 미션 추가/수정 모달 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMission ? '미션 수정' : '미션 추가'}
      >
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              style={styles.input}
              placeholder="미션 제목"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              style={styles.textarea}
              rows={3}
              placeholder="미션 설명"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>주차</label>
              <select
                value={formData.week}
                onChange={(e) => setFormData(prev => ({ ...prev, week: parseInt(e.target.value) }))}
                style={styles.select}
              >
                <option value={0}>공통</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                  <option key={w} value={w}>{w}주차</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                style={styles.select}
              >
                <option value="daily">일일</option>
                <option value="weekly">주간</option>
                <option value="special">특별</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>포인트</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>시작일</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>마감일 *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                style={styles.checkbox}
              />
              <span>활성화</span>
            </label>
          </div>

          <Button onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </Modal>

      {/* 미션 완료 현황 모달 */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={selectedMission ? `${selectedMission.title} - 완료 현황` : '완료 현황'}
      >
        {selectedMission && (
          <div style={styles.statusModalContent}>
            <div style={styles.statusSummary}>
              <div style={styles.statusSummaryItem}>
                <span style={styles.statusSummaryNum}>
                  {getMissionStatus(selectedMission.id).completed}
                </span>
                <span style={styles.statusSummaryLabel}>완료</span>
              </div>
              <div style={styles.statusSummaryItem}>
                <span style={styles.statusSummaryNum}>
                  {students.length - getMissionStatus(selectedMission.id).completed}
                </span>
                <span style={styles.statusSummaryLabel}>미완료</span>
              </div>
              <div style={styles.statusSummaryItem}>
                <span style={styles.statusSummaryNum}>
                  {Math.round((getMissionStatus(selectedMission.id).completed / students.length) * 100) || 0}%
                </span>
                <span style={styles.statusSummaryLabel}>완료율</span>
              </div>
            </div>

            <div style={styles.studentStatusList}>
              <h4 style={styles.statusListTitle}>수강생별 현황</h4>
              {students.map(student => {
                const submitted = submissions.find(
                  s => s.mission_id === selectedMission.id && s.student_id === student.id
                );
                return (
                  <div key={student.id} style={styles.studentStatusItem}>
                    <div style={styles.studentStatusInfo}>
                      <span style={styles.studentStatusName}>{student.name}</span>
                      {student.team && (
                        <span style={styles.studentStatusTeam}>{student.team}</span>
                      )}
                    </div>
                    {submitted ? (
                      <span style={styles.completedBadge}>완료 ✓</span>
                    ) : (
                      <span style={styles.incompleteBadge}>미완료</span>
                    )}
                  </div>
                );
              })}
            </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: 0,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '4px 0 0 0',
  },
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  missionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    gap: '16px',
  },
  missionInfo: {
    flex: 1,
  },
  missionHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  typeBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#000',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  pointsBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.primary,
    fontSize: '11px',
    fontWeight: 'bold',
  },
  missionTitle: {
    color: COLORS.text,
    fontSize: '16px',
    margin: '0 0 4px 0',
  },
  missionDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
  },
  missionDates: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: '0 0 12px 0',
  },
  completionBar: {
    marginTop: '8px',
  },
  completionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  completionText: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  completionRate: {
    color: COLORS.primary,
    fontSize: '12px',
    fontWeight: 'bold',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  missionActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  statusBtn: {
    padding: '8px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '12px',
    cursor: 'pointer',
  },
  toggleBtn: {
    padding: '8px 16px',
    background: 'none',
    border: `1px solid ${COLORS.surfaceLight}`,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '12px',
    cursor: 'pointer',
  },
  editBtn: {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteBtn: {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    color: COLORS.error,
    cursor: 'pointer',
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  input: {
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
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
  textarea: {
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  checkboxGroup: {
    marginTop: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: COLORS.text,
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: COLORS.primary,
  },
  statusModalContent: {},
  statusSummary: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    marginBottom: '20px',
  },
  statusSummaryItem: {
    textAlign: 'center',
  },
  statusSummaryNum: {
    display: 'block',
    color: COLORS.primary,
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  statusSummaryLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  studentStatusList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  statusListTitle: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '0 0 12px 0',
  },
  studentStatusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    marginBottom: '8px',
  },
  studentStatusInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studentStatusName: {
    color: COLORS.text,
    fontSize: '14px',
  },
  studentStatusTeam: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  completedBadge: {
    padding: '4px 12px',
    backgroundColor: COLORS.success,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  incompleteBadge: {
    padding: '4px 12px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textMuted,
    borderRadius: '4px',
    fontSize: '12px',
  },
};

export default MissionManage;
