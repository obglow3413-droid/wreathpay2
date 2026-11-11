import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  QUANTITY_RANGE_LABEL,
  EVENT_TYPE_LABEL,
  type EventType,
  type QuantityRange,
  type RequestStatus,
} from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  request_no: string;
  event_type: EventType;
  quantity_range: QuantityRange;
  place_name: string;
  address: string;
  pickup_date: string;
  pickup_time_slot: string;
  status: RequestStatus;
  customers?: { name: string; phone: string } | { name: string; phone: string }[] | null;
}

const DONE: RequestStatus[] = ["collected", "settled", "cancelled"];
const SLOT_ORDER = ["오전", "오후", "저녁", "시간 협의"];

function todayKst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function regionOf(address: string): string {
  return address.trim().split(/\s+/).slice(0, 2).join(" ") || "지역 미상";
}

function dayLabel(date: string, today: string): string {
  const diff = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000);
  const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(date + "T00:00:00+09:00").getDay()];
  const rel = diff === 0 ? "오늘" : diff === 1 ? "내일" : diff < 0 ? `${-diff}일 지남` : `${diff}일 후`;
  return `${date} (${wd}) · ${rel}`;
}

async function getRows(): Promise<Row[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("estimate_requests")
      .select(
        "id, request_no, event_type, quantity_range, place_name, address, pickup_date, pickup_time_slot, status, customers(name, phone)"
      )
      .not("status", "in", `(${DONE.join(",")})`)
      .order("pickup_date", { ascending: true })
      .limit(300);
    if (error) throw error;
    return (data ?? []) as unknown as Row[];
  } catch (e) {
    console.error("[admin schedule]", e);
    return [];
  }
}

export default async function SchedulePage() {
  const rows = await getRows();
  const today = todayKst();

  // 날짜 → 지역 → 건 목록
  const byDate = new Map<string, Map<string, Row[]>>();
  for (const r of rows) {
    const regions = byDate.get(r.pickup_date) ?? new Map<string, Row[]>();
    const region = regionOf(r.address);
    regions.set(region, [...(regions.get(region) ?? []), r]);
    byDate.set(r.pickup_date, regions);
  }
  const dates = [...byDate.keys()].sort();
  const overdueCount = rows.filter((r) => r.pickup_date < today).length;
  const todayCount = rows.filter((r) => r.pickup_date === today).length;
  const upcomingCount = rows.filter((r) => r.pickup_date > today).length;

  return (
    <div>
      <h1 className="text-[20px] font-bold">수거 일정 보드</h1>
      <p className="mt-1 text-[13px] text-muted">
        수거 전(수거완료·정산·취소 제외) 신청을 날짜와 지역별로 묶어 보여줘요. 배차 동선을 짤 때 쓰세요.
      </p>

      <div className="mt-5 grid max-w-xl grid-cols-3 gap-3">
        <Summary label="기한 지남" value={overdueCount} tone={overdueCount > 0 ? "danger" : "normal"} />
        <Summary label="오늘 수거" value={todayCount} />
        <Summary label="예정" value={upcomingCount} />
      </div>

      {dates.length === 0 && (
        <p className="mt-8 rounded-xl border border-border bg-white px-5 py-10 text-center text-[13.5px] text-muted">
          수거 대기 중인 신청이 없어요.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {dates.map((date) => {
          const regions = byDate.get(date)!;
          const total = [...regions.values()].reduce((n, list) => n + list.length, 0);
          const overdue = date < today;
          return (
            <section key={date} className="rounded-xl border border-border bg-white">
              <header
                className={`flex items-center justify-between rounded-t-xl px-5 py-3 ${
                  overdue ? "bg-red-50 text-red-700" : date === today ? "bg-brand-tint text-brand-dark" : "bg-surface"
                }`}
              >
                <h2 className="text-[14px] font-bold">{dayLabel(date, today)}</h2>
                <span className="text-[12.5px] font-semibold">{total}건</span>
              </header>

              <div className="divide-y divide-border">
                {[...regions.entries()]
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([region, list]) => {
                    const sorted = [...list].sort(
                      (a, b) => SLOT_ORDER.indexOf(a.pickup_time_slot) - SLOT_ORDER.indexOf(b.pickup_time_slot)
                    );
                    return (
                      <div key={region} className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold">
                          {region} <span className="text-muted">· {list.length}건</span>
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {sorted.map((r) => {
                            const c = Array.isArray(r.customers) ? r.customers[0] : r.customers;
                            return (
                              <li
                                key={r.id}
                                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]"
                              >
                                <span className="w-12 shrink-0 font-semibold">{r.pickup_time_slot}</span>
                                <Link href={`/admin/requests/${r.id}`} className="font-medium text-brand-dark">
                                  {r.request_no}
                                </Link>
                                <span className="text-muted">
                                  {EVENT_TYPE_LABEL[r.event_type]} · {QUANTITY_RANGE_LABEL[r.quantity_range]}
                                </span>
                                <span className="min-w-0 truncate text-muted">{r.place_name}</span>
                                {c?.phone && <span className="tabular-nums text-muted-light">{c.phone}</span>}
                                <StatusBadge status={r.status} />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Summary({ label, value, tone = "normal" }: { label: string; value: number; tone?: "normal" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`mt-1 text-[22px] font-extrabold tabular-nums ${tone === "danger" ? "text-red-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
