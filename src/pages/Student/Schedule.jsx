// src/pages/Student/Schedule.jsx
import React from 'react';
import { COLORS, SCHEDULE, CURRICULUM } from '../../utils/constants';

const Schedule = () => {
  // 현재 날짜 기준 진행 중인 주차 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getCurrentWeek = () => {
    for (let i = SCHEDULE.length - 1; i >= 0; i--) {
      const scheduleDate = new Date(SCHEDULE[i].date);
      if (today >= scheduleDate) {
        return SCHEDULE[i].week;
      }
    }
    return -1; // 아직 시작 전
  };

  const currentWeek = getCurrentWeek();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}/${day}(${dayOfWeek})`;
  };

  const isPast = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>일정</h1>
      <p style={styles.subtitle}>6주 커리큘럼</p>

      {/* 현재 주차 표시 */}
      {currentWeek >= 0 && (
        <div style={styles.currentWeekBanner}>
          <span style={styles.bannerIcon}>📍</span>
          <span style={styles.bannerText}>현재 {currentWeek}주차 진행 중</span>
        </div>
      )}

      {/* 타임라인 */}
      <div style={styles.timeline}>
        {SCHEDULE.map((schedule, idx) => {
          const curriculum = CURRICULUM.find(c => c.week === schedule.week);
          const pastOffline = isPast(schedule.date);
          const pastVod = isPast(schedule.vodDate);
          const isCurrent = schedule.week === currentWeek;
          const todayOffline = isToday(schedule.date);
          const todayVod = isToday(schedule.vodDate);

          return (
            <div key={idx} style={styles.weekCard}>
              {/* 타임라인 라인 */}
              <div style={styles.timelineLeft}>
                <div style={{
                  ...styles.timelineDot,
                  backgroundColor: isCurrent ? COLORS.primary : pastOffline ? COLORS.textMuted : COLORS.surface,
                  borderColor: isCurrent ? COLORS.primary : COLORS.surfaceLight,
                }}>
                  {isCurrent && <span style={styles.currentDot} />}
                </div>
                {idx < SCHEDULE.length - 1 && (
                  <div style={{
                    ...styles.timelineLine,
                    backgroundColor: pastOffline ? COLORS.textMuted : COLORS.surfaceLight,
                  }} />
                )}
              </div>

              {/* 주차 내용 */}
              <div style={{
                ...styles.weekContent,
                opacity: pastVod && !isCurrent ? 0.5 : 1,
              }}>
                {/* 주차 헤더 */}
                <div style={styles.weekHeader}>
                  <span style={{
                    ...styles.weekNumber,
                    color: isCurrent ? COLORS.primary : COLORS.text,
                  }}>
                    {schedule.week === 0 ? 'OT' : `${schedule.week}주차`}
                  </span>
                  {isCurrent && (
                    <span style={styles.currentBadge}>진행 중</span>
                  )}
                </div>

                {/* 커리큘럼 제목 */}
                <h3 style={styles.curriculumTitle}>
                  {curriculum?.title || schedule.title}
                </h3>

                {/* 일정 카드들 */}
                <div style={styles.scheduleCards}>
                  {/* 오프라인 수업 */}
                  <div style={{
                    ...styles.scheduleItem,
                    borderColor: todayOffline ? COLORS.primary : 'transparent',
                  }}>
                    <span style={styles.liveBadge}>LIVE</span>
                    <div style={styles.scheduleInfo}>
                      <span style={styles.scheduleDate}>
                        {formatDate(schedule.date)}
                      </span>
                      <span style={styles.scheduleTime}>{schedule.time}</span>
                    </div>
                    {pastOffline && (
                      <span style={styles.completedMark}>완료</span>
                    )}
                    {todayOffline && (
                      <span style={styles.todayMark}>오늘</span>
                    )}
                  </div>

                  {/* VOD */}
                  <div style={{
                    ...styles.scheduleItem,
                    borderColor: todayVod ? COLORS.secondary : 'transparent',
                  }}>
                    <span style={styles.vodBadge}>VOD</span>
                    <div style={styles.scheduleInfo}>
                      <span style={styles.scheduleDate}>
                        {formatDate(schedule.vodDate)}
                      </span>
                      <span style={styles.scheduleTime}>VOD 공개</span>
                    </div>
                    {pastVod && (
                      <span style={styles.completedMark}>공개됨</span>
                    )}
                    {todayVod && (
                      <span style={styles.todayMark}>오늘</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 안내 */}
      <div style={styles.notice}>
        <p style={styles.noticeText}>
          * 오프라인 수업은 매주 금요일 오전 10시에 진행됩니다.
        </p>
        <p style={styles.noticeText}>
          * VOD는 오프라인 수업 후 일요일에 공개됩니다.
        </p>
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
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 20px 0',
  },
  currentWeekBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    marginBottom: '24px',
    borderLeft: `3px solid ${COLORS.primary}`,
  },
  bannerIcon: {
    fontSize: '16px',
  },
  bannerText: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
  },
  weekCard: {
    display: 'flex',
    gap: '16px',
  },
  timelineLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '24px',
  },
  timelineDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  currentDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#000',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    minHeight: '20px',
  },
  weekContent: {
    flex: 1,
    paddingBottom: '24px',
  },
  weekHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  weekNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  currentBadge: {
    padding: '2px 8px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  curriculumTitle: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '500',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  scheduleCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    border: '2px solid transparent',
  },
  liveBadge: {
    padding: '4px 8px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '40px',
    textAlign: 'center',
  },
  vodBadge: {
    padding: '4px 8px',
    backgroundColor: COLORS.secondary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '40px',
    textAlign: 'center',
  },
  scheduleInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  scheduleDate: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  scheduleTime: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  completedMark: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  todayMark: {
    padding: '2px 6px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  notice: {
    marginTop: '8px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  noticeText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 4px 0',
    lineHeight: 1.5,
  },
};

export default Schedule;
