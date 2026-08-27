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
    const { error } = await supabase
      .from("partner_applications")
      .update({ status: action === "approve" ? "approved" : "rejected" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/partner-applications/:id]", err);
    return NextResponse.json({ error: "처리 중 문제가 발생했어요." }, { status: 500 });
  }
}
