-- =============================================
-- BMC 프로젝트 추가 테이블
-- Supabase SQL Editor에서 실행하세요
-- =============================================


-- =============================================
-- 1. NOTICES 테이블 (공지사항)
-- =============================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, important, event
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_is_pinned ON notices(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select_all" ON notices FOR SELECT USING (true);
CREATE POLICY "notices_insert_all" ON notices FOR INSERT WITH CHECK (true);
CREATE POLICY "notices_update_all" ON notices FOR UPDATE USING (true);
CREATE POLICY "notices_delete_all" ON notices FOR DELETE USING (true);


-- =============================================
-- 2. INSTRUCTOR 테이블 (강사 정보)
-- =============================================
CREATE TABLE IF NOT EXISTS instructor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT, -- 직함
  bio TEXT, -- 소개
  profile_image TEXT,
  career JSONB DEFAULT '[]', -- 경력 [{year, content}]
  sns JSONB DEFAULT '{}', -- SNS 링크 {instagram, youtube, blog}
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE instructor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructor_select_all" ON instructor FOR SELECT USING (true);
CREATE POLICY "instructor_insert_all" ON instructor FOR INSERT WITH CHECK (true);
CREATE POLICY "instructor_update_all" ON instructor FOR UPDATE USING (true);


-- =============================================
-- 3. SCHEDULES 테이블 (일정)
-- =============================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  category TEXT DEFAULT 'class', -- class, event, deadline, holiday
  color TEXT DEFAULT '#ffc500',
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_category ON schedules(category);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select_all" ON schedules FOR SELECT USING (true);
CREATE POLICY "schedules_insert_all" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "schedules_update_all" ON schedules FOR UPDATE USING (true);
CREATE POLICY "schedules_delete_all" ON schedules FOR DELETE USING (true);


-- =============================================
-- 4. RESOURCES 테이블 (자료실)
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER, -- bytes
  file_type TEXT, -- pdf, docx, xlsx, zip, etc.
  category TEXT DEFAULT 'general', -- general, template, guide, material
  download_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_all" ON resources FOR SELECT USING (true);
CREATE POLICY "resources_insert_all" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update_all" ON resources FOR UPDATE USING (true);
CREATE POLICY "resources_delete_all" ON resources FOR DELETE USING (true);


-- =============================================
-- 5. QNA 테이블 (Q&A 게시판)
-- =============================================
CREATE TABLE IF NOT EXISTS qna (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, blog, revenue, tech, other
  is_answered BOOLEAN DEFAULT false,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qna_student_id ON qna(student_id);
CREATE INDEX IF NOT EXISTS idx_qna_category ON qna(category);
CREATE INDEX IF NOT EXISTS idx_qna_is_answered ON qna(is_answered);
CREATE INDEX IF NOT EXISTS idx_qna_created_at ON qna(created_at DESC);

ALTER TABLE qna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qna_select_all" ON qna FOR SELECT USING (true);
CREATE POLICY "qna_insert_all" ON qna FOR INSERT WITH CHECK (true);
CREATE POLICY "qna_update_all" ON qna FOR UPDATE USING (true);
CREATE POLICY "qna_delete_all" ON qna FOR DELETE USING (true);


-- =============================================
-- 6. CONSULTATION_SLOTS 테이블 (상담 예약 슬롯)
-- =============================================
CREATE TABLE IF NOT EXISTS consultation_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  description TEXT,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_date ON consultation_slots(date);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_available ON consultation_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_student ON consultation_slots(student_id);

ALTER TABLE consultation_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultation_slots_select_all" ON consultation_slots FOR SELECT USING (true);
CREATE POLICY "consultation_slots_insert_all" ON consultation_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "consultation_slots_update_all" ON consultation_slots FOR UPDATE USING (true);
CREATE POLICY "consultation_slots_delete_all" ON consultation_slots FOR DELETE USING (true);


-- =============================================
-- 7. CONSULTINGS 테이블 (상담 신청)
-- =============================================
CREATE TABLE IF NOT EXISTS consultings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'general', -- general, blog, revenue, career
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  status TEXT DEFAULT 'pending', -- pending, scheduled, completed, cancelled
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultings_student_id ON consultings(student_id);
CREATE INDEX IF NOT EXISTS idx_consultings_status ON consultings(status);
CREATE INDEX IF NOT EXISTS idx_consultings_created_at ON consultings(created_at DESC);

ALTER TABLE consultings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultings_select_all" ON consultings FOR SELECT USING (true);
CREATE POLICY "consultings_insert_all" ON consultings FOR INSERT WITH CHECK (true);
CREATE POLICY "consultings_update_all" ON consultings FOR UPDATE USING (true);


-- =============================================
-- 8. REVENUE_PROOFS 테이블 (수익 인증 - 즉시 포인트)
-- =============================================
CREATE TABLE IF NOT EXISTS revenue_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- adpost, experience, other
  amount INTEGER, -- 금액 (선택)
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_proofs_student_id ON revenue_proofs(student_id);
CREATE INDEX IF NOT EXISTS idx_revenue_proofs_type ON revenue_proofs(type);
CREATE INDEX IF NOT EXISTS idx_revenue_proofs_created_at ON revenue_proofs(created_at DESC);

ALTER TABLE revenue_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_proofs_select_all" ON revenue_proofs FOR SELECT USING (true);
CREATE POLICY "revenue_proofs_insert_all" ON revenue_proofs FOR INSERT WITH CHECK (true);


-- =============================================
-- 9. EARNINGS 테이블 (수익 인증 - 승인 필요)
-- =============================================
CREATE TABLE IF NOT EXISTS earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT DEFAULT 'adsense', -- adsense, affiliate, sponsored, coupang, other
  description TEXT NOT NULL,
  proof_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reject_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_student_id ON earnings(student_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(status);
CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at DESC);

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "earnings_select_all" ON earnings FOR SELECT USING (true);
CREATE POLICY "earnings_insert_all" ON earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "earnings_update_all" ON earnings FOR UPDATE USING (true);


-- =============================================
-- 10. VOD_ASSIGNMENTS 테이블 (VOD 숙제)
-- =============================================
CREATE TABLE IF NOT EXISTS vod_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vod_assignments_week ON vod_assignments(week);
CREATE INDEX IF NOT EXISTS idx_vod_assignments_due_date ON vod_assignments(due_date);

ALTER TABLE vod_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vod_assignments_select_all" ON vod_assignments FOR SELECT USING (true);
CREATE POLICY "vod_assignments_insert_all" ON vod_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "vod_assignments_update_all" ON vod_assignments FOR UPDATE USING (true);
CREATE POLICY "vod_assignments_delete_all" ON vod_assignments FOR DELETE USING (true);


-- =============================================
-- 11. VOD_SUBMISSIONS 테이블 (VOD 숙제 제출)
-- =============================================
CREATE TABLE IF NOT EXISTS vod_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES vod_assignments(id) ON DELETE CASCADE,
  summary TEXT,
  practice_url TEXT,
  question TEXT,
  feedback TEXT,
  feedback_at TIMESTAMPTZ,
  points_awarded INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_vod_submissions_student_id ON vod_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_vod_submissions_assignment_id ON vod_submissions(assignment_id);

ALTER TABLE vod_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vod_submissions_select_all" ON vod_submissions FOR SELECT USING (true);
CREATE POLICY "vod_submissions_insert_all" ON vod_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "vod_submissions_update_all" ON vod_submissions FOR UPDATE USING (true);


-- =============================================
-- 12. ATTENDANCE 테이블 수정 (기존 테이블 업데이트)
-- =============================================
-- 기존 attendance 테이블이 있다면 아래 명령 실행
-- ALTER TABLE attendance DROP COLUMN IF EXISTS checked_at;
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_present BOOLEAN DEFAULT true;
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- =============================================
-- 13. 샘플 데이터
-- =============================================

-- 강사 정보 샘플
INSERT INTO instructor (name, title, bio, career, sns) VALUES (
  '쭌이덕',
  '블로그 마스터 강사',
  '10년차 블로그 전문가. 수천 명의 수강생을 배출한 블로그 수익화 전문가입니다.',
  '[
    {"year": "2024", "content": "블로그 마스터 클래스 운영"},
    {"year": "2023", "content": "네이버 인플루언서 선정"},
    {"year": "2020", "content": "블로그 컨설팅 시작"}
  ]'::jsonb,
  '{"instagram": "https://instagram.com/zzuneduck", "blog": "https://blog.naver.com/zzuneduck"}'::jsonb
) ON CONFLICT DO NOTHING;

-- 공지사항 샘플
INSERT INTO notices (title, content, category, is_pinned) VALUES
  ('블로그 마스터 클래스 1기 오픈!', '블로그 마스터 클래스 1기가 시작됩니다. 열심히 참여해주세요!', 'important', true),
  ('출석 체크 방법 안내', '매일 출석 체크를 하시면 포인트가 적립됩니다. 3일, 7일, 14일 연속 출석 시 보너스 포인트!', 'general', false),
  ('VOD 강의 업로드 안내', '매주 월요일 새로운 VOD 강의가 업로드됩니다.', 'general', false)
ON CONFLICT DO NOTHING;

-- 일정 샘플
INSERT INTO schedules (title, description, start_date, category, color) VALUES
  ('1주차 라이브', '블로그 기초 라이브 강의', CURRENT_DATE + INTERVAL '7 days', 'class', '#ffc500'),
  ('2주차 라이브', '키워드 분석 라이브 강의', CURRENT_DATE + INTERVAL '14 days', 'class', '#ffc500'),
  ('1주차 미션 마감', 'VOD 시청 및 실습 미션 제출', CURRENT_DATE + INTERVAL '6 days', 'deadline', '#ff4444')
ON CONFLICT DO NOTHING;

-- 상담 슬롯 샘플 (다음 주 월~금)
INSERT INTO consultation_slots (date, start_time, end_time, description) VALUES
  (CURRENT_DATE + INTERVAL '7 days', '10:00', '10:30', '오전 상담'),
  (CURRENT_DATE + INTERVAL '7 days', '14:00', '14:30', '오후 상담'),
  (CURRENT_DATE + INTERVAL '8 days', '10:00', '10:30', '오전 상담'),
  (CURRENT_DATE + INTERVAL '8 days', '14:00', '14:30', '오후 상담'),
  (CURRENT_DATE + INTERVAL '9 days', '10:00', '10:30', '오전 상담')
ON CONFLICT DO NOTHING;

-- VOD 숙제 샘플
INSERT INTO vod_assignments (week, title, description, due_date, points) VALUES
  (1, '블로그 개설하기', '네이버 블로그를 개설하고 기본 설정을 완료하세요.', CURRENT_DATE + INTERVAL '7 days', 10),
  (1, '첫 포스팅 작성', '자기소개 포스팅을 작성하세요.', CURRENT_DATE + INTERVAL '7 days', 10),
  (2, '키워드 분석 실습', '배운 키워드 분석 방법으로 5개 키워드를 분석하세요.', CURRENT_DATE + INTERVAL '14 days', 15)
ON CONFLICT DO NOTHING;


-- =============================================
-- 완료!
-- =============================================
