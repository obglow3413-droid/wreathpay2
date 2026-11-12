-- 디지털 리본(마음 전하기) + 실물 리본 수거/보관. Supabase SQL Editor 에서 한 번 실행.
create table if not exists ribbon_boards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  event_type text not null,
  host_name text not null,
  host_phone text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists idx_ribbon_boards_phone on ribbon_boards(host_phone);
create table if not exists ribbon_messages (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references ribbon_boards(id) on delete cascade,
  sender_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ribbon_messages_board on ribbon_messages(board_id, created_at);
alter table ribbon_boards enable row level security;
alter table ribbon_messages enable row level security;
-- 정책 없음: 서버(서비스 롤)만 접근

alter table pickup_orders add column if not exists ribbon_count int;
alter table pickup_orders add column if not exists ribbon_photo_paths text[] not null default '{}';
alter table estimate_requests add column if not exists ribbon_wanted boolean not null default true;
