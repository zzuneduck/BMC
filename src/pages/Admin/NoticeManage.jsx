// src/pages/Admin/NoticeManage.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const NoticeManage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    is_pinned: false,
    is_important: false,
  });

  // 주간 공지 자동 생성
  const handleAutoWeeklyNotice = async () => {
    // 현재 주차 계산 (가장 최근 공지의 주차 기반 또는 수동)
    const now = new Date();
    const kstOffset = 9 * 60;
    const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
    const dayOfWeek = kst.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(kst);
    nextMonday.setDate(kst.getDate() + daysUntilMonday);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    const formatKR = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    const period = `${formatKR(nextMonday)}(월) ~ ${formatKR(nextSunday)}(일)`;

    // 주차 번호 추정 (기존 공지에서 추출)
    const weekMatch = notices.find(n => n.title.match(/(\d+)주차/));
    const lastWeek = weekMatch ? parseInt(weekMatch.title.match(/(\d+)주차/)[1]) : 0;
    const nextWeek = lastWeek + 1;

    const title = `${nextWeek}주차 주간 안내 (${period})`;
    const content = `안녕하세요, BMC 수강생 여러분!

${nextWeek}주차 안내드립니다.

[이번 주 일정]
- VOD 강의: ${nextWeek}주차 강의 시청 + 숙제 제출
- 미션: 매일 미션 + 주간 미션 수행
- 출석: 매일 출석체크 잊지 마세요!

[주간 목표]
- VOD 숙제 기한 내 제출
- 블로그 포스팅 꾸준히 작성
- 미션 완료하고 포인트 획득

[공지사항]
- 궁금한 점은 Q&A 게시판을 이용해주세요.
- 코칭 상담이 필요하시면 상담 예약을 해주세요.

이번 주도 화이팅! 💪`;

    if (!confirm(`${nextWeek}주차 주간 공지를 자동 생성합니다.\n\n제목: ${title}\n\n생성하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('notices')
        .insert({
          title,
          content,
          is_pinned: true,
          is_important: false,
        });

      if (error) throw error;
      fetchNotices();
      alert('주간 공지가 생성되었습니다. 내용을 수정하려면 편집해주세요.');
    } catch (err) {
      console.error('자동 공지 생성 실패:', err);
      alert('생성에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('공지사항 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNotice(null);
    setForm({
      title: '',
      content: '',
      is_pinned: false,
      is_important: false,
    });
    setShowModal(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      content: notice.content,
      is_pinned: notice.is_pinned || false,
      is_important: notice.is_important || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      if (editingNotice) {
        // 수정
        const { error } = await supabase
          .from('notices')
          .update({
            title: form.title,
            content: form.content,
            is_pinned: form.is_pinned,
            is_important: form.is_important,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNotice.id);

        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase
          .from('notices')
          .insert({
            title: form.title,
            content: form.content,
            is_pinned: form.is_pinned,
            is_important: form.is_important,
          });

        if (error) throw error;
      }

      setShowModal(false);
      fetchNotices();
    } catch (err) {
      console.error('공지사항 저장 실패:', err);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (notice) => {
    if (!confirm(`"${notice.title}" 공지를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', notice.id);

      if (error) throw error;
      fetchNotices();
    } catch (err) {
      console.error('공지사항 삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const togglePin = async (notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_pinned: !notice.is_pinned })
        .eq('id', notice.id);

      if (error) throw error;
      fetchNotices();
    } catch (err) {
      console.error('고정 토글 실패:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
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
        <h1 style={styles.title}>공지사항 관리</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...styles.addButton, backgroundColor: COLORS.success }} onClick={handleAutoWeeklyNotice}>
            주간 공지 자동 생성
          </button>
          <button style={styles.addButton} onClick={openCreateModal}>
            + 공지 등록
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{notices.length}</span>
          <span style={styles.statLabel}>전체 공지</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{notices.filter(n => n.is_pinned).length}</span>
          <span style={styles.statLabel}>고정 공지</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{notices.filter(n => n.is_important).length}</span>
          <span style={styles.statLabel}>중요 공지</span>
        </div>
      </div>

      {/* 공지 목록 */}
      <div style={styles.noticeList}>
        {notices.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} style={styles.noticeCard}>
              <div style={styles.noticeHeader}>
                <div style={styles.noticeTags}>
                  {notice.is_pinned && (
                    <span style={styles.pinnedTag}>📌 고정</span>
                  )}
                  {notice.is_important && (
                    <span style={styles.importantTag}>🔴 중요</span>
                  )}
                </div>
                <span style={styles.noticeDate}>{formatDate(notice.created_at)}</span>
              </div>
              <h3 style={styles.noticeTitle}>{notice.title}</h3>
              <p style={styles.noticeContent}>
                {notice.content.length > 150
                  ? notice.content.slice(0, 150) + '...'
                  : notice.content}
              </p>
              <div style={styles.noticeActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    color: notice.is_pinned ? COLORS.primary : COLORS.textMuted,
                  }}
                  onClick={() => togglePin(notice)}
                >
                  {notice.is_pinned ? '고정 해제' : '고정'}
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => openEditModal(notice)}
                >
                  수정
                </button>
                <button
                  style={{ ...styles.actionButton, color: COLORS.error }}
                  onClick={() => handleDelete(notice)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingNotice ? '공지 수정' : '공지 등록'}
            </h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>제목</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="공지 제목"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>내용</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="공지 내용을 입력하세요"
                style={styles.textarea}
                rows={8}
              />
            </div>

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  style={styles.checkbox}
                />
                <span>📌 상단 고정</span>
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.is_important}
                  onChange={(e) => setForm({ ...form, is_important: e.target.checked })}
                  style={styles.checkbox}
                />
                <span>🔴 중요 공지</span>
              </label>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button style={styles.saveButton} onClick={handleSave}>
                {editingNotice ? '수정' : '등록'}
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
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
  noticeList: {
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
  noticeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '20px',
  },
  noticeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  noticeTags: {
    display: 'flex',
    gap: '8px',
  },
  pinnedTag: {
    padding: '4px 8px',
    backgroundColor: 'rgba(255, 197, 0, 0.2)',
    borderRadius: '4px',
    fontSize: '12px',
    color: COLORS.primary,
  },
  importantTag: {
    padding: '4px 8px',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: '4px',
    fontSize: '12px',
    color: COLORS.error,
  },
  noticeDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },
  noticeContent: {
    color: COLORS.textMuted,
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
    whiteSpace: 'pre-wrap',
  },
  noticeActions: {
    display: 'flex',
    gap: '12px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
    paddingTop: '12px',
  },
  actionButton: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
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
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: '20px',
    margin: '0 0 20px 0',
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
  textarea: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
  },
  checkboxRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
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

export default NoticeManage;
