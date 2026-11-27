import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";

export const runtime = "nodejs";

const num = (v: unknown) => {
  if (v === null || v === "" || v === undefined) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? n : NaN;
};

/** 관리자: 건별 실제 판매금액·차량비·물류비 입력, 판매 정산 완료 처리 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, col] of [
    ["actualSale", "actual_sale_amount"],
    ["vehicleCost", "actual_vehicle_cost"],
    ["logisticsCost", "actual_logistics_cost"],
  ] as const) {
    if (k in b) {
      const v = num(b[k]);
      if (Number.isNaN(v)) return NextResponse.json({ error: "금액을 확인해 주세요." }, { status: 400 });
      patch[col] = v;
    }
  }
  if ("saleSettled" in b) patch.sale_settled_at = b.saleSettled ? new Date().toISOString() : null;
  const svc = await createServiceRoleClient();
  if (b.saleSettled) {
    const { data } = await svc.from("estimate_requests").select("status, actual_sale_amount").eq("id", id).single();
    if (!data || !["collected", "settled"].includes(data.status)) return NextResponse.json({ error: "수거 완료된 건만 판매 정산 완료로 바꿀 수 있어요." }, { status: 400 });
    if ((patch.actual_sale_amount ?? data.actual_sale_amount) == null) return NextResponse.json({ error: "실제 판매금액을 먼저 입력해 주세요." }, { status: 400 });
  }
  const { error } = await svc.from("estimate_requests").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  await auditLog(admin.id, "profit.update", id, patch);
  return NextResponse.json({ ok: true });
}
