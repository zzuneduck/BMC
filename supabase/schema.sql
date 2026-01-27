-- =============================================
-- BMC 프로젝트 전체 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- =============================================
-- 1. STUDENTS 테이블 (수강생)
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  team TEXT,
  class_type TEXT DEFAULT '온라인', -- 온라인, 오프라인

  -- 포인트 관련
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,

  -- 블로그/나무 관련
  blog1 TEXT,
  blog2 TEXT,
  blog3 TEXT,
  post_count INTEGER DEFAULT 0,
  tree_level INTEGER DEFAULT 1,
  last_evidence TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_team ON students(team);
CREATE INDEX IF NOT EXISTS idx_students_total_points ON students(total_points DESC);

-- RLS 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "students_select_all" ON students
  FOR SELECT USING (true);

CREATE POLICY "students_insert_all" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "students_update_all" ON students
  FOR UPDATE USING (true);

CREATE POLICY "students_delete_all" ON students
  FOR DELETE USING (true);


-- =============================================
-- 2. POINTS_LOG 테이블 (포인트 내역)
-- =============================================
CREATE TABLE IF NOT EXISTS points_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_points_log_student_id ON points_log(student_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_log_type ON points_log(type);

-- RLS 활성화
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "points_log_select_all" ON points_log
  FOR SELECT USING (true);

CREATE POLICY "points_log_insert_all" ON points_log
  FOR INSERT WITH CHECK (true);


-- =============================================
-- 3. ATTENDANCE 테이블 (출석)
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 날 중복 출석 방지
  UNIQUE(student_id, date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);

-- RLS 활성화
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "attendance_select_all" ON attendance
  FOR SELECT USING (true);

CREATE POLICY "attendance_insert_all" ON attendance
  FOR INSERT WITH CHECK (true);


-- =============================================
-- 4. MISSIONS 테이블 (미션)
-- =============================================
CREATE TABLE IF NOT EXISTS missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general', -- vod, blog, comment, share, practice, general
  points INTEGER DEFAULT 10,
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_missions_week ON missions(week);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);
CREATE INDEX IF NOT EXISTS idx_missions_order ON missions(week, order_num);

-- RLS 활성화
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "missions_select_all" ON missions
  FOR SELECT USING (true);

CREATE POLICY "missions_insert_all" ON missions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "missions_update_all" ON missions
  FOR UPDATE USING (true);

CREATE POLICY "missions_delete_all" ON missions
  FOR DELETE USING (true);


