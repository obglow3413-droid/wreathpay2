/**
 * 등급별 단가와 관리자가 입력한 등급별 수량을 기반으로
 * 예상 매각금액 / 고객 페이백 / 물류비 / 기타비용 / 공헌이익을 계산합니다.
 *
 * 공헌이익 계산식:
 *   예상 매각금액 = Σ(등급별 수량 × 등급별 단가)
 *   예상 공헌이익 = 예상 매각금액 − 고객 페이백 − 물류비 − 기타 직접비용
 *
 * 고객 페이백 비율(payback rate)은 시스템 설정(system_settings)에서
 * 관리자가 조정할 수 있도록 구조화되어 있으며, 기본값은 서버에서 주입합니다.
 */

export interface GradeCounts {
  premium: number;
  a: number;
  b: number;
  c: number;
}

export interface GradeUnitPrices {
  premium: number;
  a: number;
  b: number;
  c: number;
}

export interface CostInputs {
  logisticsCost: number;
  otherCost: number;
  paybackRate: number; // 0~1, 매각금액 대비 고객에게 돌려주는 비율
}

export interface PricingResult {
  estimatedSaleAmount: number;
  customerPaybackAmount: number;
  logisticsCost: number;
  otherCost: number;
  estimatedContributionMargin: number;
}

export function calculatePricing(
  counts: GradeCounts,
  prices: GradeUnitPrices,
  costs: CostInputs
): PricingResult {
  const estimatedSaleAmount =
    counts.premium * prices.premium +
    counts.a * prices.a +
    counts.b * prices.b +
    counts.c * prices.c;

  const customerPaybackAmount = Math.round(estimatedSaleAmount * costs.paybackRate);

  const estimatedContributionMargin =
    estimatedSaleAmount - customerPaybackAmount - costs.logisticsCost - costs.otherCost;

  return {
    estimatedSaleAmount,
    customerPaybackAmount,
    logisticsCost: costs.logisticsCost,
    otherCost: costs.otherCost,
    estimatedContributionMargin,
  };
}

export const DEFAULT_PAYBACK_RATE = 0.6;

/** 수량 구간별 수거 정책 (초기값, 실제 운영값은 system_settings 테이블에서 override) */
export const QUANTITY_POLICY: Record<
  string,
  { label: string; priority: "normal" | "high" | "bulk" }
> = {
  "1-4": { label: "공동수거 또는 일정 협의", priority: "normal" },
  "5-9": { label: "일반 방문수거 검토", priority: "normal" },
  "10-29": { label: "우선 배차 가능", priority: "high" },
  "30-49": { label: "대량 화환 별도견적", priority: "bulk" },
  "50+": { label: "대량 화환 별도견적", priority: "bulk" },
};

export function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

/**
 * 신청번호를 생성합니다. 날짜 + 짧은 랜덤 코드 조합이라 항상 고유합니다.
 * (예전에는 "오늘 몇 번째 신청인지" 개수를 세는 방식이었는데, 관리자가 신청 건을
 * 삭제하면 개수가 어긋나면서 이미 사용된 번호와 중복되는 문제가 있었습니다.)
 */
export function generateRequestNo(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WP-${y}${m}${d}-${random}`;
}

/**
 * 홈페이지 "매입 가능한 화환" 시세표에서 사용하는 수량 구간 경계값.
 * max가 null이면 "이상"(하한 없는 상한)을 의미합니다.
 * estimate 위저드의 QuantityRange 키와 동일하게 맞춰, 시세표에서 CTA를 누르면
 * 견적신청 STEP 2(수량)까지 그대로 이어집니다.
 */
export const QUANTITY_TIER_BOUNDS: Record<string, { min: number; max: number | null }> = {
  "1-4": { min: 1, max: 4 },
  "5-9": { min: 5, max: 9 },
  "10-29": { min: 10, max: 29 },
  "30-49": { min: 30, max: 49 },
  "50+": { min: 50, max: null },
};

/**
 * 등급별 참고 단가(공개 시세표 표시용).
 * 실제 매입가는 관리자 설정(system_settings/grade_prices)에서 조정되는 값이 최종 기준이며,
 * 이 값은 고객에게 "예상 시세"를 보여주기 위한 기본값입니다.
 */
export const PUBLIC_GRADE_UNIT_PRICES: GradeUnitPrices = {
  premium: 80000,
  a: 50000,
  b: 30000,
  c: 10000,
};

export const GRADE_LABELS: { code: keyof GradeUnitPrices; label: string; desc: string }[] = [
  { code: "premium", label: "최상 (Premium)", desc: "생화 상태 최상, 리본·프레임 손상 없음" },
  { code: "a", label: "A급", desc: "생화 상태 양호, 경미한 사용감" },
  { code: "b", label: "B급", desc: "일부 시들거나 손상, 재사용 가능 범위" },
  { code: "c", label: "C급", desc: "상태 다소 낮음, 조화·부자재 위주" },
];

/**
 * 수량 구간(QuantityRange)의 대표 수량(중간값)을 반환합니다.
 * 관리자가 아직 등급별 수량을 확정하지 않은 신청 건의 "실시간 예상 페이백"을
 * 자동으로 계산할 때 사용합니다. (50+ 구간은 최소값 기준으로 보수적으로 계산)
 */
export function quantityMidpoint(range: string): number {
  const bounds = QUANTITY_TIER_BOUNDS[range];
  if (!bounds) return 1;
  return bounds.max ? Math.round((bounds.min + bounds.max) / 2) : bounds.min;
}


/**
 * 수량 기준 페이백 권장 범위(원). 공개 시세표(홈 '내 화환은 얼마일까요?')와 같은 기준.
 * 사진 AI 견적이 없을 때 관리자가 승인할 금액의 출발점으로 쓴다. 50개 이상은 별도 견적(null).
 */
const PAYBACK_TABLE: { max: number; funeral: [number, number]; celebration: [number, number] }[] = [
  { max: 4, funeral: [0, 0], celebration: [0, 0] },
  { max: 9, funeral: [10000, 30000], celebration: [0, 20000] },
  { max: 14, funeral: [40000, 70000], celebration: [20000, 40000] },
  { max: 19, funeral: [60000, 100000], celebration: [30000, 60000] },
  { max: 29, funeral: [90000, 150000], celebration: [50000, 100000] },
  { max: 49, funeral: [150000, 250000], celebration: [90000, 160000] },
];
const RANGE_BOUNDS: Record<string, [number, number]> = { "1-4": [1, 4], "5-9": [5, 9], "10-29": [10, 29], "30-49": [30, 49] };

export function suggestPayback(
  eventType: string,
  quantityRange: string,
  exactCount?: number | null
): { low: number; high: number; mid: number } | null {
  const col = eventType === "funeral" ? "funeral" : "celebration";
  const row = (n: number) => PAYBACK_TABLE.find((r) => n <= r.max);
  let low: number;
  let high: number;
  if (exactCount && exactCount > 0) {
    const r = row(exactCount);
    if (!r) return null;
    [low, high] = r[col];
  } else {
    const b = RANGE_BOUNDS[quantityRange];
    if (!b) return null;
    const lo = row(b[0]);
    const hi = row(b[1]);
    if (!lo || !hi) return null;
    low = lo[col][0];
    high = hi[col][1];
  }
  return { low, high, mid: Math.round((low + high) / 2 / 1000) * 1000 };
}
