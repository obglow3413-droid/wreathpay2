-- =========================================================
-- 업체/파트너 등록 테이블 추가 마이그레이션
-- (SQL Editor에서 이 파일 내용만 추가로 실행하세요)
-- =========================================================

create type partner_application_status as enum ('pending', 'approved', 'rejected');

create table if not exists partner_applications (
  id uuid primary key default gen_random_uuid(),
  category text not null,              -- 예: 화환 수거대행 / 화환 재판매·도매 / 배송·물류 / 기타
  company_name text not null,
  applicant_name text not null,
  email text,
  phone text not null,
  website text,
  service_regions text[] not null default '{}',  -- 체크된 서비스 지역 목록
  memo text,
  status partner_application_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table partner_applications enable row level security;

-- 익명 사용자(업체)는 등록(insert)만 가능
create policy "anon can insert partner_applications" on partner_applications
  for insert to anon with check (true);

-- 관리자는 전체 접근 가능
create policy "admin full access partner_applications" on partner_applications
  for all to authenticated using (true) with check (true);
