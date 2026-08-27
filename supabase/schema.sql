-- =========================================================
-- 화환페이백(WreathPay) MVP 데이터베이스 스키마
-- =========================================================
-- 관계 요약
-- customers 1—N estimate_requests
-- estimate_requests 1—N estimate_images
-- estimate_requests 1—1 pickup_orders
-- estimate_requests 1—N payouts
-- wreath_grades 1—N grade_prices (등급별 단가 변경 이력)
-- drivers 1—N pickup_orders
-- admin_users : Supabase Auth user와 1:1 매핑되는 프로필 테이블
-- system_settings : 수량정책/대량기준 등 운영 설정 (key-value)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- customers: 회원가입 없이 견적 신청 시점에 생성되는 고객 정보
-- ---------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
create index idx_customers_phone on customers(phone);

-- ---------------------------------------------------------
-- estimate_requests: 견적 신청 (핵심 테이블)
-- ---------------------------------------------------------
create type event_type as enum ('funeral', 'wedding', 'opening', 'corporate', 'etc');

create type quantity_range as enum ('1-4', '5-9', '10-29', '30-49', '50+');

create type request_status as enum (
  'received',       -- 접수
  'estimating',      -- 견적중
  'estimated',       -- 견적완료
  'customer_approved', -- 고객승인
  'dispatch_pending',  -- 배차대기
  'dispatched',        -- 배차완료
  'collecting',        -- 수거중
  'collected',         -- 수거완료
  'settled',           -- 정산완료
  'cancelled'          -- 취소
);

create table estimate_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text not null unique, -- 사용자에게 노출되는 신청번호 (예: WP-20260824-0001)
  customer_id uuid not null references customers(id) on delete cascade,

  event_type event_type not null,
  quantity_range quantity_range not null,

  -- 수거장소
  place_name text not null,
  address text not null,
  address_detail text,
  -- 카카오 주소 API 연동 대비 필드
  address_lat numeric,
  address_lng numeric,
  address_road_code text,

  -- 수거 희망시간
  pickup_date date not null,
  pickup_time_slot text not null, -- 오전/오후/저녁/시간협의

  -- 고객 요청사항
  customer_note text,

  -- 동의
  agreed_disposal_authority boolean not null default false,
  agreed_site_restriction boolean not null default false,
  agreed_final_price_variation boolean not null default false,
  agreed_privacy boolean not null default false,

  -- 관리자 입력값 (등급별 수량)
  grade_premium_count int default 0,
  grade_a_count int default 0,
  grade_b_count int default 0,
  grade_c_count int default 0,

  -- 자동계산 결과 (캐시, 실제 계산은 애플리케이션/뷰에서 수행)
  estimated_sale_amount numeric default 0,   -- 예상 매각금액
  customer_payback_amount numeric default 0, -- 고객 페이백
  estimated_logistics_cost numeric default 0, -- 물류비
  estimated_other_cost numeric default 0,      -- 기타 직접비용
  estimated_contribution_margin numeric default 0, -- 예상 공헌이익

  status request_status not null default 'received',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_estimate_requests_status on estimate_requests(status);
create index idx_estimate_requests_created_at on estimate_requests(created_at);
create index idx_estimate_requests_event_type on estimate_requests(event_type);

