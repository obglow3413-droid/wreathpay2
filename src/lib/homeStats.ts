/**
 * 홈 화면 실적 수동 기준값 (운영자가 직접 확인한 최근 7일 실적).
 * returnedAmount가 0보다 크면 DB 누적 금액 대신 이 값을 그대로 표시하고, weekCount는 DB 집계가 더 크면 DB 값을 쓴다.
 * 숫자를 갱신하려면 아래 값만 수정하면 된다. (사용하지 않으려면 0)
 */
export const MANUAL_WEEK_STATS = {
  weekCount: 67,
  returnedAmount: 1_327_800,
};
