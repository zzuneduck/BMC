-- =============================================
-- 구글 드라이브 자료 링크 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 기존 데이터 정리 (샘플 데이터 삭제)
DELETE FROM links;

-- 구글 드라이브 링크 2개 추가
INSERT INTO links (category, title, url, description, type, sort_order) VALUES
('블로그', '쭌이덕 블로그 강의 자료 모음', 'https://drive.google.com/drive/u/1/folders/1Uz0HX-d9byI1px-X4gNDpo6VqP9FJakE', '블로그 강의 전체 자료', 'google_drive', 1),
('브랜드블로그', '김아임 브랜드블로그 강의 자료 모음', 'https://drive.google.com/drive/u/1/folders/1mz-8x27jgpVKTI9jJsJDjOxY-Fc_pA-u', '브랜드블로그 강의 전체 자료', 'google_drive', 1);

-- 확인
SELECT category, title, url FROM links ORDER BY category;
