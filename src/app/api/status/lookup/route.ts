import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// 연락처 대입 조회를 늦추기 위한 단순 요청 제한(인스턴스 단위, best-effort)
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 20;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

const digits = (v: string) => v.replace(/\D/g, "");

/** 연락처만으로 본인 접수 내역 조회(최근 10건). 이름·주소·접수번호는 돌려주지 않는다. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "조회가 너무 잦아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const phone = digits(body.phone ?? "");
  if (phone.length < 10 || phone.length > 11) {
    return NextResponse.json({ error: "휴대폰번호를 정확히 입력해주세요." }, { status: 400 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "조회 기능을 준비 중이에요." }, { status: 503 });
  }

  try {
    const supabase = await createServiceRoleClient();

    // 저장된 번호 형식(010-1234-5678 등)이 제각각이라, 숫자 순서가 맞는 후보를 가져온 뒤 숫자만 비교
    const pattern = "%" + phone.split("").join("%") + "%";
    const { data: customers } = await supabase.from("customers").select("id, phone").ilike("phone", pattern).limit(50);
    const ids = (customers ?? []).filter((c) => digits(c.phone ?? "") === phone).map((c) => c.id);

    if (ids.length === 0) {
      return NextResponse.json({ error: "이 번호로 접수된 내역이 없어요. 신청 시 입력한 번호를 확인해주세요." }, { status: 404 });
    }

    const base =
      "id, request_no, event_type, quantity_range, status, pickup_date, pickup_time_slot, customer_payback_amount, created_at";
    let rows: Record<string, unknown>[] | null = null;
    // ai_estimate 열은 마이그레이션 적용 후에만 존재 → 실패하면 없이 조회
    const withAi = await supabase.from("estimate_requests").select(`${base}, ai_estimate`).in("customer_id", ids).order("created_at", { ascending: false }).limit(10);
    if (!withAi.error) rows = withAi.data as unknown as Record<string, unknown>[];
    else {
      const plain = await supabase.from("estimate_requests").select(base).in("customer_id", ids).order("created_at", { ascending: false }).limit(10);
      rows = (plain.data ?? []) as unknown as Record<string, unknown>[];
    }

    const requestIds = (rows ?? []).map((r) => r.id as string);
    const accounts = new Map<string, { bankName: string; last4: string }>();
    try {
      const { data: acc } = await supabase
        .from("payout_accounts")
        .select("estimate_request_id, bank_name, account_last4")
        .in("estimate_request_id", requestIds);
      for (const a of acc ?? []) accounts.set(a.estimate_request_id, { bankName: a.bank_name, last4: a.account_last4 });
    } catch {}

    const items = (rows ?? []).map((r) => {
      const ai = r.ai_estimate as { status?: string; low?: { payback?: number }; high?: { payback?: number } } | null | undefined;
      const aiRange =
        ai?.status === "ok" && ai.low?.payback && ai.high?.payback ? { low: ai.low.payback, high: ai.high.payback } : null;
      return {
        // requestNo 는 계좌 등록·알림 신청 호출에만 쓰이고 화면에는 표시하지 않는다.
        requestNo: r.request_no,
        eventType: r.event_type,
        quantityRange: r.quantity_range,
        status: r.status,
        pickupDate: r.pickup_date,
        pickupTimeSlot: r.pickup_time_slot,
        paybackAmount: (r.customer_payback_amount as number) ?? 0,
        createdAt: r.created_at,
        aiRange,
        account: accounts.get(r.id as string) ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[status lookup]", e);
    return NextResponse.json({ error: "조회 중 문제가 생겼어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
