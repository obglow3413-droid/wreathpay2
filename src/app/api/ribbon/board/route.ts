import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { generateBoardCode, RIBBON_EVENT_LABEL } from "@/lib/ribbon";

export const dynamic = "force-dynamic";

/** 마음 전하기 보드 만들기(상주/주최자). 가입 없이 이름·휴대폰번호만. 링크는 30일 뒤 만료. */
export async function POST(req: Request) {
  if (rateLimited(`board:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  let body: { title?: string; eventType?: string; hostName?: string; hostPhone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const title = (body.title ?? "").trim();
  const hostName = (body.hostName ?? "").trim();
  const hostPhone = (body.hostPhone ?? "").replace(/\D/g, "");
  const eventType = body.eventType ?? "";
  if (title.length < 2 || title.length > 40) return NextResponse.json({ error: "제목을 2~40자로 입력해주세요." }, { status: 400 });
  if (hostName.length < 2 || hostName.length > 20) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  if (hostPhone.length < 10 || hostPhone.length > 11) return NextResponse.json({ error: "휴대폰번호를 정확히 입력해주세요." }, { status: 400 });
  if (!(eventType in RIBBON_EVENT_LABEL)) return NextResponse.json({ error: "행사 종류를 선택해주세요." }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "준비 중이에요." }, { status: 503 });

  try {
    const supabase = await createServiceRoleClient();
    for (let i = 0; i < 3; i++) {
      const code = generateBoardCode();
      const { error } = await supabase
        .from("ribbon_boards")
        .insert({ code, title, event_type: eventType, host_name: hostName, host_phone: hostPhone });
      if (!error) return NextResponse.json({ code });
      if ((error as { code?: string }).code !== "23505") throw error;
    }
    throw new Error("code collision");
  } catch (e) {
    console.error("[ribbon board]", e);
    return NextResponse.json({ error: "만들지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
