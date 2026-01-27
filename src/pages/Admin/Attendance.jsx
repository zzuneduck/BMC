// src/pages/Admin/Attendance.jsx
import React, { useState, useEffect } from 'react';
import { Card, Loading } from '../../components/Common';
import { useStudents, useAttendance } from '../../hooks';
import { COLORS } from '../../utils/constants';

// KST 기준 오늘 날짜
const getKSTToday = () => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  return kst.toISOString().split('T')[0];
};

const Attendance = () => {
  const { students, loading: studentsLoading, fetchStudents } = useStudents();
  const { getAttendanceByDate, addAttendance, removeAttendance, addBulkAttendance } = useAttendance();

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getKSTToday());
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchStudents();
      const result = await getAttendanceByDate(selectedDate);
      if (result.success) {
        setAttendanceData(result.data);
        // 이미 출석한 학생들은 선택된 상태로
        setSelectedIds(new Set(Object.keys(result.data)));
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 체크박스 토글
  const toggleSelect = (studentId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
    setSelectAll(!selectAll);
  };

  // 일괄 출석 처리
  const handleBulkAttendance = async () => {
    if (saving) return;

    setSaving(true);
    try {
      // 새로 추가할 학생들 (선택됨 + 아직 출석 안 함)
      const toAdd = [...selectedIds].filter(id => !attendanceData[id]);
      // 삭제할 학생들 (선택 해제됨 + 이미 출석함)
      const toRemove = Object.keys(attendanceData).filter(id => !selectedIds.has(id));

      // 출석 추가
      if (toAdd.length > 0) {
        const result = await addBulkAttendance(toAdd, selectedDate);
        if (result.success) {
          const newAttendance = { ...attendanceData };
          result.data.forEach(a => {
            newAttendance[a.student_id] = a;
          });
          setAttendanceData(newAttendance);
        }
      }

      // 출석 삭제
      for (const id of toRemove) {
        await removeAttendance(id, selectedDate);
      }

      // 다시 로드
      await loadData();
      alert('출석 처리가 완료되었습니다.');
    } catch (err) {
      console.error('출석 처리 실패:', err);
      alert('출석 처리 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 개별 출석 토글
  const toggleAttendance = async (studentId) => {
    if (saving) return;

    setSaving(true);
    const isAttended = !!attendanceData[studentId];

    try {
      if (isAttended) {
        const result = await removeAttendance(studentId, selectedDate);
        if (result.success) {
          setAttendanceData(prev => {
            const newData = { ...prev };
            delete newData[studentId];
            return newData;
          });
          setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(studentId);
            return newSet;
          });
        }
      } else {
        const result = await addAttendance(studentId, selectedDate);
        if (result.success) {
          setAttendanceData(prev => ({
            ...prev,
            [studentId]: result.data,
          }));
          setSelectedIds(prev => new Set([...prev, studentId]));
        }
      }
    } catch (err) {
      console.error('출석 처리 실패:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || studentsLoading) {
    return <Loading fullScreen />;
  }

  const attendedCount = Object.keys(attendanceData).length;
  const attendanceRate = students.length > 0
    ? Math.round((attendedCount / students.length) * 100)
    : 0;

  // 조별 그룹핑
  const groupedStudents = students.reduce((acc, s) => {
    const team = s.team || '미배정';
    if (!acc[team]) acc[team] = [];
    acc[team].push(s);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>출석 관리</h1>

      {/* 날짜 선택 */}
      <Card>
        <div style={styles.dateSelector}>
          <div style={styles.dateInputGroup}>
            <label style={styles.dateLabel}>날짜 선택</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
            />
          </div>
          <div style={styles.quickDates}>
            <button
              style={styles.quickDateBtn}
              onClick={() => setSelectedDate(getKSTToday())}
            >
              오늘
            </button>
            <button
              style={styles.quickDateBtn}
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
            >
              어제
            </button>
          </div>
        </div>
      </Card>

      {/* 출석 현황 */}
      <Card>
        <div style={styles.statusCard}>
          <div style={styles.statusLeft}>
            <p style={styles.statusDate}>{selectedDate}</p>
            <p style={styles.statusLabel}>출석 현황</p>
          </div>
          <div style={styles.statusRight}>
            <div style={styles.statusNumbers}>
              <span style={styles.attendedNum}>{attendedCount}</span>
              <span style={styles.totalNum}>/ {students.length}명</span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${attendanceRate}%`,
                }}
              />
            </div>
            <p style={styles.statusRate}>{attendanceRate}% 출석</p>
          </div>
        </div>
      </Card>

      {/* 일괄 처리 버튼 */}
      <div style={styles.actionBar}>
        <label style={styles.selectAllLabel}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            style={styles.checkbox}
          />
          전체 선택
        </label>
        <button
          style={{
            ...styles.bulkBtn,
            opacity: saving ? 0.7 : 1,
          }}
          onClick={handleBulkAttendance}
          disabled={saving}
        >
          {saving ? '처리 중...' : `선택 항목 출석 처리 (${selectedIds.size}명)`}
        </button>
      </div>

      {/* 조별 출석 목록 */}
      {Object.entries(groupedStudents)
        .sort((a, b) => {
          if (a[0] === '미배정') return 1;
          if (b[0] === '미배정') return -1;
          return a[0].localeCompare(b[0]);
        })
        .map(([team, teamStudents]) => {
          const teamAttended = teamStudents.filter(s => attendanceData[s.id]).length;
          return (
            <div key={team} style={styles.teamSection}>
              <div style={styles.teamHeader}>
                <h3 style={styles.teamTitle}>
                  {team}
                  <span style={styles.teamCount}>
                    ({teamAttended}/{teamStudents.length}명)
                  </span>
                </h3>
              </div>
              <div style={styles.studentList}>
                {teamStudents.map(student => {
                  const isAttended = !!attendanceData[student.id];
                  const isSelected = selectedIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      style={{
                        ...styles.studentItem,
                        backgroundColor: isAttended ? COLORS.surfaceLight : COLORS.surface,
                        borderColor: isSelected ? COLORS.primary : 'transparent',
                      }}
                    >
                      <label style={styles.studentLabel}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(student.id)}
                          style={styles.checkbox}
                        />
                        <span style={styles.studentName}>{student.name}</span>
                      </label>
                      <div style={styles.studentStatus}>
                        {isAttended ? (
                          <span style={styles.attendedBadge}>출석 ✓</span>
                        ) : (
                          <span style={styles.absentBadge}>미출석</span>
                        )}
                        <button
                          style={styles.toggleBtn}
                          onClick={() => toggleAttendance(student.id)}
                          disabled={saving}
                        >
                          {isAttended ? '취소' : '출석'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {students.length === 0 && (
        <p style={styles.emptyText}>등록된 수강생이 없습니다.</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  dateSelector: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '16px',
  },
  dateInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dateLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  dateInput: {
    padding: '12px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  quickDates: {
    display: 'flex',
    gap: '8px',
  },
  quickDateBtn: {
    padding: '10px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
  },
  statusCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {},
  statusDate: {
    color: COLORS.text,
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
  },
  statusLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
  },
  statusRight: {
    textAlign: 'right',
    minWidth: '150px',
  },
  statusNumbers: {
    marginBottom: '8px',
  },
  attendedNum: {
    color: COLORS.primary,
    fontSize: '28px',
    fontWeight: 'bold',
  },
  totalNum: {
    color: COLORS.textMuted,
    fontSize: '16px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  statusRate: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: 0,
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    marginBottom: '20px',
  },
  selectAllLabel: {
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
    accentColor: COLORS.primary,
    cursor: 'pointer',
  },
  bulkBtn: {
    padding: '12px 24px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  teamSection: {
    marginBottom: '24px',
  },
  teamHeader: {
    marginBottom: '12px',
  },
  teamTitle: {
    color: COLORS.text,
    fontSize: '16px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  teamCount: {
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: 'normal',
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  studentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid transparent',
  },
  studentLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  studentName: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  studentStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  attendedBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.success,
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  absentBadge: {
    padding: '4px 10px',
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.textMuted,
    borderRadius: '4px',
    fontSize: '12px',
  },
  toggleBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.surfaceLight}`,
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '12px',
    cursor: 'pointer',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: '40px',
  },
};

export default Attendance;
