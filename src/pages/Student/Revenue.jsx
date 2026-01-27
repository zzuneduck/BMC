// src/pages/Student/Revenue.jsx
// 수익인증 페이지 (+30 포인트)

import { useState, useEffect } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { usePoints } from '../../hooks/usePoints';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';
import { formatDateFull } from '../../utils/helpers';

const REVENUE_TYPES = [
  { value: 'adpost', label: '애드포스트', emoji: '📢' },
  { value: 'experience', label: '체험단', emoji: '🎁' },
  { value: 'other', label: '기타', emoji: '💼' },
];

const Revenue = () => {
  const { user } = useAuth();
  const { addPoints } = usePoints();
  const [loading, setLoading] = useState(true);
  const [proofs, setProofs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'adpost',
    amount: '',
    description: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_proofs')
        .select(`
          *,
          students!revenue_proofs_student_id_fkey(name, team)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProofs(data || []);
    } catch (err) {
      console.error('수익인증 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert('인증 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // 수익인증 저장
      const { error: proofError } = await supabase
        .from('revenue_proofs')
        .insert([{
          student_id: user.id,
          type: formData.type,
          amount: formData.amount ? parseInt(formData.amount, 10) : null,
          description: formData.description.trim(),
          image_url: formData.image_url.trim() || null,
        }]);

      if (proofError) throw proofError;

      // +30 포인트 지급
      const typeLabel = REVENUE_TYPES.find(t => t.value === formData.type)?.label || formData.type;
      await addPoints(user.id, 30, `수익인증 (${typeLabel})`, 'revenue');

      alert('수익인증이 완료되었습니다! +30 포인트');
      setShowModal(false);
      setFormData({
        type: 'adpost',
        amount: '',
        description: '',
        image_url: '',
      });
      loadProofs();
    } catch (err) {
      console.error('수익인증 실패:', err);
      alert('인증에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeInfo = (type) => {
    return REVENUE_TYPES.find(t => t.value === type) || { label: type, emoji: '💰' };
  };

  const formatAmount = (amount) => {
    if (!amount) return null;
    return amount.toLocaleString() + '원';
  };

  // 총 인증 수
  const totalCount = proofs.length;
  // 내 인증 수
  const myCount = proofs.filter(p => p.student_id === user?.id).length;

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>수익인증</h1>
      <p style={styles.subtitle}>블로그 수익을 인증하고 포인트를 받으세요</p>

      {/* 요약 카드 */}
      <div style={styles.summaryRow}>
        <Card>
          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>📊</span>
            <div style={styles.summaryInfo}>
              <span style={styles.summaryValue}>{totalCount}</span>
              <span style={styles.summaryLabel}>전체 인증</span>
            </div>
          </div>
        </Card>
        <Card>
          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>✨</span>
            <div style={styles.summaryInfo}>
              <span style={styles.summaryValue}>{myCount}</span>
              <span style={styles.summaryLabel}>내 인증</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 인증하기 버튼 */}
      <button
        style={styles.submitButton}
        onClick={() => setShowModal(true)}
      >
        <span style={styles.submitIcon}>💰</span>
        <div style={styles.submitText}>
          <span style={styles.submitMain}>수익 인증하기</span>
          <span style={styles.submitSub}>+30 포인트</span>
        </div>
      </button>

      {/* 인증 유형 안내 */}
      <div style={styles.typeGuide}>
        {REVENUE_TYPES.map(type => (
          <div key={type.value} style={styles.typeItem}>
            <span style={styles.typeEmoji}>{type.emoji}</span>
            <span style={styles.typeLabel}>{type.label}</span>
          </div>
        ))}
      </div>

      {/* 인증 목록 */}
      <h2 style={styles.sectionTitle}>전체 인증 내역</h2>

      {proofs.length > 0 ? (
        <div style={styles.proofList}>
          {proofs.map(proof => {
            const typeInfo = getTypeInfo(proof.type);
            const isMe = proof.student_id === user?.id;
            return (
              <Card key={proof.id}>
                <div style={styles.proofItem}>
                  <div style={styles.proofHeader}>
                    <div style={styles.proofAuthor}>
                      <span style={styles.authorEmoji}>{typeInfo.emoji}</span>
                      <span style={{
                        ...styles.authorName,
                        color: isMe ? COLORS.primary : COLORS.text,
                      }}>
                        {proof.students?.name || '익명'}
                        {isMe && ' (나)'}
                      </span>
                      {proof.students?.team && (
                        <span style={styles.authorTeam}>{proof.students.team}</span>
                      )}
                    </div>
                    <span style={styles.proofDate}>
                      {formatDateFull(proof.created_at)}
                    </span>
                  </div>

                  <div style={styles.proofContent}>
                    <span style={styles.typeBadge}>{typeInfo.label}</span>
                    {proof.amount && (
                      <span style={styles.proofAmount}>
                        {formatAmount(proof.amount)}
                      </span>
                    )}
                  </div>

                  <p style={styles.proofDesc}>{proof.description}</p>

                  {proof.image_url && (
                    <a
                      href={proof.image_url}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.proofLink}
                    >
                      인증 이미지 보기 →
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>💰</span>
            <p style={styles.emptyText}>아직 인증된 수익이 없습니다.</p>
            <p style={styles.emptySubtext}>첫 번째 인증의 주인공이 되어보세요!</p>
          </div>
        </Card>
      )}

      {/* 인증 모달 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="수익 인증"
      >
        <div style={styles.form}>
          {/* 포인트 안내 */}
          <div style={styles.pointsNotice}>
            <span style={styles.pointsIcon}>🎁</span>
            <span style={styles.pointsText}>인증 완료 시 +30 포인트!</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>인증 유형 *</label>
            <div style={styles.typeSelector}>
              {REVENUE_TYPES.map(type => (
                <button
                  key={type.value}
                  style={{
                    ...styles.typeButton,
                    ...(formData.type === type.value ? styles.typeButtonActive : {}),
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                >
                  <span style={styles.typeBtnEmoji}>{type.emoji}</span>
                  <span style={styles.typeBtnLabel}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>금액 (선택)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="예: 50000"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>인증 내용 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="어떤 수익인지 간단히 설명해주세요"
              style={styles.textarea}
              rows={3}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>이미지 URL (선택)</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="스크린샷 URL"
              style={styles.input}
            />
          </div>

          <button
            style={{
              ...styles.formSubmitButton,
              opacity: submitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '인증 중...' : '인증하기 (+30P)'}
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
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  summaryIcon: {
    fontSize: '28px',
  },
  summaryInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '18px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  submitIcon: {
    fontSize: '28px',
  },
  submitText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  submitMain: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  submitSub: {
    fontSize: '13px',
    opacity: 0.8,
  },
  typeGuide: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    marginBottom: '24px',
  },
  typeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  typeEmoji: {
    fontSize: '16px',
  },
  typeLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '18px',
    margin: '0 0 16px 0',
  },
  proofList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  proofItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  proofHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proofAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  authorEmoji: {
    fontSize: '18px',
  },
  authorName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  authorTeam: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textMuted,
    borderRadius: '4px',
    fontSize: '11px',
  },
  proofDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  proofContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  typeBadge: {
    padding: '4px 12px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  proofAmount: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  proofDesc: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
  },
  proofLink: {
    color: COLORS.primary,
    fontSize: '13px',
    textDecoration: 'none',
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
    margin: '0 0 4px 0',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: 0,
    opacity: 0.7,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  pointsNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(255, 197, 0, 0.15)',
    borderRadius: '8px',
  },
  pointsIcon: {
    fontSize: '20px',
  },
  pointsText: {
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: 'bold',
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
  typeSelector: {
    display: 'flex',
    gap: '8px',
  },
  typeButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 8px',
    backgroundColor: COLORS.surface,
    border: '2px solid transparent',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  typeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 197, 0, 0.1)',
  },
  typeBtnEmoji: {
    fontSize: '24px',
  },
  typeBtnLabel: {
    color: COLORS.text,
    fontSize: '13px',
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
  formSubmitButton: {
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

export default Revenue;
