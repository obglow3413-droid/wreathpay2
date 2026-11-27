import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { getAdminUser } from "@/lib/adminAuth";
import { formatKRW } from "@/lib/pricing";
import { EVENT_TYPE_LABEL, STATUS_LABEL, type EventType, type RequestStatus } from "@/lib/types";
import { commissionFor, loadWpSettings } from "@/lib/weddingPartners";
import { ProfitEditor } from "@/components/admin/WpActions";

export const dynamic = "force-dynamic";

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

interface Row {
  id: string;
  request_no: string;
  event_type: EventType;
  status: RequestStatus;
  pickup_date: string;
  place_name: string;
  customer_payback_amount: number | null;
  estimated_sale_amount: number | null;
  actual_sale_amount: number | null;
  actual_vehicle_cost: number | null;
  actual_logistics_cost: number | null;
  sale_settled_at: string | null;
  pickup_orders: { actual_quantity: number | null } | { actual_quantity: number | null }[] | null;
  wp_referrals:
    | { commission_status: string; commission_amount: number; wedding_partners: { name: string } | { name: string }[] | null }
    | { commission_status: string; commission_amount: number; wedding_partners: { name: string } | { name: string }[] | null }[]
    | null;
}

/** 건별 실제 수익 분석: 판매금액 − 고객 페이백 − 차량비 − 물류비 − 파트너 소개비 */
export default async function ProfitPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const onlyOpen = scope !== "all";
  if (!isServiceRoleConfigured() || !(await getAdminUser())) return <p className="text-[14px] text-muted">관리자 권한이 필요해요.</p>;

  const svc = await createServiceRoleClient();
  const settings = await loadWpSettings(svc);
  let q = svc
    .from("estimate_requests")
    .select(
      "id, request_no, event_type, status, pickup_date, place_name, customer_payback_amount, estimated_sale_amount, actual_sale_amount, actual_vehicle_cost, actual_logistics_cost, sale_settled_at, pickup_orders(actual_quantity), wp_referrals(commission_status, commission_amount, wedding_partners(name))"
    )
    .in("status", ["collected", "settled"])
    .order("pickup_date", { ascending: false })
    .limit(300);
  if (onlyOpen) q = q.is("sale_settled_at", null);
  const { data, error } = await q;
  if (error) console.error("[admin profit]", error);
  const rows = ((data ?? []) as unknown as Row[]).map((r) => {
    const po = one(r.pickup_orders);
    const ref = one(r.wp_referrals);
    const partner = ref ? one(ref.wedding_partners)?.name ?? "파트너" : null;
    const qty = po?.actual_quantity ?? null;
    const fee = ref ? (ref.commission_status === "confirmed" ? ref.commission_amount : ref.commission_status === "void" ? 0 : commissionFor(qty, settings.tiers)) : 0;
    const sale = r.actual_sale_amount;
    const payback = Number(r.customer_payback_amount ?? 0);
    const vehicle = Number(r.actual_vehicle_cost ?? 0);
    const logistics = Number(r.actual_logistics_cost ?? 0);
    const profit = sale != null ? Number(sale) - payback - vehicle - logistics - fee : null;
    return { ...r, qty, partner, fee, feeConfirmed: ref?.commission_status === "confirmed", payback, vehicle, logistics, profit };
  });
  const withSale = rows.filter((r) => r.profit != null);
  const sum = (k: "payback" | "vehicle" | "logistics" | "fee") => withSale.reduce((s, r) => s + r[k], 0);
  const saleTotal = withSale.reduce((s, r) => s + Number(r.actual_sale_amount ?? 0), 0);
  const profitTotal = withSale.reduce((s, r) => s + (r.profit ?? 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-bold">건별 실제 수익</h1>
          <p className="mt-1 text-[13px] text-muted">수거 완료 건의 판매금액·차량비·물류비를 입력하고 판매 정산을 완료하세요. 웨딩 파트너 소개비는 판매 정산 완료 후 확정할 수 있어요.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-white p-1 text-[12.5px] font-semibold">
          <Link href="/admin/profit" className={`rounded-md px-3 py-1.5 ${onlyOpen ? "bg-brand text-white" : "text-muted"}`}>
            정산 전
          </Link>
          <Link href="/admin/profit?scope=all" className={`rounded-md px-3 py-1.5 ${!onlyOpen ? "bg-brand text-white" : "text-muted"}`}>
            전체
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        {[
          ["판매금액", saleTotal],
          ["고객 페이백", sum("payback")],
          ["차량비", sum("vehicle")],
          ["물류비", sum("logistics")],
          ["파트너 소개비", sum("fee")],
          ["실제 수익", profitTotal],
        ].map(([l, v]) => (
          <div key={l as string} className={`rounded-xl border bg-white p-4 ${l === "실제 수익" ? "border-foreground" : "border-border"}`}>
            <p className="text-[12px] text-muted">{l}</p>
            <p className={`mt-1 text-[16px] font-bold tabular-nums ${typeof v === "number" && v < 0 ? "text-error" : ""}`}>{formatKRW(v as number)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-muted">합계는 판매금액이 입력된 {withSale.length}건 기준 · 표시 {rows.length}건</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[1300px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              {["접수", "행사·수거일", "수거 수량", "고객 페이백", "파트너 소개비", "실제 수익", "판매금액 / 차량비 / 물류비 · 정산"].map((h) => (
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
                  {onlyOpen ? "판매 정산 전인 수거 완료 건이 없어요." : "수거 완료 건이 없어요."}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/requests/${r.id}`} className="font-medium underline">
                    {r.request_no}
                  </Link>
                  <p className="text-[12px] text-muted">{STATUS_LABEL[r.status]}{r.sale_settled_at ? " · 판매 정산 완료" : ""}</p>
                </td>
                <td className="px-4 py-3 text-[12.5px]">
                  {EVENT_TYPE_LABEL[r.event_type]} · {r.place_name}
                  <br />
                  <span className="text-muted">{r.pickup_date}</span>
                </td>
                <td className="px-4 py-3 tabular-nums">{r.qty != null ? `${r.qty}개` : "-"}</td>
                <td className="px-4 py-3 tabular-nums">{formatKRW(r.payback)}</td>
                <td className="px-4 py-3 tabular-nums">
                  {r.partner ? (
                    <>
                      {formatKRW(r.fee)}
                      <br />
                      <span className="text-[11.5px] text-muted">
                        {r.partner} · {r.feeConfirmed ? "확정" : "예상"}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className={`px-4 py-3 font-semibold tabular-nums ${r.profit != null && r.profit < 0 ? "text-error" : ""}`}>
                  {r.profit != null ? formatKRW(r.profit) : <span className="font-normal text-muted">판매금액 입력 필요</span>}
                  {r.profit != null && Number(r.actual_sale_amount) > 0 && (
                    <p className="text-[11.5px] font-normal text-muted">마진 {Math.round(((r.profit ?? 0) / Number(r.actual_sale_amount)) * 100)}%</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ProfitEditor
                    id={r.id}
                    sale={r.actual_sale_amount != null ? Number(r.actual_sale_amount) : null}
                    vehicle={r.actual_vehicle_cost != null ? Number(r.actual_vehicle_cost) : null}
                    logistics={r.actual_logistics_cost != null ? Number(r.actual_logistics_cost) : null}
                    settled={Boolean(r.sale_settled_at)}
                    collected
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
