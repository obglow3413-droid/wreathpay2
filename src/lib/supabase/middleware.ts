import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin 경로 보호를 위한 세션 갱신 로직.
 * 로그인하지 않은 사용자가 /admin/* 에 접근하면 /admin/login 으로 리다이렉트합니다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/admin/login";
  // 비밀번호 재설정은 이메일 링크로 막 들어온 상태(세션이 브라우저에서 막 생성되는 중)라
  // 서버가 아직 로그인 상태를 못 볼 수 있어, 로그인 페이지처럼 예외로 둡니다.
  const isResetPasswordPage = pathname === "/admin/reset-password";

  if (pathname.startsWith("/admin") && !isLoginPage && !isResetPasswordPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
