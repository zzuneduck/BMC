// src/pages/Admin/VODManage.jsx
// VOD 숙제 관리 페이지

import { useState, useEffect } from 'react';
import { Card, Loading, Button, Modal } from '../../components/Common';
import { useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const VODManage = () => {
  const { students, fetchStudents } = useStudents();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});

  // 모달 상태
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // 편집/선택 상태
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // 폼 상태
  const [assignmentForm, setAssignmentForm] = useState({
    week: 1,
    title: '',
    description: '',
    start_date: '',
    due_date: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    feedback: '',
    points: 10,
  });

  const [saving, setSaving] = useState(false);

  // 자동 생성 기능
  const handleAutoGenerate = async () => {
    const nextWeek = assignments.length > 0
      ? Math.max(...assignments.map(a => a.week || 0)) + 1
      : 1;

    // 다음 월요일 ~ 일요일 계산
    const now = new Date();
    const kstOffset = 9 * 60;
    const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
    const dayOfWeek = kst.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(kst);
    nextMonday.setDate(kst.getDate() + daysUntilMonday);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    const startDate = nextMonday.toISOString().split('T')[0];
    const dueDate = nextSunday.toISOString().split('T')[0];

    const title = `${nextWeek}주차 VOD 숙제`;
    const description = `${nextWeek}주차 VOD 강의를 시청하고 핵심 내용을 정리해주세요.\n실습 URL과 궁금한 점도 함께 제출해주세요.`;

    if (!confirm(`${nextWeek}주차 숙제를 자동 생성합니다.\n기간: ${startDate} ~ ${dueDate}\n\n생성하시겠습니까?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vod_assignments')
        .insert([{
          week: nextWeek,
          title,
          description,
          start_date: startDate,
          due_date: dueDate,
        }]);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('자동 생성 실패:', err);
      alert('자동 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchStudents();

      // 과제 목록 조회
      const { data: assignmentData } = await supabase
        .from('vod_assignments')
        .select('*')
        .order('week', { ascending: false })
        .order('due_date', { ascending: false });

      setAssignments(assignmentData || []);

      // 모든 제출 현황 조회
      if (assignmentData && assignmentData.length > 0) {
        const { data: submissionData } = await supabase
          .from('vod_submissions')
          .select('*, students(name)')
          .in('assignment_id', assignmentData.map(a => a.id));

        // assignment_id별로 그룹핑
        const grouped = (submissionData || []).reduce((acc, sub) => {
          if (!acc[sub.assignment_id]) acc[sub.assignment_id] = [];
          acc[sub.assignment_id].push(sub);
          return acc;
        }, {});
        setSubmissions(grouped);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 과제 저장
  const handleSaveAssignment = async () => {
    if (!assignmentForm.title.trim() || !assignmentForm.due_date) {
      alert('제목과 마감일을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (editingAssignment) {
        const { error } = await supabase
          .from('vod_assignments')
          .update(assignmentForm)
          .eq('id', editingAssignment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vod_assignments')
          .insert([assignmentForm]);
        if (error) throw error;
      }

      setShowAssignmentModal(false);
      setEditingAssignment(null);
      setAssignmentForm({
        week: 1,
        title: '',
        description: '',
        start_date: '',
        due_date: '',
      });
      loadData();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 과제 삭제
  const handleDeleteAssignment = async (id) => {
    if (!confirm('이 과제를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('vod_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  // 과제 편집 모달 열기
  const openEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      week: assignment.week || 1,
      title: assignment.title || '',
      description: assignment.description || '',
      start_date: assignment.start_date || '',
      due_date: assignment.due_date || '',
    });
    setShowAssignmentModal(true);
  };

  // 제출 현황 모달 열기
  const openSubmissionsModal = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
  };

  // 피드백 모달 열기
  const openFeedbackModal = (submission) => {
    setSelectedSubmission(submission);
    setFeedbackForm({
      feedback: submission.feedback || '',
      points: submission.points_awarded || 10,
    });
    setShowFeedbackModal(true);
  };

  // 피드백 저장 및 포인트 지급
  const handleSaveFeedback = async () => {
    if (!selectedSubmission) return;

    setSaving(true);
    try {
      const alreadyAwarded = !!selectedSubmission.feedback_at;

      // 피드백 저장
      const { error: updateError } = await supabase
        .from('vod_submissions')
        .update({
          feedback: feedbackForm.feedback,
          points_awarded: feedbackForm.points,
          feedback_at: new Date().toISOString(),
        })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      // 아직 포인트를 지급하지 않았다면 포인트 지급
      if (!alreadyAwarded && feedbackForm.points > 0) {
        const { error: pointsError } = await supabase.rpc('add_points', {
          p_student_id: selectedSubmission.student_id,
          p_points: feedbackForm.points,
          p_reason: `VOD 숙제 피드백 (${selectedAssignment?.title || 'VOD'})`,
        });

        if (pointsError) {
          console.error('포인트 지급 실패:', pointsError);
          // 포인트 지급 실패해도 피드백은 저장됨
        }
      }

      setShowFeedbackModal(false);
      setSelectedSubmission(null);
      loadData();
      alert('피드백이 저장되었습니다.' + (!alreadyAwarded && feedbackForm.points > 0 ? ` (+${feedbackForm.points}P 지급)` : ''));
    } catch (err) {
      console.error('피드백 저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  // 주차별 그룹핑
  const groupedByWeek = assignments.reduce((acc, assignment) => {
    const week = assignment.week || 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(assignment);
    return acc;
  }, {});

  const weeks = Object.keys(groupedByWeek).sort((a, b) => b - a);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>VOD 숙제 관리</h1>
      <p style={styles.subtitle}>총 {assignments.length}개 숙제</p>

      {/* 숙제 추가 버튼 */}
      <div style={styles.actionBar}>
        <Button onClick={handleAutoGenerate} disabled={saving} style={{ marginRight: '8px', backgroundColor: COLORS.success, color: '#000' }}>
          다음 주차 자동 생성
        </Button>
        <Button onClick={() => {
          setEditingAssignment(null);
          setAssignmentForm({
            week: weeks.length > 0 ? Math.max(...weeks.map(Number)) + 1 : 1,
            title: '',
            description: '',
            start_date: '',
            due_date: '',
          });
          setShowAssignmentModal(true);
        }}>
          + 숙제 추가
        </Button>
      </div>

      {/* 주차별 숙제 목록 */}
      {weeks.map((week) => (
        <div key={week} style={styles.weekSection}>
          <h2 style={styles.weekTitle}>{week}주차</h2>
          <div style={styles.assignmentList}>
            {groupedByWeek[week].map((assignment) => {
              const assignmentSubs = submissions[assignment.id] || [];
              const submittedCount = assignmentSubs.length;
              const feedbackCount = assignmentSubs.filter(s => s.feedback).length;
              const isOverdue = new Date(assignment.due_date) < new Date();

              return (
                <Card key={assignment.id}>
                  <div style={styles.assignmentCard}>
                    <div style={styles.assignmentHeader}>
                      <div style={styles.assignmentInfo}>
                        <h3 style={styles.assignmentTitle}>{assignment.title}</h3>
                        {assignment.description && (
                          <p style={styles.assignmentDesc}>{assignment.description}</p>
                        )}
                        <p style={styles.assignmentDue}>
                          {assignment.start_date && `시작: ${assignment.start_date} / `}마감: {assignment.due_date}
                          {isOverdue && <span style={styles.overdueBadge}>마감됨</span>}
                        </p>
                      </div>
                      <div style={styles.assignmentActions}>
                        <button style={styles.editBtn} onClick={() => openEditAssignment(assignment)}>
                          수정
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteAssignment(assignment.id)}>
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 제출 현황 */}
                    <div style={styles.submissionStatus}>
                      <div style={styles.statusRow}>
                        <div style={styles.statusItem}>
                          <span style={styles.statusLabel}>제출</span>
                          <span style={styles.statusValue}>{submittedCount}명</span>
                        </div>
                        <div style={styles.statusItem}>
                          <span style={styles.statusLabel}>피드백 완료</span>
                          <span style={styles.statusValue}>{feedbackCount}명</span>
                        </div>
                        <div style={styles.statusItem}>
                          <span style={styles.statusLabel}>미제출</span>
                          <span style={styles.statusValueMuted}>
                            {students.length - submittedCount}명
                          </span>
                        </div>
                      </div>

                      {/* 프로그레스 바 */}
                      <div style={styles.progressContainer}>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${students.length > 0 ? (submittedCount / students.length) * 100 : 0}%`,
                            }}
                          />
                          <div
                            style={{
                              ...styles.progressFeedback,
                              width: `${students.length > 0 ? (feedbackCount / students.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span style={styles.progressText}>
                          {students.length > 0 ? Math.round((submittedCount / students.length) * 100) : 0}% 제출
                        </span>
                      </div>

                      <button
                        style={styles.viewSubmissionsBtn}
                        onClick={() => openSubmissionsModal(assignment)}
                      >
                        제출 현황 보기 ({submittedCount}명)
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {assignments.length === 0 && (
        <Card>
          <p style={styles.emptyText}>등록된 VOD 숙제가 없습니다.</p>
        </Card>
      )}

      {/* 숙제 등록/수정 모달 */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title={editingAssignment ? '숙제 수정' : '숙제 추가'}
      >
        <div style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>주차 *</label>
              <input
                type="number"
                value={assignmentForm.week}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, week: parseInt(e.target.value) || 1 }))}
                style={styles.input}
                min="1"
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>시작일</label>
              <input
                type="date"
                value={assignmentForm.start_date}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, start_date: e.target.value }))}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>마감일 *</label>
              <input
                type="date"
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, due_date: e.target.value }))}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>제목 *</label>
            <input
              type="text"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
              style={styles.input}
              placeholder="예: 1주차 VOD 숙제"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>설명</label>
            <textarea
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
              style={styles.textarea}
              placeholder="숙제 설명을 입력하세요..."
              rows={3}
            />
          </div>
          <Button onClick={handleSaveAssignment} disabled={saving} style={{ width: '100%', marginTop: '8px' }}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </Modal>

      {/* 제출 현황 모달 */}
      <Modal
        isOpen={showSubmissionsModal}
        onClose={() => setShowSubmissionsModal(false)}
        title={selectedAssignment ? `${selectedAssignment.title} - 제출 현황` : '제출 현황'}
      >
        <div style={styles.submissionsModal}>
          {selectedAssignment && (
            <>
              {/* 제출한 수강생 목록 */}
              <div style={styles.submissionSection}>
                <h4 style={styles.sectionTitle}>
                  제출 완료 ({(submissions[selectedAssignment.id] || []).length}명)
                </h4>
                <div style={styles.studentList}>
                  {(submissions[selectedAssignment.id] || []).map((sub) => (
                    <div key={sub.id} style={styles.studentItem}>
                      <div style={styles.studentInfo}>
                        <span style={styles.studentName}>{sub.students?.name || '알 수 없음'}</span>
                        <span style={styles.submittedAt}>
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={styles.studentActions}>
                        {sub.feedback ? (
                          <span style={styles.feedbackDone}>
                            피드백 완료 (+{sub.points_awarded || 0}P)
                          </span>
                        ) : (
                          <button
                            style={styles.feedbackBtn}
                            onClick={() => openFeedbackModal(sub)}
                          >
                            피드백 작성
                          </button>
                        )}
                        {sub.feedback && (
                          <button
                            style={styles.editFeedbackBtn}
                            onClick={() => openFeedbackModal(sub)}
                          >
                            수정
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(submissions[selectedAssignment.id] || []).length === 0 && (
                    <p style={styles.emptySubmission}>제출한 수강생이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 미제출 수강생 목록 */}
              <div style={styles.submissionSection}>
                <h4 style={styles.sectionTitle}>
                  미제출 ({students.length - (submissions[selectedAssignment.id] || []).length}명)
                </h4>
                <div style={styles.studentList}>
                  {students
                    .filter(s => !(submissions[selectedAssignment.id] || []).some(sub => sub.student_id === s.id))
                    .map((student) => (
                      <div key={student.id} style={styles.studentItemMuted}>
                        <span style={styles.studentNameMuted}>{student.name}</span>
                        <span style={styles.notSubmitted}>미제출</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 피드백 모달 */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title={`피드백 작성 - ${selectedSubmission?.students?.name || ''}`}
      >
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>피드백 내용</label>
            <textarea
              value={feedbackForm.feedback}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
              style={styles.textarea}
              placeholder="피드백을 입력하세요..."
              rows={4}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>지급 포인트</label>
            <input
              type="number"
              value={feedbackForm.points}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
              style={styles.input}
              min="0"
            />
            <p style={styles.hint}>
              {selectedSubmission?.feedback_at
                ? '* 이미 피드백이 작성되어 추가 포인트가 지급되지 않습니다.'
                : '* 첫 피드백 저장 시 포인트가 자동 지급됩니다.'}
            </p>
          </div>
          <Button onClick={handleSaveFeedback} disabled={saving} style={{ width: '100%', marginTop: '8px' }}>
            {saving ? '저장 중...' : '피드백 저장'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
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
  actionBar: {
    marginBottom: '24px',
  },
  weekSection: {
    marginBottom: '32px',
  },
  weekTitle: {
    color: COLORS.primary,
    fontSize: '18px',
    margin: '0 0 16px 0',
    paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.primary}`,
  },
  assignmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  assignmentCard: {},
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  assignmentInfo: {},
  assignmentTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  assignmentDesc: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 8px 0',
  },
  assignmentDue: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  overdueBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.error,
    color: '#fff',
    borderRadius: '4px',
    fontSize: '11px',
  },
  assignmentActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: '13px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: COLORS.error,
    cursor: 'pointer',
    fontSize: '13px',
  },
  submissionStatus: {},
  statusRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '12px',
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  statusValue: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  statusValueMuted: {
    color: COLORS.textMuted,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.3s',
    opacity: 0.5,
  },
  progressFeedback: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    minWidth: '60px',
  },
  viewSubmissionsBtn: {
    padding: '10px 20px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: '40px',
  },
  // 모달 폼 스타일
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
  hint: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: 0,
  },
  // 제출 현황 모달 스타일
  submissionsModal: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  submissionSection: {},
  sectionTitle: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '0 0 12px 0',
    paddingBottom: '8px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  studentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  studentItemMuted: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
    opacity: 0.7,
  },
  studentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  studentNameMuted: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  submittedAt: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  studentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  feedbackDone: {
    padding: '6px 12px',
    backgroundColor: COLORS.success,
    color: '#000',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  feedbackBtn: {
    padding: '8px 16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  editFeedbackBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: COLORS.textMuted,
    border: `1px solid ${COLORS.surfaceLight}`,
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  notSubmitted: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  emptySubmission: {
    color: COLORS.textMuted,
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  },
};

export default VODManage;
