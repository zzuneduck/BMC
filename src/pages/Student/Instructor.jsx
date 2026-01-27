// src/pages/Student/Instructor.jsx
// 강사 소개 페이지

import { useState, useEffect } from 'react';
import { Card, Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// 8대 혜택 데이터
const BENEFITS = [
  {
    icon: '📚',
    title: 'VOD 무제한',
    description: '블로그 기본 + 브랜드 블로그 전 강의 무제한 수강',
  },
  {
    icon: '📝',
    title: '주간 미션',
    description: '매주 실습 미션으로 실력 향상',
  },
  {
    icon: '💬',
    title: '1:1 컨설팅',
    description: '개인 맞춤 블로그 컨설팅 제공',
  },
  {
    icon: '👥',
    title: '커뮤니티',
    description: '동기들과 함께 성장하는 스터디 그룹',
  },
  {
    icon: '🏆',
    title: '랭킹 시스템',
    description: '포인트로 경쟁하며 동기부여',
  },
  {
    icon: '🌳',
    title: '성장 나무',
    description: '포스팅 개수에 따라 성장하는 나의 나무',
  },
  {
    icon: '📊',
    title: '진도 관리',
    description: '체계적인 커리큘럼과 진도 체크',
  },
  {
    icon: '🎁',
    title: '보상 시스템',
    description: '미션 완료 시 포인트 적립',
  },
];

const Instructor = () => {
  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    loadInstructor();
  }, []);

  const loadInstructor = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('강사 정보 로드 실패:', error);
      }

      setInstructor(data);
    } catch (err) {
      console.error('강사 정보 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  // 기본 강사 정보 (DB에 없을 경우)
  const defaultInstructor = {
    name: '강사명',
    title: '블로그 마스터 클래스 강사',
    photo_url: null,
    introduction: '안녕하세요! 블로그 마스터 클래스에 오신 것을 환영합니다.\n\n블로그를 통해 여러분의 삶을 변화시킬 수 있도록 도와드리겠습니다. 함께 성장해요!',
    career: [
      '블로그 마케팅 전문가',
      '온라인 비즈니스 컨설턴트',
      '다수의 수강생 배출',
    ],
    sns: {},
  };

  const info = instructor || defaultInstructor;

  return (
    <div style={styles.container}>
      {/* 프로필 섹션 */}
      <div style={styles.profileSection}>
        <div style={styles.photoWrapper}>
          {info.photo_url ? (
            <img src={info.photo_url} alt={info.name} style={styles.photo} />
          ) : (
            <div style={styles.photoPlaceholder}>
              <span style={styles.photoIcon}>👨‍🏫</span>
            </div>
          )}
        </div>
        <h1 style={styles.name}>{info.name}</h1>
        <p style={styles.title}>{info.title}</p>
      </div>

      {/* 소개 */}
      <Card title="강사 소개">
        <p style={styles.introduction}>
          {info.introduction || '강사 소개가 준비 중입니다.'}
        </p>
      </Card>

      {/* 경력 */}
      {info.career && info.career.length > 0 && (
        <Card title="경력 & 이력">
          <ul style={styles.careerList}>
            {info.career.map((item, index) => (
              <li key={index} style={styles.careerItem}>
                <span style={styles.careerBullet}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 8대 혜택 */}
      <Card title="평생 관리반 8대 혜택">
        <div style={styles.benefitsGrid}>
          {BENEFITS.map((benefit, index) => (
            <div key={index} style={styles.benefitCard}>
              <span style={styles.benefitIcon}>{benefit.icon}</span>
              <h4 style={styles.benefitTitle}>{benefit.title}</h4>
              <p style={styles.benefitDesc}>{benefit.description}</p>
            </div>
          ))}
        </div>
      </Card>

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

      {/* SNS 링크 */}
      {info.sns && Object.keys(info.sns).length > 0 && (
        <Card title="SNS">
          <div style={styles.snsLinks}>
            {info.sns.blog && (
              <a
                href={info.sns.blog}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.snsLink}
              >
                <span style={styles.snsIcon}>📝</span>
                <span>블로그</span>
              </a>
            )}
            {info.sns.instagram && (
              <a
                href={info.sns.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.snsLink}
              >
                <span style={styles.snsIcon}>📸</span>
                <span>인스타그램</span>
              </a>
            )}
            {info.sns.youtube && (
              <a
                href={info.sns.youtube}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.snsLink}
              >
                <span style={styles.snsIcon}>🎬</span>
                <span>유튜브</span>
              </a>
            )}
            {info.sns.kakao && (
              <a
                href={info.sns.kakao}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.snsLink}
              >
                <span style={styles.snsIcon}>💬</span>
                <span>카카오톡</span>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* 연락처 */}
      {info.contact && (
        <Card title="문의">
          <p style={styles.contact}>{info.contact}</p>
        </Card>
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  profileSection: {
    textAlign: 'center',
    padding: '30px 20px',
  },
  photoWrapper: {
    marginBottom: '20px',
  },
  photo: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `3px solid ${COLORS.primary}`,
  },
  photoPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: COLORS.surface,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `3px solid ${COLORS.primary}`,
  },
  photoIcon: {
    fontSize: '48px',
  },
  name: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.text,
    margin: '0 0 8px 0',
  },
  title: {
    fontSize: '16px',
    color: COLORS.primary,
    margin: 0,
  },
  introduction: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  careerList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  careerItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    color: COLORS.text,
    fontSize: '14px',
    lineHeight: 1.5,
  },
  careerBullet: {
    color: COLORS.primary,
    fontWeight: 'bold',
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
  // SNS
  snsLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  snsLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '8px',
    color: COLORS.text,
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  snsIcon: {
    fontSize: '18px',
  },
  contact: {
    color: COLORS.text,
    fontSize: '14px',
    margin: 0,
  },
};

export default Instructor;
