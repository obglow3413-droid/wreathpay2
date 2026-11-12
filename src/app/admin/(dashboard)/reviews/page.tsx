import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import ReviewActions from "@/components/admin/ReviewActions";

export const dynamic = "force-dynamic";

export default async function ReviewsAdminPage() {
  let rows: { id: string; rating: number; body: string; region: string | null; approved: boolean; created_at: string }[] = [];
  if (isSupabaseConfigured() && isServiceRoleConfigured()) {
    try {
      const s = await createClient();
      const {
        data: { user },
      } = await s.auth.getUser();
      if (user) {
        const svc = await createServiceRoleClient();
        const { data } = await svc.from("reviews").select("id, rating, body, region, approved, created_at").order("created_at", { ascending: false }).limit(100);
        rows = data ?? [];
      }
    } catch (e) {
      console.error("[admin reviews]", e);
    }
  }
  return (
    <div>
      <h1 className="text-[20px] font-bold">고객 후기</h1>
      <p className="mt-1 text-[13.5px] text-muted">승인한 후기만 홈 화면에 노출돼요. 이름과 연락처는 저장하지 않고 지역·행사 종류만 표시합니다.</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 && <p className="rounded-xl border border-border px-5 py-10 text-center text-[13.5px] text-muted">아직 후기가 없어요.</p>}
        {rows.map((r) => (
          <section key={r.id} className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-brass">{"★".repeat(r.rating)}<span className="text-sage">{"★".repeat(5 - r.rating)}</span> <span className="ml-2 text-muted">{r.region ?? ""}</span></p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.approved ? "bg-brand-tint text-foreground" : "bg-sage text-muted"}`}>{r.approved ? "노출 중" : "승인 대기"}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[14px]">{r.body}</p>
            <ReviewActions id={r.id} approved={r.approved} />
          </section>
        ))}
      </div>
    </div>
  );
}
