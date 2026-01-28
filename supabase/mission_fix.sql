-- =============================================
-- 미션 관련 테이블 수정
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. missions 테이블에 start_date, due_date 컬럼 추가
ALTER TABLE missions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS due_date DATE;

-- 기존 데이터에 기본값 설정 (created_at 기준)
UPDATE missions
SET start_date = DATE(created_at),
    due_date = DATE(created_at + INTERVAL '7 days')
WHERE start_date IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_missions_start_date ON missions(start_date);
CREATE INDEX IF NOT EXISTS idx_missions_due_date ON missions(due_date);


-- 2. mission_submissions 테이블 생성
CREATE TABLE IF NOT EXISTS mission_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  url TEXT,
  content TEXT,
  status TEXT DEFAULT 'submitted', -- submitted, approved, rejected
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, mission_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_mission_submissions_student_id ON mission_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_mission_id ON mission_submissions(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_date ON mission_submissions(date);

-- RLS
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_submissions_select_all" ON mission_submissions;
CREATE POLICY "mission_submissions_select_all" ON mission_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "mission_submissions_insert_all" ON mission_submissions;
CREATE POLICY "mission_submissions_insert_all" ON mission_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "mission_submissions_update_all" ON mission_submissions;
CREATE POLICY "mission_submissions_update_all" ON mission_submissions FOR UPDATE USING (true);


-- 3. 샘플 미션 데이터 (선택)
INSERT INTO missions (week, title, description, type, points, start_date, due_date, is_active) VALUES
  (1, '오늘의 블로그 포스팅', '블로그에 1개 이상의 포스팅을 작성하세요.', 'daily', 10, CURRENT_DATE, CURRENT_DATE, true),
  (1, '키워드 분석 실습', '배운 키워드 분석 방법으로 3개 이상의 키워드를 분석하세요.', 'weekly', 20, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true),
  (1, '첫 수익 인증', '블로그 수익(애드포스트, 체험단 등)을 처음 인증하세요!', 'special', 50, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true)
ON CONFLICT DO NOTHING;


-- 확인
SELECT 'missions' as table_name, COUNT(*) as count FROM missions
UNION ALL
SELECT 'mission_submissions', COUNT(*) FROM mission_submissions;
