// src/pages/Admin/ResourcesManage.jsx
// 관리자 자료실 관리 페이지

import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📁' },
  { id: '템플릿', label: '템플릿', icon: '📝' },
  { id: '가이드', label: '가이드', icon: '📖' },
  { id: '유용한 도구', label: '유용한 도구', icon: '🔧' },
];

const LINK_TYPES = [
  { id: 'notion', label: 'Notion', icon: '📔' },
  { id: 'google_docs', label: 'Google Docs', icon: '📄' },
  { id: 'google_sheets', label: 'Google Sheets', icon: '📊' },
  { id: 'google_drive', label: 'Google Drive', icon: '📂' },
  { id: 'youtube', label: 'YouTube', icon: '🎬' },
  { id: 'website', label: '웹사이트', icon: '🌐' },
  { id: 'download', label: '다운로드', icon: '⬇️' },
  { id: 'other', label: '기타', icon: '🔗' },
];

const ResourcesManage = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'website',
    category: '템플릿',
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error('자료 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title || '',
        description: link.description || '',
        url: link.url || '',
        type: link.type || 'website',
        category: link.category || '템플릿',
        sort_order: link.sort_order || 0,
      });
    } else {
      setEditingLink(null);
      setFormData({
        title: '',
        description: '',
        url: '',
        type: 'website',
        category: '템플릿',
        sort_order: 0,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      alert('제목과 URL을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const linkData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        url: formData.url.trim(),
        type: formData.type,
        category: formData.category,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };

      if (editingLink) {
        const { error } = await supabase
          .from('links')
          .update(linkData)
          .eq('id', editingLink.id);
        if (error) throw error;
        alert('수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('links')
          .insert([linkData]);
        if (error) throw error;
        alert('추가되었습니다.');
      }

      setShowModal(false);
      loadLinks();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId) => {
    if (!confirm('이 자료를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      alert('삭제되었습니다.');
      loadLinks();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const getTypeInfo = (typeId) => {
    return LINK_TYPES.find(t => t.id === typeId) || LINK_TYPES[LINK_TYPES.length - 1];
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || { label: categoryId, icon: '📁' };
  };

  // 필터링
  const filteredLinks = activeCategory === 'all'
    ? links
    : links.filter(l => l.category === activeCategory);

  // 카테고리별 그룹핑
  const groupedLinks = {};
  filteredLinks.forEach(link => {
    const cat = link.category || '기타';
    if (!groupedLinks[cat]) {
      groupedLinks[cat] = [];
    }
    groupedLinks[cat].push(link);
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>자료실 관리</h1>
        <button style={styles.addButton} onClick={() => handleOpenModal()}>
          + 자료 추가
        </button>
      </div>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{links.length}</span>
          <span style={styles.statLabel}>전체 자료</span>
        </div>
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
          <div key={cat.id} style={styles.statCard}>
            <span style={styles.statIcon}>{cat.icon}</span>
            <span style={styles.statValue}>
              {links.filter(l => l.category === cat.id).length}
            </span>
            <span style={styles.statLabel}>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.tab,
              ...(activeCategory === cat.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 자료 목록 */}
      {Object.keys(groupedLinks).length > 0 ? (
        <div style={styles.categoryGroups}>
          {Object.entries(groupedLinks).map(([category, catLinks]) => (
            <div key={category} style={styles.categoryGroup}>
              <h3 style={styles.categoryHeader}>
                {getCategoryInfo(category).icon} {category}
                <span style={styles.categoryCount}>{catLinks.length}</span>
              </h3>
              <div style={styles.linkList}>
                {catLinks.map(link => {
                  const typeInfo = getTypeInfo(link.type);
                  return (
                    <div
                      key={link.id}
                      style={styles.linkCard}
                      onClick={() => handleOpenModal(link)}
                    >
                      <div style={styles.linkIcon}>{typeInfo.icon}</div>
                      <div style={styles.linkMain}>
                        <div style={styles.linkHeader}>
                          <h4 style={styles.linkTitle}>{link.title}</h4>
                          <span style={styles.typeBadge}>{typeInfo.label}</span>
                        </div>
                        {link.description && (
                          <p style={styles.linkDesc}>{link.description}</p>
                        )}
                        <p style={styles.linkUrl}>{link.url}</p>
                      </div>
                      <div style={styles.linkActions}>
                        <span style={styles.sortOrder}>#{link.sort_order || 0}</span>
                        <button
                          style={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(link.id);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📁</span>
          <p style={styles.emptyText}>등록된 자료가 없습니다.</p>
        </div>
      )}

      {/* 자료 추가/수정 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingLink ? '자료 수정' : '자료 추가'}
              </h2>
              <button style={styles.closeButton} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="자료 제목"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>카테고리</label>
                <div style={styles.optionSelector}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <button
                      key={cat.id}
                      style={{
                        ...styles.optionBtn,
                        ...(formData.category === cat.id ? styles.optionBtnActive : {}),
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>링크 유형</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  style={styles.select}
                >
                  {LINK_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="자료에 대한 설명 (선택)"
                  style={styles.textarea}
                  rows={2}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>정렬 순서</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                  placeholder="0"
                  style={styles.input}
                />
                <span style={styles.hint}>숫자가 작을수록 먼저 표시됩니다</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowModal(false)}>
                취소
              </button>
              <button
                style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? '저장 중...' : (editingLink ? '수정' : '추가')}
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
    padding: '10px 20px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
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
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statIcon: {
    fontSize: '20px',
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
    flexWrap: 'wrap',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '20px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  // 카테고리 그룹
  categoryGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  categoryGroup: {},
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  categoryCount: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '10px',
    color: COLORS.textMuted,
    fontSize: '12px',
    fontWeight: 'normal',
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  linkCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    cursor: 'pointer',
  },
  linkIcon: {
    fontSize: '28px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '10px',
    flexShrink: 0,
  },
  linkMain: {
    flex: 1,
    minWidth: 0,
  },
  linkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  linkTitle: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '600',
    margin: 0,
  },
  typeBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  linkDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 4px 0',
    lineHeight: 1.4,
  },
  linkUrl: {
    color: COLORS.secondary,
    fontSize: '12px',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  linkActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  sortOrder: {
    color: COLORS.textMuted,
    fontSize: '11px',
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.error}`,
    borderRadius: '6px',
    color: COLORS.error,
    fontSize: '12px',
    cursor: 'pointer',
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
    maxWidth: '480px',
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
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
  optionSelector: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  optionBtn: {
    padding: '8px 14px',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.surfaceLight}`,
    borderRadius: '6px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
  optionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  hint: {
    display: 'block',
    marginTop: '6px',
    color: COLORS.textMuted,
    fontSize: '12px',
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

export default ResourcesManage;
