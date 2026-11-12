import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** 보드 주최자(휴대폰번호 일치)가 부적절한 문구를 지운다. */
export async function POST(req: Request) {
  if (rateLimited(`rdel:${clientIp(req)}`, 20, 10 * 60_000)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  let body: { phone?: string; messageId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const phone = (body.phone ?? "").replace(/\D/g, "");
  if (!body.messageId || phone.length < 10 || !isServiceRoleConfigured()) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase.from("ribbon_messages").select("id, ribbon_boards(host_phone)").eq("id", body.messageId).maybeSingle();
    const board = data && (Array.isArray(data.ribbon_boards) ? data.ribbon_boards[0] : data.ribbon_boards);
    if (!data || !board || board.host_phone !== phone) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    await supabase.from("ribbon_messages").delete().eq("id", data.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ribbon delete]", e);
    return NextResponse.json({ error: "삭제하지 못했어요." }, { status: 500 });
  }
}
