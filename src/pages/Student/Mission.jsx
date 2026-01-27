// src/pages/Student/Mission.jsx
// 수강생 미션 페이지 - 오늘 미션 확인 및 제출

import React, { useState, useEffect } from 'react';
import { Card, Loading, Modal } from '../../components/Common';
import { useAuth } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// KST 기준 오늘 날짜
const getKSTToday = () => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  return kst.toISOString().split('T')[0];
};

const Mission = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [totalStats, setTotalStats] = useState({ total: 0, completed: 0 });

  // 제출 모달
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    url: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const today = getKSTToday();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 오늘 기준 활성화된 미션 조회 (시작일 <= 오늘 <= 마감일)
      const { data: missionData } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('due_date', today)
        .order('type')
        .order('due_date');

      setMissions(missionData || []);

      // 내 제출 현황 조회
      const { data: submissionData } = await supabase
        .from('mission_submissions')
        .select('*')
        .eq('student_id', user.id);

      // mission_id별로 그룹핑
      const submissionMap = (submissionData || []).reduce((acc, sub) => {
        acc[sub.mission_id] = sub;
        return acc;
      }, {});
      setSubmissions(submissionMap);

      // 전체 미션 통계
      const { count: totalMissions } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const completedCount = Object.keys(submissionMap).length;
      setTotalStats({
        total: totalMissions || 0,
        completed: completedCount,
      });

    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 제출 모달 열기
  const openSubmitModal = (mission) => {
    setSelectedMission(mission);
    const existing = submissions[mission.id];
    setSubmitForm({
      url: existing?.url || '',
      content: existing?.content || '',
    });
    setShowSubmitModal(true);
  };

  // 미션 제출
  const handleSubmit = async () => {
    if (!selectedMission) return;

    // URL 또는 내용 중 하나는 필수
    if (!submitForm.url.trim() && !submitForm.content.trim()) {
      alert('URL 또는 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const existing = submissions[selectedMission.id];

      if (existing) {
        // 기존 제출 수정
        const { error } = await supabase
          .from('mission_submissions')
          .update({
            url: submitForm.url.trim(),
            content: submitForm.content.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
        alert('제출이 수정되었습니다.');
      } else {
        // 새로 제출
        const { error } = await supabase
          .from('mission_submissions')
          .insert([{
            student_id: user.id,
            mission_id: selectedMission.id,
            date: today,
            url: submitForm.url.trim(),
            content: submitForm.content.trim(),
            submitted_at: new Date().toISOString(),
          }]);

        if (error) throw error;

        // 포인트 지급
        if (selectedMission.points > 0) {
          await supabase.rpc('add_points', {
            p_student_id: user.id,
            p_points: selectedMission.points,
            p_reason: `미션 완료: ${selectedMission.title}`,
          });
        }

        alert(`미션 제출 완료! +${selectedMission.points}P 획득!`);
      }

      setShowSubmitModal(false);
      setSelectedMission(null);
      loadData();
    } catch (err) {
      console.error('제출 실패:', err);
      alert('제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 미션 타입 아이콘
  const getMissionIcon = (type) => {
    switch (type) {
      case 'daily': return '📋';
      case 'weekly': return '📅';
      case 'special': return '⭐';
      default: return '✅';
    }
  };

  // 미션 타입 라벨
  const getTypeLabel = (type) => {
    switch (type) {
      case 'daily': return '일일';
      case 'weekly': return '주간';
      case 'special': return '특별';
      default: return type;
    }
  };

  // D-day 계산
  const getDday = (dueDate) => {
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diff = Math.ceil((due - todayDate) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return '마감';
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const todayMissions = missions.filter(m => m.type === 'daily');
  const weeklyMissions = missions.filter(m => m.type === 'weekly');
  const specialMissions = missions.filter(m => m.type === 'special');

  const todayCompletedCount = todayMissions.filter(m => submissions[m.id]).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>미션</h1>

      {/* 전체 진행률 */}
      <Card>
        <div style={styles.progressCard}>
          <div style={styles.progressInfo}>
            <span style={styles.progressLabel}>전체 미션 진행률</span>
            <span style={styles.progressValue}>
              {totalStats.completed}/{totalStats.total}
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${totalStats.total > 0 ? (totalStats.completed / totalStats.total) * 100 : 0}%`,
              }}
            />
          </div>
          <span style={styles.progressRate}>
            {totalStats.total > 0 ? Math.round((totalStats.completed / totalStats.total) * 100) : 0}% 완료
          </span>
        </div>
      </Card>

      {/* 오늘의 미션 */}
      {todayMissions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>오늘의 미션</h2>
            <span style={styles.sectionCount}>
              {todayCompletedCount}/{todayMissions.length} 완료
            </span>
          </div>
          <div style={styles.missionList}>
            {todayMissions.map((mission) => {
              const submitted = submissions[mission.id];
              return (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  submitted={submitted}
                  onSubmit={() => openSubmitModal(mission)}
                  getMissionIcon={getMissionIcon}
                  getTypeLabel={getTypeLabel}
                  getDday={getDday}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 주간 미션 */}
      {weeklyMissions.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>주간 미션</h2>
          <div style={styles.missionList}>
            {weeklyMissions.map((mission) => {
              const submitted = submissions[mission.id];
              return (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  submitted={submitted}
                  onSubmit={() => openSubmitModal(mission)}
                  getMissionIcon={getMissionIcon}
                  getTypeLabel={getTypeLabel}
                  getDday={getDday}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 특별 미션 */}
      {specialMissions.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>특별 미션</h2>
          <div style={styles.missionList}>
            {specialMissions.map((mission) => {
              const submitted = submissions[mission.id];
              return (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  submitted={submitted}
                  onSubmit={() => openSubmitModal(mission)}
                  getMissionIcon={getMissionIcon}
                  getTypeLabel={getTypeLabel}
                  getDday={getDday}
                />
              );
            })}
          </div>
        </div>
      )}

      {missions.length === 0 && (
        <Card>
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📋</span>
            <p style={styles.emptyText}>오늘 진행 중인 미션이 없습니다.</p>
          </div>
        </Card>
      )}

      {/* 안내 */}
      <div style={styles.notice}>
        <p style={styles.noticeTitle}>미션 안내</p>
        <p style={styles.noticeText}>• 미션을 완료하고 URL 또는 내용을 제출하세요.</p>
        <p style={styles.noticeText}>• 제출 시 포인트가 자동 지급됩니다.</p>
        <p style={styles.noticeText}>• 마감일 전까지 수정이 가능합니다.</p>
      </div>

      {/* 제출 모달 */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={selectedMission?.title || '미션 제출'}
      >
        <div style={styles.submitModal}>
          {selectedMission && (
            <>
              <div style={styles.missionDetail}>
                <span style={styles.missionDetailPoints}>+{selectedMission.points}P</span>
                {selectedMission.description && (
                  <p style={styles.missionDetailDesc}>{selectedMission.description}</p>
                )}
                <p style={styles.missionDetailDue}>
                  마감: {selectedMission.due_date} ({getDday(selectedMission.due_date)})
                </p>
              </div>

              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>블로그 URL</label>
                  <input
                    type="url"
                    value={submitForm.url}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, url: e.target.value }))}
                    style={styles.input}
                    placeholder="https://blog.naver.com/..."
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>제출 내용 (선택)</label>
                  <textarea
                    value={submitForm.content}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, content: e.target.value }))}
                    style={styles.textarea}
                    placeholder="미션 완료 내용을 입력하세요..."
                    rows={3}
                  />
                </div>

                <button
                  style={{
                    ...styles.submitBtn,
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? '제출 중...' : (submissions[selectedMission.id] ? '수정하기' : '제출하기')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

// 미션 카드 컴포넌트
const MissionCard = ({ mission, submitted, onSubmit, getMissionIcon, getTypeLabel, getDday }) => {
  return (
    <div
      style={{
        ...styles.missionCard,
        borderColor: submitted ? COLORS.success : 'transparent',
        opacity: submitted ? 0.85 : 1,
      }}
    >
      <div style={styles.missionHeader}>
        <div style={styles.missionLeft}>
          <span style={styles.missionIcon}>{getMissionIcon(mission.type)}</span>
          <span style={{
            ...styles.typeBadge,
            backgroundColor: submitted ? COLORS.success : COLORS.surfaceLight,
            color: submitted ? '#000' : COLORS.textMuted,
          }}>
            {getTypeLabel(mission.type)}
          </span>
          <span style={styles.ddayBadge}>{getDday(mission.due_date)}</span>
        </div>
        <span style={styles.missionPoints}>+{mission.points}P</span>
      </div>

      <h3 style={styles.missionTitle}>{mission.title}</h3>
      {mission.description && (
        <p style={styles.missionDesc}>{mission.description}</p>
      )}

      {submitted ? (
        <div style={styles.submittedBox}>
          <div style={styles.submittedInfo}>
            <span style={styles.submittedIcon}>✅</span>
            <span style={styles.submittedText}>제출 완료</span>
          </div>
          <button style={styles.editSubmitBtn} onClick={onSubmit}>
            수정
          </button>
        </div>
      ) : (
        <button style={styles.completeBtn} onClick={onSubmit}>
          미션 제출하기
        </button>
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
  progressCard: {},
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  progressLabel: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  progressValue: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressRate: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  section: {
    marginTop: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '18px',
    margin: 0,
  },
  sectionCount: {
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: '600',
  },
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  missionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid transparent',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  missionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  missionIcon: {
    fontSize: '20px',
  },
  typeBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  ddayBadge: {
    padding: '4px 8px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  missionPoints: {
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  missionTitle: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  missionDesc: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  completeBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  submittedBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
  submittedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  submittedIcon: {
    fontSize: '16px',
  },
  submittedText: {
    color: COLORS.success,
    fontSize: '14px',
    fontWeight: '600',
  },
  editSubmitBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.textMuted}`,
    borderRadius: '6px',
    color: COLORS.textMuted,
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
    marginBottom: '12px',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  notice: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  noticeText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 4px 0',
    lineHeight: 1.5,
  },
  // 제출 모달 스타일
  submitModal: {},
  missionDetail: {
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
    marginBottom: '20px',
  },
  missionDetailPoints: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: COLORS.primary,
    color: '#000',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  missionDetailDesc: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '0 0 8px 0',
    lineHeight: 1.5,
  },
  missionDetailDue: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  input: {
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  textarea: {
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default Mission;
