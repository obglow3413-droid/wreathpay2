import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as "approve" | "reject";

    const supabase = await createServiceRoleClient();

    const { data: application, error: fetchError } = await supabase
      .from("driver_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: "지원서를 찾을 수 없어요." }, { status: 404 });
    }

    if (action === "approve") {
      // 실제 배차 가능한 기사(drivers)로 등록
      const { error: insertError } = await supabase.from("drivers").insert({
        name: application.name,
        phone: application.phone,
        vehicle_number: application.vehicle_number,
        is_active: true,
      });
      if (insertError) throw insertError;
    }

    const { error: updateError } = await supabase
      .from("driver_applications")
      .update({ status: action === "approve" ? "approved" : "rejected" })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/driver-applications/:id]", err);
    return NextResponse.json({ error: "처리 중 문제가 발생했어요." }, { status: 500 });
  }
}
