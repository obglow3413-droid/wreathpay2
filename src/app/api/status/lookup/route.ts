import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// 접수번호 + 연락처 대입 공격을 늦추기 위한 단순 요청 제한(인스턴스 단위, best-effort)
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 10;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

const digits = (v: string) => v.replace(/\D/g, "");

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "조회가 너무 잦아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let body: { requestNo?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const requestNo = (body.requestNo ?? "").trim().toUpperCase();
  const phone = digits(body.phone ?? "");
  if (!requestNo || phone.length < 9) {
    return NextResponse.json({ error: "접수번호와 연락처를 입력해주세요." }, { status: 400 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "조회 기능을 준비 중이에요." }, { status: 503 });
  }

  const notFound = NextResponse.json(
    { error: "일치하는 접수 내역이 없어요. 접수번호와 연락처를 다시 확인해주세요." },
    { status: 404 }
  );

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select(
        "request_no, event_type, quantity_range, status, pickup_date, pickup_time_slot, customer_payback_amount, created_at, customers(phone)"
      )
      .ilike("request_no", requestNo)
      .maybeSingle();

    if (!data) return notFound;
    const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
    if (!customer || digits(customer.phone ?? "") !== phone) return notFound;

    // 개인정보(이름·연락처·주소)는 돌려주지 않음
    return NextResponse.json({
      requestNo: data.request_no,
      eventType: data.event_type,
      quantityRange: data.quantity_range,
      status: data.status,
      pickupDate: data.pickup_date,
      pickupTimeSlot: data.pickup_time_slot,
      paybackAmount: data.customer_payback_amount ?? 0,
      createdAt: data.created_at,
    });
  } catch (e) {
    console.error("[status lookup]", e);
    return NextResponse.json({ error: "조회 중 문제가 생겼어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
