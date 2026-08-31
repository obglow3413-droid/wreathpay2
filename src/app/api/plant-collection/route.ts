import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

function generatePlantRequestNo(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PT-${y}${m}${d}-${random}`;
}

export const runtime = "nodejs";

/**
 * 개업화분 회수 신청 접수 API.
 * 기존 화환 견적(/api/estimate)과 완전히 분리된 별도 테이블/플로우입니다.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const plantType = formData.get("plantType") as string | null;
    const quantity = formData.get("quantity") as string | null;
    const plantSize = formData.get("plantSize") as string | null;
    const pickupAddress = formData.get("pickupAddress") as string | null;
    const pickupAddressDetail = formData.get("pickupAddressDetail") as string | null;
    const desiredPickupDate = formData.get("desiredPickupDate") as string | null;
    const desiredPickupTimeSlot = formData.get("desiredPickupTimeSlot") as string | null;
    const customerName = formData.get("customerName") as string | null;
    const customerPhone = formData.get("customerPhone") as string | null;
    const requestNote = formData.get("requestNote") as string | null;
    const images = formData.getAll("images").filter((f): f is File => f instanceof File);

    if (!plantType || !quantity || !plantSize || !pickupAddress || !customerName || !customerPhone) {
      return NextResponse.json({ error: "필수 입력값이 누락되었어요." }, { status: 400 });
    }

    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!isSupabaseConfigured) {
      return NextResponse.json({ requestNo: generatePlantRequestNo(), mock: true });
    }

    const supabase = await createServiceRoleClient();

    let plantRequest: { id: string; request_no: string } | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const requestNo = generatePlantRequestNo();
      const { data, error: requestError } = await supabase
        .from("plant_collection_requests")
        .insert({
          request_no: requestNo,
          plant_type: plantType,
          quantity: Number(quantity),
          plant_size: plantSize,
          pickup_address: pickupAddress,
          pickup_address_detail: pickupAddressDetail || null,
          desired_pickup_date: desiredPickupDate || null,
          desired_pickup_time_slot: desiredPickupTimeSlot || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          request_note: requestNote || null,
          status: "received",
        })
        .select("id, request_no")
        .single();

      if (!requestError && data) {
        plantRequest = data;
        break;
      }
      lastError = requestError;
      if ((requestError as { code?: string } | null)?.code !== "23505") break;
    }

    if (!plantRequest) {
      throw lastError ?? new Error("화분 회수 신청을 저장하지 못했어요.");
    }

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const arrayBuffer = await file.arrayBuffer();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `plant/${plantRequest.id}/${i}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("estimate-photos")
        .upload(path, Buffer.from(arrayBuffer), {
          contentType: file.type || "image/jpeg",
        });

      if (!uploadError) {
        await supabase.from("plant_collection_images").insert({
          request_id: plantRequest.id,
          storage_path: path,
          sort_order: i,
        });
      }
    }

    return NextResponse.json({ requestNo: plantRequest.request_no });
  } catch (err) {
    console.error("[POST /api/plant-collection]", err);
    const message = err instanceof Error ? err.message : "신청 처리 중 문제가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
