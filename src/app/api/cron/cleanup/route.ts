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
    .or("ribbon_extract_status.neq.none,ribbon_photo_paths.neq.{}");
  for (const po of old ?? []) {
    const paths: string[] = po.ribbon_photo_paths ?? [];
    if (paths.length) await supabase.storage.from(RIBBON_PHOTO_BUCKET).remove(paths);
    // 사진과 함께 추출한 명단(이름·문구)도 30일 뒤 삭제
    await supabase.from("pickup_orders").update({ ribbon_photo_paths: [], ribbon_extract: null, ribbon_extract_status: "none" }).eq("id", po.id);
    photos += paths.length;
  }
  // 요청 제한 카운터·만료된 인증번호 정리
  await supabase.from("rate_limits").delete().lt("window_start", new Date(now.getTime() - 24 * 3600 * 1000).toISOString());
  await supabase.from("otp_codes").delete().lt("expires_at", now.toISOString());
  return NextResponse.json({ ok: true, boardsDeleted: boards?.length ?? 0, photosDeleted: photos });
}
