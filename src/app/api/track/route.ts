import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const EVENTS = new Set(["home_view", "estimate_view", "photo_added", "estimate_shown", "submit_done", "reserve_done", "lookup_view", "place_view"]);

/** 단계별 방문 집계(날짜·단계·유입처별 횟수만 저장). 사람·기기를 식별하는 값은 저장하지 않는다. */
export async function POST(req: Request) {
  if (rateLimited(`trk:${clientIp(req)}`, 60, 10 * 60_000) || !isServiceRoleConfigured()) return new NextResponse(null, { status: 204 });
  const b = (await req.json().catch(() => ({}))) as { event?: string };
  if (!b.event || !EVENTS.has(b.event)) return new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  // 검색 로봇은 세지 않는다
  if (/bot|crawl|spider|slurp|preview|facebookexternalhit|kakaotalk-scrap/i.test(ua)) return new NextResponse(null, { status: 204 });
  const source = /Instagram/i.test(ua) ? "instagram" : /KAKAOTALK/i.test(ua) ? "kakao" : /NAVER/i.test(ua) ? "naver" : "web";
  try {
    const svc = await createServiceRoleClient();
    await svc.rpc("funnel_hit", { p_event: b.event, p_source: source });
  } catch {}
  return new NextResponse(null, { status: 204 });
}
