import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { RIBBON_PHOTO_BUCKET } from "@/lib/ribbon";

export const dynamic = "force-dynamic";

/** 매일 새벽: 만료된 마음 전하기 보드(문구 포함)와 30일 지난 리본 사진을 삭제. Vercel Cron 이 CRON_SECRET 으로 호출. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ ok: false });

  const supabase = await createServiceRoleClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: boards } = await supabase.from("ribbon_boards").delete().lt("expires_at", now.toISOString()).select("id");

  let photos = 0;
  const { data: old } = await supabase
    .from("pickup_orders")
    .select("id, ribbon_photo_paths")
    .lt("updated_at", cutoff)
    .neq("ribbon_photo_paths", "{}");
  for (const po of old ?? []) {
    const paths: string[] = po.ribbon_photo_paths ?? [];
    if (!paths.length) continue;
    await supabase.storage.from(RIBBON_PHOTO_BUCKET).remove(paths);
    await supabase.from("pickup_orders").update({ ribbon_photo_paths: [] }).eq("id", po.id);
    photos += paths.length;
  }
  return NextResponse.json({ ok: true, boardsDeleted: boards?.length ?? 0, photosDeleted: photos });
}
