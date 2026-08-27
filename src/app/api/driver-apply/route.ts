import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, region, vehicleType, vehicleNumber, message } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "이름과 연락처는 필수예요." }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      // Mock 모드: Supabase 미연결 상태에서도 데모 가능
      return NextResponse.json({ ok: true, mock: true });
    }

    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from("driver_applications").insert({
      name,
      phone,
      region: region || null,
      vehicle_type: vehicleType || null,
      vehicle_number: vehicleNumber || null,
      message: message || null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/driver-apply]", err);
    return NextResponse.json(
      { error: "지원서 접수 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
