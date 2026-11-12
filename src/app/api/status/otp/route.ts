import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { sendSms } from "@/lib/notify";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";
import { hashCode, isOtpEnforced, newCode, OTP_MAX_ATTEMPTS, OTP_TTL, safeEqual, verifiedCookie } from "@/lib/phoneVerify";

export const dynamic = "force-dynamic";
const digits = (v: string) => v.replace(/\D/g, "");

/**
 * 휴대폰 본인확인.
 *  - { phone }        : 인증번호 발송(접수 이력이 있는 번호에만 실제 발송, 응답은 항상 동일 → 번호 존재 여부 노출 방지)
 *  - { phone, code }  : 인증번호 확인 → 30분짜리 서명 쿠키 발급
 */
export async function POST(req: Request) {
  let b: { phone?: string; code?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const phone = digits(b.phone ?? "");
  if (phone.length < 10 || phone.length > 11) return NextResponse.json({ error: "휴대폰번호를 정확히 입력해주세요." }, { status: 400 });
  if (!isOtpEnforced() || !isServiceRoleConfigured()) return NextResponse.json({ ok: true, enforced: false });
  const ip = clientIp(req);
  const supabase = await createServiceRoleClient();

  if (!b.code) {
    if ((await rateLimitedShared(`otp:send:ph:${phone}`, 3, 600)) || (await rateLimitedShared(`otp:send:ip:${ip}`, 10, 600))) {
      return NextResponse.json({ error: "인증번호 요청이 너무 잦아요. 10분 뒤 다시 시도해주세요." }, { status: 429 });
    }
    try {
      const pattern = "%" + phone.split("").join("%") + "%";
      const { data: cs } = await supabase.from("customers").select("phone").ilike("phone", pattern).limit(50);
      const known = (cs ?? []).some((c) => digits(c.phone ?? "") === phone);
      if (known) {
        const code = newCode();
        await supabase.from("otp_codes").upsert({ phone, code_hash: hashCode(phone, code), expires_at: new Date(Date.now() + OTP_TTL).toISOString(), attempts: 0 });
        await sendSms(phone, `[KKOT PAY] 인증번호 ${code} (5분 이내 입력). 본인이 요청하지 않았다면 무시하세요.`);
      }
    } catch (e) {
      console.error("[otp send]", e);
    }
    return NextResponse.json({ ok: true, enforced: true });
  }

  if (await rateLimitedShared(`otp:verify:ip:${ip}`, 20, 600)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  const code = digits(b.code);
  try {
    const { data: row } = await supabase.from("otp_codes").select("code_hash, expires_at, attempts").eq("phone", phone).maybeSingle();
    if (!row || new Date(row.expires_at).getTime() < Date.now() || row.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: "인증번호가 만료됐어요. 다시 받아주세요." }, { status: 400 });
    }
    if (!safeEqual(row.code_hash, hashCode(phone, code))) {
      await supabase.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("phone", phone);
      return NextResponse.json({ error: "인증번호가 맞지 않아요." }, { status: 400 });
    }
    await supabase.from("otp_codes").delete().eq("phone", phone);
    const res = NextResponse.json({ ok: true, verified: true });
    res.headers.append("Set-Cookie", verifiedCookie(phone));
    return res;
  } catch (e) {
    console.error("[otp verify]", e);
    return NextResponse.json({ error: "처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
