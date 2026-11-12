import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

/**
 * 홈 화면 실적의 수동 표시값. 관리자 > 설정에서 수정한다(system_settings.home_stats).
 *  - weekCount: 최근 7일 건수. DB 집계가 더 크면 DB 값을 쓴다.
 *  - returnedAmount: 0보다 크면 "최근 7일간 돌려드린 금액"으로 이 값을 그대로 표시, 0이면 DB 누적 정산 금액.
 * 사이트 밖에서 처리해 DB에 없는 실적을 반영하기 위한 값이므로, 실제 처리한 숫자만 넣는다.
 */
export interface HomeStats {
  weekCount: number;
  returnedAmount: number;
}

export async function getHomeStats(): Promise<HomeStats> {
  const zero = { weekCount: 0, returnedAmount: 0 };
  if (!isServiceRoleConfigured()) return zero;
  try {
    const svc = await createServiceRoleClient();
    const { data } = await svc.from("system_settings").select("value").eq("key", "home_stats").maybeSingle();
    const v = (data?.value ?? {}) as Partial<HomeStats>;
    const n = (x: unknown) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Math.round(Number(x)) : 0);
    return { weekCount: n(v.weekCount), returnedAmount: n(v.returnedAmount) };
  } catch {
    return zero;
  }
}
