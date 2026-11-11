import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { isSmsConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 10;
}
const digits = (v: string) => v.replace(/\D/g, "");

/** 진행 알림 신청/해제. 접수번호 + 연락처가 일치해야 한다. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  let body: { requestNo?: string; phone?: string; enable?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const requestNo = (body.requestNo ?? "").trim().toUpperCase();
  const phone = digits(body.phone ?? "");
  if (!requestNo || phone.length < 9) return NextResponse.json({ error: "접수번호와 연락처를 확인해주세요." }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "준비 중이에요." }, { status: 503 });

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select("id, customers(phone)")
      .ilike("request_no", requestNo)
      .maybeSingle();
    const customer = data && (Array.isArray(data.customers) ? data.customers[0] : data.customers);
    if (!data || !customer || digits(customer.phone ?? "") !== phone) {
      return NextResponse.json({ error: "일치하는 접수 내역이 없어요." }, { status: 404 });
    }
    const enable = body.enable !== false;
    const { error } = await supabase.from("estimate_requests").update({ notify_opt_in: enable }).eq("id", data.id);
    if (error) throw error;
    // smsReady=false 이면 신청은 저장되지만 문자 발송 설정 전이라는 뜻 → 화면 문구를 정직하게 바꾼다.
    return NextResponse.json({ ok: true, enabled: enable, smsReady: isSmsConfigured() });
  } catch (e) {
    console.error("[status notify]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
