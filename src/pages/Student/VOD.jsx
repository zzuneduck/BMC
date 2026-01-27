// src/pages/Student/VOD.jsx
// 수강생 VOD 학습 페이지

import { useState, useEffect, useMemo } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// KST 기준 오늘 날짜
const getKSTToday = () => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  return kst.toISOString().split('T')[0];
};

const VOD = () => {
  const { user } = useAuth();
  const today = getKSTToday();

  // 상태
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' | 'courses'
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);

  // 제출 모달
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    summary: '',
    practice_url: '',
    question: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // 피드백 모달
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // VOD 숙제 목록 (주차별)
      const { data: assignmentData } = await supabase
        .from('vod_assignments')
        .select('*')
        .order('week', { ascending: false })
        .order('due_date', { ascending: false });

      setAssignments(assignmentData || []);

      // 내 제출 현황
      const { data: submissionData } = await supabase
        .from('vod_submissions')
        .select('*')
        .eq('student_id', user.id);

      const submissionMap = (submissionData || []).reduce((acc, sub) => {
        acc[sub.assignment_id] = sub;
        return acc;
      }, {});
      setSubmissions(submissionMap);

      // VOD 강의 목록
      const { data: courseData } = await supabase
        .from('vod_courses')
        .select('*')
        .order('course_type')
        .order('category')
        .order('order_num');

      setCourses(courseData || []);

      // 강의 시청 현황
      const { data: progressData } = await supabase
        .from('vod_progress')
        .select('*')
        .eq('student_id', user.id);

      setProgress(progressData || []);

    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 제출 모달 열기
  const openSubmitModal = (assignment) => {
    setSelectedAssignment(assignment);
    const existing = submissions[assignment.id];
    setSubmitForm({
      summary: existing?.summary || '',
      practice_url: existing?.practice_url || '',
      question: existing?.question || '',
    });
    setShowSubmitModal(true);
  };

  // 숙제 제출
  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    if (!submitForm.summary.trim() && !submitForm.practice_url.trim()) {
      alert('학습 내용 정리 또는 실습 URL을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const existing = submissions[selectedAssignment.id];

      if (existing) {
        // 기존 제출 수정
        const { error } = await supabase
          .from('vod_submissions')
          .update({
            summary: submitForm.summary.trim(),
            practice_url: submitForm.practice_url.trim(),
            question: submitForm.question.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
        alert('제출이 수정되었습니다.');
      } else {
        // 새로 제출
        const { error } = await supabase
          .from('vod_submissions')
          .insert([{
            student_id: user.id,
            assignment_id: selectedAssignment.id,
            summary: submitForm.summary.trim(),
            practice_url: submitForm.practice_url.trim(),
            question: submitForm.question.trim(),
            submitted_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        alert('제출 완료! 피드백을 기다려주세요.');
      }

      setShowSubmitModal(false);
      setSelectedAssignment(null);
      loadData();
    } catch (err) {
      console.error('제출 실패:', err);
      alert('제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 피드백 보기
  const openFeedbackModal = (submission) => {
    setSelectedFeedback(submission);
    setShowFeedbackModal(true);
  };

  // 강의 시청 처리
  const handleWatch = async (course) => {
    if (course.video_url) {
      window.open(course.video_url, '_blank');
    }

    // 완료 처리
    const alreadyCompleted = progress.some(p => p.course_id === course.id);
    if (!alreadyCompleted) {
      try {
        await supabase
          .from('vod_progress')
          .insert([{
            student_id: user.id,
            course_id: course.id,
            completed_at: new Date().toISOString(),
          }]);
        loadData();
      } catch (err) {
        console.error('진행률 저장 실패:', err);
      }
    }
  };

  // D-day 계산
  const getDday = (dueDate) => {
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diff = Math.ceil((due - todayDate) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return '마감됨';
  };

  // 진행 중인 숙제 (오늘 기준)
  const currentAssignments = assignments.filter(a => a.due_date >= today);
  const pastAssignments = assignments.filter(a => a.due_date < today);

  // 강의 진행률
  const completedCourseIds = new Set(progress.map(p => p.course_id));
  const totalCourses = courses.length;
  const completedCourses = progress.length;
  const progressRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  // 카테고리별 그룹핑
  const groupedCourses = courses.reduce((acc, course) => {
    const key = `${course.course_type}-${course.category}`;
    if (!acc[key]) {
      acc[key] = {
        type: course.course_type,
        category: course.category,
        courses: [],
      };
    }
    acc[key].courses.push(course);
    return acc;
  }, {});

  if (loading) {
    return <Loading fullScreen />;
  }

  // 외부 링크 카드 데이터
  const externalLinks = [
    {
      id: 'titan',
      title: '🎬 라이브 다시보기',
      description: '타이탄클래스 강의 영상',
      url: 'https://www.titanclass.co.kr/course/course_list.jsp?cid=115726',
    },
    {
      id: 'gpt',
      title: '🤖 쭌이덕 GPT',
      description: '가이드 있는 포스팅 작성',
      url: 'https://chatgpt.com/g/g-68b1b9dca15c819188812ecccc7f00ca-jjunideogyi-swibgo-anjeonhan-beulrogeu-geulsseugi-cobojayong',
    },
    {
      id: 'inflo',
      title: '✨ 블로그 AI 생성',
      description: '블로그 포스팅 생성 AI',
      url: 'https://www.infloai.net/',
    },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>VOD+AI 게시판</h1>

      {/* 외부 링크 카드 */}
      <div style={styles.linkCards}>
        {externalLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.surfaceLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.surface;
            }}
          >
            <span style={styles.linkTitle}>{link.title}</span>
            <span style={styles.linkDesc}>{link.description}</span>
          </a>
        ))}
      </div>

      {/* 탭 */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'assignment' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('assignment')}
        >
          VOD 숙제
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'courses' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('courses')}
        >
          강의 목록
        </button>
      </div>

      {/* VOD 숙제 탭 */}
      {activeTab === 'assignment' && (
        <>
          {/* 진행 중인 숙제 */}
          {currentAssignments.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>진행 중인 숙제</h2>
              <div style={styles.assignmentList}>
                {currentAssignments.map((assignment) => {
                  const submission = submissions[assignment.id];
                  const hasFeedback = submission?.feedback;

                  return (
                    <Card key={assignment.id}>
                      <div style={styles.assignmentCard}>
                        <div style={styles.assignmentHeader}>
                          <span style={styles.weekBadge}>{assignment.week}주차</span>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: submission ? COLORS.success : COLORS.surfaceLight,
                            color: submission ? '#000' : COLORS.textMuted,
                          }}>
                            {submission ? '제출 완료' : '미제출'}
                          </span>
                          <span style={styles.ddayBadge}>{getDday(assignment.due_date)}</span>
                        </div>

                        <h3 style={styles.assignmentTitle}>{assignment.title}</h3>
                        {assignment.description && (
                          <p style={styles.assignmentDesc}>{assignment.description}</p>
                        )}
                        <p style={styles.assignmentDue}>마감일: {assignment.due_date}</p>

                        <div style={styles.assignmentActions}>
                          <button
                            style={styles.submitBtn}
                            onClick={() => openSubmitModal(assignment)}
                          >
                            {submission ? '수정하기' : '제출하기'}
                          </button>

                          {hasFeedback && (
                            <button
                              style={styles.feedbackBtn}
                              onClick={() => openFeedbackModal(submission)}
                            >
                              피드백 확인 (+{submission.points_awarded || 0}P)
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {currentAssignments.length === 0 && (
            <Card>
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📚</span>
                <p style={styles.emptyText}>현재 진행 중인 VOD 숙제가 없습니다.</p>
              </div>
            </Card>
          )}

          {/* 지난 숙제 */}
          {pastAssignments.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>지난 숙제</h2>
              <div style={styles.assignmentList}>
                {pastAssignments.slice(0, 5).map((assignment) => {
                  const submission = submissions[assignment.id];
                  const hasFeedback = submission?.feedback;

                  return (
                    <div key={assignment.id} style={styles.pastAssignment}>
                      <div style={styles.pastAssignmentInfo}>
                        <span style={styles.pastWeek}>{assignment.week}주차</span>
                        <span style={styles.pastTitle}>{assignment.title}</span>
                      </div>
                      <div style={styles.pastAssignmentStatus}>
                        {submission ? (
                          hasFeedback ? (
                            <button
                              style={styles.viewFeedbackBtn}
                              onClick={() => openFeedbackModal(submission)}
                            >
                              피드백 보기
                            </button>
                          ) : (
                            <span style={styles.submittedBadge}>제출 완료</span>
                          )
                        ) : (
                          <span style={styles.missedBadge}>미제출</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 강의 목록 탭 */}
      {activeTab === 'courses' && (
        <>
          {/* 전체 진행률 */}
          <Card>
            <div style={styles.progressCard}>
              <div style={styles.progressInfo}>
                <span style={styles.progressLabel}>전체 강의 진행률</span>
                <span style={styles.progressValue}>{completedCourses}/{totalCourses}강</span>
              </div>
              <div style={styles.progressBarBg}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${progressRate}%`,
                  }}
                />
              </div>
              <span style={styles.progressRate}>{progressRate}% 완료</span>
            </div>
          </Card>

          {/* 강의 목록 */}
          {Object.values(groupedCourses).map((group) => (
            <Card
              key={`${group.type}-${group.category}`}
              title={`${group.type === 'basic' ? '블로그 기본' : '브랜드 블로그'} - ${group.category}`}
            >
              <div style={styles.courseList}>
                {group.courses.map((course, index) => {
                  const isCompleted = completedCourseIds.has(course.id);

                  return (
                    <div
                      key={course.id}
                      style={{
                        ...styles.courseItem,
                        borderColor: isCompleted ? COLORS.success : 'transparent',
                      }}
                    >
                      <div style={styles.courseStatus}>
                        {isCompleted ? '✅' : '⬜'}
                      </div>
                      <div style={styles.courseInfo}>
                        <span style={styles.courseNumber}>{course.order_num || index + 1}강</span>
                        <span style={styles.courseTitle}>{course.title}</span>
                        {course.duration && (
                          <span style={styles.courseDuration}>{course.duration}</span>
                        )}
                      </div>
                      <button
                        style={{
                          ...styles.watchBtn,
                          backgroundColor: isCompleted ? COLORS.surfaceLight : COLORS.primary,
                          color: isCompleted ? COLORS.textMuted : '#000',
                        }}
                        onClick={() => handleWatch(course)}
                      >
                        {isCompleted ? '다시보기' : '시청'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          {courses.length === 0 && (
            <Card>
              <p style={styles.emptyText}>등록된 강의가 없습니다.</p>
            </Card>
          )}
        </>
      )}

      {/* 제출 모달 */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={selectedAssignment?.title || 'VOD 숙제 제출'}
      >
        <div style={styles.modalContent}>
          {selectedAssignment && (
            <>
              <div style={styles.assignmentDetail}>
                <span style={styles.detailWeek}>{selectedAssignment.week}주차</span>
                {selectedAssignment.description && (
                  <p style={styles.detailDesc}>{selectedAssignment.description}</p>
                )}
                <p style={styles.detailDue}>
                  마감: {selectedAssignment.due_date} ({getDday(selectedAssignment.due_date)})
                </p>
              </div>

              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>학습 내용 정리</label>
                  <textarea
                    value={submitForm.summary}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, summary: e.target.value }))}
                    style={styles.textarea}
                    placeholder="강의에서 배운 핵심 내용을 정리해주세요."
                    rows={4}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>실습 인증 URL (선택)</label>
                  <input
                    type="url"
                    value={submitForm.practice_url}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, practice_url: e.target.value }))}
                    style={styles.input}
                    placeholder="https://blog.naver.com/..."
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>질문 / 어려운 점 (선택)</label>
                  <textarea
                    value={submitForm.question}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, question: e.target.value }))}
                    style={styles.textarea}
                    placeholder="강의 내용 중 궁금한 점이나 어려웠던 부분을 적어주세요."
                    rows={3}
                  />
                </div>

                <button
                  style={{
                    ...styles.submitButton,
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? '제출 중...' : (submissions[selectedAssignment.id] ? '수정하기' : '제출하기')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 피드백 모달 */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="피드백"
      >
        <div style={styles.feedbackModal}>
          {selectedFeedback && (
            <>
              <div style={styles.feedbackPoints}>
                <span style={styles.feedbackPointsIcon}>🎉</span>
                <span style={styles.feedbackPointsText}>
                  +{selectedFeedback.points_awarded || 0}P 획득!
                </span>
              </div>

              <div style={styles.feedbackContent}>
                <h4 style={styles.feedbackLabel}>코치 피드백</h4>
                <p style={styles.feedbackText}>
                  {selectedFeedback.feedback || '피드백이 아직 없습니다.'}
                </p>
              </div>

              {selectedFeedback.feedback_at && (
                <p style={styles.feedbackDate}>
                  {new Date(selectedFeedback.feedback_at).toLocaleDateString('ko-KR')} 작성
                </p>
              )}
            </>
          )}
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
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  // 외부 링크 카드
  linkCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '24px',
  },
  linkCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: '12px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  linkTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  linkDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
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
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '18px',
    margin: '0 0 12px 0',
  },
  assignmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  assignmentCard: {},
  assignmentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  weekBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  ddayBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  assignmentTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  assignmentDesc: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 8px 0',
    lineHeight: 1.5,
  },
  assignmentDue: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 16px 0',
  },
  assignmentActions: {
    display: 'flex',
    gap: '8px',
  },
  submitBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  feedbackBtn: {
    padding: '12px 16px',
    backgroundColor: COLORS.success,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  pastAssignment: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  pastAssignmentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pastWeek: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  pastTitle: {
    color: COLORS.text,
    fontSize: '14px',
  },
  pastAssignmentStatus: {},
  viewFeedbackBtn: {
    padding: '6px 12px',
    backgroundColor: COLORS.success,
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  submittedBadge: {
    padding: '6px 12px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textMuted,
    borderRadius: '4px',
    fontSize: '12px',
  },
  missedBadge: {
    padding: '6px 12px',
    backgroundColor: COLORS.error,
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
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
    textAlign: 'center',
  },
  // 진행률 카드
  progressCard: {},
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  progressLabel: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  progressValue: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressRate: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  // 강의 목록
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  courseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    border: '2px solid transparent',
  },
  courseStatus: {
    fontSize: '18px',
    width: '24px',
    textAlign: 'center',
  },
  courseInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  courseNumber: {
    color: COLORS.textMuted,
    fontSize: '11px',
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
  watchBtn: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // 모달
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  assignmentDetail: {
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
  detailWeek: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  detailDesc: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '0 0 8px 0',
    lineHeight: 1.5,
  },
  detailDue: {
    color: COLORS.textMuted,
    fontSize: '13px',
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
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  textarea: {
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  // 피드백 모달
  feedbackModal: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  feedbackPoints: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
  },
  feedbackPointsIcon: {
    fontSize: '32px',
  },
  feedbackPointsText: {
    color: COLORS.primary,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  feedbackContent: {},
  feedbackLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 8px 0',
  },
  feedbackText: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: 1.6,
    margin: 0,
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  feedbackDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
    textAlign: 'right',
    margin: 0,
  },
};

export default VOD;
