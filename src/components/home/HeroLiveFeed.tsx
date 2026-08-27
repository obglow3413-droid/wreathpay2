import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";
import { formatKRW } from "@/lib/pricing";

interface FeedRow {
  id: string;
  event_type: EventType;
  quantity_range: QuantityRange;
  address: string;
  customer_payback_amount: number;
  created_at: string;
}

function toRegionLabel(address: string): string {
  const parts = address.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(" ") || "수도권";
}

function toRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

async function getRecentRequests(): Promise<FeedRow[]> {
  if (!isServiceRoleConfigured()) return [];
  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("estimate_requests")
      .select("id, event_type, quantity_range, address, customer_payback_amount, created_at")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) throw error;
    return (data ?? []) as FeedRow[];
  } catch (e) {
    console.error("[HeroLiveFeed]", e);
    return [];
  }
}

export default async function HeroLiveFeed() {
  const rows = await getRecentRequests();

  return (
    <div className="fade-up mt-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
        <p className="text-[13px] font-semibold">실시간 접수현황</p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-muted">
          아직 접수된 신청이 없어요. 첫 번째 신청자가 되어보세요!
        </p>
      ) : (
        <div className="mt-2.5 space-y-1.5">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="min-w-0 truncate text-muted">
                {toRegionLabel(row.address)} · {EVENT_TYPE_LABEL[row.event_type]} ·{" "}
                {QUANTITY_RANGE_LABEL[row.quantity_range]}
              </span>
              <span className="shrink-0 font-semibold text-brand-dark">
                {row.customer_payback_amount > 0 ? formatKRW(row.customer_payback_amount) : "진행중"}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-right text-[10.5px] text-muted-light">
        {rows[0] ? toRelativeTime(rows[0].created_at) : ""}
      </p>
    </div>
  );
}
