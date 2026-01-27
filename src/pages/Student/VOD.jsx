// src/pages/Student/VOD.jsx
// VOD 강의 페이지

import { useState, useEffect, useMemo } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { useVOD } from '../../hooks/useVOD';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const VOD = () => {
  const { user } = useAuth();
  const {
    loading,
    getCourses,
    getProgress,
    markComplete,
    getCurrentAssignment,
    getSubmission,
    submitAssignment,
  } = useVOD();

  // 상태
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'brand'
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [brandUnlocked, setBrandUnlocked] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // 모달 상태
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    watched: false,
    summary: '',
    practice_url: '',
    question: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, activeTab]);

  const loadData = async () => {
    setPageLoading(true);
    try {
      // 강의 목록
      const coursesResult = await getCourses(activeTab);
      if (coursesResult.success) {
        setCourses(coursesResult.data);
      }

      // 진행률
      const progressResult = await getProgress(user.id, activeTab);
      if (progressResult.success) {
        setProgress(progressResult.data);
      }

      // 기본 과정 완료 여부 확인 (브랜드 잠금 해제용)
      if (activeTab === 'brand') {
        const basicCoursesResult = await getCourses('basic');
        const basicProgressResult = await getProgress(user.id, 'basic');
        if (basicCoursesResult.success && basicProgressResult.success) {
          const basicTotal = basicCoursesResult.data.length;
          const basicCompleted = basicProgressResult.data.length;
          setBrandUnlocked(basicCompleted >= basicTotal && basicTotal > 0);
        }
      }

      // 이번 주 과제
      const assignmentResult = await getCurrentAssignment();
      if (assignmentResult.success && assignmentResult.data) {
        setAssignment(assignmentResult.data);

        // 제출 여부 확인
        const submissionResult = await getSubmission(user.id, assignmentResult.data.id);
        if (submissionResult.success) {
          setSubmission(submissionResult.data);
        }
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setPageLoading(false);
    }
  };

  // 진행률 계산
  const progressStats = useMemo(() => {
    const total = courses.length;
    const completed = progress.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [courses, progress]);

  // 카테고리별 그룹핑
  const groupedCourses = useMemo(() => {
    const groups = {};
    courses.forEach((course) => {
      const category = course.category || '기본 강의';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(course);
    });
    return groups;
  }, [courses]);

  // 완료된 강의 ID Set
  const completedIds = useMemo(() => {
    return new Set(progress.map((p) => p.course_id));
  }, [progress]);

  // 강의 시청 처리
  const handleWatch = async (course) => {
    // 외부 링크로 이동
    if (course.video_url) {
      window.open(course.video_url, '_blank');
    }

    // 완료 처리
    if (!completedIds.has(course.id)) {
      const result = await markComplete(user.id, course.id);
      if (result.success) {
        setProgress((prev) => [...prev, { course_id: course.id }]);
      }
    }
  };

  // 숙제 제출 모달 열기
  const handleOpenSubmit = () => {
    if (submission) {
      setSubmitForm({
        watched: submission.watched || false,
        summary: submission.summary || '',
        practice_url: submission.practice_url || '',
        question: submission.question || '',
      });
    } else {
      setSubmitForm({
        watched: false,
        summary: '',
        practice_url: '',
        question: '',
      });
    }
    setShowSubmitModal(true);
  };

  // 숙제 제출
  const handleSubmit = async () => {
    if (!submitForm.watched) {
      alert('시청 완료를 체크해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAssignment(user.id, assignment.id, submitForm);
      if (result.success) {
        setSubmission(result.data);
        setShowSubmitModal(false);
        alert('제출 완료!');
      } else {
        alert('제출에 실패했습니다.');
      }
    } catch (err) {
      console.error('제출 실패:', err);
      alert('제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      {/* 탭 메뉴 */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'basic' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('basic')}
        >
          블로그 기본
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'brand' ? styles.tabActive : {}),
            opacity: brandUnlocked || activeTab === 'brand' ? 1 : 0.5,
          }}
          onClick={() => setActiveTab('brand')}
        >
          브랜드 블로그 {!brandUnlocked && activeTab !== 'brand' && '🔒'}
        </button>
      </div>

      {/* 진행률 표시 */}
      <Card>
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressTitle}>
              {activeTab === 'basic' ? '블로그 기본' : '브랜드 블로그'}
            </span>
            <span style={styles.progressText}>
              {progressStats.completed}/{progressStats.total}강
            </span>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progressStats.percentage}%`,
              }}
            />
          </div>
          <div style={styles.progressPercentage}>{progressStats.percentage}%</div>
        </div>
      </Card>

      {/* 이번 주 VOD 숙제 */}
      {assignment && (
        <Card title="이번 주 VOD 숙제">
          <div style={styles.assignmentCard}>
            <div style={styles.assignmentHeader}>
              <span style={styles.assignmentBadge}>
                {submission ? '제출 완료' : '미제출'}
              </span>
              <span style={styles.assignmentDue}>
                마감: {formatDate(assignment.due_date)}
              </span>
            </div>
            <p style={styles.assignmentTitle}>{assignment.title}</p>
            <p style={styles.assignmentRange}>
              시청 범위: {assignment.course_range || '전체'}
            </p>
            <button
              style={styles.submitButton}
              onClick={handleOpenSubmit}
            >
              {submission ? '제출 내용 수정' : '숙제 제출하기'}
            </button>
          </div>
        </Card>
      )}

      {/* 브랜드 블로그 잠금 안내 */}
      {activeTab === 'brand' && !brandUnlocked && (
        <Card>
          <div style={styles.lockedMessage}>
            <span style={styles.lockedIcon}>🔒</span>
            <p style={styles.lockedText}>
              블로그 기본 과정을 모두 완료하면
              <br />
              브랜드 블로그 강의가 열립니다!
            </p>
            <p style={styles.lockedProgress}>
              현재 진행률: {progressStats.completed}/{progressStats.total}
            </p>
          </div>
        </Card>
      )}

      {/* 강의 목록 */}
      {(activeTab === 'basic' || brandUnlocked) &&
        Object.entries(groupedCourses).map(([category, categoryCourses]) => (
          <Card key={category} title={category}>
            <div style={styles.courseList}>
              {categoryCourses.map((course, index) => {
                const isCompleted = completedIds.has(course.id);
                const isLocked = course.locked && !isCompleted;

                return (
                  <div
                    key={course.id}
                    style={{
                      ...styles.courseItem,
                      opacity: isLocked ? 0.5 : 1,
                    }}
                  >
                    <div style={styles.courseStatus}>
                      {isLocked ? '🔒' : isCompleted ? '✅' : '🔲'}
                    </div>
                    <div style={styles.courseInfo}>
                      <span style={styles.courseNumber}>{index + 1}강</span>
                      <span style={styles.courseTitle}>{course.title}</span>
                      {course.duration && (
                        <span style={styles.courseDuration}>{course.duration}</span>
                      )}
                    </div>
                    <button
                      style={{
                        ...styles.watchButton,
                        backgroundColor: isLocked
                          ? COLORS.surface
                          : isCompleted
                          ? COLORS.surfaceLight
                          : COLORS.primary,
                        color: isCompleted || isLocked ? COLORS.textMuted : '#000',
                      }}
                      onClick={() => !isLocked && handleWatch(course)}
                      disabled={isLocked}
                    >
                      {isLocked ? '잠김' : isCompleted ? '다시보기' : '시청'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      {/* 강의 없음 */}
      {courses.length === 0 && (
        <Card>
          <p style={styles.emptyText}>등록된 강의가 없습니다.</p>
        </Card>
      )}

      {/* 숙제 제출 모달 */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="VOD 숙제 제출"
      >
        <div style={styles.modalContent}>
          {/* 시청 완료 체크 */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={submitForm.watched}
              onChange={(e) =>
                setSubmitForm((prev) => ({ ...prev, watched: e.target.checked }))
              }
              style={styles.checkbox}
            />
            <span>시청 완료</span>
          </label>

          {/* 핵심 내용 정리 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>핵심 내용 정리 (선택)</label>
            <textarea
              value={submitForm.summary}
              onChange={(e) =>
                setSubmitForm((prev) => ({ ...prev, summary: e.target.value }))
              }
              placeholder="강의에서 배운 핵심 내용을 정리해주세요."
              style={styles.textarea}
              rows={4}
            />
          </div>

          {/* 실습 인증 URL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>실습 인증 URL (선택)</label>
            <input
              type="url"
              value={submitForm.practice_url}
              onChange={(e) =>
                setSubmitForm((prev) => ({ ...prev, practice_url: e.target.value }))
              }
              placeholder="블로그 포스팅 URL"
              style={styles.input}
            />
          </div>

          {/* 힘든 점 / 질문 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>힘든 점 / 질문</label>
            <textarea
              value={submitForm.question}
              onChange={(e) =>
                setSubmitForm((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="강의를 듣고 어려웠던 점이나 질문이 있으면 작성해주세요."
              style={styles.textarea}
              rows={3}
            />
          </div>

          {/* 제출 버튼 */}
          <button
            style={{
              ...styles.submitButtonModal,
              opacity: submitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </Modal>
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
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  tab: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '6px',
    transition: 'width 0.5s ease',
  },
  progressPercentage: {
    textAlign: 'right',
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: 'bold',
  },
  assignmentCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  assignmentDue: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  assignmentTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  assignmentRange: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  submitButton: {
    padding: '12px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '4px',
  },
  lockedMessage: {
    textAlign: 'center',
    padding: '20px',
  },
  lockedIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  lockedText: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: 1.6,
    margin: '0 0 12px 0',
  },
  lockedProgress: {
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 0,
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  courseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  courseStatus: {
    fontSize: '20px',
    width: '28px',
    textAlign: 'center',
  },
  courseInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  courseNumber: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  courseTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  courseDuration: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  watchButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
  },
  // 모달 스타일
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: COLORS.text,
    fontSize: '16px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    accentColor: COLORS.primary,
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
  submitButtonModal: {
    padding: '14px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default VOD;
