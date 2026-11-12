import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** 마음 전하기: 보드 링크를 가진 누구나 리본 문구를 남길 수 있다(로그인 불필요). */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (rateLimited(`msg:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  let body: { senderName?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const senderName = (body.senderName ?? "").trim();
  const message = (body.message ?? "").trim();
  if (senderName.length < 1 || senderName.length > 20) return NextResponse.json({ error: "보내는 분 이름을 입력해주세요." }, { status: 400 });
  if (message.length < 1 || message.length > 100) return NextResponse.json({ error: "문구는 100자 이내로 입력해주세요." }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "준비 중이에요." }, { status: 503 });

  try {
    const supabase = await createServiceRoleClient();
    const { data: board } = await supabase.from("ribbon_boards").select("id, expires_at").eq("code", code).maybeSingle();
    if (!board || new Date(board.expires_at) < new Date()) {
      return NextResponse.json({ error: "만료되었거나 없는 링크예요." }, { status: 404 });
    }
    const { count } = await supabase.from("ribbon_messages").select("id", { count: "exact", head: true }).eq("board_id", board.id);
    if ((count ?? 0) >= 500) return NextResponse.json({ error: "더 이상 문구를 받을 수 없어요." }, { status: 409 });

    const { error } = await supabase.from("ribbon_messages").insert({ board_id: board.id, sender_name: senderName, message });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ribbon message]", e);
    return NextResponse.json({ error: "보내지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
