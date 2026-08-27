import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

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

    const { data: row } = await supabase
      .from("case_gallery")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (row?.storage_path) {
      await supabase.storage.from("estimate-photos").remove([row.storage_path]);
    }

    const { error } = await supabase.from("case_gallery").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/gallery/:id]", err);
    return NextResponse.json({ error: "삭제 중 문제가 발생했어요." }, { status: 500 });
  }
}
