import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { getAllPlaces } from "@/lib/places";

export const dynamic = "force-dynamic";

/**
 * 관리자: 장소 숨김/제휴 표시 변경 또는 새 장소 추가.
 *  - { slug, isHidden?, isPartner? } : 기존 장소 상태 변경(기본 목록의 장소는 DB에 행을 만들어 덮어쓴다)
 *  - { kind, name, sido, sigungu, address } : 새 장소 추가
 */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const svc = await createServiceRoleClient();
  try {
    if (typeof b.slug === "string") {
      const cur = (await getAllPlaces(true)).find((p) => p.slug === b.slug);
      if (!cur) return NextResponse.json({ error: "장소를 찾을 수 없어요." }, { status: 404 });
      const { error } = await svc.from("places").upsert(
        {
          slug: cur.slug,
          kind: cur.kind,
          name: cur.name,
          sido: cur.sido,
          sigungu: cur.sigungu,
          address: cur.address,
          rooms: cur.rooms,
          parking: cur.parking,
          operator_type: cur.operatorType,
          is_hidden: typeof b.isHidden === "boolean" ? b.isHidden : cur.isHidden,
          is_partner: typeof b.isPartner === "boolean" ? b.isPartner : cur.isPartner,
        },
        { onConflict: "slug" }
      );
      if (error) throw error;
      await auditLog(admin.id, "place.update", cur.slug, { isHidden: b.isHidden, isPartner: b.isPartner });
    } else {
      const kind = b.kind === "wedding" ? "wedding" : "funeral";
      const f = (k: string) => String(b[k] ?? "").trim();
      const [name, sido, sigungu, address] = [f("name"), f("sido"), f("sigungu"), f("address")];
      if (name.length < 2 || !sido || !sigungu || address.length < 5) return NextResponse.json({ error: "이름·시도·시군구·주소를 모두 입력해 주세요." }, { status: 400 });
      const slug = `${kind === "wedding" ? "w" : "x"}${Date.now().toString(36)}`;
      const { error } = await svc.from("places").insert({ slug, kind, name, sido, sigungu, address });
      if (error) throw error;
      await auditLog(admin.id, "place.create", slug, { name });
    }
    revalidatePath("/places");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin places]", e);
    return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  }
}
