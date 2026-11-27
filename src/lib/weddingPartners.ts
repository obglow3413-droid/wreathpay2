import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 꽃페이 웨딩 파트너스 공통 로직.
 * - 소개비: 실제 수거 수량 구간별 정액(관리자 설정 system_settings.wp_commission_tiers)
 * - 확정 조건: 수거 완료(collected/settled) + 검수·판매 정산 완료(sale_settled_at) + 관리자 확정
 * - 고객 페이백과 파트너 소개비는 별도로 계산·지급한다.
 */

export interface CommissionTier {
  min: number;
  amount: number;
}

export interface WpSettings {
  tiers: CommissionTier[];
  minWithdrawal: number;
}

export const DEFAULT_WP_SETTINGS: WpSettings = {
  tiers: [
    { min: 30, amount: 30000 },
    { min: 50, amount: 50000 },
    { min: 100, amount: 100000 },
  ],
  minWithdrawal: 10000,
};

export const WP_CODE_RE = /^[a-z0-9]{5,12}$/;
export const WP_LS_KEY = "kkotpay:wp";

export const FLAG_LABEL: Record<string, string> = {
  self_referral: "본인 추천 의심(파트너 연락처와 고객 연락처 같음)",
  duplicate_phone: "같은 고객 연락처로 최근 다른 접수 있음",
  duplicate_event: "같은 날짜·같은 장소 접수 중복",
};

export function normalizePhone(p: string | null | undefined): string {
  return String(p ?? "").replace(/\D/g, "");
}

export function sanitizeTiers(raw: unknown): CommissionTier[] {
  if (!Array.isArray(raw)) return DEFAULT_WP_SETTINGS.tiers;
  const tiers = raw
    .map((t) => ({ min: Math.round(Number((t as CommissionTier)?.min)), amount: Math.round(Number((t as CommissionTier)?.amount)) }))
    .filter((t) => Number.isFinite(t.min) && Number.isFinite(t.amount) && t.min >= 1 && t.min <= 10000 && t.amount >= 0 && t.amount <= 10_000_000)
    .sort((a, b) => a.min - b.min);
  return tiers.length ? tiers : DEFAULT_WP_SETTINGS.tiers;
}

export async function loadWpSettings(svc: SupabaseClient): Promise<WpSettings> {
  try {
    const { data } = await svc.from("system_settings").select("value").eq("key", "wp_commission_tiers").maybeSingle();
    const v = (data?.value ?? {}) as { tiers?: unknown; min_withdrawal?: unknown };
    const minW = Math.round(Number(v.min_withdrawal));
    return {
      tiers: sanitizeTiers(v.tiers),
      minWithdrawal: Number.isFinite(minW) && minW > 0 ? minW : DEFAULT_WP_SETTINGS.minWithdrawal,
    };
  } catch {
    return DEFAULT_WP_SETTINGS;
  }
}

/** 수거 수량에 해당하는 소개비. 가장 낮은 구간보다 적으면 0원. */
export function commissionFor(count: number | null | undefined, tiers: CommissionTier[]): number {
  const n = Number(count ?? 0);
  let amount = 0;
  for (const t of [...tiers].sort((a, b) => a.min - b.min)) if (n >= t.min) amount = t.amount;
  return amount;
}

export function tierLabel(tiers: CommissionTier[]): { range: string; amount: number }[] {
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  return sorted.map((t, i) => {
    const next = sorted[i + 1];
    return { range: next ? `${t.min}~${next.min - 1}개` : `${t.min}개 이상`, amount: t.amount };
  });
}

/** 고객 이름 가림: 홍길동 → 홍*동, 김철 → 김* */
export function maskName(name: string | null | undefined): string {
  const s = String(name ?? "").trim();
  if (!s) return "고객";
  if (s.length === 1) return s;
  if (s.length === 2) return s[0] + "*";
  return s[0] + "*".repeat(s.length - 2) + s[s.length - 1];
}

/** 추천 코드 생성(소문자+숫자 7자, 헷갈리는 글자 제외) */
export function newPartnerCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "w";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

/** 소개비 확정 가능 여부: 수거 완료 + 판매 정산 완료 */
export function isCommissionEligible(status: string | null | undefined, saleSettledAt: string | null | undefined): boolean {
  return (status === "collected" || status === "settled") && Boolean(saleSettledAt);
}

