import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/** 관리자: 수거한 화환의 처리 결과(재사용·폐기 수량) 기록. 고객 조회 화면에 "순환 결과"로 표시된다. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { reuse?: number; discard?: number };
  const n = (x: unknown) => (Number.isFinite(Number(x)) && Number(x) >= 0 && Number(x) <= 1000 ? Math.round(Number(x)) : null);
  const reuse = n(b.reuse);
  const discard = n(b.discard);
  if (reuse === null || discard === null) return NextResponse.json({ error: "0 이상의 숫자를 입력해 주세요." }, { status: 400 });
  const svc = await createServiceRoleClient();
  const { data, error } = await svc.from("pickup_orders").update({ reuse_count: reuse, discard_count: discard, updated_at: new Date().toISOString() }).eq("estimate_request_id", id).select("id");
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "배차(수거) 정보가 있는 건만 기록할 수 있어요." }, { status: 409 });
  await auditLog(admin.id, "circulation.update", id, { reuse, discard });
  return NextResponse.json({ ok: true });
}
