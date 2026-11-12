import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { filesToAiImages } from "@/lib/aiEstimate";
import { extractRibbons, type RibbonItem } from "@/lib/ribbonExtract";
import { RIBBON_PHOTO_BUCKET } from "@/lib/ribbon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 기사 전용: 수거한 리본 개수 + 리본 사진 업로드(고객에게 돌려줄 자료). 본인에게 배정된 건만. */
export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const requestId = String(form.get("requestId") ?? "");
  const countRaw = Math.round(Number(form.get("count")));
  const files = form.getAll("files").filter((f): f is File => f instanceof File).slice(0, 8);
  if (!token || !requestId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "준비 중이에요." }, { status: 503 });

  try {
    const supabase = await createServiceRoleClient();
    const { data: driver } = await supabase.from("drivers").select("id, is_active").eq("access_token", token).maybeSingle();
    if (!driver?.is_active) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

    const { data: order } = await supabase
      .from("pickup_orders")
      .select("id, driver_id, ribbon_photo_paths, estimate_requests(ribbon_wanted)")
      .eq("estimate_request_id", requestId)
      .maybeSingle();
    const er = order && (Array.isArray(order.estimate_requests) ? order.estimate_requests[0] : order.estimate_requests);
    if (!order || order.driver_id !== driver.id || !er) return NextResponse.json({ error: "배정된 건이 아니에요." }, { status: 403 });
    if (!er.ribbon_wanted) return NextResponse.json({ ok: true, skipped: true });

    const existing: string[] = order.ribbon_photo_paths ?? [];
    const added: string[] = [];
    for (let i = 0; i < files.length && existing.length + added.length < 12; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) continue;
      const path = `ribbon/${requestId}/${Date.now()}-${i}.jpg`;
      const { error } = await supabase.storage.from(RIBBON_PHOTO_BUCKET).upload(path, Buffer.from(await f.arrayBuffer()), {
        contentType: f.type || "image/jpeg",
      });
      if (!error) added.push(path);
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (Number.isFinite(countRaw) && countRaw >= 0 && countRaw <= 500) update.ribbon_count = countRaw;
    if (added.length) update.ribbon_photo_paths = [...existing, ...added];

    await supabase.from("pickup_orders").update(update).eq("id", order.id);

    // AI로 리본 문구 추출 → 기존 목록에 이어 붙임(검수 전 상태 'ai'). best-effort:
    // ribbon_extract 열(supabase/migration_digital_ribbon.sql)이 아직 없거나 키가 없으면 사진만 저장하고 넘어간다.
    if (added.length) {
      try {
        const { data: cur, error: curErr } = await supabase
          .from("pickup_orders")
          .select("ribbon_extract, ribbon_extract_status")
          .eq("id", order.id)
          .maybeSingle();
        if (!curErr && cur && cur.ribbon_extract_status !== "confirmed") {
          const items = await extractRibbons(await filesToAiImages(files));
          if (items) {
            const prev = ((cur.ribbon_extract as { items?: RibbonItem[] } | null)?.items ?? []) as RibbonItem[];
            await supabase
              .from("pickup_orders")
              .update({ ribbon_extract: { items: [...prev, ...items], at: new Date().toISOString() }, ribbon_extract_status: "ai" })
              .eq("id", order.id);
          }
        }
      } catch (e) {
        console.error("[driver ribbon extract]", e);
      }
    }

    return NextResponse.json({ ok: true, uploaded: added.length });
  } catch (e) {
    console.error("[driver ribbon]", e);
    return NextResponse.json({ error: "리본 정보를 저장하지 못했어요." }, { status: 500 });
  }
}
