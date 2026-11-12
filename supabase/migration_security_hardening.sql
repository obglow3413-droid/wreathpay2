-- 보안 강화 (2026-11-12)
-- 1) 익명 키로 DB에 직접 INSERT 하던 경로 차단: 모든 접수는 서버 API(서비스 롤)로만 들어온다.
--    (이전에는 공개 anon 키만으로 status·금액을 임의로 넣은 신청/고객 행을 만들 수 있었다)
drop policy if exists "anon can insert customers" on customers;
drop policy if exists "anon can insert estimate_requests" on estimate_requests;
drop policy if exists "anon can insert estimate_images" on estimate_images;
drop policy if exists "anon can insert partner_applications" on partner_applications;
drop policy if exists "anon can insert plant_collection_requests" on plant_collection_requests;
drop policy if exists "anon can insert plant_collection_images" on plant_collection_images;

-- 2) is_admin(): 로그인 사용자만 호출 가능(익명 호출 차단)
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 3) 관리자 감사 로그(계좌 열람·정산 처리 등). 서비스 롤 전용.
create table if not exists admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null,
  action text not null,
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table admin_audit_log enable row level security;

-- 4) 서버리스 인스턴스 간에 공유되는 요청 제한 카운터. 서비스 롤 전용.
create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (key, window_start)
);
alter table rate_limits enable row level security;

create or replace function public.rate_hit(p_key text, p_window_seconds int)
returns int
language plpgsql
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into rate_limits(key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into n;
  return n;
end;
$$;
revoke execute on function public.rate_hit(text, int) from public, anon, authenticated;
grant execute on function public.rate_hit(text, int) to service_role;

-- 5) 휴대폰 본인확인(문자 인증번호). 코드는 해시로만 저장. 서비스 롤 전용.
create table if not exists otp_codes (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table otp_codes enable row level security;
