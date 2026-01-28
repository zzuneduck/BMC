-- =============================================
-- QnA 추가 FAQ 데이터
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- [블로그관리]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '블로그 비공개글 있으면 안 좋다고 하셨는데, 초기화해도 될까요?', '비공개글 정리하고 새로 시작하려고 합니다.', '블로그관리', '블로그 비공개+초기화는 하지 마시고, 앞으로 제대로 된 글을 쌓으면서 기존 글을 밀어내야 합니다! 초기화도 마찬가지입니다!', true, true, true, NOW());

INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '게시글 삭제/비공개 왜 안 되나요?', '과거 글 정리하고 싶은데 안 된다고 해서요.', '블로그관리', '게시글 삭제, 비공개 절대 하지 마세요. 새로 시작한다고 정리하려는 분들 많은데 좋을 확률이 거의 없습니다.', true, true, true, NOW());

INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '글 이동은 어떻게 하나요?', '카테고리 이동 방법이 궁금합니다.', '블로그관리', '글 30개씩 보기 열어두시고, 좌측 하단에 글 관리 열기 누르시고, 체크하시면서 옮겨야 합니다. 본문 수정으로 옮기지 마세요.', true, true, true, NOW());

-- [포스팅방법]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '포스팅 발행은 하루에 3개 발행할 때 시간 상관없이 해도 되나요?', '하루에 여러 개 발행할 때 시간 간격이 필요한가요?', '포스팅방법', '같은 날 3개 발행해도 괜찮습니다. 단, 최소 4시간 텀을 두는 것이 좋습니다.', true, true, true, NOW());

-- [블로그세팅]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '블로그 아이디랑 블로그 주소를 다르게 설정했는데 괜찮나요?', '아이디와 주소가 달라도 문제없나요?', '블로그세팅', '달라도 크게 상관은 없습니다. 블로그에 아무런 영향이 없습니다!', true, true, true, NOW());

INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '카테고리 설정은 어떻게 하나요?', '블로그 카테고리 추가 방법이 궁금합니다.', '블로그세팅', '프로필 하단의 관리 > 메뉴 > 글 동영상 관리 > 상단 메뉴 설정 > 카테고리 관리에서 추가하시면 됩니다.', true, true, true, NOW());

-- [강의관련]
INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '토요일 오프라인 강의를 온라인으로도 볼 수 있나요?', '오프라인 강의 온라인 참여 가능한가요?', '강의관련', '네, 토요일 10~13시 줌 라이브로 참여 가능합니다. 녹화본은 월요일에 타이탄클래스에 업로드됩니다.', true, true, true, NOW());

INSERT INTO qna (student_id, title, content, category, answer, is_answered, is_public, is_faq, answered_at)
VALUES (NULL, '라이브 참여 못 하면 질의응답은 어떻게 하나요?', '라이브 못 봤을 때 질문하는 방법이요.', '강의관련', '라이브 참여 못하시면 실시간 Q&A는 없습니다. 톡방이나 1:1 질의응답으로 해주시면 됩니다.', true, true, true, NOW());

-- 확인
SELECT category, COUNT(*) as count FROM qna WHERE is_faq = true GROUP BY category ORDER BY category;