-- ---------------------------------------------------------
-- estimate_images: 견적 신청 시 업로드된 사진 (최대 5장)
-- ---------------------------------------------------------
create table estimate_images (
  id uuid primary key default gen_random_uuid(),
  estimate_request_id uuid not null references estimate_requests(id) on delete cascade,
  storage_path text not null, -- Supabase Storage 경로
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_estimate_images_request on estimate_images(estimate_request_id);

-- ---------------------------------------------------------
-- drivers: 배차 기사 (MVP: 관리자가 수기 등록)
-- ---------------------------------------------------------
create table drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  vehicle_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- pickup_orders: 배차/수거 정보 (estimate_request 1:1)
-- ---------------------------------------------------------
create table pickup_orders (
  id uuid primary key default gen_random_uuid(),
  estimate_request_id uuid not null unique references estimate_requests(id) on delete cascade,
  driver_id uuid references drivers(id),
  scheduled_pickup_at timestamptz,
  actual_quantity int,
  completion_photo_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- wreath_grades: 화환 등급 마스터 (Premium/A/B/C)
-- ---------------------------------------------------------
create table wreath_grades (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'premium' | 'a' | 'b' | 'c'
  label text not null,       -- 표시용 이름
  sort_order int not null default 0
);

-- ---------------------------------------------------------
-- grade_prices: 등급별 단가 (변경 이력 유지, 최신값 = is_current)
-- ---------------------------------------------------------
create table grade_prices (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references wreath_grades(id) on delete cascade,
  unit_price numeric not null,
  is_current boolean not null default true,
  effective_from timestamptz not null default now(),
  created_by uuid, -- admin_users.id
  created_at timestamptz not null default now()
);
create index idx_grade_prices_current on grade_prices(grade_id, is_current);

-- ---------------------------------------------------------
-- payouts: 고객 페이백 지급 관리
-- ---------------------------------------------------------
create type payout_status as enum ('pending', 'partial', 'completed');

create table payouts (
  id uuid primary key default gen_random_uuid(),
  estimate_request_id uuid not null references estimate_requests(id) on delete cascade,
  total_payback_amount numeric not null default 0,
  reserved_advance_amount numeric not null default 0, -- 예약 선지급
  balance_after_pickup numeric not null default 0,     -- 수거 후 잔금
  status payout_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payouts_request on payouts(estimate_request_id);

-- ---------------------------------------------------------
-- admin_users: Supabase Auth user와 매핑되는 관리자 프로필
-- ---------------------------------------------------------
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'admin', -- admin | super_admin
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- system_settings: 수량정책/대량기준 등 key-value 운영 설정
-- ---------------------------------------------------------
create table system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- 기본 데이터 시드 --------------------------------------------------

insert into wreath_grades (code, label, sort_order) values
  ('premium', 'Premium', 1),
  ('a', 'A급', 2),
  ('b', 'B급', 3),
  ('c', 'C급', 4);

insert into grade_prices (grade_id, unit_price)
  select id, case code
    when 'premium' then 80000
    when 'a' then 50000
    when 'b' then 30000
    when 'c' then 10000
  end
  from wreath_grades;

insert into system_settings (key, value, description) values
  ('quantity_policy', '{
    "1-4": {"label": "공동수거 또는 일정 협의", "priority": "normal"},
    "5-9": {"label": "일반 방문수거 검토", "priority": "normal"},
    "10-29": {"label": "우선 배차 가능", "priority": "high"},
    "30-49": {"label": "대량 화환 별도견적", "priority": "bulk"},
    "50+": {"label": "대량 화환 별도견적", "priority": "bulk"}
  }', '수량별 수거 정책 (관리자 화면에서 수정 가능)'),
  ('logistics_cost_default', '{"per_request": 30000}', '건당 기본 예상 물류비'),
  ('other_cost_default', '{"per_request": 5000}', '건당 기본 기타 직접비용');

-- ---------------------------------------------------------
-- Row Level Security: 관리자만 접근 가능 (public에서는 anon insert만 허용)
-- ---------------------------------------------------------
alter table customers enable row level security;
alter table estimate_requests enable row level security;
alter table estimate_images enable row level security;
alter table pickup_orders enable row level security;
alter table payouts enable row level security;
alter table drivers enable row level security;
alter table wreath_grades enable row level security;
alter table grade_prices enable row level security;
alter table admin_users enable row level security;
alter table system_settings enable row level security;

-- 익명 사용자(anon)는 견적신청 관련 테이블에 INSERT만 가능
create policy "anon can insert customers" on customers for insert to anon with check (true);
create policy "anon can insert estimate_requests" on estimate_requests for insert to anon with check (true);
create policy "anon can insert estimate_images" on estimate_images for insert to anon with check (true);

-- 인증된 관리자(authenticated)는 전체 접근 가능
create policy "admin full access customers" on customers for all to authenticated using (true) with check (true);
create policy "admin full access estimate_requests" on estimate_requests for all to authenticated using (true) with check (true);
create policy "admin full access estimate_images" on estimate_images for all to authenticated using (true) with check (true);
create policy "admin full access pickup_orders" on pickup_orders for all to authenticated using (true) with check (true);
create policy "admin full access payouts" on payouts for all to authenticated using (true) with check (true);
create policy "admin full access drivers" on drivers for all to authenticated using (true) with check (true);
create policy "admin full access wreath_grades" on wreath_grades for all to authenticated using (true) with check (true);
create policy "admin full access grade_prices" on grade_prices for all to authenticated using (true) with check (true);
create policy "admin full access admin_users" on admin_users for all to authenticated using (true) with check (true);
create policy "admin full access system_settings" on system_settings for all to authenticated using (true) with check (true);

-- 공개 읽기: 등급/가격/설정은 견적 화면 계산 참고용으로 anon도 read 가능하게 열 수 있음(선택)
create policy "anon can read grade_prices" on grade_prices for select to anon using (true);
create policy "anon can read wreath_grades" on wreath_grades for select to anon using (true);
create policy "anon can read system_settings" on system_settings for select to anon using (true);

-- ---------------------------------------------------------
-- Storage bucket (Supabase Storage) - 콘솔 또는 별도 마이그레이션에서 생성
-- bucket name: 'estimate-photos' (public read = false, signed url 사용 권장)
-- ---------------------------------------------------------
