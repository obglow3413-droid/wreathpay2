import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { getAdminUser } from "@/lib/adminAuth";

const STEPS: [string, string][] = [
  ["home_view", "홈 방문"],
  ["estimate_view", "신청 화면 진입"],
  ["photo_added", "사진 올림"],
  ["estimate_shown", "예상 금액 확인"],
  ["submit_done", "신청 완료"],
];
const EXTRA: [string, string][] = [
  ["reserve_done", "사전 예약 완료"],
  ["place_view", "장소 페이지 방문"],
  ["lookup_view", "조회 화면 방문"],
];
const SOURCE: Record<string, string> = { instagram: "인스타그램", kakao: "카카오톡", naver: "네이버", web: "그 외" };

async function load() {
  if (!isServiceRoleConfigured() || !(await getAdminUser())) return null;
  try {
    const svc = await createServiceRoleClient();
    const since = new Date(Date.now() + 9 * 3600_000 - 6 * 86400_000).toISOString().slice(0, 10);
    const { data } = await svc.from("funnel_events").select("event, source, hits").gte("day", since).limit(5000);
    const byEvent = new Map<string, number>();
    const bySource = new Map<string, { visit: number; done: number }>();
    for (const r of data ?? []) {
      byEvent.set(r.event as string, (byEvent.get(r.event as string) ?? 0) + (r.hits as number));
      const s = bySource.get(r.source as string) ?? { visit: 0, done: 0 };
      if (r.event === "home_view" || r.event === "estimate_view") s.visit += r.hits as number;
      if (r.event === "submit_done" || r.event === "reserve_done") s.done += r.hits as number;
      bySource.set(r.source as string, s);
    }
    return { byEvent, bySource: [...bySource.entries()].sort((a, b) => b[1].visit - a[1].visit) };
  } catch (e) {
    console.error("[funnel]", e);
    return null;
  }
}

/** 관리자 대시보드: 최근 7일 방문 → 신청 단계별 숫자(어디서 빠져나가는지)와 유입처 */
export default async function FunnelStats() {
  const d = await load();
  if (!d) return null;
  const top = Math.max(1, d.byEvent.get(STEPS[0][0]) ?? 0, d.byEvent.get(STEPS[1][0]) ?? 0);
  const card = "rounded-xl border border-border bg-white p-5";
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className={card}>
        <h2 className="text-[15px] font-bold">방문 → 신청 단계 (최근 7일)</h2>
        <p className="mt-0.5 text-[12px] text-muted">같은 방문자는 단계마다 한 번만 세요. 숫자가 크게 줄어드는 단계가 손봐야 할 곳이에요.</p>
        <ul className="mt-4 space-y-2.5">
          {STEPS.map(([k, label], i) => {
            const n = d.byEvent.get(k) ?? 0;
            const prev = i > 0 ? (d.byEvent.get(STEPS[i - 1][0]) ?? 0) : 0;
            return (
              <li key={k} className="text-[13px]">
                <div className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-semibold tabular-nums">
                    {n.toLocaleString("ko-KR")}
                    {i > 0 && prev > 0 && <span className="ml-1.5 font-normal text-muted">({Math.round((n / prev) * 100)}%)</span>}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-sage/60">
                  <div className="h-1.5 rounded-full bg-forest" style={{ width: `${Math.min(100, (n / top) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[12px] text-muted">
          {EXTRA.map(([k, label]) => `${label} ${(d.byEvent.get(k) ?? 0).toLocaleString("ko-KR")}`).join(" · ")}
        </p>
      </section>
      <section className={card}>
        <h2 className="text-[15px] font-bold">어디서 들어왔나 (최근 7일)</h2>
        <p className="mt-0.5 text-[12px] text-muted">앱 안에서 연 브라우저 기준이에요. 인스타 링크를 눌러 들어오면 인스타그램으로 잡혀요.</p>
        <table className="mt-3 w-full text-left text-[13px]">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">유입처</th>
              <th className="py-2 text-right font-medium">방문</th>
              <th className="py-2 text-right font-medium">신청·예약</th>
            </tr>
          </thead>
          <tbody>
            {d.bySource.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-muted">아직 집계된 방문이 없어요. 오늘부터 쌓여요.</td>
              </tr>
            )}
            {d.bySource.map(([s, v]) => (
              <tr key={s} className="border-b border-border last:border-0">
                <td className="py-2 font-semibold">{SOURCE[s] ?? s}</td>
                <td className="py-2 text-right tabular-nums">{v.visit.toLocaleString("ko-KR")}</td>
                <td className="py-2 text-right tabular-nums">{v.done.toLocaleString("ko-KR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
