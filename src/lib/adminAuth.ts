import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * 관리자 판별. 로그인만으로는 관리자가 아니다(일반 회원가입이 열려 있음).
 * admin_users 테이블에 등록된 계정만 관리자이며, 서비스 롤로 직접 확인한다.
 */
export async function isAdminUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const svc = await createServiceRoleClient();
    const { data } = await svc.from("admin_users").select("id").eq("id", userId).maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

/** 현재 세션이 관리자면 사용자 정보를, 아니면 null 을 돌려준다. */
export async function getAdminUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user || !(await isAdminUser(user.id))) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}

/** 관리자 행위 감사 로그(계좌 조회·정산 처리 등). 실패해도 본 작업은 막지 않는다. */
export async function auditLog(adminId: string, action: string, targetId?: string | null, detail?: Record<string, unknown>) {
  try {
    const svc = await createServiceRoleClient();
    await svc.from("admin_audit_log").insert({ admin_id: adminId, action, target_id: targetId ?? null, detail: detail ?? null });
  } catch (e) {
    console.error("[audit]", e);
  }
}
