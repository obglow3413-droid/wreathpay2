
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePricing, DEFAULT_PAYBACK_RATE } from "@/lib/pricing";

/**
 * 관리자 신청 상세 업데이트.
 * - 등급별 수량 입력 → 매각금액/페이백/공헌이익 자동 재계산
 * - 배차정보, 페이백 상태, 진행상태 변경
 *
 * 인증된 관리자 세션(Supabase Auth)의 RLS 정책(authenticated full access)에 의존합니다.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
    }

    // 기존 값을 먼저 조회해, 이번 요청에 없는 필드는 기존 값을 그대로 유지 (빠른 처리 버튼처럼
    // 상태만 바꾸는 요청이 등급별 수량을 0으로 덮어쓰지 않도록 함)
    const { data: existingRow } = await supabase
      .from("estimate_requests")
      .select("grade_premium_count, grade_a_count, grade_b_count, grade_c_count, estimated_logistics_cost, estimated_other_cost")
      .eq("id", id)
      .single();

    const gradeCounts = {
      premium: Number(body.gradePremiumCount ?? existingRow?.grade_premium_count ?? 0),
      a: Number(body.gradeACount ?? existingRow?.grade_a_count ?? 0),
      b: Number(body.gradeBCount ?? existingRow?.grade_b_count ?? 0),
      c: Number(body.gradeCCount ?? existingRow?.grade_c_count ?? 0),
    };

    const { data: gradePrices } = await supabase
      .from("grade_prices")
      .select("unit_price, wreath_grades(code)")
      .eq("is_current", true);

    const priceByCode: Record<string, number> = {};
    for (const row of gradePrices ?? []) {
      const code = (row as unknown as { wreath_grades: { code: string } }).wreath_grades?.code;
      if (code) priceByCode[code] = row.unit_price as number;
    }

    const { data: settingsRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "logistics_cost_default")
      .single();
    const { data: otherCostRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "other_cost_default")
      .single();

    const pricing = calculatePricing(
      gradeCounts,
      {
        premium: priceByCode.premium ?? 0,
        a: priceByCode.a ?? 0,
        b: priceByCode.b ?? 0,
        c: priceByCode.c ?? 0,
      },
      {
        logisticsCost:
          Number(body.logisticsCost) ||
          existingRow?.estimated_logistics_cost ||
          (settingsRow?.value as { per_request?: number })?.per_request ||
          0,
        otherCost:
          Number(body.otherCost) ||
          existingRow?.estimated_other_cost ||
          (otherCostRow?.value as { per_request?: number })?.per_request ||
          0,
        paybackRate: Number(body.paybackRate) || DEFAULT_PAYBACK_RATE,
      }
    );

    const updatePayload: Record<string, unknown> = {
      grade_premium_count: gradeCounts.premium,
      grade_a_count: gradeCounts.a,
      grade_b_count: gradeCounts.b,
      grade_c_count: gradeCounts.c,
      estimated_sale_amount: pricing.estimatedSaleAmount,
      customer_payback_amount: pricing.customerPaybackAmount,
      estimated_logistics_cost: pricing.logisticsCost,
      estimated_other_cost: pricing.otherCost,
      estimated_contribution_margin: pricing.estimatedContributionMargin,
      updated_at: new Date().toISOString(),
    };

    // 관리자가 목록/상세에서 페이백 금액을 직접 입력해 덮어쓴 경우 (등급 계산 대신 그 값을 그대로 사용)
    let finalPaybackAmount = pricing.customerPaybackAmount;
    if (body.overridePaybackAmount !== undefined && body.overridePaybackAmount !== null) {
      finalPaybackAmount = Number(body.overridePaybackAmount) || 0;
      updatePayload.customer_payback_amount = finalPaybackAmount;
      updatePayload.estimated_contribution_margin =
        pricing.estimatedSaleAmount - finalPaybackAmount - pricing.logisticsCost - pricing.otherCost;
    }

    if (body.status) updatePayload.status = body.status;

    const { data: updatedRows, error: updateError } = await supabase
      .from("estimate_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("id");

    if (updateError) throw updateError;

    // RLS(권한) 문제로 조용히 0건만 업데이트되는 경우를 확실히 에러로 잡아냄
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(
        "저장은 요청됐지만 실제로 반영되지 않았어요. 이 계정이 admin_users 테이블에 등록되어 있는지 확인해주세요."
      );
    }

    // 배차 정보 upsert
    if (body.dispatch) {
      await supabase.from("pickup_orders").upsert(
        {
          estimate_request_id: id,
          driver_id: body.dispatch.driverId || null,
          scheduled_pickup_at: body.dispatch.scheduledPickupAt || null,
          actual_quantity: body.dispatch.actualQuantity ? Number(body.dispatch.actualQuantity) : null,
          notes: body.dispatch.notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "estimate_request_id" }
      );
    }

    // 페이백 정보 upsert
    if (body.payout) {
      const { data: existingPayout } = await supabase
        .from("payouts")
        .select("reserved_advance_amount")
        .eq("estimate_request_id", id)
        .maybeSingle();

      const reservedAdvance =
        body.payout.reservedAdvanceAmount !== undefined
          ? Number(body.payout.reservedAdvanceAmount) || 0
          : existingPayout?.reserved_advance_amount ?? 0;

      await supabase.from("payouts").upsert(
        {
          estimate_request_id: id,
          total_payback_amount: finalPaybackAmount,
          reserved_advance_amount: reservedAdvance,
          balance_after_pickup: finalPaybackAmount - reservedAdvance,
          status: body.payout.status || "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "estimate_request_id" }
      );
    }

    return NextResponse.json({ ok: true, pricing });
  } catch (err) {
    console.error("[PATCH /api/admin/requests/:id]", err);
    const message = err instanceof Error ? err.message : "저장 중 문제가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 관리자 신청 삭제.
 * estimate_images / pickup_orders / payouts는 DB의 ON DELETE CASCADE로 함께 삭제됩니다.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
    }

    // 업로드된 사진 파일도 Storage에서 함께 정리
    const { data: images } = await supabase
      .from("estimate_images")
      .select("storage_path")
      .eq("estimate_request_id", id);

    if (images && images.length > 0) {
      await supabase.storage
        .from("estimate-photos")
        .remove(images.map((img) => img.storage_path));
    }

    const { error: deleteError } = await supabase.from("estimate_requests").delete().eq("id", id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/requests/:id]", err);
    return NextResponse.json({ error: "삭제 중 문제가 발생했어요." }, { status: 500 });
  }
}
