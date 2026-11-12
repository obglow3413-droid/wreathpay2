import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { formatKRW } from "@/lib/pricing";
import SettlementActions from "@/components/admin/SettlementActions";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  request_no: string;
  customer_payback_amount: number | null;
  pickup_date: string;
  customers: { name: string; phone: string } | { name: string; phone: string }[] | null;
}

export default async function SettlementsPage() {
  let rows: Row[] = [];
  const accounts = new Map<string, { bank: string; last4: string }>();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("estimate_requests")
          .select("id, request_no, customer_payback_amount, pickup_date, customers(name, phone)")
          .eq("status", "collected")
          .order("updated_at", { ascending: true });
        rows = (data ?? []) as unknown as Row[];

        if (rows.length && isServiceRoleConfigured()) {
          const svc = await createServiceRoleClient();
          const { data: acc } = await svc
            .from("payout_accounts")
            .select("estimate_request_id, bank_name, account_last4")
            .in("estimate_request_id", rows.map((r) => r.id));
          for (const a of acc ?? []) accounts.set(a.estimate_request_id, { bank: a.bank_name, last4: a.account_last4 });
        }
      }
    } catch (e) {
      console.error("[admin settlements]", e);
    }
  }

  const total = rows.reduce((sum, r) => sum + (r.customer_payback_amount ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">정산 대기</h1>
        <span className="text-[13px] text-muted">
          {rows.length}건 · 합계 {formatKRW(total)}
        </span>
      </div>
      <p className="mt-1 text-[13.5px] text-muted">
        수거가 끝난 건이에요. 계좌를 확인해 입금한 뒤 &ldquo;입금 완료&rdquo;를 누르면 고객 화면과 문자 알림에 정산 완료로 반영돼요.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              {["신청번호", "고객", "연락처", "수거일", "정산 금액", "입금 계좌", "처리"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  정산 대기 중인 건이 없어요.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const c = Array.isArray(r.customers) ? r.customers[0] : r.customers;
              const acc = accounts.get(r.id);
              return (
                <tr key={r.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3 font-medium">{r.request_no}</td>
                  <td className="px-4 py-3">{c?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{c?.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{r.pickup_date}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatKRW(r.customer_payback_amount ?? 0)}</td>
                  <td className="px-4 py-3 text-muted">{acc ? `${acc.bank} ····${acc.last4}` : "-"}</td>
                  <td className="px-4 py-3">
                    <SettlementActions requestId={r.id} amount={r.customer_payback_amount ?? 0} hasAccount={Boolean(acc)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
