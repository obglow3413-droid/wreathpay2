import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const digits = (v: string) => v.replace(/\D/g, "");

/** 받은 화환 명단(리본 문구 정리) 신청/해제. 수거 완료 전까지만 변경 가능. */
export async function POST(req: Request) {
  if (rateLimited(`rr:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  let body: { requestNo?: string; phone?: string; enable?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const requestNo = (body.requestNo ?? "").trim().toUpperCase();
  const phone = digits(body.phone ?? "");
  if (!requestNo || phone.length < 10 || !isServiceRoleConfigured()) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase.from("estimate_requests").select("id, status, customers(phone)").ilike("request_no", requestNo).maybeSingle();
    const c = data && (Array.isArray(data.customers) ? data.customers[0] : data.customers);
    if (!data || !c || digits(c.phone ?? "") !== phone) return NextResponse.json({ error: "일치하는 접수 내역이 없어요." }, { status: 404 });
    if (["collected", "settled", "cancelled"].includes(data.status)) return NextResponse.json({ error: "수거가 끝난 건은 신청을 바꿀 수 없어요. 채널톡으로 문의해 주세요." }, { status: 409 });
    const enable = body.enable !== false;
    await supabase.from("estimate_requests").update({ ribbon_wanted: enable }).eq("id", data.id);
    return NextResponse.json({ ok: true, enabled: enable });
  } catch (e) {
    console.error("[ribbon-request]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
