// src/pages/Student/Resources.jsx
// 자료실 페이지 - links 테이블에서 카테고리별 링크 조회

import { useState, useEffect } from 'react';
import { Card, Loading } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

// 카테고리 정의
const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📁' },
  { id: '블로그', label: '블로그', icon: '📝' },
  { id: '브랜드블로그', label: '브랜드블로그', icon: '💼' },
  { id: '템플릿', label: '템플릿', icon: '📋' },
  { id: '가이드', label: '가이드', icon: '📖' },
  { id: '유용한 도구', label: '유용한 도구', icon: '🔧' },
];

const Resources = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error('자료 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 링크
  const filteredLinks = selectedCategory === 'all'
    ? links
    : links.filter(link => link.category === selectedCategory);

  // 카테고리별 그룹핑 (전체 보기 시 사용)
  const groupedLinks = {};
  if (selectedCategory === 'all') {
    links.forEach(link => {
      const category = link.category || '기타';
      if (!groupedLinks[category]) {
        groupedLinks[category] = [];
      }
      groupedLinks[category].push(link);
    });
  }

  // 카테고리 아이콘 가져오기
  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || '📁';
  };

  // 링크 타입별 아이콘
  const getLinkIcon = (type) => {
    switch (type) {
      case 'notion': return '📔';
      case 'google_docs': return '📄';
      case 'google_sheets': return '📊';
      case 'google_drive': return '📂';
      case 'youtube': return '🎬';
      case 'website': return '🌐';
      case 'download': return '⬇️';
      default: return '🔗';
    }
  };

  // 링크 열기
  const handleOpenLink = (link) => {
    if (link.url) {
      window.open(link.url, '_blank');
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>자료실</h1>
      <p style={styles.subtitle}>블로그 운영에 필요한 자료 모음</p>

      {/* 카테고리 탭 */}
      <div style={styles.categoryTabs}>
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            style={{
              ...styles.categoryTab,
              ...(selectedCategory === category.id ? styles.categoryTabActive : {}),
            }}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span style={styles.categoryIcon}>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* 전체 보기 - 카테고리별 그룹 */}
      {selectedCategory === 'all' ? (
        Object.keys(groupedLinks).length > 0 ? (
          Object.entries(groupedLinks).map(([category, categoryLinks]) => (
            <Card key={category} title={`${getCategoryIcon(category)} ${category}`}>
              <div style={styles.linkList}>
                {categoryLinks.map(link => (
                  <div
                    key={link.id}
                    style={styles.linkItem}
                    onClick={() => handleOpenLink(link)}
                  >
                    <div style={styles.linkIcon}>
                      {getLinkIcon(link.type)}
                    </div>
                    <div style={styles.linkInfo}>
                      <h4 style={styles.linkTitle}>{link.title}</h4>
                      {link.description && (
                        <p style={styles.linkDesc}>{link.description}</p>
                      )}
                    </div>
                    <div style={styles.arrowIcon}>→</div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📁</span>
              <p style={styles.emptyText}>등록된 자료가 없습니다.</p>
            </div>
          </Card>
        )
      ) : (
        // 카테고리 선택 시
        filteredLinks.length > 0 ? (
          <Card>
            <div style={styles.linkList}>
              {filteredLinks.map(link => (
                <div
                  key={link.id}
                  style={styles.linkItem}
                  onClick={() => handleOpenLink(link)}
                >
                  <div style={styles.linkIcon}>
                    {getLinkIcon(link.type)}
                  </div>
                  <div style={styles.linkInfo}>
                    <h4 style={styles.linkTitle}>{link.title}</h4>
                    {link.description && (
                      <p style={styles.linkDesc}>{link.description}</p>
                    )}
                  </div>
                  <div style={styles.arrowIcon}>→</div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📁</span>
              <p style={styles.emptyText}>
                {CATEGORIES.find(c => c.id === selectedCategory)?.label} 자료가 없습니다.
              </p>
            </div>
          </Card>
        )
      )}

      {/* 안내 */}
      <div style={styles.notice}>
        <p style={styles.noticeTitle}>💡 자료실 안내</p>
        <p style={styles.noticeText}>• 블로그: 네이버 블로그 관련 자료</p>
        <p style={styles.noticeText}>• 브랜드블로그: 브랜드블로그 대행 관련 자료</p>
        <p style={styles.noticeText}>• 템플릿: 블로그 포스팅에 활용할 수 있는 양식</p>
        <p style={styles.noticeText}>• 가이드: 블로그 운영 및 수익화 안내 문서</p>
        <p style={styles.noticeText}>• 유용한 도구: 블로그 작성에 도움되는 사이트/도구</p>
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
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  categoryTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: COLORS.surface,
    border: 'none',
    borderRadius: '20px',
    color: COLORS.textMuted,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    color: '#000',
    fontWeight: 'bold',
  },
  categoryIcon: {
    fontSize: '16px',
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
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
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
