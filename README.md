# 꽃값 (WreathPay) — MVP

받은 화환을 사진으로 등록하면 예상 매입가를 안내하고, 방문수거 후 현금으로 페이백하는
화환 현금매입 플랫폼 MVP입니다.

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Database / Storage / Auth)
- Vercel 배포 기준

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # Supabase 값 입력
npm run dev
```

> `.env.local`을 채우지 않아도 실행은 됩니다. 이 경우 견적신청은 **Mock 모드**로 동작해
> 실제 DB 저장 없이 신청번호만 발급되고, 관리자 화면은 "Supabase 연결 필요" 안내와 함께
> 빈 상태로 표시됩니다. 실제 데이터 흐름을 확인하려면 아래 Supabase 설정을 진행하세요.

## Supabase 설정

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체 실행 (테이블 + RLS 정책 + 시드데이터 생성)
3. Storage에서 `estimate-photos` 버킷 생성 (Public 여부는 선택 — 코드에서는 Signed URL을 사용하므로 Private 권장)
4. Authentication에서 관리자 계정을 이메일/비밀번호로 직접 생성한 뒤,
   `admin_users` 테이블에 해당 `auth.users.id`로 프로필 행을 추가
5. 프로젝트 설정 > API 메뉴에서 URL, anon key, service_role key를 `.env.local`에 입력

## 폴더 구조

```
src/
  app/
    page.tsx                     메인 랜딩
    estimate/                    견적신청 플로우 (Step 1~7) + 완료 페이지
    landing/[type]/               광고 랜딩페이지 (funeral / wedding / opening / business)
    admin/
      login/                     관리자 로그인
      (dashboard)/               인증 필요 영역 (대시보드/신청목록/상세/설정)
    api/
      estimate/                  견적신청 접수 API (익명)
      admin/requests/[id]/       관리자 신청 상세 업데이트 API
      admin/settings/            등급단가·수량정책 업데이트 API
  components/
    home/, estimate/, admin/, layout/, ui/
  lib/
    types.ts                     공통 타입 및 라벨
    pricing.ts                   공헌이익 계산 로직, 신청번호 생성
    landingContent.ts            광고 랜딩페이지 카피
    supabase/                    client / server / middleware(proxy) / config
supabase/
  schema.sql                     전체 DB 스키마 + RLS + 시드데이터
```

## 핵심 사용자 플로우

광고 유입 → `/estimate` 진입 → 사진 업로드 → 예상 수량 → 장소 → 수거일시 → 연락처 → 동의
→ 제출 (`/api/estimate`) → `/estimate/complete`. **회원가입 없이 완료**되며, 선택형 UI 위주로
구성해 모바일에서 최대한 빠르게 끝나도록 설계했습니다.

## 관리자 플로우

`/admin/login` 로그인(Supabase Auth) → `/admin` 대시보드(오늘 지표) → `/admin/requests`
신청목록(날짜/지역/행사종류/상태 필터) → `/admin/requests/[id]` 상세에서 등급별 수량을
입력하면 등급 단가 기준으로 예상 매각금액·고객 페이백·공헌이익이 자동 계산되고, 배차 정보와
페이백 지급 상태를 함께 관리할 수 있습니다. `/admin/settings`에서 등급별 단가와 수량별
수거 정책을 조정할 수 있습니다.

## MVP에서 제외된 기능 (추후 확장 가능한 구조로 설계)

- 기사 전용 앱 / 구매업체 전용 앱
- 화환 B2B 경매, AI 이미지 자동등급판정
- 실제 계좌이체 API 연동 (현재는 상태값만 관리)
- 전국 자동배차 시스템, 자체 채팅 시스템
- 카카오 주소 API, 카카오톡 상담 연동 (현재 Placeholder)
