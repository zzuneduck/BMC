// src/pages/Student/QnA.jsx
// Q&A 페이지 - 카테고리별 FAQ + 질문 기능

import { useState, useEffect, useMemo } from 'react';
import { Loading } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// 카테고리 목록
const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📋' },
  { id: '1:1상담', label: '1:1상담', icon: '💬' },
  { id: '블로그주제', label: '블로그주제', icon: '📝' },
  { id: '블로그관리', label: '블로그관리', icon: '⚙️' },
  { id: '포스팅방법', label: '포스팅방법', icon: '✍️' },
  { id: '블로그세팅', label: '블로그세팅', icon: '🔧' },
  { id: '강의관련', label: '강의관련', icon: '🎓' },
];

const QnA = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '강의관련',
  });
  const [submitting, setSubmitting] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('qna')
        .select('*')
        .eq('is_public', true)
        .order('is_faq', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Q&A 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 제목 입력 시 유사 질문 검색
  useEffect(() => {
    if (formData.title.length >= 3) {
      const searchTerm = formData.title.toLowerCase();
      const similar = questions.filter(q =>
        q.title.toLowerCase().includes(searchTerm) ||
        q.content.toLowerCase().includes(searchTerm)
      ).slice(0, 3);
      setSimilarQuestions(similar);
    } else {
      setSimilarQuestions([]);
    }
  }, [formData.title, questions]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('qna')
        .insert([{
          student_id: user?.id || null,
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          is_answered: false,
          is_public: true,
          is_faq: false,
        }]);

      if (error) throw error;

      alert('질문이 등록되었습니다.');
      setShowQuestionModal(false);
      setFormData({ title: '', content: '', category: '강의관련' });
      setSimilarQuestions([]);
      loadQuestions();
    } catch (err) {
      console.error('질문 등록 실패:', err);
      alert('질문 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 필터링된 질문 목록
  const filteredQuestions = useMemo(() => {
    let result = questions;

    // 카테고리 필터
    if (category !== 'all') {
      result = result.filter(q => q.category === category);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.title.toLowerCase().includes(query) ||
        q.content.toLowerCase().includes(query) ||
        (q.answer && q.answer.toLowerCase().includes(query))
      );
    }

    // FAQ를 상단에 배치
    return result.sort((a, b) => {
      if (a.is_faq && !b.is_faq) return -1;
      if (!a.is_faq && b.is_faq) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [questions, category, searchQuery]);

  const faqCount = filteredQuestions.filter(q => q.is_faq).length;
  const userQuestionCount = filteredQuestions.filter(q => !q.is_faq).length;

  const getCategoryIcon = (cat) => {
    const found = CATEGORIES.find(c => c.id === cat);
    return found ? found.icon : '❓';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Q&A</h1>
      <p style={styles.subtitle}>자주 묻는 질문과 답변</p>

      {/* 검색창 */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="질문 검색... (중복 질문 방지)"
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.clearButton} onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div style={styles.categoryContainer}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.categoryTab,
              ...(category === cat.id ? styles.categoryTabActive : {}),
            }}
            onClick={() => setCategory(cat.id)}
          >
            <span style={styles.categoryIcon}>{cat.icon}</span>
            <span style={styles.categoryLabel}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 결과 요약 */}
      <div style={styles.resultSummary}>
        <span>FAQ {faqCount}개</span>
        {userQuestionCount > 0 && <span> · 질문 {userQuestionCount}개</span>}
      </div>

      {/* 질문 목록 */}
      <div style={styles.questionList}>
        {filteredQuestions.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>❓</span>
            <p style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '질문이 없습니다.'}
            </p>
          </div>
        ) : (
          filteredQuestions.map(question => (
            <div
              key={question.id}
              style={{
                ...styles.questionCard,
                borderLeft: question.is_faq ? `3px solid ${COLORS.primary}` : 'none',
              }}
              onClick={() => setSelectedQuestion(question)}
            >
              <div style={styles.questionHeader}>
                {question.is_faq && (
                  <span style={styles.faqBadge}>FAQ</span>
                )}
                <span style={styles.categoryBadge}>
                  {getCategoryIcon(question.category)} {question.category}
                </span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: question.is_answered ? COLORS.secondary : COLORS.surfaceLight,
                  color: question.is_answered ? '#000' : COLORS.textMuted,
                }}>
                  {question.is_answered ? '답변완료' : '미답변'}
                </span>
              </div>
              <h3 style={styles.questionTitle}>Q. {question.title}</h3>
              {question.is_answered && question.answer && (
                <p style={styles.answerPreview}>
                  A. {question.answer.length > 80 ? question.answer.slice(0, 80) + '...' : question.answer}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* 질문하기 버튼 (플로팅) */}
      <button style={styles.floatingButton} onClick={() => setShowQuestionModal(true)}>
        <span style={styles.floatingIcon}>✏️</span>
        <span>질문하기</span>
      </button>

      {/* 질문 작성 모달 */}
      {showQuestionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowQuestionModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>질문하기</h2>
              <button style={styles.closeButton} onClick={() => setShowQuestionModal(false)}>✕</button>
            </div>

            {/* 유사 질문 안내 */}
            {similarQuestions.length > 0 && (
              <div style={styles.similarBox}>
                <p style={styles.similarTitle}>💡 비슷한 질문이 있어요!</p>
                {similarQuestions.map(sq => (
                  <div
                    key={sq.id}
                    style={styles.similarItem}
                    onClick={() => {
                      setShowQuestionModal(false);
                      setSelectedQuestion(sq);
                    }}
                  >
                    <span style={{
                      ...styles.similarBadge,
                      backgroundColor: sq.is_answered ? COLORS.secondary : COLORS.surfaceLight,
                    }}>
                      {sq.is_answered ? '답변완료' : '미답변'}
                    </span>
                    <span style={styles.similarItemTitle}>{sq.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                style={styles.select}
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>제목 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="질문 제목을 입력하세요"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>내용 *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="질문 내용을 자세히 작성해주세요"
                style={styles.textarea}
                rows={5}
              />
            </div>

            <button
              style={{ ...styles.submitButton, opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '등록 중...' : '질문 등록'}
            </button>
          </div>
        </div>
      )}

      {/* 질문 상세 모달 */}
      {selectedQuestion && (
        <div style={styles.modalOverlay} onClick={() => setSelectedQuestion(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Q&A 상세</h2>
              <button style={styles.closeButton} onClick={() => setSelectedQuestion(null)}>✕</button>
            </div>

            <div style={styles.detailHeader}>
              {selectedQuestion.is_faq && <span style={styles.faqBadge}>FAQ</span>}
              <span style={styles.categoryBadge}>
                {getCategoryIcon(selectedQuestion.category)} {selectedQuestion.category}
              </span>
            </div>

            <div style={styles.questionBox}>
              <span style={styles.qLabel}>Q</span>
              <div>
                <h3 style={styles.detailTitle}>{selectedQuestion.title}</h3>
                <p style={styles.detailContent}>{selectedQuestion.content}</p>
              </div>
            </div>

            {selectedQuestion.is_answered && selectedQuestion.answer ? (
              <div style={styles.answerBox}>
                <span style={styles.aLabel}>A</span>
                <div>
                  <p style={styles.answerContent}>{selectedQuestion.answer}</p>
                  {selectedQuestion.answered_at && (
                    <span style={styles.answerDate}>{formatDate(selectedQuestion.answered_at)}</span>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.waitingBox}>
                <span style={styles.waitingIcon}>⏳</span>
                <p style={styles.waitingText}>답변 대기 중입니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    paddingBottom: '120px',
    maxWidth: '500px',
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
  // 검색
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    marginBottom: '16px',
  },
  searchIcon: { fontSize: '18px' },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  clearButton: {
    padding: '4px 8px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '14px',
    cursor: 'pointer',
  },
  // 카테고리
  categoryContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  },
  categoryTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '20px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  categoryIcon: { fontSize: '14px' },
  categoryLabel: {},
  // 결과
  resultSummary: {
    color: COLORS.textMuted,
    fontSize: '13px',
    marginBottom: '16px',
  },
  // 질문 목록
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
  },
  questionHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px',
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
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
  },
  answerPreview: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
    lineHeight: 1.5,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  emptyText: { color: COLORS.textMuted, fontSize: '14px', margin: 0 },
  // 플로팅 버튼
  floatingButton: {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '30px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 197, 0, 0.4)',
    zIndex: 50,
  },
  floatingIcon: { fontSize: '18px' },
  // 모달
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    maxWidth: '500px',
    maxHeight: '85vh',
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
  // 폼
  formGroup: { marginBottom: '16px' },
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
    boxSizing: 'border-box',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // 유사 질문
  similarBox: {
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
    marginBottom: '16px',
    borderLeft: `3px solid ${COLORS.primary}`,
  },
  similarTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  similarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  similarBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#000',
  },
  similarItemTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // 상세
  detailHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  questionBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
    marginBottom: '16px',
  },
  qLabel: {
    color: COLORS.primary,
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  detailContent: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.6,
  },
  answerBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    borderLeft: `3px solid ${COLORS.secondary}`,
  },
  aLabel: {
    color: COLORS.secondary,
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  answerContent: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '0 0 8px 0',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  answerDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  waitingBox: {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
  },
  waitingIcon: { fontSize: '32px', display: 'block', marginBottom: '8px' },
  waitingText: { color: COLORS.textMuted, fontSize: '14px', margin: 0 },
};

export default QnA;
