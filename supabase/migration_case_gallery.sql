-- =========================================================
-- 이용사례 갤러리 테이블 추가 마이그레이션
-- (기존 schema.sql을 이미 실행했다면, 이 파일만 SQL Editor에서 추가로 실행하세요)
-- =========================================================

create table if not exists case_gallery (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,   -- Supabase Storage 내 경로 (estimate-photos 버킷의 gallery/ 폴더 사용)
  label text not null,          -- 예: "장례식 근조화환"
  meta text,                    -- 예: "5개 수거"
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table case_gallery enable row level security;

-- 인증된 관리자만 등록/수정/삭제 가능
create policy "admin full access case_gallery" on case_gallery
  for all to authenticated using (true) with check (true);

-- 홈페이지(공개)에서는 읽기만 가능
create policy "anon can read case_gallery" on case_gallery
  for select to anon using (true);
