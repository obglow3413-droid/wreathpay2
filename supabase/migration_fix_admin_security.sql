-- =========================================================
-- [중요/보안] 관리자 전용 데이터 접근 권한을 admin_users 등록자로 한정
--
-- 배경: 기존 정책들은 "authenticated(로그인한 사람) = 관리자"라고 가정하고
-- 만들어졌습니다. 하지만 이제 일반 고객도 카카오/구글로 로그인(회원가입)할 수
-- 있게 되면서, 로그인한 일반 회원도 "authenticated" 역할을 갖게 되어
-- 다른 고객의 연락처·신청내역·정산정보까지 조회 가능한 상태였습니다.
--
-- 이 마이그레이션은 admin_users 테이블에 등록된 사람만 "관리자 권한"을
-- 갖도록 모든 관련 정책을 교체합니다.
-- 아직 만들지 않은 테이블(예: driver_applications 등)은 자동으로 건너뜁니다.
-- (SQL Editor에서 전체 실행하세요)
-- =========================================================

-- 이 계정이 admin_users에 등록된 관리자인지 확인하는 함수.
-- security definer로 만들어 RLS와 무관하게 admin_users를 조회할 수 있게 합니다.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- 아래 각 테이블에 대해: 테이블이 실제로 존재할 때만 정책을 교체합니다.
do $$
declare
  target_tables text[] := array[
    'customers',
    'estimate_requests',
    'estimate_images',
    'pickup_orders',
    'payouts',
    'drivers',
    'wreath_grades',
    'grade_prices',
    'admin_users',
    'system_settings',
    'case_gallery',
    'driver_applications',
    'partner_applications'
  ];
  t text;
begin
  foreach t in array target_tables loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists %I on %I', 'admin full access ' || t, t);
      execute format(
        'create policy %I on %I for all to authenticated using (is_admin()) with check (is_admin())',
        'admin full access ' || t, t
      );
    end if;
  end loop;
end $$;
