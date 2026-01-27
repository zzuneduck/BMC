import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Loading } from '../../components/Common';
import { TreeDisplay } from '../../components/Tree';
import { useAuth, useStudents, usePoints } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { getTreeLevel, getPostsToNextLevel } from '../../utils/helpers';

const Blog = () => {
  const { user } = useAuth();
  const { getStudent, updateStudent } = useStudents();
  const { addPoints } = usePoints();

  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    newPostCount: '',
    evidenceUrl: '',
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getStudent(user.id);
      if (result.success) {
        setStudentData(result.data);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdate = () => {
    setUpdateForm({
      newPostCount: studentData?.post_count?.toString() || '0',
      evidenceUrl: '',
    });
    setUpdateError('');
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = async () => {
    const newCount = parseInt(updateForm.newPostCount, 10);
    const currentCount = studentData?.post_count || 0;

    if (isNaN(newCount) || newCount < 0) {
      setUpdateError('올바른 포스팅 개수를 입력해주세요.');
      return;
    }

    if (newCount < currentCount) {
      setUpdateError('포스팅 개수는 현재보다 적을 수 없습니다.');
      return;
    }

    if (newCount === currentCount) {
      setUpdateError('포스팅 개수가 변경되지 않았습니다.');
      return;
    }

    setUpdating(true);
    setUpdateError('');

    try {
      // 레벨 계산
      const oldLevel = getTreeLevel(currentCount);
      const newLevel = getTreeLevel(newCount);
      const levelUp = newLevel.level > oldLevel.level;
      const addedPosts = newCount - currentCount;

      // 학생 데이터 업데이트
      const result = await updateStudent(user.id, {
        post_count: newCount,
        tree_level: newLevel.level,
      });

      if (result.success) {
        // 포인트 지급 (5개 증가당 20P)
        if (addedPosts >= 5) {
          const bonusCount = Math.floor(addedPosts / 5);
          await addPoints(
            user.id,
            bonusCount * 20,
            `블로그 성장 (${addedPosts}개 증가)`,
            'blog_growth'
          );
        }

        // 레벨업 보너스
        if (levelUp) {
          await addPoints(
            user.id,
            50,
            `나무 레벨업! Lv.${newLevel.level}`,
            'tree_levelup'
          );
        }

        setStudentData(result.data);
        setIsUpdateModalOpen(false);
      } else {
        setUpdateError(result.error || '업데이트에 실패했습니다.');
      }
    } catch (err) {
      setUpdateError('업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const openBlog = (url) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const currentLevel = getTreeLevel(studentData?.post_count || 0);
  const postsToNext = getPostsToNextLevel(studentData?.post_count || 0);

  return (
    <div style={styles.container}>
      {/* 나의 나무 */}
      <TreeDisplay
        postCount={studentData?.post_count || 0}
        points={studentData?.total_points || 0}
        name={user?.name}
      />

      {/* 포스팅 현황 */}
      <Card title="포스팅 현황">
        <div style={styles.postingStats}>
          <div style={styles.postingStat}>
            <span style={styles.postingLabel}>현재 포스팅</span>
            <span style={styles.postingValue}>{studentData?.post_count || 0}개</span>
          </div>
          <div style={styles.postingStat}>
            <span style={styles.postingLabel}>나무 레벨</span>
            <span style={styles.postingValue}>
              Lv.{currentLevel.level} {currentLevel.emoji}
            </span>
          </div>
          {postsToNext > 0 && (
            <div style={styles.nextLevelInfo}>
              다음 레벨까지 <span style={styles.highlight}>{postsToNext}개</span> 남았어요!
            </div>
          )}
        </div>
        <Button variant="primary" fullWidth onClick={handleOpenUpdate}>
          포스팅 업데이트
        </Button>
      </Card>

      {/* 내 블로그 목록 */}
      <Card title="내 블로그">
        <div style={styles.blogList}>
          {studentData?.blog1 && (
            <div style={styles.blogItem} onClick={() => openBlog(studentData.blog1)}>
              <span style={styles.blogIcon}>📝</span>
              <div style={styles.blogInfo}>
                <span style={styles.blogLabel}>블로그 1</span>
                <span style={styles.blogUrl}>{studentData.blog1}</span>
              </div>
              <span style={styles.blogArrow}>→</span>
            </div>
          )}
          {studentData?.blog2 && (
            <div style={styles.blogItem} onClick={() => openBlog(studentData.blog2)}>
              <span style={styles.blogIcon}>📝</span>
              <div style={styles.blogInfo}>
                <span style={styles.blogLabel}>블로그 2</span>
                <span style={styles.blogUrl}>{studentData.blog2}</span>
              </div>
              <span style={styles.blogArrow}>→</span>
            </div>
          )}
          {studentData?.blog3 && (
            <div style={styles.blogItem} onClick={() => openBlog(studentData.blog3)}>
              <span style={styles.blogIcon}>📝</span>
              <div style={styles.blogInfo}>
                <span style={styles.blogLabel}>블로그 3</span>
                <span style={styles.blogUrl}>{studentData.blog3}</span>
              </div>
              <span style={styles.blogArrow}>→</span>
            </div>
          )}
          {!studentData?.blog1 && !studentData?.blog2 && !studentData?.blog3 && (
            <p style={styles.noBlog}>등록된 블로그가 없습니다.</p>
          )}
        </div>
      </Card>

      {/* 성장 안내 */}
      <Card title="나무 성장 안내">
        <div style={styles.levelGuide}>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🌱</span>
            <span style={styles.levelRange}>Lv.1 (0~5개)</span>
            <span style={styles.levelDesc}>씨앗에서 막 싹텄어요</span>
          </div>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🌿</span>
            <span style={styles.levelRange}>Lv.2 (6~15개)</span>
            <span style={styles.levelDesc}>작지만 단단해요</span>
          </div>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🌲</span>
            <span style={styles.levelRange}>Lv.3 (16~30개)</span>
            <span style={styles.levelDesc}>쑥쑥 자라는 중!</span>
          </div>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🌳</span>
            <span style={styles.levelRange}>Lv.4 (31~50개)</span>
            <span style={styles.levelDesc}>이제 제법 나무다워요</span>
          </div>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🌴</span>
            <span style={styles.levelRange}>Lv.5 (51~80개)</span>
            <span style={styles.levelDesc}>잎이 무성해요</span>
          </div>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🎄</span>
            <span style={styles.levelRange}>Lv.6 (81~120개)</span>
            <span style={styles.levelDesc}>숲의 주인공!</span>
          </div>
          <div style={styles.levelItem}>
            <span style={styles.levelEmoji}>🏆</span>
            <span style={styles.levelRange}>Lv.7 (121개+)</span>
            <span style={styles.levelDesc}>전설의 나무</span>
          </div>
        </div>
      </Card>

      {/* 포인트 안내 */}
      <Card>
        <div style={styles.notice}>
          <p style={styles.noticeTitle}>💡 포인트 획득 안내</p>
          <p style={styles.noticeText}>• 포스팅 5개 증가 시 +20P</p>
          <p style={styles.noticeText}>• 나무 레벨업 시 +50P</p>
        </div>
      </Card>

      {/* 포스팅 업데이트 모달 */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="포스팅 업데이트"
      >
        <div style={styles.modalContent}>
          <div style={styles.currentInfo}>
            <span style={styles.currentLabel}>현재 포스팅</span>
            <span style={styles.currentValue}>{studentData?.post_count || 0}개</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>새 포스팅 개수</label>
            <input
              type="number"
              value={updateForm.newPostCount}
              onChange={(e) => setUpdateForm(prev => ({
                ...prev,
                newPostCount: e.target.value
              }))}
              placeholder="현재 총 포스팅 개수"
              style={styles.input}
              min={studentData?.post_count || 0}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>인증 URL (선택)</label>
            <input
              type="url"
              value={updateForm.evidenceUrl}
              onChange={(e) => setUpdateForm(prev => ({
                ...prev,
                evidenceUrl: e.target.value
              }))}
              placeholder="블로그 글 목록 캡처 URL"
              style={styles.input}
            />
          </div>

          {updateError && <p style={styles.error}>{updateError}</p>}

          <Button
            variant="primary"
            fullWidth
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? '업데이트 중...' : '업데이트'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    paddingBottom: '100px',
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  postingStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  postingStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postingLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  postingValue: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  nextLevelInfo: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  blogList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  blogItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  blogIcon: {
    fontSize: '20px',
  },
  blogInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  blogLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  blogUrl: {
    color: COLORS.text,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  blogArrow: {
    color: COLORS.primary,
    fontSize: '16px',
  },
  noBlog: {
    color: COLORS.textMuted,
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
    margin: 0,
  },
  levelGuide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  levelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
  levelEmoji: {
    fontSize: '24px',
  },
  levelRange: {
    color: COLORS.primary,
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '100px',
  },
  levelDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  notice: {
    padding: '4px',
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  noticeText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 4px 0',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  currentInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
  currentLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  currentValue: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
  },
  input: {
    padding: '12px 14px',
    backgroundColor: COLORS.surfaceLight,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  error: {
    color: COLORS.error,
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
  },
};

export default Blog;
