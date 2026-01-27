// src/pages/Student/QnA.jsx
// Q&A 페이지 - 질문 검색 및 중복 방지 기능 포함

import { useState, useEffect, useMemo } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';
import { formatDateFull } from '../../utils/helpers';

const QnA = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'mine' | 'answered' | 'unanswered'
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
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
        .select(`
          *,
          students!qna_student_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Q&A 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 제목 입력 시 유사 질문 검색 (중복 방지)
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
          student_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          is_answered: false,
        }]);

      if (error) throw error;

      alert('질문이 등록되었습니다.');
      setShowQuestionModal(false);
      setFormData({ title: '', content: '', category: 'general' });
      setSimilarQuestions([]);
      loadQuestions();
    } catch (err) {
      console.error('질문 등록 실패:', err);
      alert('질문 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 검색 및 필터링된 질문 목록
  const filteredQuestions = useMemo(() => {
    let result = questions;

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.title.toLowerCase().includes(query) ||
        q.content.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    switch (filter) {
      case 'mine':
        result = result.filter(q => q.student_id === user?.id);
        break;
      case 'answered':
        result = result.filter(q => q.is_answered);
        break;
      case 'unanswered':
        result = result.filter(q => !q.is_answered);
        break;
      default:
        break;
    }

    return result;
  }, [questions, searchQuery, filter, user?.id]);

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'general': return '일반';
      case 'blog': return '블로그';
      case 'revenue': return '수익화';
      case 'tech': return '기술';
      default: return category;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'general': return '💬';
      case 'blog': return '📝';
      case 'revenue': return '💰';
      case 'tech': return '🔧';
      default: return '❓';
    }
  };

  // 모달 열기 시 초기화
  const openQuestionModal = () => {
    setFormData({ title: '', content: '', category: 'general' });
    setSimilarQuestions([]);
    setShowQuestionModal(true);
  };

  // 유사 질문 선택 시 해당 질문 상세 보기
  const handleViewSimilar = (question) => {
    setShowQuestionModal(false);
    setSelectedQuestion(question);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Q&A</h1>
      <p style={styles.subtitle}>궁금한 점을 질문하고 답변받기</p>

      {/* 질문하기 버튼 */}
      <button
        style={styles.askButton}
        onClick={openQuestionModal}
      >
        <span style={styles.askIcon}>✏️</span>
        <span>질문하기</span>
      </button>

      {/* 검색창 */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="질문 검색..."
          style={styles.searchInput}
        />
        {searchQuery && (
          <button
            style={styles.clearButton}
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* 필터 탭 */}
      <div style={styles.filterTabs}>
        {[
          { id: 'all', label: '전체' },
          { id: 'mine', label: '내 질문' },
          { id: 'answered', label: '답변완료' },
          { id: 'unanswered', label: '미답변' },
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.filterTab,
              ...(filter === tab.id ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색 결과 개수 */}
      {searchQuery && (
        <p style={styles.searchResult}>
          검색 결과: <span style={styles.searchCount}>{filteredQuestions.length}</span>건
        </p>
      )}

      {/* 질문 목록 */}
      {filteredQuestions.length > 0 ? (
        <div style={styles.questionList}>
          {filteredQuestions.map(question => (
            <Card key={question.id}>
              <div
                style={styles.questionItem}
                onClick={() => setSelectedQuestion(question)}
              >
                <div style={styles.questionHeader}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: question.is_answered ? COLORS.secondary : COLORS.surface,
                    color: question.is_answered ? '#000' : COLORS.textMuted,
                  }}>
                    {question.is_answered ? '답변완료' : '미답변'}
                  </span>
                  <span style={styles.categoryBadge}>
                    {getCategoryIcon(question.category)} {getCategoryLabel(question.category)}
                  </span>
                </div>
                <h3 style={styles.questionTitle}>{question.title}</h3>
                <p style={styles.questionContent}>
                  {question.content.length > 100
                    ? question.content.substring(0, 100) + '...'
                    : question.content}
                </p>
                <div style={styles.questionMeta}>
                  <span style={styles.authorName}>
                    {question.students?.name || '익명'}
                  </span>
                  <span style={styles.questionDate}>
                    {formatDateFull(question.created_at)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>❓</span>
            <p style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '질문이 없습니다.'}
            </p>
            {searchQuery && (
              <button
                style={styles.emptyButton}
                onClick={openQuestionModal}
              >
                새 질문 작성하기
              </button>
            )}
          </div>
        </Card>
      )}

      {/* 질문 작성 모달 */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title="질문하기"
      >
        <div style={styles.form}>
          {/* 유사 질문 안내 */}
          {similarQuestions.length > 0 && (
            <div style={styles.similarBox}>
              <p style={styles.similarTitle}>💡 비슷한 질문이 있어요</p>
              <p style={styles.similarSubtitle}>
                이미 답변이 있을 수 있어요. 확인해보세요!
              </p>
              {similarQuestions.map(sq => (
                <div
                  key={sq.id}
                  style={styles.similarItem}
                  onClick={() => handleViewSimilar(sq)}
                >
                  <span style={{
                    ...styles.similarBadge,
                    backgroundColor: sq.is_answered ? COLORS.secondary : COLORS.surface,
                    color: sq.is_answered ? '#000' : COLORS.textMuted,
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
              <option value="general">💬 일반</option>
              <option value="blog">📝 블로그</option>
              <option value="revenue">💰 수익화</option>
              <option value="tech">🔧 기술</option>
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
              rows={6}
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
            {submitting ? '등록 중...' : '질문 등록'}
          </button>
        </div>
      </Modal>

      {/* 질문 상세 모달 */}
      <Modal
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        title="질문 상세"
      >
        {selectedQuestion && (
          <div style={styles.detailContent}>
            <div style={styles.detailHeader}>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: selectedQuestion.is_answered ? COLORS.secondary : COLORS.surface,
                color: selectedQuestion.is_answered ? '#000' : COLORS.textMuted,
              }}>
                {selectedQuestion.is_answered ? '답변완료' : '미답변'}
              </span>
              <span style={styles.categoryBadge}>
                {getCategoryIcon(selectedQuestion.category)} {getCategoryLabel(selectedQuestion.category)}
              </span>
            </div>
            <h3 style={styles.detailTitle}>{selectedQuestion.title}</h3>
            <div style={styles.detailMeta}>
              <span>{selectedQuestion.students?.name || '익명'}</span>
              <span>{formatDateFull(selectedQuestion.created_at)}</span>
            </div>
            <p style={styles.detailBody}>{selectedQuestion.content}</p>

            {selectedQuestion.answer ? (
              <div style={styles.answerBox}>
                <span style={styles.answerLabel}>📣 답변</span>
                <p style={styles.answerContent}>{selectedQuestion.answer}</p>
                {selectedQuestion.answered_at && (
                  <span style={styles.answerDate}>
                    {formatDateFull(selectedQuestion.answered_at)}
                  </span>
                )}
              </div>
            ) : (
              <div style={styles.waitingBox}>
                <span style={styles.waitingIcon}>⏳</span>
                <p style={styles.waitingText}>답변 대기 중입니다.</p>
              </div>
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
    paddingBottom: '100px',
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  askButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  askIcon: {
    fontSize: '20px',
  },
  // 검색
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
  },
  searchIcon: {
    fontSize: '18px',
  },
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
  searchResult: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
  },
  searchCount: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // 필터
  filterTabs: {
    display: 'flex',
    gap: '8px',
  },
  filterTab: {
    flex: 1,
    padding: '10px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  // 질문 목록
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionItem: {
    cursor: 'pointer',
  },
  questionHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  categoryBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
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
  questionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    color: COLORS.text,
    fontSize: '13px',
  },
  questionDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 16px 0',
  },
  emptyButton: {
    padding: '10px 20px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // 폼
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
  submitButton: {
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
  // 유사 질문
  similarBox: {
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
    borderLeft: `3px solid ${COLORS.primary}`,
  },
  similarTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  similarSubtitle: {
    color: COLORS.textMuted,
    fontSize: '12px',
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
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailHeader: {
    display: 'flex',
    gap: '8px',
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  detailMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  detailBody: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: 1.7,
    margin: 0,
    padding: '16px 0',
    borderTop: `1px solid ${COLORS.surface}`,
    borderBottom: `1px solid ${COLORS.surface}`,
    whiteSpace: 'pre-wrap',
  },
  answerBox: {
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    borderLeft: `3px solid ${COLORS.secondary}`,
  },
  answerLabel: {
    color: COLORS.secondary,
    fontSize: '13px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '10px',
  },
  answerContent: {
    color: COLORS.text,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  answerDate: {
    display: 'block',
    marginTop: '10px',
    color: COLORS.textMuted,
    fontSize: '12px',
    textAlign: 'right',
  },
  waitingBox: {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  waitingIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '8px',
  },
  waitingText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
};

export default QnA;
