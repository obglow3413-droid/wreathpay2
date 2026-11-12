import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function authed() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  return Boolean(user);
}

/** 관리자: 후기 노출 승인/해제 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authed())) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { approved?: boolean };
  const svc = await createServiceRoleClient();
  const { error } = await svc.from("reviews").update({ approved: body.approved === true }).eq("id", id);
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** 관리자: 후기 삭제 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authed())) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const svc = await createServiceRoleClient();
  const { error } = await svc.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제하지 못했어요." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
