-- =============================================
-- QnA 테이블 설정 및 초기 FAQ 데이터
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. QnA 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS qna (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT '강의관련',
  answer TEXT,
  is_answered BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  is_faq BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- 2. category 컬럼 추가 (이미 테이블 있는 경우)
ALTER TABLE qna ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '강의관련';
ALTER TABLE qna ADD COLUMN IF NOT EXISTS is_faq BOOLEAN DEFAULT false;

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_qna_category ON qna(category);
CREATE INDEX IF NOT EXISTS idx_qna_is_faq ON qna(is_faq);
CREATE INDEX IF NOT EXISTS idx_qna_created_at ON qna(created_at DESC);

-- 4. RLS 정책
ALTER TABLE qna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qna_select_all" ON qna;
CREATE POLICY "qna_select_all" ON qna FOR SELECT USING (true);

DROP POLICY IF EXISTS "qna_insert_all" ON qna;
CREATE POLICY "qna_insert_all" ON qna FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "qna_update_all" ON qna;
CREATE POLICY "qna_update_all" ON qna FOR UPDATE USING (true);

DROP POLICY IF EXISTS "qna_delete_all" ON qna;
CREATE POLICY "qna_delete_all" ON qna FOR DELETE USING (true);


-- =============================================
-- 5. FAQ 초기 데이터 삽입
-- =============================================

-- 기존 FAQ 삭제 (중복 방지)
DELETE FROM qna WHERE is_faq = true;

-- [1:1상담]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at) VALUES
(NULL, '1:1 상담은 기회가 한 번인가요?', '1:1 상담 횟수가 궁금합니다.', '1:1상담', '네, 1:1은 한 번 진행합니다.', true, true, true, NOW()),
(NULL, '1:1 상담은 언제까지 신청하면 되나요?', '상담 신청 기한이 궁금합니다.', '1:1상담', '3개월 수강기간 내 해주시면 됩니다. 5주 수강하시고 블로그 키우다 보면 궁금한 점이 많아지실 거예요!', true, true, true, NOW());

-- [블로그주제]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at) VALUES
(NULL, '1일 3포스팅은 주제 상관없이 해도 되나요?', '맛집+숙박+뷰티 이렇게 다른 주제로 해도 되나요?', '블로그주제', '한 가지 집중했을 때: 100%, 2가지 나눠서 했을 때: 50%, 3개로 나눠서 했을 때: 33%. 주제별 전문성이 있어서 전문성 올리는 속도가 느려지는 거예요. 본인이 더 메리트를 느끼는 분야를 선택하셔야 합니다.', true, true, true, NOW()),
(NULL, '여행/연예방송이슈/제품리뷰 블로그 3개 운영해도 되나요?', '블로그 3개를 각각 다른 주제로 운영하려고 합니다.', '블로그주제', '여행은 여행비용 절감이랑 CPA에 좋지만 애드포스트나 수익화는 어려운 분야. 연예방송이슈는 협찬이 어렵지만 방문자 올리기 좋고 홈판 노리기 좋음. 제품 블로그는 분야가 명확하지 않으면 생활비 세이브 이상으로는 어렵습니다. A의 장단점, B의 장단점을 나열해놓고 본인이 더 메리트를 느끼는 분야를 선택하셔야 합니다.', true, true, true, NOW()),
(NULL, '네이버 아이디 3개로 각각 다른 주제 해도 괜찮나요?', '뷰티/IT/자동차 각각 다른 아이디로 운영하려고 합니다.', '블로그주제', '네, 괜찮습니다! 아이디별 개별로 블로그를 생성한다고 보시면 됩니다.', true, true, true, NOW());

-- [블로그관리]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at) VALUES
(NULL, '블로그 비공개글 있으면 안 좋다고 하셨는데, 초기화해도 될까요?', '비공개글 정리하고 새로 시작하려고 합니다.', '블로그관리', '블로그 비공개+초기화는 하지 마시고, 앞으로 제대로 된 글을 쌓으면서 기존 글을 밀어내야 합니다! 초기화도 마찬가지입니다!', true, true, true, NOW()),
(NULL, '게시글 삭제/비공개 왜 안 되나요?', '과거 글 정리하고 싶은데 안 된다고 해서요.', '블로그관리', '게시글 삭제, 비공개 절대 하지 마세요. 새로 시작한다고 정리하려는 분들 많은데 좋을 확률이 거의 없습니다.', true, true, true, NOW()),
(NULL, '글 이동은 어떻게 하나요?', '카테고리 이동 방법이 궁금합니다.', '블로그관리', '글 30개씩 보기 열어두시고, 좌측 하단에 글 관리 열기 누르시고, 체크하시면서 옮겨야 합니다. 본문 수정으로 옮기지 마세요.', true, true, true, NOW()),
(NULL, '블로그 게시글을 여러 번 수정하면 노출도나 계정에 타격이 있나요?', '글 수정 횟수가 영향을 주는지 궁금합니다.', '블로그관리', '수정 횟수는 문제없습니다만, 사진/제목/키워드 수정하시면 노출 변경될 수 있습니다. 오히려 키워드 맞춰서 수정해서 노출 잘 될 때도 있습니다.', true, true, true, NOW());

-- [포스팅방법]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at) VALUES
(NULL, '포스팅 발행은 하루에 3개 발행할 때 시간 상관없이 해도 되나요?', '하루에 여러 개 발행할 때 시간 간격이 필요한가요?', '포스팅방법', '같은 날 3개 발행해도 괜찮습니다. 단, 최소 4시간 텀을 두는 것이 좋습니다.', true, true, true, NOW());

-- [블로그세팅]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at) VALUES
(NULL, '블로그 아이디랑 블로그 주소를 다르게 설정했는데 괜찮나요?', '아이디와 주소가 달라도 문제없나요?', '블로그세팅', '달라도 크게 상관은 없습니다. 저는 아이디/주소가 상이한데 네이버 인플루언서도 되었고요. 결론적으로 블로그에 아무런 영향이 없습니다!', true, true, true, NOW()),
(NULL, '카테고리 설정은 어떻게 하나요?', '블로그 카테고리 추가 방법이 궁금합니다.', '블로그세팅', '프로필 하단의 관리 > 메뉴 > 글 동영상 관리 > 상단 메뉴 설정 > 카테고리 관리에서 추가하시면 됩니다.', true, true, true, NOW());

-- [강의관련]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at) VALUES
(NULL, '토요일 오프라인 강의를 온라인으로도 볼 수 있나요?', '오프라인 강의 온라인 참여 가능한가요?', '강의관련', '네, 토요일 10~13시 줌 라이브로 참여 가능합니다. 녹화본은 월요일에 타이탄클래스에 업로드됩니다.', true, true, true, NOW()),
(NULL, '라이브 참여 못 하면 질의응답은 어떻게 하나요?', '라이브 못 봤을 때 질문하는 방법이요.', '강의관련', '라이브 참여 못하시면 실시간 Q&A는 없습니다. 톡방이나 1:1 질의응답으로 해주시면 됩니다.', true, true, true, NOW()),
(NULL, '머니덕에서 네이버 플레이스도 볼 수 있나요?', '플레이스 강의도 제공되나요?', '강의관련', '제공하기로 했던 패키지A (블로그+브랜드블로그 VOD) 제공만 가능합니다. 플레이스는 포함되지 않습니다.', true, true, true, NOW());

-- 확인
SELECT category, COUNT(*) as count FROM qna WHERE is_faq = true GROUP BY category ORDER BY category;
