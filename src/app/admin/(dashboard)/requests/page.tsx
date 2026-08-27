import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  type EstimateRequestRow,
  type EventType,
  type QuantityRange,
  type RequestStatus,
} from "@/lib/types";
import { formatKRW } from "@/lib/pricing";
import RequestFilters from "@/components/admin/RequestFilters";
import RequestQuickActions from "@/components/admin/RequestQuickActions";
import DeleteRequestButton from "@/components/admin/DeleteRequestButton";

interface SearchParams {
  date?: string;
  region?: string;
  eventType?: string;
  status?: string;
}

async function getRequests(filters: SearchParams): Promise<EstimateRequestRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from("estimate_requests")
      .select(
        "id, request_no, customer_id, event_type, quantity_range, place_name, address, address_detail, pickup_date, pickup_time_slot, customer_note, status, grade_premium_count, grade_a_count, grade_b_count, grade_c_count, estimated_sale_amount, customer_payback_amount, estimated_logistics_cost, estimated_other_cost, estimated_contribution_margin, created_at, updated_at, customers(name, phone)"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
    }
    if (filters.region) {
      query = query.ilike("address", `%${filters.region}%`);
    }
    if (filters.eventType) {
      query = query.eq("event_type", filters.eventType);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as EstimateRequestRow[];
  } catch (e) {
    console.error("[admin requests list]", e);
    return [];
  }
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const requests = await getRequests(filters);
  const configured = isSupabaseConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">신청목록</h1>
        <span className="text-[13px] text-muted">총 {requests.length}건</span>
      </div>

      <div className="mt-4">
        <RequestFilters />
      </div>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 실제 신청 데이터가 이 표에 표시됩니다.
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[1300px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <Th>신청번호</Th>
              <Th>신청일</Th>
              <Th>고객명</Th>
              <Th>연락처</Th>
              <Th>행사종류</Th>
              <Th>지역</Th>
              <Th>예상수량</Th>
              <Th>예상 페이백</Th>
              <Th>수거희망시간</Th>
              <Th>현재상태</Th>
              <Th>관리</Th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-muted">
                  표시할 신청 건이 없어요.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/admin/requests/${r.id}`} className="font-medium text-brand-dark">
                    {r.request_no}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">{r.customers?.name ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{r.customers?.phone ?? "-"}</td>
                <td className="px-4 py-3">{EVENT_TYPE_LABEL[r.event_type as EventType]}</td>
                <td className="px-4 py-3 text-muted">{r.address?.split(" ").slice(0, 2).join(" ")}</td>
                <td className="px-4 py-3">{QUANTITY_RANGE_LABEL[r.quantity_range as QuantityRange]}</td>
                <td className="px-4 py-3 tabular-nums">{formatKRW(r.customer_payback_amount)}</td>
                <td className="px-4 py-3 text-muted">
                  {r.pickup_date} · {r.pickup_time_slot}
                </td>
                <td className="px-4 py-3">
                  <RequestQuickActions
                    requestId={r.id}
                    status={r.status as RequestStatus}
                    customerPaybackAmount={r.customer_payback_amount}
                  />
                </td>
                <td className="px-4 py-3">
                  <DeleteRequestButton requestId={r.id} requestNo={r.request_no} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
