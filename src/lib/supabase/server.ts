import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트 / Route Handler에서 사용하는 Supabase 클라이언트.
 * 관리자 인증 세션(Supabase Auth)을 쿠키 기반으로 관리합니다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시 (미들웨어가 세션을 갱신함)
          }
        },
      },
    }
  );
}

/**
 * 관리자 전용 작업(RLS 우회가 필요한 집계 등)에 사용하는 서비스 롤 클라이언트.
 * SUPABASE_SERVICE_ROLE_KEY는 서버에서만 사용하고 절대 클라이언트에 노출하지 않습니다.
 */
export async function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } }
  );
}
