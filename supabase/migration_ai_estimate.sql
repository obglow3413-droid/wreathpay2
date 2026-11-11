-- AI 사진 견적 결과(금액 범위·신뢰도·등급별 수량)를 신청 건에 함께 보관
-- Supabase SQL Editor 에서 한 번 실행하세요. 기존 데이터에는 영향이 없습니다.
alter table estimate_requests
  add column if not exists ai_estimate jsonb;

comment on column estimate_requests.ai_estimate is
  'AI 사진 견적 결과 {status, confidence, low/high 페이백, 등급별 수량, notes, model, createdAt}. 관리자 확정 금액과 별개로 보관';
