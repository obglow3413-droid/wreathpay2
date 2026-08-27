import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateRequestNo } from "@/lib/pricing";
import type { EventType, QuantityRange } from "@/lib/types";

export const runtime = "nodejs";

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

    return NextResponse.json({ requestNo: estimateRequest.request_no });
  } catch (err) {
    console.error("[POST /api/estimate]", err);
    return NextResponse.json(
      { error: "신청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
