-- 수거 가능 장소(장례식장·웨딩홀) 안내용 목록. 읽기는 서버(서비스 롤)에서만 한다.
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('funeral','wedding')),
  name text not null,
  sido text not null,
  sigungu text not null,
  address text not null,
  rooms int,
  parking int,
  operator_type text,
  is_partner boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists places_kind_region_idx on places (kind, sido, sigungu);
alter table places enable row level security;
