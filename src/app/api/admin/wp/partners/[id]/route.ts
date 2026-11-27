import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { sendSms } from "@/lib/notify";

export const runtime = "nodejs";

const NEXT: Record<string, string> = { approve: "approved", reject: "rejected", suspend: "suspended", reinstate: "approved" };

/** 관리자: 웨딩 파트너 승인/거절/정지/재개 + 메모 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { action?: string; memo?: string };
  const svc = await createServiceRoleClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.memo === "string") patch.admin_memo = b.memo.slice(0, 500) || null;
  const status = b.action ? NEXT[b.action] : undefined;
  if (b.action && !status) return NextResponse.json({ error: "알 수 없는 처리예요." }, { status: 400 });
  if (status) patch.status = status;
  if (b.action === "approve") patch.approved_at = new Date().toISOString();

  const { data, error } = await svc.from("wedding_partners").update(patch).eq("id", id).select("name, phone").single();
  if (error || !data) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  await auditLog(admin.id, `wp_partner.${b.action ?? "memo"}`, id);

  if (b.action === "approve") {
    await sendSms(data.phone, `[꽃페이] ${data.name}님, 웨딩 파트너스 승인이 완료됐어요. kkotpay.kr/wedding-partners/dashboard 에서 추천 링크와 QR을 확인하세요.`).catch(() => false);
  }
  return NextResponse.json({ ok: true });
}
