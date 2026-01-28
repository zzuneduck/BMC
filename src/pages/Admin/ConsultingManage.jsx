// src/pages/Admin/ConsultingManage.jsx
// 관리자 상담 신청 관리 페이지

import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const STATUS_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '대기중' },
  { id: 'scheduled', label: '예약됨' },
  { id: 'completed', label: '완료' },
  { id: 'cancelled', label: '취소' },
];

const TYPE_LABELS = {
  general: '일반 상담',
  blog: '블로그 상담',
  revenue: '수익화 상담',
  career: '진로 상담',
};

const ConsultingManage = () => {
  const [consultings, setConsultings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedConsulting, setSelectedConsulting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // 통계
  const stats = {
    total: consultings.length,
    pending: consultings.filter(c => c.status === 'pending').length,
    scheduled: consultings.filter(c => c.status === 'scheduled').length,
    completed: consultings.filter(c => c.status === 'completed').length,
  };

  useEffect(() => {
    loadConsultings();
  }, []);

  const loadConsultings = async () => {
    try {
      const { data, error } = await supabase
        .from('consultings')
        .select(`
          *,
          students:student_id (id, name, team_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultings(data || []);
    } catch (err) {
      console.error('상담 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (consulting) => {
    setSelectedConsulting(consulting);
    setReply(consulting.reply || '');
    setNewStatus(consulting.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedConsulting) return;

    setSaving(true);
    try {
      const updateData = {
        status: newStatus,
        reply: reply.trim() || null,
      };

      // 답변이 있으면 answered_at 설정
      if (reply.trim()) {
        updateData.replied_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('consultings')
        .update(updateData)
        .eq('id', selectedConsulting.id);

      if (error) throw error;

      alert('저장되었습니다.');
      setShowModal(false);
      loadConsultings();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { text: '대기중', color: COLORS.warning, bgColor: `${COLORS.warning}20` };
      case 'scheduled':
        return { text: '예약됨', color: COLORS.secondary, bgColor: `${COLORS.secondary}20` };
      case 'completed':
        return { text: '완료', color: COLORS.textMuted, bgColor: `${COLORS.surfaceLight}` };
      case 'cancelled':
        return { text: '취소', color: COLORS.error, bgColor: `${COLORS.error}20` };
      default:
        return { text: status, color: COLORS.textMuted, bgColor: COLORS.surfaceLight };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const filteredConsultings = activeStatus === 'all'
    ? consultings
    : consultings.filter(c => c.status === activeStatus);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>상담 관리</h1>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>전체</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: COLORS.warning }}>
          <span style={{ ...styles.statValue, color: COLORS.warning }}>{stats.pending}</span>
          <span style={styles.statLabel}>대기중</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: COLORS.secondary }}>
          <span style={{ ...styles.statValue, color: COLORS.secondary }}>{stats.scheduled}</span>
          <span style={styles.statLabel}>예약됨</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: COLORS.success }}>
          <span style={{ ...styles.statValue, color: COLORS.success }}>{stats.completed}</span>
          <span style={styles.statLabel}>완료</span>
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={styles.tabs}>
        {STATUS_OPTIONS.map(option => (
          <button
            key={option.id}
            style={{
              ...styles.tab,
              ...(activeStatus === option.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveStatus(option.id)}
          >
            {option.label}
            {option.id !== 'all' && (
              <span style={styles.tabCount}>
                {consultings.filter(c => c.status === option.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 상담 목록 */}
      {filteredConsultings.length > 0 ? (
        <div style={styles.list}>
          {filteredConsultings.map(consulting => {
            const status = getStatusBadge(consulting.status);
            return (
              <div
                key={consulting.id}
                style={styles.card}
                onClick={() => handleOpenModal(consulting)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardLeft}>
                    <span style={{
                      ...styles.statusBadge,
                      color: status.color,
                      backgroundColor: status.bgColor,
                    }}>
                      {status.text}
                    </span>
                    <span style={styles.typeLabel}>
                      {TYPE_LABELS[consulting.type] || consulting.type}
                    </span>
                  </div>
                  <span style={styles.date}>{formatDate(consulting.created_at)}</span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.studentInfo}>
                    <span style={styles.studentName}>
                      {consulting.students?.name || '(탈퇴회원)'}
                    </span>
                    {consulting.students?.team_id && (
                      <span style={styles.teamBadge}>
                        {consulting.students.team_id}조
                      </span>
                    )}
                  </div>
                  <h3 style={styles.cardTitle}>{consulting.title}</h3>
                  <p style={styles.cardContent}>{consulting.content}</p>

                  {consulting.preferred_date && (
                    <div style={styles.preferredInfo}>
                      희망일시: {consulting.preferred_date} {consulting.preferred_time}
                    </div>
                  )}

                  {consulting.reply && (
                    <div style={styles.replyPreview}>
                      <span style={styles.replyIcon}>💬</span>
                      <span style={styles.replyText}>답변 완료</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📋</span>
          <p style={styles.emptyText}>상담 신청이 없습니다.</p>
        </div>
      )}

      {/* 상담 상세/답변 모달 */}
      {showModal && selectedConsulting && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>상담 상세</h2>
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
                    {selectedConsulting.students?.name || '(탈퇴회원)'}
                    {selectedConsulting.students?.team_id && ` (${selectedConsulting.students.team_id}조)`}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>유형</span>
                  <span style={styles.infoValue}>
                    {TYPE_LABELS[selectedConsulting.type] || selectedConsulting.type}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>신청일</span>
                  <span style={styles.infoValue}>
                    {new Date(selectedConsulting.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                {selectedConsulting.preferred_date && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>희망일시</span>
                    <span style={styles.infoValue}>
                      {selectedConsulting.preferred_date} {selectedConsulting.preferred_time}
                    </span>
                  </div>
                )}
              </div>

              {/* 상담 내용 */}
              <div style={styles.contentSection}>
                <h4 style={styles.contentTitle}>{selectedConsulting.title}</h4>
                <p style={styles.contentText}>{selectedConsulting.content}</p>
              </div>

              {/* 상태 변경 */}
              <div style={styles.formGroup}>
                <label style={styles.label}>상태</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={styles.select}
                >
                  <option value="pending">대기중</option>
                  <option value="scheduled">예약됨</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              {/* 답변 */}
              <div style={styles.formGroup}>
                <label style={styles.label}>답변</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="수강생에게 전달할 답변을 작성하세요"
                  style={styles.textarea}
                  rows={5}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                style={{
                  ...styles.saveButton,
                  opacity: saving ? 0.7 : 1,
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
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
    borderLeft: `3px solid ${COLORS.primary}`,
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
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
  tabCount: {
    fontSize: '12px',
    opacity: 0.8,
  },
  // 목록
  list: {
    display: 'flex',
    flexDirection: 'column',
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
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  typeLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
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
    marginBottom: '8px',
  },
  studentName: {
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: '600',
  },
  teamBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 6px 0',
  },
  cardContent: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  preferredInfo: {
    marginTop: '8px',
    color: COLORS.secondary,
    fontSize: '12px',
  },
  replyPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '6px',
  },
  replyIcon: {
    fontSize: '14px',
  },
  replyText: {
    color: COLORS.success,
    fontSize: '12px',
    fontWeight: '500',
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
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
  },
  contentTitle: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  contentText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '14px',
    marginBottom: '8px',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    cursor: 'pointer',
  },
  saveButton: {
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

export default ConsultingManage;
