-- =========================================================
-- 꽃페이 웨딩 파트너스 (웨딩플래너 제휴 프로그램)
-- - wedding_partners      : 파트너(웨딩플래너) 계정·승인 상태·추천 코드·정산 계좌(암호화)
-- - wp_referrals          : 파트너 추천으로 들어온 접수(1접수 1추천) + 부정 추천 표시 + 소개비 확정
-- - wp_withdrawals        : 파트너 수익금 출금 신청 → 관리자 승인 → 지급 완료
-- - estimate_requests 확장 : 실제 판매금액·차량비·물류비·판매 정산 완료 시각 (건별 실제 수익 분석)
-- - system_settings       : wp_commission_tiers (소개비 단가 구간, 관리자 화면에서 수정)
-- 모든 테이블은 RLS 를 켜고 관리자(is_admin())만 직접 접근. 파트너 화면은 서버(서비스 롤)에서 본인 것만 조회한다.
-- =========================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'wp_partner_status') then
    create type wp_partner_status as enum ('pending', 'approved', 'rejected', 'suspended');
  end if;
end $$;

create table if not exists wedding_partners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  code text not null unique check (code ~ '^[a-z0-9]{5,12}$'),
  name text not null,
  company text,
  phone text not null,
  email text not null,
  bank_name text,
  account_holder text,
  account_enc text,
  account_last4 text,
  agreed_terms_at timestamptz,
  agreed_company_policy_at timestamptz,
  status wp_partner_status not null default 'pending',
  admin_memo text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wedding_partners_status on wedding_partners(status);
create index if not exists idx_wedding_partners_phone on wedding_partners(phone);

create table if not exists wp_referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references wedding_partners(id) on delete restrict,
  estimate_request_id uuid not null unique references estimate_requests(id) on delete cascade,
  consent_share boolean not null default false,          -- 고객이 파트너에게 진행상황 공유에 동의했는지
  flags text[] not null default '{}',                    -- self_referral | duplicate_phone | duplicate_event
  wreath_count int,                                      -- 확정 시점 수거 수량(관리자 수정 가능)
  commission_amount int not null default 0,              -- 확정 소개비(원)
  commission_status text not null default 'pending' check (commission_status in ('pending', 'confirmed', 'void')),
  confirmed_at timestamptz,
  confirmed_by uuid,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wp_referrals_partner on wp_referrals(partner_id);
create index if not exists idx_wp_referrals_status on wp_referrals(commission_status);

create table if not exists wp_withdrawals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references wedding_partners(id) on delete restrict,
  amount int not null check (amount > 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected')),
  bank_name text,
  account_holder text,
  account_enc text,
  account_last4 text,
  admin_memo text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  processed_by uuid
);
create index if not exists idx_wp_withdrawals_partner on wp_withdrawals(partner_id);
create index if not exists idx_wp_withdrawals_status on wp_withdrawals(status);

-- 건별 실제 수익 분석용 실제값
alter table estimate_requests add column if not exists actual_sale_amount numeric;      -- 화환 실제 판매금액
alter table estimate_requests add column if not exists actual_vehicle_cost numeric;     -- 차량비(기사 운임 등)
alter table estimate_requests add column if not exists actual_logistics_cost numeric;   -- 물류비(보관·운반 기타)
alter table estimate_requests add column if not exists sale_settled_at timestamptz;     -- 검수·판매 정산 완료 시각(소개비 확정 조건)

alter table wedding_partners enable row level security;
alter table wp_referrals enable row level security;
alter table wp_withdrawals enable row level security;

drop policy if exists "admin full access wedding_partners" on wedding_partners;
create policy "admin full access wedding_partners" on wedding_partners
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "admin full access wp_referrals" on wp_referrals;
create policy "admin full access wp_referrals" on wp_referrals
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "admin full access wp_withdrawals" on wp_withdrawals;
create policy "admin full access wp_withdrawals" on wp_withdrawals
  for all to authenticated using (is_admin()) with check (is_admin());

insert into system_settings (key, value, description) values
  ('wp_commission_tiers',
   '{"tiers": [{"min": 30, "amount": 30000}, {"min": 50, "amount": 50000}, {"min": 100, "amount": 100000}], "min_withdrawal": 10000}',
   '웨딩 파트너스 소개비 단가(수거 수량 구간별) · 최소 출금액')
on conflict (key) do nothing;
