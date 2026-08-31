-- =========================================================
-- 개업화분 회수 신청에 페이백 금액 컬럼 추가
-- (SQL Editor에서 이 파일 내용만 추가로 실행하세요)
-- =========================================================

alter table plant_collection_requests
  add column if not exists payback_amount numeric not null default 0;

-- status 값은 앞으로 'received'(접수) / 'approved'(승인) / 'completed'(페이백완료)로 사용합니다.

