import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const digits = (v: string) => v.replace(/\D/g, "");

/** 수거 완료·정산 완료 건에 대한 후기 작성(1회). 관리자 승인 후에만 홈에 노출된다. */
export async function POST(req: Request) {
  if (rateLimited(`rv:${clientIp(req)}`, 5, 10 * 60_000)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  let b: { requestNo?: string; phone?: string; rating?: number; body?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const requestNo = (b.requestNo ?? "").trim().toUpperCase();
  const phone = digits(b.phone ?? "");
  const rating = Math.round(Number(b.rating));
  const text = String(b.body ?? "").trim();
  if (!requestNo || phone.length < 10 || !(rating >= 1 && rating <= 5) || text.length < 5 || text.length > 400 || !isServiceRoleConfigured())
    return NextResponse.json({ error: "별점과 5자 이상의 후기를 입력해 주세요." }, { status: 400 });
  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select("id, status, event_type, address, customers(phone)")
      .ilike("request_no", requestNo)
      .maybeSingle();
    const c = data && (Array.isArray(data.customers) ? data.customers[0] : data.customers);
    if (!data || !c || digits(c.phone ?? "") !== phone) return NextResponse.json({ error: "일치하는 접수 내역이 없어요." }, { status: 404 });
    if (!["collected", "settled"].includes(data.status)) return NextResponse.json({ error: "수거가 끝난 뒤에 후기를 남길 수 있어요." }, { status: 409 });
    const region = String(data.address ?? "").trim().split(/\s+/).slice(0, 2).join(" ") || null;
    const { error } = await supabase.from("reviews").insert({ request_id: data.id, rating, body: text, event_type: data.event_type, region });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "이미 후기를 남겨주셨어요. 감사합니다!" }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[review]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
