-- VOD 숙제 시스템 보완
-- vod_assignments에 start_date 컬럼 추가

ALTER TABLE vod_assignments ADD COLUMN IF NOT EXISTS start_date DATE;

-- 기존 데이터: start_date가 없으면 due_date 7일 전으로 설정
UPDATE vod_assignments SET start_date = due_date - INTERVAL '7 days' WHERE start_date IS NULL;

-- vod_progress에 note 컬럼 추가 (어려운 부분 메모)
ALTER TABLE vod_progress ADD COLUMN IF NOT EXISTS note TEXT;
