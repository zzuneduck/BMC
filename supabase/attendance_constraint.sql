-- =============================================
-- Attendance 테이블 unique constraint 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- student_id + date 조합에 unique constraint 추가
-- 동일 학생이 같은 날짜에 중복 출석 방지
ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS attendance_student_date_unique
UNIQUE (student_id, date);
