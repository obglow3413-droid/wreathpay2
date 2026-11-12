import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { getAdminUser } from "@/lib/adminAuth";

/** 기사별 월 정산표: 최근 3개월, 수거 완료(정산 완료 포함) 건수와 실제 수거 수량 합계 */
async function load() {
  if (!isServiceRoleConfigured() || !(await getAdminUser())) return null;
  try {
    const svc = await createServiceRoleClient();
    const since = new Date();
    since.setMonth(since.getMonth() - 2);
    since.setDate(1);
    const { data } = await svc
      .from("pickup_orders")
      .select("driver_id, actual_quantity, updated_at, drivers(name), estimate_requests(status)")
      .not("driver_id", "is", null)
      .gte("updated_at", since.toISOString())
      .limit(5000);
    const map = new Map<string, { name: string; month: string; count: number; qty: number }>();
    for (const r of data ?? []) {
      const er = Array.isArray(r.estimate_requests) ? r.estimate_requests[0] : r.estimate_requests;
      if (!er || !["collected", "settled"].includes((er as { status: string }).status)) continue;
      const d = Array.isArray(r.drivers) ? r.drivers[0] : r.drivers;
      const month = new Date(new Date(r.updated_at as string).getTime() + 9 * 3600_000).toISOString().slice(0, 7);
      const key = `${r.driver_id}|${month}`;
      const cur = map.get(key) ?? { name: (d as { name?: string } | null)?.name ?? "기사", month, count: 0, qty: 0 };
      cur.count += 1;
      cur.qty += Number(r.actual_quantity) || 0;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.month.localeCompare(a.month) || b.count - a.count);
  } catch (e) {
    console.error("[driver monthly]", e);
    return null;
  }
}

export default async function DriverMonthly() {
  const rows = await load();
  if (!rows) return null;
  return (
    <section className="mt-8 rounded-xl border border-border bg-white p-5">
      <h2 className="text-[16px] font-bold">기사별 월 정산표</h2>
      <p className="mt-1 text-[13px] text-muted">최근 3개월 · 수거 완료 건 기준. 건당 지급 단가를 곱해 정산에 쓰세요.</p>
      <table className="mt-3 w-full text-left text-[13.5px]">
        <thead className="text-muted">
          <tr className="border-b border-border">
            <th className="py-2 font-medium">월</th>
            <th className="py-2 font-medium">기사</th>
            <th className="py-2 text-right font-medium">수거 건수</th>
            <th className="py-2 text-right font-medium">수거 화환 수</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-muted">아직 수거 완료 건이 없어요.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.name + r.month} className="border-b border-border last:border-0">
              <td className="py-2 tabular-nums">{r.month}</td>
              <td className="py-2 font-semibold">{r.name}</td>
              <td className="py-2 text-right tabular-nums">{r.count}건</td>
              <td className="py-2 text-right tabular-nums">{r.qty}개</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
