import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllPlaces } from "@/lib/places";

/** 관리자 대시보드: 최근 8주 추이, 지역별 접수(30일), 유입 경로(제휴 장소·친구 추천) */
async function loadTrends() {
  if (!isSupabaseConfigured()) return null;
  const since = new Date(Date.now() - 56 * 86400_000);
  let rows: { created_at: string; status: string; address: string | null; customer_payback_amount: number | null; source_ref: string | null }[] = [];
  let refOwners: { ref_code: string | null; request_no: string }[] = [];
  let refPartners: { code: string; name: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select("created_at, status, address, customer_payback_amount, source_ref")
      .gte("created_at", since.toISOString())
      .limit(5000);
    rows = data ?? [];
    const codes = [...new Set(rows.map((r) => r.source_ref).filter((s): s is string => !!s && s.startsWith("ref:")).map((s) => s.slice(4)))];
    if (codes.length) {
      const { data: owners } = await supabase.from("estimate_requests").select("ref_code, request_no").in("ref_code", codes);
      refOwners = owners ?? [];
      // ref_partners 는 서비스 롤 전용 테이블이라 관리자 세션(RLS)으로는 안 읽힐 수 있다 → 실패해도 무시
      try {
        const { createServiceRoleClient } = await import("@/lib/supabase/server");
        const svc = await createServiceRoleClient();
        const { data: ps } = await svc.from("ref_partners").select("code, name").in("code", codes);
        refPartners = ps ?? [];
      } catch {}
    }
  } catch (e) {
    console.error("[dashboard trends]", e);
    return null;
  }

  // 주간 버킷(최근 8주, 오래된 주 → 이번 주)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = Date.now() - (7 - i) * 7 * 86400_000;
    return { start: end - 7 * 86400_000, end, label: i === 7 ? "이번 주" : `${7 - i}주 전`, total: 0, done: 0, amount: 0 };
  });
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    const w = weeks.find((x) => t > x.start && t <= x.end);
    if (!w) continue;
    w.total += 1;
    if (r.status === "collected" || r.status === "settled") w.done += 1;
    if (r.status === "settled") w.amount += r.customer_payback_amount ?? 0;
  }
  const maxTotal = Math.max(1, ...weeks.map((w) => w.total));

  // 지역별(최근 30일): 주소 앞 두 토큰
  const d30 = Date.now() - 30 * 86400_000;
  const regions = new Map<string, number>();
  for (const r of rows) {
    if (new Date(r.created_at).getTime() < d30) continue;
    const k = (r.address ?? "").trim().split(/\s+/).slice(0, 2).join(" ") || "주소 미입력";
    regions.set(k, (regions.get(k) ?? 0) + 1);
  }
  const topRegions = [...regions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRegion = Math.max(1, ...topRegions.map((r) => r[1]));

  // 유입 경로
  const sources = new Map<string, number>();
  for (const r of rows) if (r.source_ref) sources.set(r.source_ref, (sources.get(r.source_ref) ?? 0) + 1);
  const places = sources.size ? await getAllPlaces(true) : [];
  const sourceRows = [...sources.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, n]) => {
      if (k.startsWith("place:")) return { label: `장소 · ${places.find((p) => p.slug === k.slice(6))?.name ?? k.slice(6)}`, n };
      const partner = refPartners.find((p) => p.code === k.slice(4));
      if (partner) return { label: `제휴 · ${partner.name}`, n };
      const owner = refOwners.find((o) => o.ref_code === k.slice(4));
      return { label: `친구 추천 · ${owner ? `추천인 접수 ${owner.request_no}` : k.slice(4)}`, n };
    });

  return { weeks, maxTotal, topRegions, maxRegion, sourceRows };
}

export default async function DashboardTrends() {
  const data = await loadTrends();
  if (!data) return null;
  const { weeks, maxTotal, topRegions, maxRegion, sourceRows } = data;
  const card = "rounded-xl border border-border bg-white p-5";
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <section className={`${card} lg:col-span-2`}>
        <h2 className="text-[15px] font-bold">최근 8주 추이</h2>
        <p className="mt-0.5 text-[12px] text-muted">막대 = 접수 건수, 진한 부분 = 수거 완료 이상</p>
        <div className="mt-4 flex items-end gap-2">
          {weeks.map((w) => (
            <div key={w.label} className="flex min-w-0 flex-1 flex-col items-center">
              <span className="text-[11.5px] font-semibold tabular-nums">{w.total}</span>
              <div className="mt-1 flex h-28 w-full items-end overflow-hidden rounded-md bg-sage/50">
                <div className="relative w-full rounded-md bg-brass/40" style={{ height: `${(w.total / maxTotal) * 100}%` }}>
                  <div className="absolute inset-x-0 bottom-0 rounded-md bg-forest" style={{ height: w.total ? `${(w.done / w.total) * 100}%` : 0 }} />
                </div>
              </div>
              <span className="mt-1.5 truncate text-[10.5px] text-muted">{w.label}</span>
              <span className="text-[10.5px] tabular-nums text-muted-light">{w.amount ? `${Math.round(w.amount / 10000).toLocaleString("ko-KR")}만` : "-"}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-muted-light">맨 아래 숫자는 그 주에 접수된 건 중 정산 완료된 페이백 합계(만원)</p>
      </section>

      <section className={card}>
        <h2 className="text-[15px] font-bold">지역별 접수 (최근 30일)</h2>
        <ul className="mt-3 space-y-2">
          {topRegions.length === 0 && <li className="text-[13px] text-muted">아직 데이터가 없어요.</li>}
          {topRegions.map(([k, n]) => (
            <li key={k} className="text-[13px]">
              <div className="flex justify-between">
                <span className="truncate">{k}</span>
                <span className="font-semibold tabular-nums">{n}건</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-sage/60">
                <div className="h-1.5 rounded-full bg-forest" style={{ width: `${(n / maxRegion) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-[15px] font-bold">유입 경로 (최근 8주)</h2>
        <p className="mt-0.5 text-[12px] text-muted">장소 페이지·제휴 QR, 친구 추천 링크로 들어온 접수</p>
        <ul className="mt-3 space-y-2">
          {sourceRows.length === 0 && <li className="text-[13px] text-muted">아직 링크로 들어온 접수가 없어요.</li>}
          {sourceRows.map((s) => (
            <li key={s.label} className="flex justify-between text-[13px]">
              <span className="truncate">{s.label}</span>
              <span className="font-semibold tabular-nums">{s.n}건</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
