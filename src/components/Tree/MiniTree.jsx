// src/components/Tree/MiniTree.jsx
// 작은 나무 컴포넌트 (숲 보기용)

import { getTreeLevel, getTreeDecorations } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid transparent`,
    minWidth: '100px',
  },
  containerHover: {
    backgroundColor: COLORS.surfaceLight,
    border: `1px solid ${COLORS.primary}`,
    transform: 'translateY(-2px)',
  },
  decorations: {
    fontSize: '0.75rem',
    minHeight: '1rem',
    marginBottom: '0.25rem',
  },
  treeEmoji: {
    fontSize: '2.5rem',
    lineHeight: 1,
    marginBottom: '0.5rem',
  },
  name: {
    fontSize: '0.75rem',
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  level: {
    fontSize: '0.625rem',
    color: COLORS.textMuted,
    marginTop: '0.25rem',
  },
};

export default function MiniTree({ postCount = 0, points = 0, name = '', onClick }) {
  const level = getTreeLevel(postCount);
  const decorations = getTreeDecorations(points);
  const topDecoration = decorations.length > 0 ? decorations[decorations.length - 1] : null;

  const handleMouseEnter = (e) => {
    Object.assign(e.currentTarget.style, styles.containerHover);
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = COLORS.surface;
    e.currentTarget.style.border = '1px solid transparent';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <div
      style={styles.container}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* 장식 */}
      <div style={styles.decorations}>
        {topDecoration && <span>{topDecoration.emoji}</span>}
      </div>

      {/* 나무 이모지 */}
      <div style={styles.treeEmoji}>{level.emoji}</div>

      {/* 이름 */}
      <div style={styles.name} title={name}>{name}</div>

      {/* 레벨 */}
      <div style={styles.level}>Lv.{level.level}</div>
    </div>
  );
}
