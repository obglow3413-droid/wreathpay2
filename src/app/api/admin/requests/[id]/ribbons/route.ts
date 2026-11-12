import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/adminAuth";
import { RIBBON_PHOTO_BUCKET } from "@/lib/ribbon";

export const dynamic = "force-dynamic";

async function authed() {
  return Boolean(await getAdminUser());
}

/** 관리자: 리본 사진(임시 링크)과 현재 추출 결과 조회 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await authed())) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const svc = await createServiceRoleClient();
  const { data } = await svc.from("pickup_orders").select("ribbon_photo_paths, ribbon_extract, ribbon_extract_status").eq("estimate_request_id", id).maybeSingle();
  const photos: string[] = [];
  for (const p of data?.ribbon_photo_paths ?? []) {
    const { data: u } = await svc.storage.from(RIBBON_PHOTO_BUCKET).createSignedUrl(p, 3600);
    if (u?.signedUrl) photos.push(u.signedUrl);
  }
  return NextResponse.json({ photos, items: (data?.ribbon_extract as { items?: unknown[] } | null)?.items ?? [], status: data?.ribbon_extract_status ?? "none" });
}

/** 관리자: 검수한 명단 저장(줄마다 "보낸 분 | 문구"). confirm=true 면 고객에게 '검수 완료'로 표시. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await authed())) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { text?: string; confirm?: boolean };
  const items = String(body.text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 200)
    .map((l) => {
      const [sender, ...rest] = l.split("|");
      return { sender: sender.trim().slice(0, 80), text: rest.join("|").trim().slice(0, 120) };
    });
  const svc = await createServiceRoleClient();
  const { error } = await svc
    .from("pickup_orders")
    .update({
      ribbon_extract: { items, at: new Date().toISOString(), edited: true },
      ribbon_extract_status: body.confirm ? "confirmed" : "ai",
      updated_at: new Date().toISOString(),
    })
    .eq("estimate_request_id", id);
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  return NextResponse.json({ ok: true, count: items.length });
}
