// src/pages/Student/Instructor.jsx
// 강사 소개 페이지

import { COLORS } from '../../utils/constants';

// 강사 프로필 정보
const INSTRUCTOR = {
  name: '쭌이덕',
  title: '블로그 마스터 클래스 대표 강사',
  photo_url: null, // 나중에 이미지 URL 추가
  career: [
    '네이버 전체 뷰티 인플루언서 1위 (25.03)',
    '블로그 18년차, 누적 방문자 4,000만명+',
    '2016~2019 CJ올리브영 근무',
    '국가공인 맞춤형화장품조제관리사',
    '『쭌이덕의 맞춤형조제관리사』 저자',
    '화장품 브랜드 제이덤 대표',
    '(주)블로그교육연구소 대표이사',
    '블로그·플레이스 대행사 네인플 대표',
  ],
};

// 8대 혜택 데이터
const BENEFITS = [
  { icon: '📚', title: 'VOD 무제한', description: '블로그 기본 + 브랜드 블로그 전 강의 무제한 수강' },
  { icon: '📝', title: '주간 미션', description: '매주 실습 미션으로 실력 향상' },
  { icon: '💬', title: '1:1 컨설팅', description: '개인 맞춤 블로그 컨설팅 제공' },
  { icon: '👥', title: '커뮤니티', description: '동기들과 함께 성장하는 스터디 그룹' },
  { icon: '🏆', title: '랭킹 시스템', description: '포인트로 경쟁하며 동기부여' },
  { icon: '🌳', title: '성장 나무', description: '포스팅 개수에 따라 성장하는 나의 나무' },
  { icon: '📊', title: '진도 관리', description: '체계적인 커리큘럼과 진도 체크' },
  { icon: '🎁', title: '보상 시스템', description: '미션 완료 시 포인트 적립' },
];

const Instructor = () => {
  return (
    <div style={styles.container}>
      {/* 프로필 섹션 */}
      <div style={styles.profileSection}>
        <div style={styles.photoWrapper}>
          {INSTRUCTOR.photo_url ? (
            <img src={INSTRUCTOR.photo_url} alt={INSTRUCTOR.name} style={styles.photo} />
          ) : (
            <div style={styles.photoPlaceholder}>
              <span style={styles.photoIcon}>👨‍🏫</span>
            </div>
          )}
        </div>
        <h1 style={styles.name}>{INSTRUCTOR.name}</h1>
        <p style={styles.title}>{INSTRUCTOR.title}</p>
      </div>

      {/* 경력 & 이력 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>경력 & 이력</h2>
        <ul style={styles.careerList}>
          {INSTRUCTOR.career.map((item, index) => (
            <li key={index} style={styles.careerItem}>
              <span style={styles.careerBullet}>●</span>
              <span style={styles.careerText}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 8대 혜택 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>평생 관리반 8대 혜택</h2>
        <div style={styles.benefitsGrid}>
          {BENEFITS.map((benefit, index) => (
            <div key={index} style={styles.benefitCard}>
              <span style={styles.benefitIcon}>{benefit.icon}</span>
              <h4 style={styles.benefitTitle}>{benefit.title}</h4>
              <p style={styles.benefitDesc}>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 최종 보상 안내 */}
      <div style={styles.rewardBanner}>
        <div style={styles.rewardContent}>
          <span style={styles.rewardEmoji}>🏆</span>
          <div style={styles.rewardText}>
            <p style={styles.rewardTitle}>조별 1등 최종 보상</p>
            <p style={styles.rewardMain}>미슐랭 출신 셰프 매장</p>
            <p style={styles.rewardSub}>스페셜 디너 초대!</p>
          </div>
          <span style={styles.rewardEmoji}>🍽️</span>
        </div>
        <p style={styles.rewardNote}>
          8주간의 여정 끝에 조별 1등 팀 전원에게 제공됩니다.
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
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  // 프로필 섹션
  profileSection: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: COLORS.surface,
    borderRadius: '20px',
    border: `2px solid ${COLORS.primary}`,
  },
  photoWrapper: {
    marginBottom: '20px',
  },
  photo: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `4px solid ${COLORS.primary}`,
    boxShadow: `0 0 20px ${COLORS.primary}40`,
  },
  photoPlaceholder: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    backgroundColor: COLORS.surfaceLight,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `4px solid ${COLORS.primary}`,
    boxShadow: `0 0 20px ${COLORS.primary}40`,
  },
  photoIcon: {
    fontSize: '60px',
  },
  name: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: '0 0 8px 0',
    letterSpacing: '2px',
  },
  title: {
    fontSize: '15px',
    color: COLORS.textMuted,
    margin: 0,
  },
  // 카드
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: COLORS.text,
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  // 경력 리스트
  careerList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  careerItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  careerBullet: {
    color: COLORS.primary,
    fontSize: '10px',
    marginTop: '5px',
    flexShrink: 0,
  },
  careerText: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: 1.5,
  },
  // 혜택 그리드
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  benefitCard: {
    padding: '16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '12px',
    textAlign: 'center',
  },
  benefitIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '8px',
  },
  benefitTitle: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  benefitDesc: {
    color: COLORS.textMuted,
    fontSize: '12px',
    margin: 0,
    lineHeight: 1.4,
  },
  // 최종 보상 배너
  rewardBanner: {
    padding: '24px',
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    border: `2px solid ${COLORS.primary}`,
    textAlign: 'center',
  },
  rewardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  rewardEmoji: {
    fontSize: '40px',
  },
  rewardText: {},
  rewardTitle: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 4px 0',
  },
  rewardMain: {
    color: COLORS.primary,
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 2px 0',
  },
  rewardSub: {
    color: COLORS.text,
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  rewardNote: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
    padding: '12px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
  },
};

export default Instructor;
