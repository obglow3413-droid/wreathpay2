-- 도착 예정 시각, 순환(재사용·폐기) 결과, 고객 수량 확인, 제휴(꽃집 등) 추천 코드
alter table pickup_orders add column if not exists eta_at timestamptz;
alter table pickup_orders add column if not exists reuse_count int;
alter table pickup_orders add column if not exists discard_count int;
alter table pickup_orders add column if not exists customer_confirmed_at timestamptz;

create table if not exists ref_partners (
  code text primary key check (code ~ '^[a-z0-9]{5,12}$'),
  name text not null,
  kind text,
  created_at timestamptz not null default now()
);
alter table ref_partners enable row level security;
