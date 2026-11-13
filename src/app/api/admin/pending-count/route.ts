import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 관리자 알림용: 아직 처리 전(접수) 건수 + 가장 최근 접수 한 건의 요약(새 접수 알림 문구에 사용) */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { count } = await supabase.from("estimate_requests").select("id", { count: "exact", head: true }).eq("status", "received");
  const { data: last } = await supabase
    .from("estimate_requests")
    .select("id, created_at, event_type, quantity_range, address, customer_note")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latest = last
    ? {
        id: last.id as string,
        createdAt: last.created_at as string,
        label: [
          String(last.customer_note ?? "").startsWith("[사전 예약]") ? "사전 예약" : null,
          EVENT_TYPE_LABEL[last.event_type as EventType] ?? null,
          QUANTITY_RANGE_LABEL[last.quantity_range as QuantityRange] ?? null,
          String(last.address ?? "").trim().split(/\s+/).slice(0, 2).join(" ") || null,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    : null;
  return NextResponse.json({ received: count ?? 0, latest });
}
