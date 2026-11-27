import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { sanitizeTiers } from "@/lib/weddingPartners";

export const runtime = "nodejs";

/** 관리자: 소개비 단가 구간·최소 출금액 수정 (이미 확정된 소개비에는 영향 없음) */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { tiers?: unknown; minWithdrawal?: unknown };
  const tiers = sanitizeTiers(b.tiers);
  const minW = Math.round(Number(b.minWithdrawal));
  const value = { tiers, min_withdrawal: Number.isFinite(minW) && minW >= 1000 ? minW : 10000 };
  const svc = await createServiceRoleClient();
  const { error } = await svc
    .from("system_settings")
    .upsert({ key: "wp_commission_tiers", value, description: "웨딩 파트너스 소개비 단가(수거 수량 구간별) · 최소 출금액", updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  await auditLog(admin.id, "wp_settings.update", null, value);
  return NextResponse.json({ ok: true, value });
}
