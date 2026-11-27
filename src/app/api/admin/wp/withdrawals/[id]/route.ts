import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { sendSms } from "@/lib/notify";

export const runtime = "nodejs";

/** 관리자: 출금 신청 승인 → 지급 완료 / 반려 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { action?: string; memo?: string };
  const svc = await createServiceRoleClient();
  const { data: w } = await svc.from("wp_withdrawals").select("id, status, amount, wedding_partners(name, phone)").eq("id", id).single();
  if (!w) return NextResponse.json({ error: "출금 신청을 찾지 못했어요." }, { status: 404 });

  const now = new Date().toISOString();
  const allowed: Record<string, string[]> = { approve: ["requested"], paid: ["requested", "approved"], reject: ["requested", "approved"] };
  if (!b.action || !allowed[b.action]) return NextResponse.json({ error: "알 수 없는 처리예요." }, { status: 400 });
  if (!allowed[b.action].includes(w.status)) return NextResponse.json({ error: "이미 처리된 신청이에요." }, { status: 400 });

  const patch: Record<string, unknown> = { processed_by: admin.id, admin_memo: typeof b.memo === "string" ? b.memo.slice(0, 300) || null : undefined };
  if (b.action === "approve") Object.assign(patch, { status: "approved", approved_at: now });
  if (b.action === "paid") Object.assign(patch, { status: "paid", paid_at: now, approved_at: now });
  if (b.action === "reject") Object.assign(patch, { status: "rejected" });
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  const { error } = await svc.from("wp_withdrawals").update(patch).eq("id", id).eq("status", w.status);
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  await auditLog(admin.id, `wp_withdrawal.${b.action}`, id, { amount: w.amount });

  const p = (Array.isArray(w.wedding_partners) ? w.wedding_partners[0] : w.wedding_partners) as { name: string; phone: string } | null;
  if (b.action === "paid" && p?.phone) {
    await sendSms(p.phone, `[꽃페이] ${p.name}님, 웨딩 파트너스 수익금 ${w.amount.toLocaleString("ko-KR")}원 지급이 완료됐어요.`).catch(() => false);
  }
  return NextResponse.json({ ok: true });
}
