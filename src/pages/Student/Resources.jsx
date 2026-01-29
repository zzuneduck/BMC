// src/pages/Student/Resources.jsx
// 자료실 페이지 - links 테이블에서 카테고리별 링크 조회

import { useState, useEffect } from 'react';
import { Card, Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// 카테고리 정의
const CATEGORIES = [
  { id: '블로그', label: '블로그', icon: '📝' },
  { id: '브랜드블로그', label: '브랜드블로그', icon: '💼' },
];

const Resources = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error('자료 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 아이콘 가져오기
  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || '📁';
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>자료실</h1>
      <p style={styles.subtitle}>강의 자료 구글 드라이브 모음</p>

      {CATEGORIES.map(cat => {
        const catLinks = links.filter(l => l.category === cat.id);
        return (
          <Card key={cat.id} title={`${cat.icon} ${cat.label}`}>
            {catLinks.length > 0 ? (
              <div style={styles.linkList}>
                {catLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.linkItem}
                  >
                    <div style={styles.linkIcon}>📂</div>
                    <div style={styles.linkInfo}>
                      <h4 style={styles.linkTitle}>{link.title}</h4>
                      {link.description && (
                        <p style={styles.linkDesc}>{link.description}</p>
                      )}
                    </div>
                    <div style={styles.arrowIcon}>→</div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>등록된 자료가 없습니다.</p>
              </div>
            )}
          </Card>
        );
      })}

      {/* 안내 */}
      <div style={styles.notice}>
        <p style={styles.noticeTitle}>💡 자료실 안내</p>
        <p style={styles.noticeText}>• 링크를 누르면 구글 드라이브가 새 탭에서 열립니다.</p>
        <p style={styles.noticeText}>• 블로그: 쭌이덕 블로그 강의 자료</p>
        <p style={styles.noticeText}>• 브랜드블로그: 김아임 브랜드블로그 강의 자료</p>
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
    gap: '16px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 8px 0',
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  linkIcon: {
    fontSize: '28px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: '10px',
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  linkDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: 0,
    lineHeight: 1.4,
  },
  arrowIcon: {
    color: COLORS.primary,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  emptyState: {
    textAlign: 'center',
    padding: '24px 20px',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
  notice: {
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
};

export default Resources;
