// src/pages/Student/Consultation.jsx
// 상담 예약 페이지 (슬롯 기반)

import { useState, useEffect } from 'react';
import { Card, Loading } from '../../components/Common';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const Consultation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my'
  const [reserving, setReserving] = useState(null);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      // 예약 가능한 슬롯 조회
      const { data: slotsData, error: slotsError } = await supabase
        .from('consultation_slots')
        .select('*')
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;
      setSlots(slotsData || []);

      // 내 예약 내역
      if (user?.id) {
        const { data: myData, error: myError } = await supabase
          .from('consultation_slots')
          .select('*')
          .eq('student_id', user.id)
          .order('date', { ascending: false });

        if (myError) throw myError;
        setMyReservations(myData || []);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 예약하기
  const handleReserve = async (slot) => {
    if (!user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!confirm(`${formatDate(slot.date)} ${formatTime(slot.start_time)} 상담을 예약하시겠습니까?`)) {
      return;
    }

    setReserving(slot.id);
    try {
      const { error } = await supabase
        .from('consultation_slots')
        .update({
          student_id: user.id,
          is_available: false,
        })
        .eq('id', slot.id)
        .eq('is_available', true); // 동시 예약 방지

      if (error) throw error;

      alert('상담이 예약되었습니다.');
      loadData();
    } catch (err) {
      console.error('예약 실패:', err);
      alert('예약에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setReserving(null);
    }
  };

  // 예약 취소
  const handleCancel = async (slot) => {
    if (!confirm('예약을 취소하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('consultation_slots')
        .update({
          student_id: null,
          is_available: true,
        })
        .eq('id', slot.id)
        .eq('student_id', user.id);

      if (error) throw error;

      alert('예약이 취소되었습니다.');
      loadData();
    } catch (err) {
      console.error('취소 실패:', err);
      alert('취소에 실패했습니다.');
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  // 시간 포맷
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

  const groupedSlots = groupByDate(slots);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>상담 예약</h1>
      <p style={styles.subtitle}>1:1 상담 시간을 예약하세요</p>

      {/* 탭 */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'available' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('available')}
        >
          예약 가능
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'my' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('my')}
        >
          내 예약
        </button>
      </div>

      {activeTab === 'available' ? (
        <>
          {Object.keys(groupedSlots).length > 0 ? (
            <div style={styles.dateGroups}>
              {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <div key={date} style={styles.dateGroup}>
                  <h3 style={styles.dateHeader}>{formatDate(date)}</h3>
                  <div style={styles.slotList}>
                    {dateSlots.map(slot => (
                      <div key={slot.id} style={styles.slotCard}>
                        <div style={styles.slotInfo}>
                          <span style={styles.slotTime}>
                            {formatTime(slot.start_time)}
                            {slot.end_time && ` - ${formatTime(slot.end_time)}`}
                          </span>
                          {slot.description && (
                            <span style={styles.slotDesc}>{slot.description}</span>
                          )}
                        </div>
                        <button
                          style={{
                            ...styles.reserveButton,
                            opacity: reserving === slot.id ? 0.7 : 1,
                          }}
                          onClick={() => handleReserve(slot)}
                          disabled={reserving === slot.id}
                        >
                          {reserving === slot.id ? '...' : '예약'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📅</span>
                <p style={styles.emptyText}>예약 가능한 상담 시간이 없습니다.</p>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          {myReservations.length > 0 ? (
            <div style={styles.reservationList}>
              {myReservations.map(reservation => {
                const isPast = new Date(reservation.date) < new Date(new Date().toDateString());
                return (
                  <Card key={reservation.id}>
                    <div style={styles.reservationItem}>
                      <div style={styles.reservationMain}>
                        <div style={styles.reservationDate}>
                          <span style={styles.reservationIcon}>📆</span>
                          <span style={styles.reservationDateText}>
                            {formatDate(reservation.date)}
                          </span>
                        </div>
                        <span style={styles.reservationTime}>
                          {formatTime(reservation.start_time)}
                          {reservation.end_time && ` - ${formatTime(reservation.end_time)}`}
                        </span>
                      </div>
                      <div style={styles.reservationActions}>
                        {isPast ? (
                          <span style={styles.pastBadge}>완료</span>
                        ) : (
                          <button
                            style={styles.cancelButton}
                            onClick={() => handleCancel(reservation)}
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📋</span>
                <p style={styles.emptyText}>예약 내역이 없습니다.</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* 안내 */}
      <div style={styles.notice}>
        <span style={styles.noticeIcon}>ℹ️</span>
        <p style={styles.noticeText}>
          예약 후 변경이 필요하시면 최소 하루 전에 취소해주세요.
        </p>
      </div>
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
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
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
  dateGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  dateGroup: {},
  dateHeader: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  slotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  slotCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
  },
  slotInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  slotTime: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '500',
  },
  slotDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  reserveButton: {
    padding: '8px 20px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  reservationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  reservationItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reservationMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  reservationDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  reservationIcon: {
    fontSize: '20px',
  },
  reservationDateText: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '500',
  },
  reservationTime: {
    color: COLORS.primary,
    fontSize: '14px',
    marginLeft: '28px',
  },
  reservationActions: {},
  pastBadge: {
    padding: '6px 14px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textMuted,
    borderRadius: '6px',
    fontSize: '13px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: COLORS.error,
    border: `1px solid ${COLORS.error}`,
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
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
  notice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginTop: '24px',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
  },
  noticeIcon: {
    fontSize: '16px',
  },
  noticeText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
    lineHeight: 1.5,
  },
};

export default Consultation;
