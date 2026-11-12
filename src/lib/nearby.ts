import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

/** 오늘·내일 수거가 잡혀 있는 지역(시·도 + 시·군·구 단위 건수만, 개인정보 없음) */
export interface NearbyRegion {
  sido: string;
  sigungu: string;
  today: number;
  tomorrow: number;
}

const SIDO: Record<string, string> = { 서울: "서울특별시", 서울시: "서울특별시", 경기: "경기도", 인천: "인천광역시", 인천시: "인천광역시" };
const kstDate = (offsetDays = 0) => new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);

export function regionOfAddress(address: string | null | undefined): { sido: string; sigungu: string } | null {
  const t = (address ?? "").trim().split(/\s+/);
  if (t.length < 2) return null;
  return { sido: SIDO[t[0]] ?? t[0], sigungu: t[1] };
}

export async function getNearbyRegions(): Promise<NearbyRegion[]> {
  if (!isServiceRoleConfigured()) return [];
  try {
    const svc = await createServiceRoleClient();
    const today = kstDate(0);
    const tomorrow = kstDate(1);
    const { data } = await svc
      .from("estimate_requests")
      .select("address, pickup_date, status")
      .in("pickup_date", [today, tomorrow])
      .in("status", ["estimated", "customer_approved", "dispatch_pending", "dispatched", "collecting"])
      .limit(500);
    const map = new Map<string, NearbyRegion>();
    for (const r of data ?? []) {
      const reg = regionOfAddress(r.address as string);
      if (!reg) continue;
      const k = `${reg.sido} ${reg.sigungu}`;
      const cur = map.get(k) ?? { ...reg, today: 0, tomorrow: 0 };
      if (r.pickup_date === today) cur.today += 1;
      else cur.tomorrow += 1;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.today - a.today || b.tomorrow - a.tomorrow);
  } catch (e) {
    console.error("[nearby]", e);
    return [];
  }
}
