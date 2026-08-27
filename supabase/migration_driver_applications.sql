-- =========================================================
-- 기사(드라이버) 지원서 테이블 추가 마이그레이션
-- (SQL Editor에서 이 파일 내용만 추가로 실행하세요)
-- =========================================================

create type driver_application_status as enum ('pending', 'approved', 'rejected');

create table if not exists driver_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  region text,               -- 활동 희망지역
  vehicle_type text,         -- 예: 다마스/라보/1톤트럭/개인승용차
  vehicle_number text,
  message text,              -- 하고 싶은 말 (선택)
  status driver_application_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table driver_applications enable row level security;

-- 익명 사용자(지원자)는 지원서 등록(insert)만 가능
create policy "anon can insert driver_applications" on driver_applications
  for insert to anon with check (true);

-- 관리자는 전체 접근 가능
create policy "admin full access driver_applications" on driver_applications
  for all to authenticated using (true) with check (true);
