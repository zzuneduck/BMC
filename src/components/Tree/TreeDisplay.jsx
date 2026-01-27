// src/components/Tree/TreeDisplay.jsx
// 메인 나무 표시 컴포넌트

import { getTreeLevel, getTreeDecorations, getLevelProgress, getPostsToNextLevel } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    backgroundColor: COLORS.background,
    borderRadius: '16px',
    border: `1px solid ${COLORS.surfaceLight}`,
    minWidth: '280px',
  },
  treeSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  decorations: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '0.5rem',
    fontSize: '1.5rem',
    minHeight: '2rem',
  },
  treeEmoji: {
    fontSize: '5rem',
    lineHeight: 1,
    marginBottom: '0.5rem',
    filter: 'drop-shadow(0 4px 8px rgba(255, 197, 0, 0.3))',
  },
  name: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  levelName: {
    fontSize: '0.875rem',
    color: COLORS.textMuted,
    marginBottom: '1rem',
    textAlign: 'center',
  },
  stats: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    marginBottom: '0.25rem',
  },
  statValue: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: '1.125rem',
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.75rem',
    color: COLORS.textMuted,
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: COLORS.surface,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  maxLevel: {
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
};

export default function TreeDisplay({ postCount = 0, points = 0, name = '' }) {
  const level = getTreeLevel(postCount);
  const decorations = getTreeDecorations(points);
  const progress = getLevelProgress(postCount);
  const postsToNext = getPostsToNextLevel(postCount);
  const isMaxLevel = level.level === 7;

  // 대표 장식 선택 (가장 높은 단계)
  const topDecoration = decorations.length > 0 ? decorations[decorations.length - 1] : null;

  return (
    <div style={styles.container}>
      <div style={styles.treeSection}>
        {/* 장식 */}
        <div style={styles.decorations}>
          {topDecoration && <span>{topDecoration.emoji}</span>}
        </div>

        {/* 나무 이모지 */}
        <div style={styles.treeEmoji}>{level.emoji}</div>

        {/* 이름 */}
        <div style={styles.name}>{name}</div>

        {/* 레벨 이름 */}
        <div style={styles.levelName}>
          Lv.{level.level} {level.name}
        </div>
      </div>

      {/* 통계 */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>포스팅</span>
          <span style={styles.statValue}>{postCount}개</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>포인트</span>
          <span style={{ ...styles.statValue, color: COLORS.primary }}>
            {points.toLocaleString()}P
          </span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div style={styles.progressSection}>
        {isMaxLevel ? (
          <div style={styles.maxLevel}>🏆 최고 레벨 달성!</div>
        ) : (
          <>
            <div style={styles.progressHeader}>
              <span>다음 레벨까지</span>
              <span>{postsToNext}개 남음</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
