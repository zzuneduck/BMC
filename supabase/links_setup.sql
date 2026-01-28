-- =============================================
-- Links 테이블 설정 (자료실)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. Links 테이블 생성
CREATE TABLE IF NOT EXISTS links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'website', -- notion, google_docs, google_sheets, google_drive, youtube, website, download, other
  category VARCHAR(50) DEFAULT '템플릿', -- 템플릿, 가이드, 유용한 도구
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_links_category ON links(category);
CREATE INDEX IF NOT EXISTS idx_links_sort_order ON links(sort_order);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);

-- 3. RLS 정책
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "links_select_all" ON links;
CREATE POLICY "links_select_all" ON links FOR SELECT USING (true);

DROP POLICY IF EXISTS "links_insert_all" ON links;
CREATE POLICY "links_insert_all" ON links FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "links_update_all" ON links;
CREATE POLICY "links_update_all" ON links FOR UPDATE USING (true);

DROP POLICY IF EXISTS "links_delete_all" ON links;
CREATE POLICY "links_delete_all" ON links FOR DELETE USING (true);


-- =============================================
-- 4. 샘플 데이터
-- =============================================

-- 템플릿
INSERT INTO links (title, description, url, type, category, sort_order) VALUES
('블로그 포스팅 체크리스트', '포스팅 전 확인해야 할 항목 체크리스트', 'https://www.notion.so/example1', 'notion', '템플릿', 1),
('키워드 분석 템플릿', '키워드 분석용 스프레드시트', 'https://docs.google.com/spreadsheets/example', 'google_sheets', '템플릿', 2)
ON CONFLICT DO NOTHING;

-- 가이드
INSERT INTO links (title, description, url, type, category, sort_order) VALUES
('블로그 시작 가이드', '블로그 개설부터 첫 포스팅까지', 'https://www.notion.so/example2', 'notion', '가이드', 1),
('SEO 기초 가이드', '검색 최적화 기본 개념', 'https://www.notion.so/example3', 'notion', '가이드', 2),
('수익화 로드맵', '블로그 수익화 단계별 안내', 'https://docs.google.com/document/example', 'google_docs', '가이드', 3)
ON CONFLICT DO NOTHING;

-- 유용한 도구
INSERT INTO links (title, description, url, type, category, sort_order) VALUES
('키워드 검색량 조회', '네이버 키워드 검색량 확인 도구', 'https://searchadvisor.naver.com', 'website', '유용한 도구', 1),
('무료 이미지 사이트', '상업적 무료 이미지 다운로드', 'https://unsplash.com', 'website', '유용한 도구', 2),
('썸네일 제작 도구', '간편한 썸네일 만들기', 'https://www.canva.com', 'website', '유용한 도구', 3)
ON CONFLICT DO NOTHING;


-- 확인
SELECT category, COUNT(*) as count FROM links GROUP BY category ORDER BY category;
