/**
 * 홈 화면 실적 수동 기준값 (운영자가 직접 확인한 최근 7일 실적).
 * returnedAmount가 0보다 크면 DB 누적 금액 대신 이 값을 그대로 표시하고, weekCount는 DB 집계가 더 크면 DB 값을 쓴다.
 * 숫자를 갱신하려면 아래 값만 수정하면 된다. (사용하지 않으려면 0)
 */
export const MANUAL_WEEK_STATS = {
  weekCount: 67,
  returnedAmount: 13_278_000,
};

/**
 * 시범 운영(테스트) 단계용 시뮬레이션 수치.
 * 켜져 있으면 baseAmount에서 시작해 1시간마다 perHour씩 늘어난 값을 보여주고,
 * 화면에 "시범 운영 예시 수치 · 실제 정산 금액이 아님" 문구를 반드시 함께 표시한다.
 * DB 실시간 연동 후에는 enabled를 false로 바꾸고 MANUAL_WEEK_STATS.returnedAmount를 0으로 둔다.
 */
export const SIMULATED_RETURNED = {
  enabled: true,
  baseAmount: 13_278_000,
  baseTime: "2026-11-12T02:30:00Z",
  perHour: 400_000,
};

export function getSimulatedReturnedAmount(now = Date.now()): number {
  const hours = Math.max(0, Math.floor((now - new Date(SIMULATED_RETURNED.baseTime).getTime()) / 3_600_000));
  return SIMULATED_RETURNED.baseAmount + hours * SIMULATED_RETURNED.perHour;
}
