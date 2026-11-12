import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { suggestPayback } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * 관리자: 아직 금액이 없는 접수 건(접수·견적 중)에 수량 기준 권장 금액(중간값)을 채우고 '견적 완료'로 바꾼다.
 * 지급 처리가 아니라 견적 단계까지만 진행한다. 50개 이상(별도 견적)·1~4개(무료회수)는 건드리지 않는다.
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  try {
    const svc = await createServiceRoleClient();
    const { data: rows, error } = await svc
      .from("estimate_requests")
      .select("id, event_type, quantity_range, customer_payback_amount, status")
      .in("status", ["received", "estimating"])
      .limit(500);
    if (error) throw error;
    let updated = 0;
    let skipped = 0;
    for (const r of rows ?? []) {
      if (Number(r.customer_payback_amount) > 0) continue;
      const s = suggestPayback(r.event_type, r.quantity_range);
      if (!s || s.mid <= 0) {
        skipped += 1;
        continue;
      }
      const { error: upErr } = await svc
        .from("estimate_requests")
        .update({ customer_payback_amount: s.mid, status: "estimated", updated_at: new Date().toISOString() })
        .eq("id", r.id);
      if (!upErr) updated += 1;
    }
    await auditLog(admin.id, "request.auto_estimate", null, { updated, skipped });
    return NextResponse.json({ ok: true, updated, skipped });
  } catch (e) {
    console.error("[auto-estimate]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
