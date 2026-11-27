import { NextResponse } from "next/server";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { newPartnerCode, normalizePhone } from "@/lib/weddingPartners";
import { notifyAdmin } from "@/lib/notify";

export const runtime = "nodejs";

/**
 * 웨딩 파트너 가입 신청.
 * 로그인 계정(이메일·비밀번호)을 바로 만들고 파트너 정보는 '승인 대기'로 저장한다.
 * 추천 링크·QR 은 관리자 승인 후에만 동작한다(승인 전 코드는 접수에 연결되지 않음).
 */
export async function POST(req: Request) {
  if (await rateLimitedShared(`wpsignup:${clientIp(req)}`, 5, 3600)) {
    return NextResponse.json({ error: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "지금은 가입을 받을 수 없어요." }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const company = String(b.company ?? "").trim();
  const phone = normalizePhone(String(b.phone ?? ""));
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const agreeTerms = b.agreeTerms === true;
  const agreeCompany = b.agreeCompanyPolicy === true;
  const agreePrivacy = b.agreePrivacy === true;

  if (name.length < 2 || name.length > 30) return NextResponse.json({ error: "이름을 확인해 주세요." }, { status: 400 });
  if (company.length > 60) return NextResponse.json({ error: "소속(회사명)을 60자 이내로 적어 주세요." }, { status: 400 });
  if (!/^01\d{8,9}$/.test(phone)) return NextResponse.json({ error: "휴대폰 번호를 확인해 주세요." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return NextResponse.json({ error: "이메일을 확인해 주세요." }, { status: 400 });
  if (password.length < 8 || password.length > 72) return NextResponse.json({ error: "비밀번호는 8자 이상으로 정해 주세요." }, { status: 400 });
  if (!agreeTerms || !agreeCompany || !agreePrivacy) return NextResponse.json({ error: "필수 약관에 모두 동의해 주세요." }, { status: 400 });

  const svc = await createServiceRoleClient();

  const { data: dupPhone } = await svc.from("wedding_partners").select("id").eq("phone", phone).maybeSingle();
  if (dupPhone) return NextResponse.json({ error: "이미 가입 신청된 휴대폰 번호예요. 로그인해 주세요." }, { status: 409 });

  const { data: created, error: authErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "wedding_partner" },
  });
  if (authErr || !created?.user) {
    const msg = String(authErr?.message ?? "");
    if (/already|registered|exists/i.test(msg)) {
      return NextResponse.json({ error: "이미 가입된 이메일이에요. 로그인해 주세요." }, { status: 409 });
    }
    console.error("[wp signup auth]", authErr);
    return NextResponse.json({ error: "가입을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  const now = new Date().toISOString();
  let inserted = false;
  for (let i = 0; i < 4 && !inserted; i++) {
    const { error } = await svc.from("wedding_partners").insert({
      auth_user_id: created.user.id,
      code: newPartnerCode(),
      name,
      company: company || null,
      phone,
      email,
      agreed_terms_at: now,
      agreed_company_policy_at: now,
      status: "pending",
    });
    if (!error) inserted = true;
    else if ((error as { code?: string }).code !== "23505") {
      console.error("[wp signup insert]", error);
      break;
    }
  }
  if (!inserted) {
    await svc.auth.admin.deleteUser(created.user.id).catch(() => {});
    return NextResponse.json({ error: "가입을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  await notifyAdmin(`[KKOT PAY] 웨딩 파트너 가입 신청: ${name}${company ? ` (${company})` : ""} — 관리자 승인 필요`);
  return NextResponse.json({ ok: true });
}