-- =============================================
-- 5. MISSION_LOGS 테이블 (미션 완료 기록)
-- =============================================
CREATE TABLE IF NOT EXISTS mission_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  evidence TEXT,

  -- 같은 미션 중복 완료 방지
  UNIQUE(student_id, mission_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_mission_logs_student_id ON mission_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_mission_id ON mission_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_completed_at ON mission_logs(completed_at DESC);

-- RLS 활성화
ALTER TABLE mission_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "mission_logs_select_all" ON mission_logs
  FOR SELECT USING (true);

CREATE POLICY "mission_logs_insert_all" ON mission_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "mission_logs_delete_all" ON mission_logs
  FOR DELETE USING (true);


-- =============================================
-- 6. VOD_COURSES 테이블 (VOD 강의)
-- =============================================
CREATE TABLE IF NOT EXISTS vod_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0, -- 분 단위
  category TEXT DEFAULT 'weekly', -- weekly, bonus, special
  course_type TEXT DEFAULT 'basic', -- basic, advanced
  order_num INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vod_courses_week ON vod_courses(week);
CREATE INDEX IF NOT EXISTS idx_vod_courses_category ON vod_courses(category);
CREATE INDEX IF NOT EXISTS idx_vod_courses_published ON vod_courses(is_published);

-- RLS 활성화
ALTER TABLE vod_courses ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "vod_courses_select_all" ON vod_courses
  FOR SELECT USING (true);

CREATE POLICY "vod_courses_insert_all" ON vod_courses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "vod_courses_update_all" ON vod_courses
  FOR UPDATE USING (true);

CREATE POLICY "vod_courses_delete_all" ON vod_courses
  FOR DELETE USING (true);


-- =============================================
-- 7. VOD_PROGRESS 테이블 (VOD 시청 기록)
-- =============================================
CREATE TABLE IF NOT EXISTS vod_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES vod_courses(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 VOD 중복 방지
  UNIQUE(student_id, course_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vod_progress_student_id ON vod_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_vod_progress_course_id ON vod_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_vod_progress_completed ON vod_progress(is_completed);

-- RLS 활성화
ALTER TABLE vod_progress ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "vod_progress_select_all" ON vod_progress
  FOR SELECT USING (true);

CREATE POLICY "vod_progress_insert_all" ON vod_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "vod_progress_update_all" ON vod_progress
  FOR UPDATE USING (true);


-- =============================================
-- 8. ADD_POINTS RPC 함수
-- =============================================
CREATE OR REPLACE FUNCTION add_points(
  p_student_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_type TEXT DEFAULT 'general'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total INTEGER;
  v_log_id UUID;
  v_student_name TEXT;
BEGIN
  -- 수강생 존재 확인
  SELECT name INTO v_student_name
  FROM students
  WHERE id = p_student_id;

  IF v_student_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '수강생을 찾을 수 없습니다.'
    );
  END IF;

  -- 포인트 로그 추가
  INSERT INTO points_log (student_id, points, reason, type, created_at)
  VALUES (p_student_id, p_points, p_reason, p_type, NOW())
  RETURNING id INTO v_log_id;

  -- 학생 total_points 업데이트
  UPDATE students
  SET total_points = COALESCE(total_points, 0) + p_points,
      updated_at = NOW()
  WHERE id = p_student_id
  RETURNING total_points INTO v_new_total;

  -- 결과 반환
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'log_id', v_log_id,
      'student_id', p_student_id,
      'student_name', v_student_name,
      'points_added', p_points,
      'new_total', v_new_total,
      'reason', p_reason,
      'type', p_type
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 함수 실행 권한
GRANT EXECUTE ON FUNCTION add_points(UUID, INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION add_points(UUID, INTEGER, TEXT, TEXT) TO authenticated;


-- =============================================
-- 9. 유틸리티 함수들
-- =============================================

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- students 테이블에 트리거 적용
DROP TRIGGER IF EXISTS trigger_students_updated_at ON students;
CREATE TRIGGER trigger_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- =============================================
-- 10. 샘플 데이터 (선택사항)
-- =============================================

-- 테스트용 수강생 데이터 (필요시 주석 해제)
/*
INSERT INTO students (name, password, team, total_points, post_count, tree_level) VALUES
  ('홍길동', '1234', 'A조', 50, 10, 2),
  ('김철수', '1234', 'A조', 30, 5, 2),
  ('이영희', '1234', 'B조', 80, 20, 3),
  ('박민수', '1234', 'B조', 20, 3, 1),
  ('정수연', '1234', 'C조', 100, 35, 4);
*/


-- =============================================
-- 11. 뷰 (Views)
-- =============================================

-- 개인 랭킹 뷰
CREATE OR REPLACE VIEW v_individual_ranking AS
SELECT
  id,
  name,
  team,
  total_points,
  ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
FROM students
ORDER BY total_points DESC;

-- 조별 랭킹 뷰
CREATE OR REPLACE VIEW v_team_ranking AS
SELECT
  team,
  SUM(total_points) as total_points,
  COUNT(*) as member_count,
  ROW_NUMBER() OVER (ORDER BY SUM(total_points) DESC) as rank
FROM students
WHERE team IS NOT NULL
GROUP BY team
ORDER BY total_points DESC;

-- 오늘 출석 현황 뷰
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT
  a.id,
  a.student_id,
  a.checked_at,
  s.name,
  s.team
FROM attendance a
JOIN students s ON a.student_id = s.id
WHERE a.date = CURRENT_DATE
ORDER BY a.checked_at;
