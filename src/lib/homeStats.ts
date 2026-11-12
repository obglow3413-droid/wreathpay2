/**
 * 홈 화면 실적 수동 기준값 (운영자가 직접 확인한 최근 7일 실적).
 * DB 집계가 이 값보다 작으면 이 값을 보여주고, 더 크면 DB 값을 그대로 보여준다.
 * 숫자를 갱신하려면 아래 값만 수정하면 된다. (사용하지 않으려면 0)
 */
export const MANUAL_WEEK_STATS = {
  weekCount: 67,
  returnedAmount: 1_327_800,
};
