import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * LOOOUK OS(루우크 통합 ERP)용 읽기 전용 요약.
 *  - 호출자는 LOOOUK OS 로그인 토큰을 Authorization: Bearer 로 보낸다.
 *  - 이 서버가 LOOOUK OS 의 Supabase 에 토큰을 확인하고, 대표(owner) 권한이 있는 계정에만 응답한다.
 *  - 집계와 최근 접수 목록만 내려준다. 이름·연락처·계좌·상세 주소는 포함하지 않으며, 어떤 데이터도 바꾸지 않는다.
 * 아래 두 값은 LOOOUK OS 의 공개(publishable) 값이라 코드에 둬도 된다. 환경변수로 바꿀 수 있다.
 */
const OS_URL = process.env.LOOOUK_OS_SUPABASE_URL || "https://xgasswghwcgnvfalzhaa.supabase.co";
const OS_KEY = process.env.LOOOUK_OS_SUPABASE_KEY || "sb_publishable_mlQYjHCKpsPPkuQeoLfUQA_MuyNc8pv";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "600",
};
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

async function isOsOwner(token: string): Promise<boolean> {
  try {
    const h = { apikey: OS_KEY, Authorization: `Bearer ${token}` };
    const u = await fetch(`${OS_URL}/auth/v1/user`, { headers: h, cache: "no-store" });
    if (!u.ok) return false;
    const user = (await u.json()) as { id?: string };
    if (!user.id) return false;
    // 본인 권한 행만 조회(LOOOUK OS 의 RLS 가 다른 사람 행을 막는다). user_id 로 한 번 더 좁힌다.
    const a = await fetch(`${OS_URL}/rest/v1/user_brand_access?select=role&user_id=eq.${user.id}`, { headers: h, cache: "no-store" });
    if (!a.ok) return false;
    const rows = (await a.json()) as { role?: string }[];
    return Array.isArray(rows) && rows.some((r) => r.role === "owner");
  } catch {
    return false;
  }
}

const DONE = ["collected", "settled"];

export async function GET(req: Request) {
  if (await rateLimitedShared(`erp:${clientIp(req)}`, 60, 600)) return json({ error: "요청이 너무 잦아요." }, 429);
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token || token.length > 4096 || !(await isOsOwner(token))) return json({ error: "LOOOUK OS 대표 권한이 필요해요." }, 401);
  if (!isServiceRoleConfigured()) return json({ error: "준비 중이에요." }, 503);

  try {
    const svc = await createServiceRoleClient();
    const since = new Date(Date.now() - 56 * 86400_000).toISOString();
    const [{ data: recent }, { data: settledAll }, { data: openAll }] = await Promise.all([
      svc
        .from("estimate_requests")
        .select("request_no, created_at, updated_at, event_type, quantity_range, status, address, customer_payback_amount, source_ref")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(3000),
      svc.from("estimate_requests").select("customer_payback_amount, updated_at").eq("status", "settled").limit(10000),
      svc.from("estimate_requests").select("status, customer_payback_amount").not("status", "in", "(settled,cancelled)").limit(10000),
    ]);
    const rows = recent ?? [];
    const now = Date.now();
    const within = (iso: string, days: number) => now - new Date(iso).getTime() <= days * 86400_000;
    const monthStart = new Date(new Date(now + 9 * 3600_000).toISOString().slice(0, 7) + "-01T00:00:00+09:00").getTime();

    const statusCounts: Record<string, number> = {};
    for (const r of openAll ?? []) statusCounts[r.status as string] = (statusCounts[r.status as string] ?? 0) + 1;

    const weeks = Array.from({ length: 8 }, (_, i) => {
      const end = now - (7 - i) * 7 * 86400_000;
      return { label: i === 7 ? "이번 주" : `${7 - i}주 전`, start: end - 7 * 86400_000, end, total: 0, done: 0, settledAmount: 0 };
    });
    for (const r of rows) {
      const t = new Date(r.created_at as string).getTime();
      const w = weeks.find((x) => t > x.start && t <= x.end);
      if (!w) continue;
      w.total += 1;
      if (DONE.includes(r.status as string)) w.done += 1;
      if (r.status === "settled") w.settledAmount += Number(r.customer_payback_amount) || 0;
    }

    const settled = settledAll ?? [];
    const sum = (xs: { customer_payback_amount: unknown }[]) => xs.reduce((a, x) => a + (Number(x.customer_payback_amount) || 0), 0);

    return json({
      generatedAt: new Date().toISOString(),
      kpis: {
        today: rows.filter((r) => within(r.created_at as string, 1)).length,
        week: rows.filter((r) => within(r.created_at as string, 7)).length,
        month: rows.filter((r) => within(r.created_at as string, 30)).length,
        inProgress: (openAll ?? []).length,
        pendingPayback: sum(openAll ?? []),
        settledThisMonth: sum(settled.filter((s) => new Date(s.updated_at as string).getTime() >= monthStart)),
        settledThisMonthCount: settled.filter((s) => new Date(s.updated_at as string).getTime() >= monthStart).length,
        settledTotal: sum(settled),
        settledTotalCount: settled.length,
      },
      statusCounts,
      weeks: weeks.map(({ label, total, done, settledAmount }) => ({ label, total, done, settledAmount })),
      recent: rows.slice(0, 40).map((r) => ({
        requestNo: r.request_no,
        createdAt: r.created_at,
        eventType: r.event_type,
        quantityRange: r.quantity_range,
        status: r.status,
        region: String(r.address ?? "").trim().split(/\s+/).slice(0, 2).join(" "),
        payback: Number(r.customer_payback_amount) || 0,
        source: r.source_ref ?? null,
      })),
    });
  } catch (e) {
    console.error("[erp summary]", e);
    return json({ error: "집계 중 문제가 생겼어요." }, 500);
  }
}
