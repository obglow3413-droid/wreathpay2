import { NextResponse } from "next/server";
import { phoneGate } from "@/lib/phoneVerify";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";
const digits = (v: string) => v.replace(/\D/g, "");
// 기사 배정 전까지만 고객이 직접 취소/일정 변경 가능
const EDITABLE = ["received", "estimating", "estimated", "customer_approved", "dispatch_pending"];

function todayKst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  if (rateLimited(`mg:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  let body: { requestNo?: string; phone?: string; action?: string; pickupDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const requestNo = (body.requestNo ?? "").trim().toUpperCase();
  const phone = digits(body.phone ?? "");
  if (!requestNo || phone.length < 10 || !isServiceRoleConfigured() || (body.action !== "cancel" && body.action !== "reschedule")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  {
    const gate = await phoneGate(req, phone, "manage", 10);
    if (gate) return gate;
  }

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase.from("estimate_requests").select("id, status, place_name, customers(phone)").ilike("request_no", requestNo).maybeSingle();
    const c = data && (Array.isArray(data.customers) ? data.customers[0] : data.customers);
    if (!data || !c || digits(c.phone ?? "") !== phone) return NextResponse.json({ error: "일치하는 접수 내역이 없어요." }, { status: 404 });
    if (!EDITABLE.includes(data.status)) {
      return NextResponse.json({ error: "기사님이 배정된 뒤에는 직접 바꿀 수 없어요. 채널톡으로 문의해 주세요." }, { status: 409 });
    }

    if (body.action === "cancel") {
      await supabase.from("estimate_requests").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", data.id);
      await notifyAdmin(`[KKOT PAY] 고객이 신청을 취소했어요. (${requestNo} · ${data.place_name})`);
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    const date = body.pickupDate ?? "";
    const min = todayKst();
    const max = new Date(Date.now() + (9 * 24 + 60 * 24) * 3600 * 1000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < min || date > max) {
      return NextResponse.json({ error: "오늘부터 60일 이내의 날짜를 선택해 주세요." }, { status: 400 });
    }
    await supabase.from("estimate_requests").update({ pickup_date: date, updated_at: new Date().toISOString() }).eq("id", data.id);
    await notifyAdmin(`[KKOT PAY] 고객이 수거 희망일을 ${date}로 변경했어요. (${requestNo} · ${data.place_name})`);
    return NextResponse.json({ ok: true, pickupDate: date });
  } catch (e) {
    console.error("[status manage]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
