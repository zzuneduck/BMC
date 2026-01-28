// src/pages/Student/Notice.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}분 전`;
      }
      return `${hours}시간 전`;
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
  };

  const isNew = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days < 3;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>공지사항</h1>

      {notices.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📢</span>
          <p style={styles.emptyText}>등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div style={styles.noticeList}>
          {notices.map((notice) => (
            <div
              key={notice.id}
              style={styles.noticeCard}
              onClick={() => setSelectedNotice(notice)}
            >
              <div style={styles.noticeHeader}>
                <div style={styles.noticeTags}>
                  {notice.is_pinned && (
                    <span style={styles.pinnedTag}>📌</span>
                  )}
                  {notice.is_important && (
                    <span style={styles.importantTag}>중요</span>
                  )}
                  {isNew(notice.created_at) && (
                    <span style={styles.newTag}>NEW</span>
                  )}
                </div>
                <span style={styles.noticeDate}>{formatDate(notice.created_at)}</span>
              </div>
              <h3 style={styles.noticeTitle}>{notice.title}</h3>
              <p style={styles.noticePreview}>
                {notice.content.length > 80
                  ? notice.content.slice(0, 80) + '...'
                  : notice.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 상세 보기 모달 */}
      {selectedNotice && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTags}>
                {selectedNotice.is_pinned && (
                  <span style={styles.pinnedTag}>📌 고정</span>
                )}
                {selectedNotice.is_important && (
                  <span style={styles.importantTagLarge}>중요</span>
                )}
              </div>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedNotice(null)}
              >
                ✕
              </button>
            </div>
            <h2 style={styles.modalTitle}>{selectedNotice.title}</h2>
            <span style={styles.modalDate}>
              {new Date(selectedNotice.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div style={styles.modalDivider} />
            <p style={styles.modalContent}>{selectedNotice.content}</p>
          </div>
        </div>
      )}
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
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '60px 20px',
    textAlign: 'center',
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
  },
  noticeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noticeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  noticeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  noticeTags: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pinnedTag: {
    fontSize: '14px',
  },
  importantTag: {
    padding: '2px 6px',
    backgroundColor: COLORS.error,
    borderRadius: '4px',
    fontSize: '10px',
    color: '#fff',
    fontWeight: 'bold',
  },
  newTag: {
    padding: '2px 6px',
    backgroundColor: COLORS.secondary,
    borderRadius: '4px',
    fontSize: '10px',
    color: '#fff',
    fontWeight: 'bold',
  },
  noticeDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 6px 0',
  },
  noticePreview: {
    color: COLORS.textMuted,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: 0,
  },
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
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  modalTags: {
    display: 'flex',
    gap: '8px',
  },
  importantTagLarge: {
    padding: '4px 10px',
    backgroundColor: COLORS.error,
    borderRadius: '4px',
    fontSize: '12px',
    color: '#fff',
    fontWeight: 'bold',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  modalDate: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  modalDivider: {
    height: '1px',
    backgroundColor: COLORS.surfaceLight,
    margin: '16px 0',
  },
  modalContent: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: '1.8',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
};

export default Notice;
