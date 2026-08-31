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
    const status = body.status as string | undefined;
    const paybackAmount = body.paybackAmount as number | undefined;

    const updatePayload: Record<string, unknown> = {};
    if (status) updatePayload.status = status;
    if (paybackAmount !== undefined) updatePayload.payback_amount = paybackAmount;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "변경할 내용이 없어요." }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();
    const { data: updatedRows, error } = await supabase
      .from("plant_collection_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(
        "저장은 요청됐지만 실제로 반영되지 않았어요. 이 계정이 admin_users 테이블에 등록되어 있는지 확인해주세요."
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/plant-collection/:id]", err);
    const message = err instanceof Error ? err.message : "저장 중 문제가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();

    // 업로드된 사진 파일도 Storage에서 함께 정리
    const { data: images } = await supabase
      .from("plant_collection_images")
      .select("storage_path")
      .eq("request_id", id);

    if (images && images.length > 0) {
      await supabase.storage.from("estimate-photos").remove(images.map((img) => img.storage_path));
    }

    const { error: deleteError } = await supabase
      .from("plant_collection_requests")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/plant-collection/:id]", err);
    return NextResponse.json({ error: "삭제 중 문제가 발생했어요." }, { status: 500 });
  }
}
