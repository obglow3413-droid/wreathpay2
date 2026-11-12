import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RIBBON_PHOTO_BUCKET } from "@/lib/ribbon";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { phoneGate, isTrustedForPhone } from "@/lib/phoneVerify";

export const dynamic = "force-dynamic";

const digits = (v: string) => v.replace(/\D/g, "");

/** 연락처만으로 본인 접수 내역 조회(최근 10건). 이름·주소·접수번호는 돌려주지 않는다. */
export async function POST(req: Request) {
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
  const gate = await phoneGate(req, phone, "lookup", 20);
  if (gate) return gate;

  try {
    const supabase = await createServiceRoleClient();

    // 저장된 번호 형식(010-1234-5678 등)이 제각각이라, 숫자 순서가 맞는 후보를 가져온 뒤 숫자만 비교
    const pattern = "%" + phone.split("").join("%") + "%";
    const { data: customers } = await supabase.from("customers").select("id, phone").ilike("phone", pattern).limit(50);
    const ids = (customers ?? []).filter((c) => digits(c.phone ?? "") === phone).map((c) => c.id);

    const hasBoards = (await supabase.from("ribbon_boards").select("id", { count: "exact", head: true }).eq("host_phone", phone).gt("expires_at", new Date().toISOString())).count ?? 0;
    if (ids.length === 0 && hasBoards === 0) {
      return NextResponse.json({ error: "이 번호로 접수된 내역이 없어요. 신청 시 입력한 번호를 확인해주세요." }, { status: 404 });
    }

    const customerIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
    const base =
      "id, request_no, event_type, quantity_range, status, pickup_date, pickup_time_slot, customer_payback_amount, created_at, updated_at, ribbon_wanted, ref_code, place_name, address";
    let rows: Record<string, unknown>[] | null = null;
    // ai_estimate 열은 마이그레이션 적용 후에만 존재 → 실패하면 없이 조회
    const withAi = await supabase.from("estimate_requests").select(`${base}, ai_estimate`).in("customer_id", customerIds).order("created_at", { ascending: false }).limit(10);
    if (!withAi.error) rows = withAi.data as unknown as Record<string, unknown>[];
    else {
      const plain = await supabase.from("estimate_requests").select(base).in("customer_id", customerIds).order("created_at", { ascending: false }).limit(10);
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

    // 수거 후 돌려드리는 실물 리본 사진(수거 완료·정산 완료 건만, 임시 링크 1시간)
    const ribbons = new Map<string, { count: number | null; photos: string[]; listStatus: string; list: { sender: string; text: string; uncertain?: boolean }[] }>();
    try {
      const doneIds = (rows ?? []).filter((r) => r.status === "collected" || r.status === "settled").map((r) => r.id as string);
      if (doneIds.length) {
        const { data: pos } = await supabase
          .from("pickup_orders")
          .select("estimate_request_id, ribbon_count, ribbon_photo_paths, ribbon_extract, ribbon_extract_status")
          .in("estimate_request_id", doneIds);
        for (const po of pos ?? []) {
          const paths: string[] = po.ribbon_photo_paths ?? [];
          const photos: string[] = [];
          for (const path of paths) {
            const { data: signed } = await supabase.storage.from(RIBBON_PHOTO_BUCKET).createSignedUrl(path, 3600);
            if (signed?.signedUrl) photos.push(signed.signedUrl);
          }
          const listStatus = (po.ribbon_extract_status as string) ?? "none";
          const list = listStatus === "none" ? [] : (((po.ribbon_extract as { items?: { sender: string; text: string; uncertain?: boolean }[] } | null)?.items) ?? []);
          if (photos.length || po.ribbon_count != null || list.length) ribbons.set(po.estimate_request_id, { count: po.ribbon_count, photos, listStatus, list });
        }
      }
    } catch {}

    // 수거 완료 증빙: 실제 수거 수량·현장 사진(임시 링크 1시간)
    const proofs = new Map<string, { actualQuantity: number | null; photo: string | null; collectedAt: string | null; reuse: number | null; discard: number | null; confirmed: boolean }>();
    const etas = new Map<string, string>();
    try {
      const movingIds = (rows ?? []).filter((r) => r.status === "collecting").map((r) => r.id as string);
      if (movingIds.length) {
        const { data: es } = await supabase.from("pickup_orders").select("estimate_request_id, eta_at").in("estimate_request_id", movingIds);
        for (const e of es ?? []) if (e.eta_at) etas.set(e.estimate_request_id, e.eta_at as string);
      }
    } catch {}
    try {
      const doneIds = (rows ?? []).filter((r) => r.status === "collected" || r.status === "settled").map((r) => r.id as string);
      if (doneIds.length) {
        const { data: pos } = await supabase.from("pickup_orders").select("estimate_request_id, actual_quantity, completion_photo_path, updated_at, reuse_count, discard_count, customer_confirmed_at").in("estimate_request_id", doneIds);
        for (const po of pos ?? []) {
          let photo: string | null = null;
          if (po.completion_photo_path) {
            const { data: signed } = await supabase.storage.from(RIBBON_PHOTO_BUCKET).createSignedUrl(po.completion_photo_path, 3600);
            photo = signed?.signedUrl ?? null;
          }
          proofs.set(po.estimate_request_id, { actualQuantity: po.actual_quantity, photo, collectedAt: po.updated_at, reuse: po.reuse_count, discard: po.discard_count, confirmed: Boolean(po.customer_confirmed_at) });
        }
      }
    } catch {}

    const reviewed = new Set<string>();
    try {
      const ids = (rows ?? []).map((r) => r.id as string);
      if (ids.length) {
        const { data: rv } = await supabase.from("reviews").select("request_id").in("request_id", ids);
        for (const x of rv ?? []) reviewed.add(x.request_id as string);
      }
    } catch {}

    const trusted = isTrustedForPhone(req, phone) && Boolean(process.env.PAYOUT_ENC_KEY || process.env.VERIFY_SECRET || process.env.CRON_SECRET);
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
        ribbonWanted: r.ribbon_wanted === true,
        reviewed: reviewed.has(r.id as string),
        proof: proofs.get(r.id as string) ?? null,
        etaAt: etas.get(r.id as string) ?? null,
        // 주소는 "이 번호로 신청했던 기기"(또는 문자 인증을 마친 기기)에만 돌려준다
        rebook: trusted ? { placeName: (r.place_name as string) ?? "", address: (r.address as string) ?? "" } : null,
        refCode: (r.ref_code as string | null) ?? null,
        updatedAt: r.updated_at,
        ribbon: r.ribbon_wanted === true ? (ribbons.get(r.id as string) ?? null) : null,
      };
    });

    // 이 번호로 만든 마음 전하기 보드(만료 전)
    let boards: { code: string; title: string; count: number; messages: { id: string; sender: string; text: string }[] }[] = [];
    try {
      const { data: bs } = await supabase
        .from("ribbon_boards")
        .select("id, code, title, ribbon_messages(id, sender_name, message, created_at)")
        .eq("host_phone", phone)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(5);
      boards = (bs ?? []).map((b) => {
        const ms = ((b.ribbon_messages ?? []) as { id: string; sender_name: string; message: string; created_at: string }[])
          .sort((a, c) => c.created_at.localeCompare(a.created_at));
        return { code: b.code, title: b.title, count: ms.length, messages: ms.slice(0, 50).map((m) => ({ id: m.id, sender: m.sender_name, text: m.message })) };
      });
    } catch {}

    return NextResponse.json({ items, boards });
  } catch (e) {
    console.error("[status lookup]", e);
    return NextResponse.json({ error: "조회 중 문제가 생겼어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
