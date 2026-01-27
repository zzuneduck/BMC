// src/pages/Student/Earnings.jsx
// 수익인증 페이지

import { useState, useEffect } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';
import { formatDateFull } from '../../utils/helpers';

const Earnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState([]);
  const [myEarnings, setMyEarnings] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'adsense',
    description: '',
    proof_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, [user?.id]);

  const loadEarnings = async () => {
    try {
      // 전체 수익 인증 (승인된 것만)
      const { data: allData, error: allError } = await supabase
        .from('earnings')
        .select(`
          *,
          students!earnings_student_id_fkey(name, team)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (allError) throw allError;
      setEarnings(allData || []);

      // 내 수익 인증
      if (user?.id) {
        const { data: myData, error: myError } = await supabase
          .from('earnings')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (myError) throw myError;
        setMyEarnings(myData || []);
      }
    } catch (err) {
      console.error('수익 인증 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description.trim()) {
      alert('금액과 설명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('earnings')
        .insert([{
          student_id: user.id,
          amount: parseInt(formData.amount, 10),
          type: formData.type,
          description: formData.description.trim(),
          proof_url: formData.proof_url.trim() || null,
          status: 'pending',
        }]);

      if (error) throw error;

      alert('수익 인증이 제출되었습니다. 승인 후 공개됩니다.');
      setShowSubmitModal(false);
      setFormData({
        amount: '',
        type: 'adsense',
        description: '',
        proof_url: '',
      });
      loadEarnings();
    } catch (err) {
      console.error('수익 인증 제출 실패:', err);
      alert('제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'adsense': return '애드센스';
      case 'affiliate': return '체험단';
      case 'sponsored': return '협찬';
      case 'coupang': return '쿠팡파트너스';
      case 'other': return '기타';
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return { text: '검토중', color: COLORS.warning };
      case 'approved': return { text: '승인', color: COLORS.success };
      case 'rejected': return { text: '반려', color: COLORS.error };
      default: return { text: status, color: COLORS.textMuted };
    }
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString() + '원';
  };

  // 전체 수익 합계
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>수익인증</h1>
      <p style={styles.subtitle}>블로그 수익을 인증하고 공유하세요</p>

      {/* 전체 수익 요약 */}
      <Card>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>💰</div>
          <div style={styles.summaryInfo}>
            <span style={styles.summaryLabel}>전체 인증 수익</span>
            <span style={styles.summaryAmount}>{formatAmount(totalEarnings)}</span>
          </div>
          <span style={styles.summaryCount}>{earnings.length}건</span>
        </div>
      </Card>

      {/* 수익 인증 버튼 */}
      <button
        style={styles.submitButton}
        onClick={() => setShowSubmitModal(true)}
      >
        <span style={styles.submitIcon}>📝</span>
        <span>수익 인증하기</span>
      </button>

      {/* 탭 */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'all' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('all')}
        >
          전체 인증
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'mine' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('mine')}
        >
          내 인증
        </button>
      </div>

      {/* 인증 목록 */}
      {activeTab === 'all' ? (
        earnings.length > 0 ? (
          <div style={styles.earningsList}>
            {earnings.map(earning => (
              <Card key={earning.id}>
                <div style={styles.earningItem}>
                  <div style={styles.earningHeader}>
                    <span style={styles.earningAuthor}>
                      {earning.students?.name || '익명'}
                      {earning.students?.team && ` (${earning.students.team})`}
                    </span>
                    <span style={styles.earningDate}>
                      {formatDateFull(earning.created_at)}
                    </span>
                  </div>
                  <div style={styles.earningMain}>
                    <span style={styles.earningAmount}>
                      {formatAmount(earning.amount)}
                    </span>
                    <span style={styles.earningType}>
                      {getTypeLabel(earning.type)}
                    </span>
                  </div>
                  <p style={styles.earningDesc}>{earning.description}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>💰</span>
              <p style={styles.emptyText}>아직 인증된 수익이 없습니다.</p>
            </div>
          </Card>
        )
      ) : (
        myEarnings.length > 0 ? (
          <div style={styles.earningsList}>
            {myEarnings.map(earning => {
              const status = getStatusBadge(earning.status);
              return (
                <Card key={earning.id}>
                  <div style={styles.earningItem}>
                    <div style={styles.earningHeader}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: status.color,
                      }}>
                        {status.text}
                      </span>
                      <span style={styles.earningDate}>
                        {formatDateFull(earning.created_at)}
                      </span>
                    </div>
                    <div style={styles.earningMain}>
                      <span style={styles.earningAmount}>
                        {formatAmount(earning.amount)}
                      </span>
                      <span style={styles.earningType}>
                        {getTypeLabel(earning.type)}
                      </span>
                    </div>
                    <p style={styles.earningDesc}>{earning.description}</p>
                    {earning.status === 'rejected' && earning.reject_reason && (
                      <p style={styles.rejectReason}>
                        반려 사유: {earning.reject_reason}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📝</span>
              <p style={styles.emptyText}>인증한 수익이 없습니다.</p>
            </div>
          </Card>
        )
      )}

      {/* 수익 인증 모달 */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="수익 인증"
      >
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>수익 유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              style={styles.select}
            >
              <option value="adsense">애드센스</option>
              <option value="affiliate">체험단</option>
              <option value="sponsored">협찬</option>
              <option value="coupang">쿠팡파트너스</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>금액 (원) *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="예: 50000"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>설명 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="수익에 대한 설명을 작성해주세요"
              style={styles.textarea}
              rows={4}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>인증 URL (선택)</label>
            <input
              type="url"
              value={formData.proof_url}
              onChange={(e) => setFormData(prev => ({ ...prev, proof_url: e.target.value }))}
              placeholder="스크린샷 또는 증빙 URL"
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
            {submitting ? '제출 중...' : '인증 제출'}
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
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  summaryIcon: {
    fontSize: '40px',
  },
  summaryInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  summaryAmount: {
    color: COLORS.primary,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  summaryCount: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  submitButton: {
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
    margin: '16px 0',
  },
  submitIcon: {
    fontSize: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontSize: '14px',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  earningsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  earningItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  earningHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningAuthor: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  earningDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  earningMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  earningAmount: {
    color: COLORS.primary,
    fontSize: '22px',
    fontWeight: 'bold',
  },
  earningType: {
    padding: '4px 10px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '12px',
  },
  earningDesc: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#000',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  rejectReason: {
    color: COLORS.error,
    fontSize: '13px',
    margin: 0,
    padding: '8px',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: '4px',
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

export default Earnings;
