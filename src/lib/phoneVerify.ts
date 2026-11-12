import { createHmac, createHash, timingSafeEqual, randomInt } from "crypto";
import { NextResponse } from "next/server";
import { isSmsConfigured } from "@/lib/notify";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";

/**
 * 휴대폰 본인확인(문자 인증번호).
 * 문자 발송(Solapi) 키가 설정되면 자동으로 켜진다. 켜진 뒤에는 조회·계좌 등록·일정 변경·취소 등
 * 연락처로 접근하는 모든 기능이 "그 번호로 받은 인증번호를 입력한 기기"에서만 동작한다.
 * 키가 없을 때는 기존처럼 번호만으로 동작하되, 요청 제한만 적용한다.
 */
const COOKIE = "kp_v";
const SESSION_MS = 30 * 60_000;
const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

function secret(): string | null {
  return process.env.VERIFY_SECRET || process.env.PAYOUT_ENC_KEY || process.env.CRON_SECRET || null;
}

export function isOtpEnforced(): boolean {
  return isSmsConfigured() && Boolean(secret());
}

const sign = (payload: string) => createHmac("sha256", secret() ?? "").update(payload).digest("base64url");
export const hashCode = (phone: string, code: string) => createHash("sha256").update(`${secret()}:${phone}:${code}`).digest("hex");
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const OTP_TTL = OTP_TTL_MS;
export const OTP_MAX_ATTEMPTS = MAX_ATTEMPTS;

function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function safeEqual(a: string, b: string) {
  return safeEq(a, b);
}

/**
 * 신청 기기 표식: 접수를 마친 브라우저에 90일짜리 서명 쿠키를 남긴다.
 * 문자 인증이 꺼져 있어도, 계좌 등록·일정 변경·취소 같은 민감한 동작은
 * "그 번호로 신청했던 기기"(또는 문자 인증을 마친 기기)에서만 허용한다.
 */
const DEVICE_COOKIE = "kp_d";
const DEVICE_MS = 90 * 24 * 3600_000;

function readCookie(req: Request, name: string): string | null {
  const raw = (req.headers.get("cookie") ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return raw ? raw.slice(name.length + 1) : null;
}

/** 이 기기에서 신청한 번호 목록(최근 5개)을 서명해 쿠키로 만든다 */
export function deviceCookie(req: Request, phone: string): string | null {
  if (!secret()) return null;
  const phones = [phone, ...trustedPhones(req).filter((p) => p !== phone)].slice(0, 5);
  const exp = Date.now() + DEVICE_MS;
  const payload = `${phones.join("-")}.${exp}`;
  return `${DEVICE_COOKIE}=${payload}.${sign("d:" + payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DEVICE_MS / 1000}`;
}

function trustedPhones(req: Request): string[] {
  const v = readCookie(req, DEVICE_COOKIE);
  if (!v || !secret()) return [];
  const [list, exp, sig] = v.split(".");
  if (!list || !exp || !sig || Number(exp) < Date.now() || !safeEq(sig, sign(`d:${list}.${exp}`))) return [];
  return list.split("-").filter((p) => /^\d{9,11}$/.test(p));
}

/** 민감 동작 허용 여부: 문자 인증을 마쳤거나, 이 번호로 신청했던 기기 */
export function isTrustedForPhone(req: Request, phone: string): boolean {
  if (!secret()) return true; // 서명 키가 없는 환경(로컬)에서는 막지 않는다
  return isPhoneVerified(req, phone) || trustedPhones(req).includes(phone);
}

/** 민감 동작(계좌 등록·일정 변경·취소) 관문. 통과하면 null */
export function sensitiveGate(req: Request, phone: string): NextResponse | null {
  if (isTrustedForPhone(req, phone)) return null;
  return NextResponse.json(
    { error: "보안을 위해 신청하신 기기(브라우저)에서만 할 수 있어요. 다른 기기라면 채널톡으로 본인 확인 후 도와드릴게요.", deviceRequired: true },
    { status: 403 }
  );
}

/** 인증 완료 쿠키 헤더 값 */
export function verifiedCookie(phone: string): string {
  const exp = Date.now() + SESSION_MS;
  const payload = `${phone}.${exp}`;
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MS / 1000}`;
}

export function isPhoneVerified(req: Request, phone: string): boolean {
  const raw = (req.headers.get("cookie") ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [p, exp, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!p || !exp || !sig || p !== phone || Number(exp) < Date.now()) return false;
  return safeEq(sig, sign(`${p}.${exp}`));
}

/**
 * 연락처 기반 API 공통 관문: (1) 번호·IP 단위 공유 요청 제한 (2) 인증 강제 시 본인확인 쿠키 검사.
 * 통과하면 null, 막히면 응답을 돌려준다.
 */
export async function phoneGate(req: Request, phone: string, scope: string, max = 20): Promise<NextResponse | null> {
  const ip = clientIp(req);
  if ((await rateLimitedShared(`${scope}:ip:${ip}`, max, 600)) || (await rateLimitedShared(`${scope}:ph:${phone}`, max * 2, 600))) {
    return NextResponse.json({ error: "요청이 너무 잦아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  if (isOtpEnforced() && !isPhoneVerified(req, phone)) {
    return NextResponse.json({ error: "휴대폰 본인확인이 필요해요.", otpRequired: true }, { status: 401 });
  }
  return null;
}
