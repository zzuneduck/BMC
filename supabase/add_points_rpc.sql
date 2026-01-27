-- =============================================
-- add_points RPC 함수
-- Supabase SQL Editor에서 실행하세요
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

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION add_points(UUID, INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION add_points(UUID, INTEGER, TEXT, TEXT) TO authenticated;

-- =============================================
-- 필요한 테이블이 없다면 아래도 실행하세요
-- =============================================

-- points_log 테이블 (없는 경우)
CREATE TABLE IF NOT EXISTS points_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- points_log RLS 정책
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON points_log
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON points_log
  FOR INSERT WITH CHECK (true);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_points_log_student_id ON points_log(student_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at DESC);
