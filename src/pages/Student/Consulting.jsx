// src/pages/Student/Consulting.jsx
// 상담 페이지

import { useState, useEffect } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';
import { formatDateFull } from '../../utils/helpers';

const Consulting = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultings, setConsultings] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'general',
    title: '',
    content: '',
    preferred_date: '',
    preferred_time: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadConsultings();
    }
  }, [user?.id]);

  const loadConsultings = async () => {
    try {
      const { data, error } = await supabase
        .from('consultings')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultings(data || []);
    } catch (err) {
      console.error('상담 내역 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('consultings')
        .insert([{
          student_id: user.id,
          type: formData.type,
          title: formData.title.trim(),
          content: formData.content.trim(),
          preferred_date: formData.preferred_date || null,
          preferred_time: formData.preferred_time || null,
          status: 'pending',
        }]);

      if (error) throw error;

      alert('상담 신청이 완료되었습니다.');
      setShowRequestModal(false);
      setFormData({
        type: 'general',
        title: '',
        content: '',
        preferred_date: '',
        preferred_time: '',
      });
      loadConsultings();
    } catch (err) {
      console.error('상담 신청 실패:', err);
      alert('상담 신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { text: '대기중', color: COLORS.warning };
      case 'scheduled':
        return { text: '예약됨', color: COLORS.secondary };
      case 'completed':
        return { text: '완료', color: COLORS.textMuted };
      case 'cancelled':
        return { text: '취소됨', color: COLORS.error };
      default:
        return { text: status, color: COLORS.textMuted };
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'general': return '일반 상담';
      case 'blog': return '블로그 상담';
      case 'revenue': return '수익화 상담';
      case 'career': return '진로 상담';
      default: return type;
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>상담</h1>
      <p style={styles.subtitle}>1:1 상담 신청 및 내역</p>

      {/* 상담 신청 버튼 */}
      <button
        style={styles.requestButton}
        onClick={() => setShowRequestModal(true)}
      >
        <span style={styles.requestIcon}>💬</span>
        <span>상담 신청하기</span>
      </button>

      {/* 상담 내역 */}
      <h2 style={styles.sectionTitle}>상담 내역</h2>

      {consultings.length > 0 ? (
        <div style={styles.consultingList}>
          {consultings.map(consulting => {
            const status = getStatusBadge(consulting.status);
            return (
              <Card key={consulting.id}>
                <div style={styles.consultingItem}>
                  <div style={styles.consultingHeader}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: status.color,
                    }}>
                      {status.text}
                    </span>
                    <span style={styles.consultingDate}>
                      {formatDateFull(consulting.created_at)}
                    </span>
                  </div>
                  <h3 style={styles.consultingTitle}>{consulting.title}</h3>
                  <p style={styles.consultingContent}>{consulting.content}</p>
                  <div style={styles.consultingMeta}>
                    <span style={styles.typeLabel}>{getTypeLabel(consulting.type)}</span>
                    {consulting.preferred_date && (
                      <span style={styles.preferredTime}>
                        희망: {consulting.preferred_date} {consulting.preferred_time}
                      </span>
                    )}
                  </div>
                  {consulting.reply && (
                    <div style={styles.replyBox}>
                      <span style={styles.replyLabel}>답변</span>
                      <p style={styles.replyContent}>{consulting.reply}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>💬</span>
            <p style={styles.emptyText}>상담 내역이 없습니다.</p>
          </div>
        </Card>
      )}

      {/* 상담 신청 모달 */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="상담 신청"
      >
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>상담 유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              style={styles.select}
            >
              <option value="general">일반 상담</option>
              <option value="blog">블로그 상담</option>
              <option value="revenue">수익화 상담</option>
              <option value="career">진로 상담</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="상담 제목을 입력하세요"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>내용 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="상담 내용을 자세히 작성해주세요"
              style={styles.textarea}
              rows={5}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>희망 날짜 (선택)</label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>희망 시간 (선택)</label>
              <input
                type="time"
                value={formData.preferred_time}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_time: e.target.value }))}
                style={styles.input}
              />
            </div>
          </div>

          <button
            style={{
              ...styles.submitButton,
              opacity: submitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '신청 중...' : '상담 신청'}
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
  requestButton: {
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
    marginBottom: '24px',
  },
  requestIcon: {
    fontSize: '20px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '18px',
    margin: '0 0 16px 0',
  },
  consultingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  consultingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  consultingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#000',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  consultingDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  consultingTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  consultingContent: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
  },
  consultingMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  typeLabel: {
    color: COLORS.primary,
    fontSize: '12px',
  },
  preferredTime: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  replyBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    borderLeft: `3px solid ${COLORS.primary}`,
  },
  replyLabel: {
    color: COLORS.primary,
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '6px',
  },
  replyContent: {
    color: COLORS.text,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
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
    flex: 1,
  },
  formRow: {
    display: 'flex',
    gap: '12px',
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
};

export default Consulting;
