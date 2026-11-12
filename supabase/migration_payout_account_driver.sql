-- 페이백 계좌(암호화 저장) + 기사 전용 링크 토큰. Supabase SQL Editor 에서 한 번 실행.
create table if not exists payout_accounts (
  id uuid primary key default gen_random_uuid(),
  estimate_request_id uuid not null unique references estimate_requests(id) on delete cascade,
  bank_name text not null,
  holder_name text not null,
  account_enc text not null,
  account_last4 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table payout_accounts enable row level security;
-- 정책 없음: 서비스 롤(서버)만 접근

alter table drivers add column if not exists access_token text unique default replace(gen_random_uuid()::text, '-', '');
update drivers set access_token = replace(gen_random_uuid()::text, '-', '') where access_token is null;
