import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { QUANTITY_POLICY } from "@/lib/pricing";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const configured = isSupabaseConfigured();

  let prices: Record<string, number> = { premium: 80000, a: 50000, b: 30000, c: 10000 };
  let policy = QUANTITY_POLICY;

  if (configured) {
    try {
      const supabase = await createClient();
      const { data: gradePrices } = await supabase
        .from("grade_prices")
        .select("unit_price, wreath_grades(code)")
        .eq("is_current", true);

      if (gradePrices) {
        prices = {};
        for (const row of gradePrices as unknown as {
          unit_price: number;
          wreath_grades: { code: string };
        }[]) {
          prices[row.wreath_grades.code] = row.unit_price;
        }
      }

      const { data: policyRow } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "quantity_policy")
        .single();
      if (policyRow?.value) policy = policyRow.value;
    } catch (e) {
      console.error("[admin settings]", e);
    }
  }

  return (
    <div>
      <h1 className="text-[20px] font-bold">설정</h1>
      <p className="mt-1 text-[13.5px] text-muted">등급별 단가와 수량별 수거 정책을 관리해요.</p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase 연결 전에는 기본값만 표시되며 저장은 동작하지 않아요.
        </div>
      )}

      <SettingsForm initialPrices={prices} initialPolicy={policy} />
    </div>
  );
}
