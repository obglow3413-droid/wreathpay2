import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import RibbonEditor from "@/components/admin/RibbonEditor";

export const dynamic = "force-dynamic";

export default async function RibbonsAdminPage() {
  let rows: { id: string; request_no: string; place_name: string; status: string; pickup_date: string }[] = [];
  if (isSupabaseConfigured() && isServiceRoleConfigured()) {
    try {
      const s = await createClient();
      const {
        data: { user },
      } = await s.auth.getUser();
      if (user) {
        const { data } = await s
          .from("estimate_requests")
          .select("id, request_no, place_name, status, pickup_date")
          .eq("ribbon_wanted", true)
          .neq("status", "cancelled")
          .order("pickup_date", { ascending: false })
          .limit(50);
        rows = data ?? [];
      }
    } catch (e) {
      console.error("[admin ribbons]", e);
    }
  }
  void createServiceRoleClient;
  return (
    <div>
      <h1 className="text-[20px] font-bold">리본 명단 정리</h1>
      <p className="mt-1 text-[13.5px] text-muted">
        고객이 신청한 건이에요. 기사님이 올린 사진을 AI가 읽어 정리하고, 여기서 사진을 보며 고친 뒤 &ldquo;검수 완료&rdquo;를 누르면 고객에게 확정 명단으로 보여요. 한 줄에 &ldquo;보낸 분 | 문구&rdquo;로 적어주세요.
      </p>
      <div className="mt-5 space-y-5">
        {rows.length === 0 && <p className="rounded-xl border border-border px-5 py-10 text-center text-[13.5px] text-muted">신청된 건이 없어요.</p>}
        {rows.map((r) => (
          <section key={r.id} className="rounded-xl border border-border bg-white p-4">
            <p className="mb-3 text-[13.5px] font-semibold">
              {r.request_no} · {r.place_name} · {r.pickup_date}
            </p>
            <RibbonEditor requestId={r.id} />
          </section>
        ))}
      </div>
    </div>
  );
}
