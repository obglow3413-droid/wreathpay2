import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatKRW } from "@/lib/pricing";
import MetricCard from "@/components/admin/MetricCard";

async function getDashboardMetrics() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [{ count: newRequestsToday }, { data: todaysRequests }, { count: pickupsToday }, { count: collectedToday }] =
      await Promise.all([
        supabase
          .from("estimate_requests")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayIso),
        supabase
          .from("estimate_requests")
          .select(
            "grade_premium_count, grade_a_count, grade_b_count, grade_c_count, estimated_sale_amount, customer_payback_amount, estimated_contribution_margin, status"
          )
          .gte("created_at", todayIso),
        supabase
          .from("pickup_orders")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_pickup_at", todayIso),
        supabase
          .from("estimate_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["collected", "settled"])
          .gte("updated_at", todayIso),
      ]);

    const rows = todaysRequests ?? [];
    const expectedWreathCount = rows.reduce(
      (sum, r) =>
        sum + (r.grade_premium_count ?? 0) + (r.grade_a_count ?? 0) + (r.grade_b_count ?? 0) + (r.grade_c_count ?? 0),
      0
    );
    const estimatedSaleAmount = rows.reduce((sum, r) => sum + (r.estimated_sale_amount ?? 0), 0);
    const estimatedMargin = rows.reduce((sum, r) => sum + (r.estimated_contribution_margin ?? 0), 0);

    const { data: pendingPayoutRows } = await supabase
      .from("estimate_requests")
      .select("customer_payback_amount")
      .not("status", "in", "(settled,cancelled)");

    const pendingPayback = (pendingPayoutRows ?? []).reduce(
      (sum, r) => sum + (r.customer_payback_amount ?? 0),
      0
    );

    return {
      newRequestsToday: newRequestsToday ?? 0,
      expectedWreathCount,
      pickupsToday: pickupsToday ?? 0,
      collectedToday: collectedToday ?? 0,
      pendingPayback,
      estimatedSaleAmount,
      estimatedMargin,
    };
  } catch (e) {
    console.error("[admin dashboard]", e);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();
  const configured = isSupabaseConfigured();

  return (
    <div>
      <h1 className="text-[20px] font-bold">대시보드</h1>
      <p className="mt-1 text-[13.5px] text-muted">오늘 기준 운영 현황이에요.</p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase 프로젝트가 아직 연결되지 않았어요. 환경변수(NEXT_PUBLIC_SUPABASE_URL 등)를
          설정하면 실제 데이터가 표시됩니다.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="오늘 신규 신청" value={`${metrics?.newRequestsToday ?? 0}건`} />
        <MetricCard label="오늘 예상 화환수" value={`${metrics?.expectedWreathCount ?? 0}개`} />
        <MetricCard label="오늘 수거 예정" value={`${metrics?.pickupsToday ?? 0}건`} />
        <MetricCard label="오늘 수거 완료" value={`${metrics?.collectedToday ?? 0}건`} />
        <MetricCard
          label="지급 예정 페이백"
          value={formatKRW(metrics?.pendingPayback ?? 0)}
          hint="정산완료/취소 제외 전체"
        />
        <MetricCard
          label="예상 매각금액"
          value={formatKRW(metrics?.estimatedSaleAmount ?? 0)}
          hint="오늘 신청 기준"
        />
        <MetricCard
          label="예상 공헌이익"
          value={formatKRW(metrics?.estimatedMargin ?? 0)}
          hint="오늘 신청 기준"
        />
      </div>
    </div>
  );
}
