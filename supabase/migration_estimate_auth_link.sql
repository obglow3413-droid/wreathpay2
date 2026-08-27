-- =========================================================
-- 회원가입자 접수현황 조회를 위한 컬럼 추가
-- (SQL Editor에서 이 파일 내용만 추가로 실행하세요)
-- =========================================================

alter table estimate_requests
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_estimate_requests_auth_user on estimate_requests(auth_user_id);

-- 로그인한 회원은 자기 명의로 등록된 신청 내역만 조회 가능
create policy "member can read own estimate_requests" on estimate_requests
  for select to authenticated
  using (auth.uid() = auth_user_id);
