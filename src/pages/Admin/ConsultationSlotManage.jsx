// src/pages/Admin/ConsultationSlotManage.jsx
// 관리자 상담 슬롯 관리 페이지

import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const ConsultationSlotManage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' | 'past' | 'all'

  // 통계
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: slots.length,
    available: slots.filter(s => s.is_available && s.date >= today).length,
    reserved: slots.filter(s => !s.is_available).length,
    upcoming: slots.filter(s => s.date >= today).length,
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_slots')
        .select(`
          *,
          students:student_id (id, name, team_id)
        `)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (err) {
      console.error('슬롯 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.start_time) {
      alert('날짜와 시작 시간을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('consultation_slots')
        .insert([{
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time || null,
          description: formData.description.trim() || null,
          is_available: true,
        }]);

      if (error) throw error;

      alert('슬롯이 추가되었습니다.');
      setShowModal(false);
      setFormData({
        date: '',
        start_time: '',
        end_time: '',
        description: '',
      });
      loadSlots();
    } catch (err) {
      console.error('슬롯 추가 실패:', err);
      alert('추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('이 슬롯을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('consultation_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      alert('삭제되었습니다.');
      loadSlots();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCancelReservation = async (slot) => {
    if (!confirm(`${slot.students?.name}님의 예약을 취소하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('consultation_slots')
        .update({
          student_id: null,
          is_available: true,
        })
        .eq('id', slot.id);

      if (error) throw error;

      alert('예약이 취소되었습니다.');
      loadSlots();
    } catch (err) {
      console.error('예약 취소 실패:', err);
      alert('취소에 실패했습니다.');
    }
  };

  // 여러 슬롯 한번에 추가
  const handleBulkAdd = async () => {
    const dateInput = prompt('날짜를 입력하세요 (예: 2025-02-01)');
    if (!dateInput) return;

    const timesInput = prompt('시간대를 입력하세요 (쉼표로 구분, 예: 10:00,11:00,14:00,15:00)');
    if (!timesInput) return;

    const times = timesInput.split(',').map(t => t.trim()).filter(t => t);
    if (times.length === 0) return;

    try {
      const slotsToAdd = times.map(time => ({
        date: dateInput,
        start_time: time,
        end_time: null,
        description: null,
        is_available: true,
      }));

      const { error } = await supabase
        .from('consultation_slots')
        .insert(slotsToAdd);

      if (error) throw error;

      alert(`${times.length}개의 슬롯이 추가되었습니다.`);
      loadSlots();
    } catch (err) {
      console.error('일괄 추가 실패:', err);
      alert('추가에 실패했습니다.');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // 날짜별 그룹핑
  const groupByDate = (slotList) => {
    const grouped = {};
    slotList.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  // 필터링된 슬롯
  const filteredSlots = slots.filter(slot => {
    if (viewMode === 'upcoming') return slot.date >= today;
    if (viewMode === 'past') return slot.date < today;
    return true;
  });

  const groupedSlots = groupByDate(filteredSlots);

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
        <h1 style={styles.title}>상담 슬롯 관리</h1>
        <div style={styles.headerButtons}>
          <button style={styles.bulkButton} onClick={handleBulkAdd}>
            일괄 추가
          </button>
          <button style={styles.addButton} onClick={() => setShowModal(true)}>
            + 슬롯 추가
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.upcoming}</span>
          <span style={styles.statLabel}>예정된 슬롯</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: COLORS.success }}>
          <span style={{ ...styles.statValue, color: COLORS.success }}>{stats.available}</span>
          <span style={styles.statLabel}>예약 가능</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: COLORS.secondary }}>
          <span style={{ ...styles.statValue, color: COLORS.secondary }}>{stats.reserved}</span>
          <span style={styles.statLabel}>예약됨</span>
        </div>
      </div>

      {/* 뷰 모드 탭 */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(viewMode === 'upcoming' ? styles.tabActive : {}) }}
          onClick={() => setViewMode('upcoming')}
        >
          예정된 슬롯
        </button>
        <button
          style={{ ...styles.tab, ...(viewMode === 'past' ? styles.tabActive : {}) }}
          onClick={() => setViewMode('past')}
        >
          지난 슬롯
        </button>
        <button
          style={{ ...styles.tab, ...(viewMode === 'all' ? styles.tabActive : {}) }}
          onClick={() => setViewMode('all')}
        >
          전체
        </button>
      </div>

      {/* 슬롯 목록 */}
      {Object.keys(groupedSlots).length > 0 ? (
        <div style={styles.dateGroups}>
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date} style={styles.dateGroup}>
              <h3 style={{
                ...styles.dateHeader,
                color: date < today ? COLORS.textMuted : COLORS.text,
              }}>
                {formatDate(date)}
                {date < today && <span style={styles.pastBadge}>지남</span>}
              </h3>
              <div style={styles.slotList}>
                {dateSlots.map(slot => (
                  <div
                    key={slot.id}
                    style={{
                      ...styles.slotCard,
                      borderLeftColor: slot.is_available ? COLORS.success : COLORS.secondary,
                    }}
                  >
                    <div style={styles.slotMain}>
                      <div style={styles.slotTime}>
                        <span style={styles.timeText}>
                          {formatTime(slot.start_time)}
                          {slot.end_time && ` - ${formatTime(slot.end_time)}`}
                        </span>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: slot.is_available ? `${COLORS.success}20` : `${COLORS.secondary}20`,
                          color: slot.is_available ? COLORS.success : COLORS.secondary,
                        }}>
                          {slot.is_available ? '예약가능' : '예약됨'}
                        </span>
                      </div>
                      {slot.description && (
                        <span style={styles.slotDesc}>{slot.description}</span>
                      )}
                      {slot.students && (
                        <div style={styles.reservedBy}>
                          <span style={styles.reservedIcon}>👤</span>
                          <span style={styles.reservedName}>
                            {slot.students.name}
                            {slot.students.team_id && ` (${slot.students.team_id}조)`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={styles.slotActions}>
                      {slot.students && (
                        <button
                          style={styles.cancelReservationButton}
                          onClick={() => handleCancelReservation(slot)}
                        >
                          예약취소
                        </button>
                      )}
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(slot.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📅</span>
          <p style={styles.emptyText}>
            {viewMode === 'upcoming' ? '예정된 슬롯이 없습니다.' :
             viewMode === 'past' ? '지난 슬롯이 없습니다.' : '슬롯이 없습니다.'}
          </p>
        </div>
      )}

      {/* 슬롯 추가 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>상담 슬롯 추가</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>날짜 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>시작 시간 *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>종료 시간 (선택)</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>설명 (선택)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="예: 오전 상담"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.modalCancelButton}
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                style={{
                  ...styles.saveButton,
                  opacity: saving ? 0.7 : 1,
                }}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? '추가 중...' : '추가'}
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
    maxWidth: '800px',
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
  headerButtons: {
    display: 'flex',
    gap: '10px',
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
  bulkButton: {
    padding: '10px 20px',
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
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
    gridTemplateColumns: 'repeat(3, 1fr)',
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
  },
  tab: {
    padding: '10px 20px',
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
  // 날짜 그룹
  dateGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  dateGroup: {},
  dateHeader: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pastBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textMuted,
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'normal',
  },
  slotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  slotCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
    borderLeft: '3px solid',
  },
  slotMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  slotTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  timeText: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  slotDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  reservedBy: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  reservedIcon: {
    fontSize: '14px',
  },
  reservedName: {
    color: COLORS.secondary,
    fontSize: '13px',
    fontWeight: '500',
  },
  slotActions: {
    display: 'flex',
    gap: '8px',
  },
  cancelReservationButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.warning}`,
    borderRadius: '6px',
    color: COLORS.warning,
    fontSize: '12px',
    cursor: 'pointer',
  },
  deleteButton: {
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
    maxWidth: '400px',
    overflow: 'hidden',
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
  modalFooter: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: `1px solid ${COLORS.surfaceLight}`,
  },
  modalCancelButton: {
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

export default ConsultationSlotManage;
