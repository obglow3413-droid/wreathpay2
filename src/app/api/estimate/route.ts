import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateRequestNo } from "@/lib/pricing";
import { filesToAiImages, isAiEstimateConfigured, runAiEstimate } from "@/lib/aiEstimate";
import type { EventType, QuantityRange } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 견적 신청 접수 API.
 * 회원가입 없이 anonymous customer + estimate_request + estimate_images 를 생성합니다.
 *
 * Supabase 프로젝트가 아직 연결되지 않은 환경(NEXT_PUBLIC_SUPABASE_URL 미설정)에서는
 * Mock 모드로 동작하여, 실제 저장 없이 신청번호만 발급합니다. (개발/데모용)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const eventType = formData.get("eventType") as EventType | null;
    const quantityRange = formData.get("quantityRange") as QuantityRange | null;
    const placeName = formData.get("placeName") as string | null;
    const address = formData.get("address") as string | null;
    const addressDetail = formData.get("addressDetail") as string | null;
    const pickupDate = formData.get("pickupDate") as string | null;
    const pickupTimeSlot = formData.get("pickupTimeSlot") as string | null;
    const customerName = formData.get("customerName") as string | null;
    const customerPhone = formData.get("customerPhone") as string | null;
    const latRaw = Number(formData.get("addressLat"));
    const lngRaw = Number(formData.get("addressLng"));
    const hasCoords =
      formData.get("addressLat") !== null && Number.isFinite(latRaw) && Number.isFinite(lngRaw) &&
      latRaw > 32 && latRaw < 39.5 && lngRaw > 123 && lngRaw < 132.5;
    const countRaw = Math.round(Number(formData.get("customerCount")));
    const customerCount = Number.isFinite(countRaw) && countRaw >= 1 && countRaw <= 500 ? countRaw : null;
    const dispatchMode = formData.get("dispatchMode") === "fast" ? "fast" : "date";
    const images = formData.getAll("images").filter((f): f is File => f instanceof File);

    if (
      !eventType ||
      !quantityRange ||
      !placeName ||
      !address ||
      !pickupDate ||
      !pickupTimeSlot ||
      !customerName ||
      !customerPhone
    ) {
      return NextResponse.json({ error: "필수 입력값이 누락되었어요." }, { status: 400 });
    }

    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!isSupabaseConfigured) {
      // Mock 모드: Supabase 미연결 상태에서도 데모/개발이 가능하도록 처리
      const mockRequestNo = generateRequestNo();
      return NextResponse.json({ requestNo: mockRequestNo, mock: true });
    }

    const supabase = await createServiceRoleClient();

    // 견적신청은 회원가입 없이도 가능하지만, 로그인한 상태로 신청하면
    // "접수현황" 페이지에서 조회할 수 있도록 계정과 연결해둡니다.
    const sessionClient = await createClient();
    const {
      data: { user: loggedInUser },
    } = await sessionClient.auth.getUser();

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({ name: customerName, phone: customerPhone })
      .select("id")
      .single();

    if (customerError || !customer) {
      throw customerError ?? new Error("고객 정보를 저장하지 못했어요.");
    }

    // 신청번호는 랜덤 코드라 거의 겹치지 않지만, 만약을 대비해 충돌 시 최대 3번 재시도
    let estimateRequest: { id: string; request_no: string } | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const requestNo = generateRequestNo();
      const { data, error: requestError } = await supabase
        .from("estimate_requests")
        .insert({
          request_no: requestNo,
          customer_id: customer.id,
          auth_user_id: loggedInUser?.id ?? null,
          event_type: eventType,
          quantity_range: quantityRange,
          place_name: placeName,
          address,
          address_detail: addressDetail || null,
          pickup_date: pickupDate,
          pickup_time_slot: pickupTimeSlot,
          customer_note: dispatchMode === "fast" ? "빠른 배정 요청(가장 빠른 일정으로 안내 희망)" : null,
          ...(hasCoords ? { address_lat: latRaw, address_lng: lngRaw } : {}),
          agreed_disposal_authority: true,
          agreed_site_restriction: true,
          agreed_final_price_variation: true,
          agreed_privacy: true,
          status: "received",
        })
        .select("id, request_no")
        .single();

      if (!requestError && data) {
        estimateRequest = data;
        break;
      }

      lastError = requestError;
      // 신청번호 중복(23505)이 아닌 다른 에러라면 재시도하지 않고 바로 중단
      if ((requestError as { code?: string } | null)?.code !== "23505") break;
    }

    if (!estimateRequest) {
      throw lastError ?? new Error("견적 신청을 저장하지 못했어요.");
    }

    // 이미지 업로드 (Supabase Storage: estimate-photos 버킷)
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const arrayBuffer = await file.arrayBuffer();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${estimateRequest.id}/${i}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("estimate-photos")
        .upload(path, Buffer.from(arrayBuffer), {
          contentType: file.type || "image/jpeg",
        });

      if (!uploadError) {
        await supabase.from("estimate_images").insert({
          estimate_request_id: estimateRequest.id,
          storage_path: path,
          sort_order: i,
        });
      }
    }

    // AI 사진 견적: 신청 저장은 이미 끝났으므로, 실패해도 접수에는 영향이 없다(best-effort).
    // 등급별 수량·금액 열은 중간값으로 채워 관리자가 바로 검토/수정할 수 있게 하고, 범위는 ai_estimate에 보관.
    if (isAiEstimateConfigured()) {
      try {
        const { data: priceRows } = await supabase
          .from("grade_prices")
          .select("unit_price, wreath_grades(code)")
          .eq("is_current", true);
        const byCode: Record<string, number> = {};
        for (const row of priceRows ?? []) {
          const code = (row as unknown as { wreath_grades: { code: string } }).wreath_grades?.code;
          if (code) byCode[code] = row.unit_price as number;
        }
        const prices =
          byCode.premium && byCode.a && byCode.b && byCode.c
            ? { premium: byCode.premium, a: byCode.a, b: byCode.b, c: byCode.c }
            : undefined;

        const ai = await runAiEstimate(await filesToAiImages(images), { eventTypeHint: eventType, prices });
        if (ai) {
          if (ai.status === "ok") {
            const keys = ["premium", "a", "b", "c"] as const;
            const mids = keys.map((k) => Math.round((ai.low.counts[k] + ai.high.counts[k]) / 2));
            const midTotal = mids.reduce((a, b) => a + b, 0);
            // 고객이 수량을 직접 입력했다면(사진이 잘린 경우 등) 등급 비율은 유지하고 총 수량만 맞춘다.
            let counts = mids;
            if (customerCount && midTotal > 0 && customerCount !== midTotal) {
              counts = mids.map((m) => Math.round((m * customerCount) / midTotal));
              const diff = customerCount - counts.reduce((a, b) => a + b, 0);
              counts[counts.indexOf(Math.max(...counts))] += diff;
            }
            const factor = customerCount && midTotal > 0 ? customerCount / midTotal : 1;
            const mid = (k: "premium" | "a" | "b" | "c") => counts[keys.indexOf(k)];
            await supabase
              .from("estimate_requests")
              .update({
                grade_premium_count: mid("premium"),
                grade_a_count: mid("a"),
                grade_b_count: mid("b"),
                grade_c_count: mid("c"),
                estimated_sale_amount: Math.round(((ai.low.sale + ai.high.sale) / 2) * factor),
                customer_payback_amount: Math.round(((ai.low.payback + ai.high.payback) / 2) * factor / 1000) * 1000,
                updated_at: new Date().toISOString(),
              })
              .eq("id", estimateRequest.id);
          }
          // ai_estimate 열은 마이그레이션(supabase/migration_ai_estimate.sql) 적용 후에만 존재 — 없으면 조용히 건너뜀
          await supabase.from("estimate_requests").update({ ai_estimate: { ...ai, customerCount } }).eq("id", estimateRequest.id);
        }
      } catch (e) {
        console.error("[estimate ai]", e);
      }
    }

    return NextResponse.json({ requestNo: estimateRequest.request_no });
  } catch (err) {
    console.error("[POST /api/estimate]", err);
    return NextResponse.json(
      { error: "신청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
