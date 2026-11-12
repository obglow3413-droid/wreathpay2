import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { phoneGate } from "@/lib/phoneVerify";

export const dynamic = "force-dynamic";
const digits = (v: string) => v.replace(/\D/g, "");

/** 고객이 실제 수거 수량(신청 수량과 달라진 경우 포함)을 확인했다고 남긴다. 수량 분쟁을 막기 위한 기록이다. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { requestNo?: string; phone?: string };
  const requestNo = (b.requestNo ?? "").trim().toUpperCase();
  const phone = digits(b.phone ?? "");
  if (!requestNo || phone.length < 10 || !isServiceRoleConfigured()) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const gate = await phoneGate(req, phone, "confirm", 10);
  if (gate) return gate;
  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase.from("estimate_requests").select("id, status, customers(phone)").ilike("request_no", requestNo).maybeSingle();
    const c = data && (Array.isArray(data.customers) ? data.customers[0] : data.customers);
    if (!data || !c || digits(c.phone ?? "") !== phone) return NextResponse.json({ error: "일치하는 접수 내역이 없어요." }, { status: 404 });
    if (!["collected", "settled"].includes(data.status)) return NextResponse.json({ error: "수거가 끝난 뒤에 확인할 수 있어요." }, { status: 409 });
    await supabase.from("pickup_orders").update({ customer_confirmed_at: new Date().toISOString() }).eq("estimate_request_id", data.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[confirm]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
