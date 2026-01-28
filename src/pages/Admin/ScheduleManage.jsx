// src/pages/Admin/ScheduleManage.jsx
// 관리자 일정 관리 페이지

import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const CATEGORIES = [
  { id: 'all', label: '전체', color: COLORS.text },
  { id: 'class', label: '수업', color: COLORS.primary },
  { id: 'event', label: '이벤트', color: COLORS.secondary },
  { id: 'deadline', label: '마감', color: COLORS.error },
  { id: 'holiday', label: '휴일', color: COLORS.textMuted },
];

const ScheduleManage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    category: 'class',
    color: '#ffc500',
    is_all_day: false,
  });
  const [saving, setSaving] = useState(false);

  // 현재 월 관리
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('일정 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        title: schedule.title || '',
        description: schedule.description || '',
        start_date: schedule.start_date || '',
        end_date: schedule.end_date || '',
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        location: schedule.location || '',
        category: schedule.category || 'class',
        color: schedule.color || '#ffc500',
        is_all_day: schedule.is_all_day || false,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        category: 'class',
        color: '#ffc500',
        is_all_day: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.start_date) {
      alert('제목과 시작 날짜를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const scheduleData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        start_time: formData.is_all_day ? null : (formData.start_time || null),
        end_time: formData.is_all_day ? null : (formData.end_time || null),
        location: formData.location.trim() || null,
        category: formData.category,
        color: formData.color,
        is_all_day: formData.is_all_day,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);
        if (error) throw error;
        alert('수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([scheduleData]);
        if (error) throw error;
        alert('추가되었습니다.');
      }

      setShowModal(false);
      loadSchedules();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      alert('삭제되었습니다.');
      loadSchedules();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  // 필터링
  const filteredSchedules = activeCategory === 'all'
    ? schedules
    : schedules.filter(s => s.category === activeCategory);

  // 날짜별 그룹핑
  const groupByMonth = (list) => {
    const grouped = {};
    list.forEach(schedule => {
      const date = new Date(schedule.start_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(schedule);
    });
    return grouped;
  };

  const groupedSchedules = groupByMonth(filteredSchedules);

  const formatMonthKey = (key) => {
    const [year, month] = key.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

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
        <h1 style={styles.title}>일정 관리</h1>
        <button style={styles.addButton} onClick={() => handleOpenModal()}>
          + 일정 추가
        </button>
      </div>

      {/* 통계 */}
      <div style={styles.statsRow}>
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
          <div key={cat.id} style={{ ...styles.statCard, borderLeftColor: cat.color }}>
            <span style={{ ...styles.statValue, color: cat.color }}>
              {schedules.filter(s => s.category === cat.id).length}
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
              ...(activeCategory === cat.id ? { backgroundColor: cat.color, color: '#000' } : {}),
            }}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 일정 목록 */}
      {Object.keys(groupedSchedules).length > 0 ? (
        <div style={styles.monthGroups}>
          {Object.entries(groupedSchedules).map(([monthKey, monthSchedules]) => (
            <div key={monthKey} style={styles.monthGroup}>
              <h3 style={styles.monthHeader}>{formatMonthKey(monthKey)}</h3>
              <div style={styles.scheduleList}>
                {monthSchedules.map(schedule => {
                  const catInfo = getCategoryInfo(schedule.category);
                  const isPast = new Date(schedule.start_date) < new Date(new Date().toDateString());
                  return (
                    <div
                      key={schedule.id}
                      style={{
                        ...styles.scheduleCard,
                        borderLeftColor: schedule.color || catInfo.color,
                        opacity: isPast ? 0.6 : 1,
                      }}
                      onClick={() => handleOpenModal(schedule)}
                    >
                      <div style={styles.cardMain}>
                        <div style={styles.cardHeader}>
                          <span style={{
                            ...styles.categoryBadge,
                            backgroundColor: `${catInfo.color}20`,
                            color: catInfo.color,
                          }}>
                            {catInfo.label}
                          </span>
                          <span style={styles.cardDate}>
                            {formatDate(schedule.start_date)}
                            {schedule.end_date && schedule.end_date !== schedule.start_date && (
                              ` ~ ${formatDate(schedule.end_date)}`
                            )}
                          </span>
                        </div>
                        <h4 style={styles.cardTitle}>{schedule.title}</h4>
                        {schedule.description && (
                          <p style={styles.cardDesc}>{schedule.description}</p>
                        )}
                        <div style={styles.cardMeta}>
                          {!schedule.is_all_day && schedule.start_time && (
                            <span style={styles.metaItem}>
                              {formatTime(schedule.start_time)}
                              {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
                            </span>
                          )}
                          {schedule.is_all_day && (
                            <span style={styles.metaItem}>종일</span>
                          )}
                          {schedule.location && (
                            <span style={styles.metaItem}>{schedule.location}</span>
                          )}
                        </div>
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(schedule.id);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📅</span>
          <p style={styles.emptyText}>등록된 일정이 없습니다.</p>
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingSchedule ? '일정 수정' : '일정 추가'}
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
                  placeholder="일정 제목"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>카테고리</label>
                <div style={styles.categorySelector}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <button
                      key={cat.id}
                      style={{
                        ...styles.catButton,
                        ...(formData.category === cat.id ? {
                          backgroundColor: cat.color,
                          color: '#000',
                          borderColor: cat.color,
                        } : {}),
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id, color: cat.color }))}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>시작 날짜 *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>종료 날짜</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_all_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_all_day: e.target.checked }))}
                    style={styles.checkbox}
                  />
                  <span>종일</span>
                </label>
              </div>

              {!formData.is_all_day && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>시작 시간</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>종료 시간</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>장소</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="장소 (선택)"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="상세 설명 (선택)"
                  style={styles.textarea}
                  rows={3}
                />
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
                {saving ? '저장 중...' : (editingSchedule ? '수정' : '추가')}
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
    borderLeft: '3px solid',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
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
    padding: '8px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  // 월 그룹
  monthGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  monthGroup: {},
  monthHeader: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    paddingBottom: '8px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  scheduleCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    borderLeft: '4px solid',
    cursor: 'pointer',
  },
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  categoryBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  cardDate: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
  },
  cardMeta: {
    display: 'flex',
    gap: '12px',
  },
  metaItem: {
    color: COLORS.textMuted,
    fontSize: '12px',
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
    flex: 1,
  },
  formRow: {
    display: 'flex',
    gap: '12px',
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
  categorySelector: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  catButton: {
    padding: '8px 14px',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.surfaceLight}`,
    borderRadius: '6px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
  },
  checkboxGroup: {
    marginBottom: '16px',
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

export default ScheduleManage;
