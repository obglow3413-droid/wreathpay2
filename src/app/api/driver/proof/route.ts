import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";
import { RIBBON_PHOTO_BUCKET } from "@/lib/ribbon";

export const dynamic = "force-dynamic";

/** 기사 전용: 수거 완료 현장 사진 1장 저장(고객 조회 화면에 "수거 완료 사진"으로 표시) */
export async function POST(req: Request) {
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "준비 중이에요." }, { status: 503 });
  if (await rateLimitedShared(`drvp:${clientIp(req)}`, 60, 600)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  const fd = await req.formData().catch(() => null);
  const token = String(fd?.get("token") ?? "");
  const requestId = String(fd?.get("requestId") ?? "");
  const file = fd?.get("file");
  if (!token || !requestId || !(file instanceof File)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "5MB 이하 사진만 올릴 수 있어요." }, { status: 400 });
  try {
    const supabase = await createServiceRoleClient();
    const { data: driver } = await supabase.from("drivers").select("id, is_active").eq("access_token", token).maybeSingle();
    if (!driver?.is_active) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    const { data: order } = await supabase.from("pickup_orders").select("id, driver_id").eq("estimate_request_id", requestId).maybeSingle();
    if (!order || order.driver_id !== driver.id) return NextResponse.json({ error: "배정된 건이 아니에요." }, { status: 403 });
    const path = `proof/${order.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(RIBBON_PHOTO_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: "image/jpeg" });
    if (error) throw error;
    await supabase.from("pickup_orders").update({ completion_photo_path: path, updated_at: new Date().toISOString() }).eq("id", order.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[driver proof]", e);
    return NextResponse.json({ error: "사진을 저장하지 못했어요." }, { status: 500 });
  }
}
