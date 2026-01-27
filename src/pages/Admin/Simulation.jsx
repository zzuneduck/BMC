// src/pages/Admin/Simulation.jsx
// 시뮬레이션 관리 페이지 (포인트/나무 테스트용)

import { useState, useEffect } from 'react';
import { Card, Loading, Button, Modal } from '../../components/Common';
import { TreeDisplay } from '../../components/Tree';
import { useStudents } from '../../hooks/useStudents';
import { usePoints } from '../../hooks/usePoints';
import { COLORS, POINTS, POINT_TYPES } from '../../utils/constants';
import { supabase } from '../../supabase';

const Simulation = () => {
  const { students, loading: studentsLoading, refresh } = useStudents();
  const { addPoints } = usePoints();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [pointForm, setPointForm] = useState({
    type: 'attendance',
    amount: 10,
    description: '',
  });
  const [postCount, setPostCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // 학생 선택 시 상세 정보 로드
  useEffect(() => {
    if (selectedStudent) {
      loadStudentData();
    }
  }, [selectedStudent]);

  const loadStudentData = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', selectedStudent)
        .single();

      setStudentData(data);
      setPostCount(data?.post_count || 0);
    } catch (err) {
      console.error('학생 데이터 로드 실패:', err);
    }
  };

  // 포인트 지급
  const handleAddPoints = async () => {
    if (!selectedStudent || !pointForm.amount) return;

    setSaving(true);
    try {
      await addPoints(
        selectedStudent,
        pointForm.amount,
        pointForm.type,
        pointForm.description || `시뮬레이션: ${pointForm.type}`
      );

      alert(`${pointForm.amount} 포인트가 지급되었습니다.`);
      setShowPointModal(false);
      loadStudentData();
      refresh();
    } catch (err) {
      console.error('포인트 지급 실패:', err);
      alert('포인트 지급에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 포스팅 수 변경
  const handleUpdatePosts = async () => {
    if (!selectedStudent) return;

    setSaving(true);
    try {
      // students 테이블 직접 업데이트
      const { error } = await supabase
        .from('students')
        .update({
          post_count: postCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedStudent);

      if (error) throw error;

      alert('포스팅 수가 업데이트되었습니다.');
      setShowPostModal(false);
      loadStudentData();
      refresh();
    } catch (err) {
      console.error('포스팅 수 업데이트 실패:', err);
      alert('업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 포인트 초기화
  const handleResetPoints = async () => {
    if (!selectedStudent) return;
    if (!confirm('이 학생의 포인트를 0으로 초기화하시겠습니까?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ total_points: 0 })
        .eq('id', selectedStudent);

      if (error) throw error;

      alert('포인트가 초기화되었습니다.');
      loadStudentData();
      refresh();
    } catch (err) {
      console.error('포인트 초기화 실패:', err);
      alert('초기화에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const pointTypeOptions = [
    { value: 'attendance', label: '출석', amount: POINTS.attendance },
    { value: 'mission', label: '미션', amount: POINTS.mission },
    { value: 'vod', label: 'VOD 시청', amount: POINTS.vod_watch },
    { value: 'blog_growth', label: '블로그 성장', amount: POINTS.blog_growth_5 },
    { value: 'tree_levelup', label: '나무 레벨업', amount: POINTS.tree_levelup },
    { value: 'weekly_mvp', label: '주간 MVP', amount: POINTS.weekly_mvp },
    { value: 'revenue', label: '수익 인증', amount: POINTS.revenue },
    { value: 'custom', label: '직접 입력', amount: 0 },
  ];

  if (studentsLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>시뮬레이션 관리</h1>
      <p style={styles.subtitle}>포인트/나무 테스트 및 데이터 조정</p>

      <div style={styles.layout}>
        {/* 학생 목록 */}
        <div style={styles.sidebar}>
          <Card title="학생 선택">
            <div style={styles.studentList}>
              {students.map(student => (
                <div
                  key={student.id}
                  style={{
                    ...styles.studentItem,
                    backgroundColor: selectedStudent === student.id ? COLORS.surfaceLight : 'transparent',
                    borderColor: selectedStudent === student.id ? COLORS.primary : 'transparent',
                  }}
                  onClick={() => setSelectedStudent(student.id)}
                >
                  <span style={styles.studentTeam}>{student.team || '-'}조</span>
                  <span style={styles.studentName}>{student.name}</span>
                  <span style={styles.studentPoints}>{student.total_points || 0}P</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 상세 정보 & 액션 */}
        <div style={styles.main}>
          {selectedStudent && studentData ? (
            <>
              {/* 현재 상태 */}
              <Card title="현재 상태">
                <div style={styles.statusSection}>
                  <div style={styles.treePreview}>
                    <TreeDisplay
                      postCount={studentData?.post_count || 0}
                      points={studentData.total_points || 0}
                      name={studentData.name}
                    />
                  </div>
                  <div style={styles.statusInfo}>
                    <div style={styles.statusRow}>
                      <span style={styles.statusLabel}>이름</span>
                      <span style={styles.statusValue}>{studentData.name}</span>
                    </div>
                    <div style={styles.statusRow}>
                      <span style={styles.statusLabel}>조</span>
                      <span style={styles.statusValue}>{studentData.team || '-'}조</span>
                    </div>
                    <div style={styles.statusRow}>
                      <span style={styles.statusLabel}>포인트</span>
                      <span style={{ ...styles.statusValue, color: COLORS.primary }}>
                        {studentData.total_points || 0}P
                      </span>
                    </div>
                    <div style={styles.statusRow}>
                      <span style={styles.statusLabel}>포스팅</span>
                      <span style={styles.statusValue}>
                        {studentData?.post_count || 0}개
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 액션 버튼 */}
              <Card title="시뮬레이션 액션">
                <div style={styles.actions}>
                  <Button onClick={() => {
                    setPointForm({ type: 'attendance', amount: POINTS.attendance, description: '' });
                    setShowPointModal(true);
                  }}>
                    + 포인트 지급
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setPostCount(studentData?.post_count || 0);
                    setShowPostModal(true);
                  }}>
                    포스팅 수 변경
                  </Button>
                  <Button variant="danger" onClick={handleResetPoints}>
                    포인트 초기화
                  </Button>
                </div>
              </Card>

              {/* 퀵 포인트 */}
              <Card title="퀵 포인트 지급">
                <div style={styles.quickPoints}>
                  {pointTypeOptions.filter(p => p.value !== 'custom').map(option => (
                    <button
                      key={option.value}
                      style={styles.quickPointBtn}
                      onClick={async () => {
                        await addPoints(selectedStudent, option.amount, option.value, option.label);
                        loadStudentData();
                        refresh();
                      }}
                    >
                      {option.label} (+{option.amount}P)
                    </button>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>왼쪽에서 학생을 선택하세요</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 포인트 지급 모달 */}
      <Modal
        isOpen={showPointModal}
        onClose={() => setShowPointModal(false)}
        title="포인트 지급"
      >
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>포인트 유형</label>
            <select
              value={pointForm.type}
              onChange={(e) => {
                const option = pointTypeOptions.find(o => o.value === e.target.value);
                setPointForm(prev => ({
                  ...prev,
                  type: e.target.value,
                  amount: option?.amount || prev.amount,
                }));
              }}
              style={styles.select}
            >
              {pointTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>포인트</label>
            <input
              type="number"
              value={pointForm.amount}
              onChange={(e) => setPointForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>설명 (선택)</label>
            <input
              type="text"
              value={pointForm.description}
              onChange={(e) => setPointForm(prev => ({ ...prev, description: e.target.value }))}
              style={styles.input}
              placeholder="포인트 지급 사유"
            />
          </div>

          <Button onClick={handleAddPoints} disabled={saving} style={{ width: '100%' }}>
            {saving ? '지급 중...' : '포인트 지급'}
          </Button>
        </div>
      </Modal>

      {/* 포스팅 수 변경 모달 */}
      <Modal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="포스팅 수 변경"
      >
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>포스팅 개수</label>
            <input
              type="number"
              value={postCount}
              onChange={(e) => setPostCount(parseInt(e.target.value) || 0)}
              style={styles.input}
              min={0}
            />
          </div>

          <Button onClick={handleUpdatePosts} disabled={saving} style={{ width: '100%' }}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
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
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 24px 0',
  },
  layout: {
    display: 'flex',
    gap: '20px',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  studentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  studentTeam: {
    color: COLORS.textMuted,
    fontSize: '12px',
    width: '30px',
  },
  studentName: {
    flex: 1,
    color: COLORS.text,
    fontSize: '14px',
  },
  studentPoints: {
    color: COLORS.primary,
    fontSize: '13px',
    fontWeight: 'bold',
  },
  statusSection: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  treePreview: {
    flexShrink: 0,
  },
  statusInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  statusValue: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  quickPoints: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  quickPointBtn: {
    padding: '8px 14px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.text,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
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
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
};

export default Simulation;
