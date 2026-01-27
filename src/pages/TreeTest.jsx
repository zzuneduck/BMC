// src/pages/TreeTest.jsx
// Tree 컴포넌트 테스트 페이지

import { useState } from 'react';
import { TreeDisplay, MiniTree, ForestView, LevelUpAnimation } from '../components/Tree';
import { COLORS } from '../utils/constants';

// 테스트용 더미 데이터
const dummyStudents = [
  { id: 1, name: '김민수', team: 1, postCount: 3, points: 50 },
  { id: 2, name: '이영희', team: 1, postCount: 12, points: 320 },
  { id: 3, name: '박철수', team: 1, postCount: 28, points: 680 },
  { id: 4, name: '최지연', team: 2, postCount: 45, points: 1350 },
  { id: 5, name: '정우성', team: 2, postCount: 67, points: 1900 },
  { id: 6, name: '강소라', team: 2, postCount: 95, points: 2600 },
  { id: 7, name: '윤아름', team: 3, postCount: 130, points: 3500 },
  { id: 8, name: '송중기', team: 3, postCount: 8, points: 150 },
  { id: 9, name: '한지민', team: 3, postCount: 22, points: 520 },
  { id: 10, name: '조인성', team: 4, postCount: 55, points: 1100 },
  { id: 11, name: '손예진', team: 4, postCount: 78, points: 2200 },
  { id: 12, name: '공유', team: 4, postCount: 110, points: 2800 },
];

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    color: COLORS.text,
    padding: '2rem',
  },
  header: {
    marginBottom: '2rem',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
    paddingBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  section: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: COLORS.text,
  },
  row: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    marginBottom: '2rem',
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  input: {
    padding: '0.5rem 1rem',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.surfaceLight}`,
    borderRadius: '8px',
    color: COLORS.text,
    width: '100px',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: '0.875rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  miniTreeRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
};

export default function TreeTest() {
  const [postCount, setPostCount] = useState(25);
  const [points, setPoints] = useState(850);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(3);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tree 컴포넌트 테스트</h1>
      </div>

      {/* 1. TreeDisplay 테스트 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>1. TreeDisplay (메인 나무)</h2>

        <div style={styles.controls}>
          <div>
            <label style={styles.label}>포스팅: </label>
            <input
              type="number"
              style={styles.input}
              value={postCount}
              onChange={(e) => setPostCount(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={styles.label}>포인트: </label>
            <input
              type="number"
              style={styles.input}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={styles.row}>
          <TreeDisplay postCount={postCount} points={points} name="테스트 유저" />
        </div>
      </div>

      {/* 2. MiniTree 테스트 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>2. MiniTree (작은 나무)</h2>
        <div style={styles.miniTreeRow}>
          <MiniTree postCount={2} points={30} name="씨앗" onClick={() => alert('씨앗 클릭!')} />
          <MiniTree postCount={10} points={200} name="새싹" onClick={() => alert('새싹 클릭!')} />
          <MiniTree postCount={25} points={600} name="나무" onClick={() => alert('나무 클릭!')} />
          <MiniTree postCount={50} points={1300} name="큰나무" onClick={() => alert('큰나무 클릭!')} />
          <MiniTree postCount={75} points={2000} name="야자수" onClick={() => alert('야자수 클릭!')} />
          <MiniTree postCount={100} points={2600} name="트리" onClick={() => alert('트리 클릭!')} />
          <MiniTree postCount={150} points={3000} name="전설" onClick={() => alert('전설 클릭!')} />
        </div>
      </div>

      {/* 3. LevelUpAnimation 테스트 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>3. LevelUpAnimation (레벨업 애니메이션)</h2>
        <div style={styles.controls}>
          <div>
            <label style={styles.label}>레벨: </label>
            <input
              type="number"
              style={styles.input}
              value={levelUpLevel}
              min={1}
              max={7}
              onChange={(e) => setLevelUpLevel(Number(e.target.value))}
            />
          </div>
          <button style={styles.button} onClick={() => setShowLevelUp(true)}>
            레벨업 애니메이션 테스트
          </button>
        </div>
      </div>

      {/* 4. ForestView 테스트 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>4. ForestView (숲 보기)</h2>
        <ForestView students={dummyStudents} teams={[1, 2, 3, 4]} />
      </div>

      {/* LevelUp Animation */}
      <LevelUpAnimation
        show={showLevelUp}
        newLevel={levelUpLevel}
        onComplete={() => setShowLevelUp(false)}
      />
    </div>
  );
}
