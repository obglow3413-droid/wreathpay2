// 인스턴스 단위 단순 요청 제한(best-effort). 서버리스 특성상 완전한 차단은 아니고 남용을 늦추는 용도.
const buckets = new Map<string, number[]>();

export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length > max;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * 인스턴스 간에 공유되는 요청 제한(DB 카운터). 민감한 경로(조회·계좌·인증번호)에 쓴다.
 * DB 오류 시에는 인스턴스 단위 제한만 적용한다(서비스 중단 방지).
 */
export async function rateLimitedShared(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (rateLimited(key, max, windowSeconds * 1000)) return true;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    const svc = await createServiceRoleClient();
    const { data, error } = await svc.rpc("rate_hit", { p_key: key, p_window_seconds: windowSeconds });
    if (error) return false;
    return typeof data === "number" && data > max;
  } catch {
    return false;
  }
}
