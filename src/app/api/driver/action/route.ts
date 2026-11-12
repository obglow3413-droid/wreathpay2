import { NextResponse } from "next/server";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { notifyStatusChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

const PRE_COLLECT = ["customer_approved", "dispatch_pending", "dispatched"];

/** 기사 전용: 이동 시작 / 수거 완료. 기사 링크 토큰 + 본인에게 배정된 건만 처리. */
export async function POST(req: Request) {
  let body: { token?: string; requestId?: string; action?: string; actualQuantity?: number; etaMinutes?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { token, requestId, action } = body;
  if (!token || !requestId || (action !== "start" && action !== "complete")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "준비 중이에요." }, { status: 503 });
  if (await rateLimitedShared(`drv:${clientIp(req)}`, 60, 600)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  try {
    const supabase = await createServiceRoleClient();
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, is_active")
      .eq("access_token", token)
      .maybeSingle();
    if (!driver || !driver.is_active) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

    const { data: order } = await supabase
      .from("pickup_orders")
      .select("id, driver_id, estimate_requests(id, status)")
      .eq("estimate_request_id", requestId)
      .maybeSingle();
    const er = order && (Array.isArray(order.estimate_requests) ? order.estimate_requests[0] : order.estimate_requests);
    if (!order || order.driver_id !== driver.id || !er) {
      return NextResponse.json({ error: "배정된 건이 아니에요." }, { status: 403 });
    }

    const status = er.status as string;
    let next: "collecting" | "collected";
    if (action === "start") {
      if (!PRE_COLLECT.includes(status)) return NextResponse.json({ error: "지금은 이동 시작을 누를 수 없는 상태예요." }, { status: 409 });
      next = "collecting";
      // 도착 예정(분): 고객 조회 화면에 "약 ○시 ○분 도착 예정"으로 표시된다
      const eta = Math.round(Number(body.etaMinutes));
      if (Number.isFinite(eta) && eta >= 5 && eta <= 240) {
        await supabase.from("pickup_orders").update({ eta_at: new Date(Date.now() + eta * 60_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id);
      }
    } else {
      if (![...PRE_COLLECT, "collecting"].includes(status)) return NextResponse.json({ error: "지금은 수거 완료 처리를 할 수 없는 상태예요." }, { status: 409 });
      next = "collected";
      const q = Math.round(Number(body.actualQuantity));
      if (Number.isFinite(q) && q >= 0 && q <= 500) {
        await supabase.from("pickup_orders").update({ actual_quantity: q, updated_at: new Date().toISOString() }).eq("id", order.id);
      }
    }

    const { error } = await supabase
      .from("estimate_requests")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) throw error;

    await notifyStatusChange(requestId, next);
    return NextResponse.json({ ok: true, status: next });
  } catch (e) {
    console.error("[driver action]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
