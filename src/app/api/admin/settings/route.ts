import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
    }

    // 등급별 단가 갱신: 기존 is_current row를 false로, 새 row를 insert (이력 유지)
    if (body.gradePrices) {
      const { data: grades } = await supabase.from("wreath_grades").select("id, code");
      for (const grade of grades ?? []) {
        const newPrice = body.gradePrices[grade.code];
        if (newPrice === undefined) continue;

        await supabase
          .from("grade_prices")
          .update({ is_current: false })
          .eq("grade_id", grade.id)
          .eq("is_current", true);

        await supabase.from("grade_prices").insert({
          grade_id: grade.id,
          unit_price: Number(newPrice),
          is_current: true,
          created_by: user.id,
        });
      }
    }

    // 수량정책 갱신
    if (body.quantityPolicy) {
      await supabase
        .from("system_settings")
        .update({ value: body.quantityPolicy, updated_at: new Date().toISOString() })
        .eq("key", "quantity_policy");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/settings]", err);
    return NextResponse.json({ error: "저장 중 문제가 발생했어요." }, { status: 500 });
  }
}
