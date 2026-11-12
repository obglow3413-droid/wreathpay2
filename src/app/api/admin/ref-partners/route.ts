import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/** 관리자: 제휴처(꽃집·예식장 등) 추천 코드 발급/삭제. 링크 https://kkotpay.kr/?r=<코드> 로 들어온 접수가 집계된다. */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { name?: string; kind?: string; remove?: string };
  const svc = await createServiceRoleClient();
  if (b.remove) {
    await svc.from("ref_partners").delete().eq("code", String(b.remove));
    await auditLog(admin.id, "ref_partner.delete", String(b.remove));
    return NextResponse.json({ ok: true });
  }
  const name = String(b.name ?? "").trim();
  if (name.length < 2 || name.length > 60) return NextResponse.json({ error: "제휴처 이름을 입력해 주세요." }, { status: 400 });
  const code = "p" + randomBytes(4).toString("hex").slice(0, 6);
  const { error } = await svc.from("ref_partners").insert({ code, name, kind: String(b.kind ?? "").trim() || null });
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  await auditLog(admin.id, "ref_partner.create", code, { name });
  return NextResponse.json({ ok: true, code });
}
