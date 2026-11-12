-- 고객 후기: 수거 완료 건에 대해 1회 작성, 관리자 승인 후 홈에 노출. 서비스 롤 전용(RLS 켬, 정책 없음).
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references estimate_requests(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 5 and 400),
  event_type text,
  region text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table reviews enable row level security;
