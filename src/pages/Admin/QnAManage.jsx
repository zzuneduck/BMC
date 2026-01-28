// src/pages/Admin/QnAManage.jsx
// 관리자 Q&A 관리 페이지 - 질문 답변 및 FAQ 등록

import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// 카테고리 목록
const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '1:1상담', label: '1:1상담' },
  { id: '블로그주제', label: '블로그주제' },
  { id: '블로그관리', label: '블로그관리' },
  { id: '포스팅방법', label: '포스팅방법' },
  { id: '블로그세팅', label: '블로그세팅' },
  { id: '강의관련', label: '강의관련' },
];

const QnAManage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unanswered'); // unanswered, answered, faq, all
  const [category, setCategory] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFaq, setNewFaq] = useState({
    title: '',
    content: '',
    answer: '',
    category: '강의관련',
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('qna')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Q&A 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 필터링
  const filteredQuestions = questions.filter(q => {
    // 상태 필터
    if (filter === 'unanswered' && q.is_answered) return false;
    if (filter === 'answered' && !q.is_answered) return false;
    if (filter === 'faq' && !q.is_faq) return false;

    // 카테고리 필터
    if (category !== 'all' && q.category !== category) return false;

    return true;
  });

  // 통계
  const stats = {
    total: questions.length,
    unanswered: questions.filter(q => !q.is_answered).length,
    answered: questions.filter(q => q.is_answered).length,
    faq: questions.filter(q => q.is_faq).length,
  };

  // 답변 등록
  const handleAnswer = async () => {
    if (!answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('qna')
        .update({
          answer: answerText.trim(),
          is_answered: true,
          answered_at: new Date().toISOString(),
        })
        .eq('id', selectedQuestion.id);

      if (error) throw error;

      alert('답변이 등록되었습니다.');
      setSelectedQuestion(null);
      setAnswerText('');
      fetchQuestions();
    } catch (err) {
      console.error('답변 등록 실패:', err);
      alert('답변 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // FAQ 직접 등록
  const handleCreateFaq = async () => {
    if (!newFaq.title.trim() || !newFaq.content.trim() || !newFaq.answer.trim()) {
      alert('제목, 내용, 답변을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('qna')
        .insert({
          student_id: null,
          title: newFaq.title.trim(),
          content: newFaq.content.trim(),
          answer: newFaq.answer.trim(),
          category: newFaq.category,
          is_answered: true,
          is_public: true,
          is_faq: true,
          answered_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert('FAQ가 등록되었습니다.');
      setShowCreateModal(false);
      setNewFaq({ title: '', content: '', answer: '', category: '강의관련' });
      fetchQuestions();
    } catch (err) {
      console.error('FAQ 등록 실패:', err);
      alert('FAQ 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // FAQ 토글
  const toggleFaq = async (question) => {
    try {
      const { error } = await supabase
        .from('qna')
        .update({ is_faq: !question.is_faq })
        .eq('id', question.id);

      if (error) throw error;
      fetchQuestions();
    } catch (err) {
      console.error('FAQ 토글 실패:', err);
    }
  };

  // 삭제
  const handleDelete = async (question) => {
    if (!confirm(`"${question.title}" 질문을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('qna')
        .delete()
        .eq('id', question.id);

      if (error) throw error;
      fetchQuestions();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Q&A 관리</h1>
        <button style={styles.addButton} onClick={() => setShowCreateModal(true)}>
          + FAQ 등록
        </button>
      </div>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div
          style={{ ...styles.statCard, borderColor: filter === 'all' ? COLORS.primary : 'transparent' }}
          onClick={() => setFilter('all')}
        >
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>전체</span>
        </div>
        <div
          style={{ ...styles.statCard, borderColor: filter === 'unanswered' ? COLORS.error : 'transparent' }}
          onClick={() => setFilter('unanswered')}
        >
          <span style={{ ...styles.statValue, color: COLORS.error }}>{stats.unanswered}</span>
          <span style={styles.statLabel}>미답변</span>
        </div>
        <div
          style={{ ...styles.statCard, borderColor: filter === 'answered' ? COLORS.secondary : 'transparent' }}
          onClick={() => setFilter('answered')}
        >
          <span style={{ ...styles.statValue, color: COLORS.secondary }}>{stats.answered}</span>
          <span style={styles.statLabel}>답변완료</span>
        </div>
        <div
          style={{ ...styles.statCard, borderColor: filter === 'faq' ? COLORS.primary : 'transparent' }}
          onClick={() => setFilter('faq')}
        >
          <span style={styles.statValue}>{stats.faq}</span>
          <span style={styles.statLabel}>FAQ</span>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.categoryTab,
              backgroundColor: category === cat.id ? COLORS.primary : COLORS.surface,
              color: category === cat.id ? '#000' : COLORS.textMuted,
            }}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 질문 목록 */}
      <div style={styles.questionList}>
        {filteredQuestions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>질문이 없습니다.</p>
          </div>
        ) : (
          filteredQuestions.map(question => (
            <div key={question.id} style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <div style={styles.badges}>
                  {question.is_faq && <span style={styles.faqBadge}>FAQ</span>}
                  <span style={styles.categoryBadge}>{question.category}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: question.is_answered ? COLORS.secondary : COLORS.error,
                  }}>
                    {question.is_answered ? '답변완료' : '미답변'}
                  </span>
                </div>
                <span style={styles.date}>{formatDate(question.created_at)}</span>
              </div>

              <h3 style={styles.questionTitle}>Q. {question.title}</h3>
              <p style={styles.questionContent}>{question.content}</p>

              {question.answer && (
                <div style={styles.answerPreview}>
                  <span style={styles.answerLabel}>A.</span>
                  <span>{question.answer.length > 100 ? question.answer.slice(0, 100) + '...' : question.answer}</span>
                </div>
              )}

              <div style={styles.actions}>
                {!question.is_answered ? (
                  <button
                    style={styles.answerButton}
                    onClick={() => {
                      setSelectedQuestion(question);
                      setAnswerText(question.answer || '');
                    }}
                  >
                    답변하기
                  </button>
                ) : (
                  <button
                    style={styles.editButton}
                    onClick={() => {
                      setSelectedQuestion(question);
                      setAnswerText(question.answer || '');
                    }}
                  >
                    수정
                  </button>
                )}
                <button
                  style={{
                    ...styles.faqToggleButton,
                    color: question.is_faq ? COLORS.primary : COLORS.textMuted,
                  }}
                  onClick={() => toggleFaq(question)}
                >
                  {question.is_faq ? 'FAQ 해제' : 'FAQ 지정'}
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(question)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 답변 모달 */}
      {selectedQuestion && (
        <div style={styles.modalOverlay} onClick={() => setSelectedQuestion(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>답변 작성</h2>
              <button style={styles.closeButton} onClick={() => setSelectedQuestion(null)}>✕</button>
            </div>

            <div style={styles.questionBox}>
              <span style={styles.qLabel}>Q</span>
              <div>
                <h3 style={styles.qTitle}>{selectedQuestion.title}</h3>
                <p style={styles.qContent}>{selectedQuestion.content}</p>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>답변 *</label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변 내용을 입력하세요"
                style={styles.textarea}
                rows={8}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => setSelectedQuestion(null)}>
                취소
              </button>
              <button
                style={{ ...styles.submitButton, opacity: submitting ? 0.7 : 1 }}
                onClick={handleAnswer}
                disabled={submitting}
              >
                {submitting ? '저장 중...' : '답변 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ 등록 모달 */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>FAQ 등록</h2>
              <button style={styles.closeButton} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>카테고리</label>
              <select
                value={newFaq.category}
                onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                style={styles.select}
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>질문 제목 *</label>
              <input
                type="text"
                value={newFaq.title}
                onChange={(e) => setNewFaq({ ...newFaq, title: e.target.value })}
                placeholder="질문 제목"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>질문 내용 *</label>
              <textarea
                value={newFaq.content}
                onChange={(e) => setNewFaq({ ...newFaq, content: e.target.value })}
                placeholder="질문 내용"
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>답변 *</label>
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="답변 내용"
                style={styles.textarea}
                rows={5}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => setShowCreateModal(false)}>
                취소
              </button>
              <button
                style={{ ...styles.submitButton, opacity: submitting ? 0.7 : 1 }}
                onClick={handleCreateFaq}
                disabled={submitting}
              >
                {submitting ? '등록 중...' : 'FAQ 등록'}
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
    maxWidth: '1000px',
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
  addButton: {
    padding: '12px 20px',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // 통계
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    cursor: 'pointer',
    border: '2px solid transparent',
  },
  statValue: {
    display: 'block',
    color: COLORS.primary,
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  // 카테고리
  categoryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px',
  },
  categoryTab: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  // 질문 목록
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '20px',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  badges: {
    display: 'flex',
    gap: '8px',
  },
  faqBadge: {
    padding: '4px 8px',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#000',
  },
  categoryBadge: {
    padding: '4px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    fontSize: '11px',
    color: COLORS.textMuted,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  questionContent: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 12px 0',
    lineHeight: 1.5,
  },
  answerPreview: {
    padding: '12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
    fontSize: '13px',
    color: COLORS.text,
    marginBottom: '12px',
    borderLeft: `3px solid ${COLORS.secondary}`,
  },
  answerLabel: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginRight: '8px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
    paddingTop: '12px',
  },
  answerButton: {
    padding: '8px 16px',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.text,
    fontSize: '13px',
    cursor: 'pointer',
  },
  faqToggleButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.error,
    fontSize: '13px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  // 모달
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
    padding: '20px',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: '20px',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '50%',
    color: COLORS.text,
    fontSize: '16px',
    cursor: 'pointer',
  },
  questionBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
    marginBottom: '20px',
  },
  qLabel: {
    color: COLORS.primary,
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  qTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  qContent: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.6,
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '13px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    cursor: 'pointer',
  },
  submitButton: {
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
};

export default QnAManage;
