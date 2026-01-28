// src/pages/Admin/RevenueManage.jsx
// 관리자 수익인증 관리 페이지

import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const TYPE_OPTIONS = [
  { id: 'all', label: '전체', emoji: '📊' },
  { id: 'adpost', label: '애드포스트', emoji: '📢' },
  { id: 'experience', label: '체험단', emoji: '🎁' },
  { id: 'other', label: '기타', emoji: '💼' },
];

const RevenueManage = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [selectedProof, setSelectedProof] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 통계 계산
  const stats = {
    total: proofs.length,
    adpost: proofs.filter(p => p.type === 'adpost').length,
    experience: proofs.filter(p => p.type === 'experience').length,
    other: proofs.filter(p => p.type === 'other').length,
    totalAmount: proofs.reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_proofs')
        .select(`
          *,
          students:student_id (id, name, team_id)
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

  const handleDelete = async (proofId) => {
    if (!confirm('이 수익인증을 삭제하시겠습니까?\n(지급된 포인트는 회수되지 않습니다)')) return;

    try {
      const { error } = await supabase
        .from('revenue_proofs')
        .delete()
        .eq('id', proofId);

      if (error) throw error;

      alert('삭제되었습니다.');
      setShowModal(false);
      loadProofs();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const getTypeInfo = (type) => {
    return TYPE_OPTIONS.find(t => t.id === type) || { label: type, emoji: '💰' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatAmount = (amount) => {
    if (!amount) return '-';
    return amount.toLocaleString() + '원';
  };

  const filteredProofs = activeType === 'all'
    ? proofs
    : proofs.filter(p => p.type === activeType);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>수익인증 관리</h1>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>📊</span>
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>전체 인증</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>📢</span>
          <span style={styles.statValue}>{stats.adpost}</span>
          <span style={styles.statLabel}>애드포스트</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>🎁</span>
          <span style={styles.statValue}>{stats.experience}</span>
          <span style={styles.statLabel}>체험단</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>💰</span>
          <span style={{ ...styles.statValue, fontSize: '20px' }}>
            {stats.totalAmount.toLocaleString()}원
          </span>
          <span style={styles.statLabel}>총 인증금액</span>
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={styles.tabs}>
        {TYPE_OPTIONS.map(option => (
          <button
            key={option.id}
            style={{
              ...styles.tab,
              ...(activeType === option.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveType(option.id)}
          >
            <span style={styles.tabEmoji}>{option.emoji}</span>
            {option.label}
            {option.id !== 'all' && (
              <span style={styles.tabCount}>
                {proofs.filter(p => p.type === option.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 인증 목록 */}
      {filteredProofs.length > 0 ? (
        <div style={styles.list}>
          {filteredProofs.map(proof => {
            const typeInfo = getTypeInfo(proof.type);
            return (
              <div
                key={proof.id}
                style={styles.card}
                onClick={() => {
                  setSelectedProof(proof);
                  setShowModal(true);
                }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardLeft}>
                    <span style={styles.cardEmoji}>{typeInfo.emoji}</span>
                    <span style={styles.typeBadge}>{typeInfo.label}</span>
                  </div>
                  <span style={styles.date}>{formatDate(proof.created_at)}</span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.studentInfo}>
                    <span style={styles.studentName}>
                      {proof.students?.name || '(탈퇴회원)'}
                    </span>
                    {proof.students?.team_id && (
                      <span style={styles.teamBadge}>
                        {proof.students.team_id}조
                      </span>
                    )}
                  </div>

                  {proof.amount && (
                    <div style={styles.amountRow}>
                      <span style={styles.amountLabel}>인증금액</span>
                      <span style={styles.amountValue}>{formatAmount(proof.amount)}</span>
                    </div>
                  )}

                  <p style={styles.description}>{proof.description}</p>

                  {proof.image_url && (
                    <span style={styles.hasImage}>이미지 첨부됨</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>💰</span>
          <p style={styles.emptyText}>수익인증이 없습니다.</p>
        </div>
      )}

      {/* 상세 모달 */}
      {showModal && selectedProof && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>수익인증 상세</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* 수강생 정보 */}
              <div style={styles.infoSection}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>수강생</span>
                  <span style={styles.infoValue}>
                    {selectedProof.students?.name || '(탈퇴회원)'}
                    {selectedProof.students?.team_id && ` (${selectedProof.students.team_id}조)`}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>유형</span>
                  <span style={styles.infoValue}>
                    {getTypeInfo(selectedProof.type).emoji} {getTypeInfo(selectedProof.type).label}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>인증일</span>
                  <span style={styles.infoValue}>
                    {new Date(selectedProof.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                {selectedProof.amount && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>금액</span>
                    <span style={{ ...styles.infoValue, color: COLORS.primary, fontWeight: 'bold' }}>
                      {formatAmount(selectedProof.amount)}
                    </span>
                  </div>
                )}
              </div>

              {/* 인증 내용 */}
              <div style={styles.contentSection}>
                <h4 style={styles.contentLabel}>인증 내용</h4>
                <p style={styles.contentText}>{selectedProof.description}</p>
              </div>

              {/* 이미지 */}
              {selectedProof.image_url && (
                <div style={styles.imageSection}>
                  <h4 style={styles.contentLabel}>첨부 이미지</h4>
                  <a
                    href={selectedProof.image_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.imageLink}
                  >
                    이미지 새 탭에서 보기 →
                  </a>
                  <img
                    src={selectedProof.image_url}
                    alt="인증 이미지"
                    style={styles.proofImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.deleteButton}
                onClick={() => handleDelete(selectedProof.id)}
              >
                삭제
              </button>
              <button
                style={styles.closeModalButton}
                onClick={() => setShowModal(false)}
              >
                닫기
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
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: COLORS.textMuted,
  },
  // 통계
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statEmoji: {
    fontSize: '24px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  // 탭
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  tabEmoji: {
    fontSize: '16px',
  },
  tabCount: {
    fontSize: '12px',
    opacity: 0.8,
  },
  // 목록
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardEmoji: {
    fontSize: '20px',
  },
  typeBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  date: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  cardBody: {},
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '600',
  },
  teamBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '6px',
    marginBottom: '10px',
  },
  amountLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  amountValue: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  description: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  hasImage: {
    display: 'inline-block',
    marginTop: '8px',
    padding: '4px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.secondary,
    fontSize: '11px',
  },
  // 빈 상태
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
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
  // 모달
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.textMuted,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: '13px',
    fontWeight: '500',
  },
  contentSection: {
    marginBottom: '16px',
  },
  contentLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 8px 0',
  },
  contentText: {
    color: COLORS.text,
    fontSize: '14px',
    margin: 0,
    padding: '14px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  imageSection: {
    marginBottom: '16px',
  },
  imageLink: {
    display: 'block',
    color: COLORS.primary,
    fontSize: '13px',
    marginBottom: '10px',
    textDecoration: 'none',
  },
  proofImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: '10px',
    backgroundColor: COLORS.surface,
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
  },
  deleteButton: {
    padding: '14px 20px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.error}`,
    borderRadius: '8px',
    color: COLORS.error,
    fontSize: '15px',
    cursor: 'pointer',
  },
  closeModalButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    cursor: 'pointer',
  },
};

export default RevenueManage;