/**
 * 견적 접수 직후 호출: 승인된 파트너 코드면 추천 기록을 남기고 부정 추천 의심 표시를 붙인다.
 * 접수 자체를 막지 않도록 실패는 조용히 기록만 한다.
 */
export async function attachWeddingReferral(
  svc: SupabaseClient,
  opts: { requestId: string; code: string; customerPhone: string; consent: boolean; placeName: string; pickupDate: string }
): Promise<void> {
  try {
    const code = opts.code.trim().toLowerCase();
    if (!WP_CODE_RE.test(code)) return;
    const { data: partner } = await svc.from("wedding_partners").select("id, phone, status").eq("code", code).maybeSingle();
    if (!partner || partner.status !== "approved") return;

    const flags: string[] = [];
    const phone = normalizePhone(opts.customerPhone);
    if (phone && phone === normalizePhone(partner.phone)) flags.push("self_referral");

    // 같은 연락처로 최근 180일 안에 다른 접수가 있었는지
    const since = new Date(Date.now() - 180 * 86400_000).toISOString();
    const variants = Array.from(new Set([opts.customerPhone.trim(), phone, phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3")])).filter(Boolean);
    const { data: sameCustomers } = await svc.from("customers").select("id").in("phone", variants);
    const customerIds = (sameCustomers ?? []).map((c) => c.id);
    if (customerIds.length) {
      const { count } = await svc
        .from("estimate_requests")
        .select("id", { count: "exact", head: true })
        .in("customer_id", customerIds)
        .neq("id", opts.requestId)
        .gte("created_at", since);
      if ((count ?? 0) > 0) flags.push("duplicate_phone");
    }

    // 같은 날짜·같은 장소 접수가 이미 있는지(같은 예식을 여러 경로로 접수)
    const place = opts.placeName.trim();
    if (place.length >= 2) {
      const { count } = await svc
        .from("estimate_requests")
        .select("id", { count: "exact", head: true })
        .eq("pickup_date", opts.pickupDate)
        .ilike("place_name", place)
        .neq("id", opts.requestId)
        .neq("status", "cancelled");
      if ((count ?? 0) > 0) flags.push("duplicate_event");
    }

    await svc.from("wp_referrals").insert({
      partner_id: partner.id,
      estimate_request_id: opts.requestId,
      consent_share: opts.consent,
      flags,
    });
  } catch (e) {
    console.error("[wp referral]", e);
  }
}

export interface PartnerBalance {
  confirmed: number; // 확정 소개비 누적
  expected: number; // 진행 중(미확정) 예상 소개비
  withdrawn: number; // 지급 완료
  locked: number; // 출금 신청·승인 대기
  available: number; // 출금 가능
}

export function computeBalance(
  referrals: { commission_status: string; commission_amount: number; expected?: number }[],
  withdrawals: { status: string; amount: number }[]
): PartnerBalance {
  const confirmed = referrals.filter((r) => r.commission_status === "confirmed").reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const expected = referrals.filter((r) => r.commission_status === "pending").reduce((s, r) => s + (r.expected ?? 0), 0);
  const withdrawn = withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);
  const locked = withdrawals.filter((w) => w.status === "requested" || w.status === "approved").reduce((s, w) => s + w.amount, 0);
  return { confirmed, expected, withdrawn, locked, available: Math.max(0, confirmed - withdrawn - locked) };
}

/** 로그인한 사용자의 파트너 정보(서비스 롤로 조회). 파트너가 아니면 null. */
export async function getPartnerForUser(svc: SupabaseClient, userId: string) {
  const { data } = await svc
    .from("wedding_partners")
    .select("id, code, name, company, phone, email, status, bank_name, account_holder, account_last4, admin_memo, created_at, approved_at")
    .eq("auth_user_id", userId)
    .maybeSingle();
  return data;
}

export const PARTNER_STATUS_LABEL: Record<string, string> = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "승인 거절",
  suspended: "이용 정지",
};

export const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  requested: "출금 신청",
  approved: "승인(지급 대기)",
  paid: "지급 완료",
  rejected: "반려",
};
