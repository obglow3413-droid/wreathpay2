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
import PlantQuickActions from "@/components/admin/PlantQuickActions";
import DeleteRequestButton from "@/components/admin/DeleteRequestButton";

interface SearchParams {
  date?: string;
  region?: string;
  eventType?: string;
  status?: string;
}

interface PlantRow {
  id: string;
  request_no: string;
  plant_type: string;
  quantity: number;
  plant_size: string;
  pickup_address: string;
  desired_pickup_date: string | null;
  desired_pickup_time_slot: string | null;
  customer_name: string;
  customer_phone: string;
  status: string;
  payback_amount: number;
  created_at: string;
}

// 화면에 함께 그리기 위한 공통 행 모양 (화환/화분 둘 다 이 형태로 변환해서 합침)
interface UnifiedRow {
  kind: "wreath" | "plant";
  id: string;
  requestNo: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  category: string; // 행사종류 또는 화분종류
  region: string;
  quantityLabel: string;
  paybackAmount: number;
  scheduleLabel: string;
  wreathRaw?: EstimateRequestRow;
  plantStatus?: string;
}

async function getWreathRequests(filters: SearchParams): Promise<EstimateRequestRow[]> {
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
  if (filters.region) query = query.ilike("address", `%${filters.region}%`);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as EstimateRequestRow[];
}

async function getPlantRequests(filters: SearchParams): Promise<PlantRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("plant_collection_requests")
    .select(
      "id, request_no, plant_type, quantity, plant_size, pickup_address, desired_pickup_date, desired_pickup_time_slot, customer_name, customer_phone, status, payback_amount, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
  }
  if (filters.region) query = query.ilike("pickup_address", `%${filters.region}%`);
  // eventType/status 필터는 화환 전용 값이라 화분에는 적용하지 않음 (화분은 항상 노출)

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PlantRow[];
}

async function getUnifiedRows(filters: SearchParams): Promise<UnifiedRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const [wreathRows, plantRows] = await Promise.all([
      getWreathRequests(filters).catch((e) => {
        console.error("[admin requests - wreath]", e);
        return [] as EstimateRequestRow[];
      }),
      getPlantRequests(filters).catch((e) => {
        console.error("[admin requests - plant]", e);
        return [] as PlantRow[];
      }),
    ]);

    const unified: UnifiedRow[] = [
      ...wreathRows.map((r) => ({
        kind: "wreath" as const,
        id: r.id,
        requestNo: r.request_no,
        createdAt: r.created_at,
        customerName: r.customers?.name ?? "-",
        customerPhone: r.customers?.phone ?? "-",
        category: EVENT_TYPE_LABEL[r.event_type as EventType],
        region: r.address?.split(" ").slice(0, 2).join(" ") ?? "-",
        quantityLabel: QUANTITY_RANGE_LABEL[r.quantity_range as QuantityRange],
        paybackAmount: r.customer_payback_amount ?? 0,
        scheduleLabel: `${r.pickup_date} · ${r.pickup_time_slot}`,
        wreathRaw: r,
      })),
      ...plantRows.map((p) => ({
        kind: "plant" as const,
        id: p.id,
        requestNo: p.request_no,
        createdAt: p.created_at,
        customerName: p.customer_name,
        customerPhone: p.customer_phone,
        category: p.plant_type,
        region: p.pickup_address?.split(" ").slice(0, 2).join(" ") ?? "-",
        quantityLabel: `${p.quantity}개 · ${p.plant_size}`,
        paybackAmount: p.payback_amount ?? 0,
        scheduleLabel: p.desired_pickup_date
          ? `${p.desired_pickup_date}${p.desired_pickup_time_slot ? " · " + p.desired_pickup_time_slot : ""}`
          : "-",
        plantStatus: p.status,
      })),
    ];

    unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return unified;
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
  const rows = await getUnifiedRows(filters);
  const configured = isSupabaseConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">신청목록</h1>
        <span className="text-[13px] text-muted">총 {rows.length}건 (화환 + 개업화분 회수)</span>
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
        <table className="w-full min-w-[1350px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <Th>구분</Th>
              <Th>신청번호</Th>
              <Th>신청일</Th>
              <Th>고객명</Th>
              <Th>연락처</Th>
              <Th>종류</Th>
              <Th>지역</Th>
              <Th>수량</Th>
              <Th>예상 페이백</Th>
              <Th>희망일시</Th>
              <Th>현재상태</Th>
              <Th>관리</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted">
                  표시할 신청 건이 없어요.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={`${r.kind}-${r.id}`} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      r.kind === "wreath" ? "bg-brand-tint text-brand-dark" : "bg-[#E7EBE4] text-[#102A22]"
                    }`}
                  >
                    {r.kind === "wreath" ? "화환" : "화분"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.kind === "wreath" ? (
                    <Link href={`/admin/requests/${r.id}`} className="font-medium text-brand-dark">
                      {r.requestNo}
                    </Link>
                  ) : (
                    <span className="font-medium text-[#102A22]">{r.requestNo}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">{r.customerName}</td>
                <td className="px-4 py-3 text-muted">{r.customerPhone}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3 text-muted">{r.region}</td>
                <td className="px-4 py-3">{r.quantityLabel}</td>
                <td className="px-4 py-3 tabular-nums">{formatKRW(r.paybackAmount)}</td>
                <td className="px-4 py-3 text-muted">{r.scheduleLabel}</td>
                <td className="px-4 py-3">
                  {r.kind === "wreath" && r.wreathRaw ? (
                    <RequestQuickActions
                      requestId={r.id}
                      status={r.wreathRaw.status as RequestStatus}
                      customerPaybackAmount={r.wreathRaw.customer_payback_amount}
                    />
                  ) : (
                    <PlantQuickActions
                      requestId={r.id}
                      status={r.plantStatus ?? "received"}
                      paybackAmount={r.paybackAmount}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.kind === "wreath" ? (
                    <DeleteRequestButton requestId={r.id} requestNo={r.requestNo} />
                  ) : (
                    <span className="text-[12px] text-muted-light">-</span>
                  )}
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
