// src/pages/Student/Attendance.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { useAuth, useAttendance } from '../../hooks';
import { COLORS } from '../../utils/constants';

const Attendance = () => {
  const { user } = useAuth();
  const { checkIn, getAttendance, getStreak } = useAttendance();

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [todayChecked, setTodayChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 출석 데이터 조회
      const attendanceResult = await getAttendance(user.id, selectedMonth);
      if (attendanceResult.success) {
        setAttendanceData(attendanceResult.data);

        // 오늘 출석 여부 확인
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceResult.data.find(a => a.date === today);
        setTodayChecked(!!todayAttendance);
      }

      // 연속 출석일 조회
      const streakResult = await getStreak(user.id);
      if (streakResult.success) {
        setStreak(streakResult.data.streak);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (checking || todayChecked) return;

    setChecking(true);
    try {
      const result = await checkIn(user.id);
      if (result.success) {
        setTodayChecked(true);
        setStreak(prev => prev + 1);
        // 출석 데이터 새로고침
        await loadData();
      } else {
        alert(result.error || '출석 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('출석 실패:', err);
    } finally {
      setChecking(false);
    }
  };

  // 달력 데이터 생성
  const generateCalendarDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceData.find(a => a.date === dateStr);
      const today = new Date();
      const isToday = today.getFullYear() === year &&
                      today.getMonth() + 1 === month &&
                      today.getDate() === day;
      const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

      days.push({
        day,
        date: dateStr,
        attended: !!attendance,
        isToday,
        isPast,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const attendedDays = attendanceData.length;
  const [year, month] = selectedMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const attendanceRate = totalDaysInMonth > 0
    ? Math.round((attendedDays / totalDaysInMonth) * 100)
    : 0;

  const changeMonth = (delta) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const newDate = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>내 출석</h1>

      {/* 출석 통계 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{attendedDays}</span>
          <span style={styles.statLabel}>총 출석</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{attendanceRate}%</span>
          <span style={styles.statLabel}>출석률</span>
        </div>
        <div style={styles.statCard}>
          <span style={{
            ...styles.statValue,
            color: streak >= 7 ? COLORS.primary : COLORS.text,
          }}>
            {streak}일 {streak >= 3 && '🔥'}
          </span>
          <span style={styles.statLabel}>연속 출석</span>
        </div>
      </div>

      {/* 오늘 출석 버튼 */}
      {isCurrentMonth() && (
        <div style={styles.checkInSection}>
          {todayChecked ? (
            <div style={styles.checkedBox}>
              <span style={styles.checkedIcon}>✅</span>
              <span style={styles.checkedText}>오늘 출석 완료!</span>
            </div>
          ) : (
            <button
              style={{
                ...styles.checkInBtn,
                opacity: checking ? 0.7 : 1,
              }}
              onClick={handleCheckIn}
              disabled={checking}
            >
              {checking ? '출석 처리 중...' : '오늘 출석하기'}
            </button>
          )}
        </div>
      )}

      {/* 달력 */}
      <div style={styles.calendarSection}>
        {/* 월 선택 */}
        <div style={styles.monthSelector}>
          <button style={styles.monthBtn} onClick={() => changeMonth(-1)}>
            ◀
          </button>
          <span style={styles.monthText}>
            {year}년 {month}월
          </span>
          <button style={styles.monthBtn} onClick={() => changeMonth(1)}>
            ▶
          </button>
        </div>

        {/* 요일 헤더 */}
        <div style={styles.weekdayHeader}>
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <span
              key={day}
              style={{
                ...styles.weekday,
                color: idx === 0 ? COLORS.error : idx === 6 ? COLORS.primary : COLORS.textMuted,
              }}
            >
              {day}
            </span>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div style={styles.calendarGrid}>
          {calendarDays.map((dayInfo, idx) => (
            <div key={idx} style={styles.dayCell}>
              {dayInfo && (
                <div style={{
                  ...styles.dayContent,
                  ...(dayInfo.isToday ? styles.todayCell : {}),
                }}>
                  <span style={{
                    ...styles.dayNumber,
                    color: dayInfo.isPast && !dayInfo.attended
                      ? COLORS.textMuted
                      : COLORS.text,
                  }}>
                    {dayInfo.day}
                  </span>
                  {dayInfo.attended ? (
                    <span style={styles.attendedMark}>●</span>
                  ) : dayInfo.isPast ? (
                    <span style={styles.missedMark}>○</span>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={styles.attendedMark}>●</span>
          <span style={styles.legendText}>출석</span>
        </div>
        <div style={styles.legendItem}>
          <span style={styles.missedMark}>○</span>
          <span style={styles.legendText}>미출석</span>
        </div>
        <div style={styles.legendItem}>
          <span style={styles.todayIndicator} />
          <span style={styles.legendText}>오늘</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  statValue: {
    color: COLORS.text,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
    marginTop: '4px',
  },
  checkInSection: {
    marginBottom: '24px',
  },
  checkInBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  checkedBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    border: `2px solid ${COLORS.secondary}`,
  },
  checkedIcon: {
    fontSize: '20px',
  },
  checkedText: {
    color: COLORS.secondary,
    fontSize: '16px',
    fontWeight: '600',
  },
  calendarSection: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  },
  monthSelector: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  monthBtn: {
    padding: '8px 12px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
  },
  monthText: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: '600',
  },
  weekdayHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: '12px',
  },
  weekday: {
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '500',
    padding: '8px 0',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  dayCell: {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContent: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  todayCell: {
    border: `2px solid ${COLORS.primary}`,
    backgroundColor: 'rgba(255, 197, 0, 0.1)',
  },
  dayNumber: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '2px',
  },
  attendedMark: {
    color: COLORS.primary,
    fontSize: '10px',
  },
  missedMark: {
    color: COLORS.textMuted,
    fontSize: '10px',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  todayIndicator: {
    width: '16px',
    height: '16px',
    border: `2px solid ${COLORS.primary}`,
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 197, 0, 0.1)',
  },
};

export default Attendance;
