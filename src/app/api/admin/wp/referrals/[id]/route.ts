import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { commissionFor, isCommissionEligible, loadWpSettings } from "@/lib/weddingPartners";

export const runtime = "nodejs";

/**
 * 관리자: 추천 건 소개비 처리
 * - confirm: 수거 완료 + 판매 정산 완료 건만. 수량(기본=실제 수거 수량)으로 단가 구간 적용해 금액 확정
 * - void: 부정·중복 추천 등으로 무효(사유 필수)
 * - reset: 확정/무효를 되돌림(출금 신청에 이미 쓰였으면 불가 — 잔액이 음수가 되지 않게)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { action?: string; wreathCount?: unknown; reason?: string };
  const svc = await createServiceRoleClient();

  const { data: ref } = await svc
    .from("wp_referrals")
    .select("id, partner_id, commission_status, commission_amount, estimate_requests(status, sale_settled_at, pickup_orders(actual_quantity))")
    .eq("id", id)
    .single();
  if (!ref) return NextResponse.json({ error: "추천 건을 찾지 못했어요." }, { status: 404 });
  const er = (Array.isArray(ref.estimate_requests) ? ref.estimate_requests[0] : ref.estimate_requests) as
    | { status: string; sale_settled_at: string | null; pickup_orders: { actual_quantity: number | null }[] | { actual_quantity: number | null } | null }
    | null;
  const po = er ? (Array.isArray(er.pickup_orders) ? er.pickup_orders[0] : er.pickup_orders) : null;
  const now = new Date().toISOString();

  if (b.action === "confirm") {
    if (!er || !isCommissionEligible(er.status, er.sale_settled_at)) {
      return NextResponse.json({ error: "수거 완료와 판매 정산 완료가 모두 끝난 건만 확정할 수 있어요." }, { status: 400 });
    }
    const raw = b.wreathCount ?? po?.actual_quantity;
    const count = Math.round(Number(raw));
    if (!Number.isFinite(count) || count < 0 || count > 5000) return NextResponse.json({ error: "수거 수량을 입력해 주세요." }, { status: 400 });
    const { tiers } = await loadWpSettings(svc);
    const amount = commissionFor(count, tiers);
    const { error } = await svc
      .from("wp_referrals")
      .update({ commission_status: "confirmed", wreath_count: count, commission_amount: amount, confirmed_at: now, confirmed_by: admin.id, void_reason: null, updated_at: now })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
    await auditLog(admin.id, "wp_referral.confirm", id, { count, amount });
    return NextResponse.json({ ok: true, amount });
  }

  if (b.action === "void") {
    const reason = String(b.reason ?? "").trim();
    if (reason.length < 2) return NextResponse.json({ error: "무효 사유를 적어 주세요." }, { status: 400 });
    if (ref.commission_status === "confirmed" && !(await canUndo(svc, ref.partner_id, ref.commission_amount))) {
      return NextResponse.json({ error: "이미 출금 신청·지급에 포함된 소개비라 무효로 바꿀 수 없어요." }, { status: 400 });
    }
    const { error } = await svc
      .from("wp_referrals")
      .update({ commission_status: "void", commission_amount: 0, void_reason: reason.slice(0, 300), updated_at: now })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
    await auditLog(admin.id, "wp_referral.void", id, { reason });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "reset") {
    if (ref.commission_status === "confirmed" && !(await canUndo(svc, ref.partner_id, ref.commission_amount))) {
      return NextResponse.json({ error: "이미 출금 신청·지급에 포함된 소개비라 되돌릴 수 없어요." }, { status: 400 });
    }
    const { error } = await svc
      .from("wp_referrals")
      .update({ commission_status: "pending", commission_amount: 0, confirmed_at: null, confirmed_by: null, void_reason: null, updated_at: now })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
    await auditLog(admin.id, "wp_referral.reset", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "알 수 없는 처리예요." }, { status: 400 });
}

/** 확정 소개비를 빼도 (확정 합계 − 신청·승인·지급 합계)가 0 이상인지 */
async function canUndo(svc: Awaited<ReturnType<typeof createServiceRoleClient>>, partnerId: string, amount: number) {
  const [{ data: refs }, { data: wds }] = await Promise.all([
    svc.from("wp_referrals").select("commission_amount").eq("partner_id", partnerId).eq("commission_status", "confirmed"),
    svc.from("wp_withdrawals").select("amount, status").eq("partner_id", partnerId).in("status", ["requested", "approved", "paid"]),
  ]);
  const confirmed = (refs ?? []).reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const used = (wds ?? []).reduce((s, w) => s + (w.amount ?? 0), 0);
  return confirmed - amount - used >= 0;
}
