import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";
import { formatKRW } from "@/lib/pricing";

interface FeedItem {
  id: string;
  kind: "wreath" | "plant";
  titleLabel: string;
  subLabel: string;
  paybackAmount: number;
  createdAt: string;
}

/** 주소에서 "시/도 + 구/군" 정도까지만 노출 (개인정보 보호, 상세주소는 제외) */
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

async function getRecentItems(): Promise<FeedItem[]> {
  if (!isServiceRoleConfigured()) return [];

  try {
    const supabase = await createServiceRoleClient();

    const [wreathResult, plantResult] = await Promise.all([
      supabase
        .from("estimate_requests")
        .select("id, event_type, quantity_range, address, customer_payback_amount, created_at, status")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("plant_collection_requests")
        .select("id, plant_type, quantity, plant_size, pickup_address, payback_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const wreathItems: FeedItem[] = (wreathResult.data ?? []).map((row) => ({
      id: row.id,
      kind: "wreath" as const,
      titleLabel: `${toRegionLabel(row.address)} · ${EVENT_TYPE_LABEL[row.event_type as EventType]}`,
      subLabel: `${QUANTITY_RANGE_LABEL[row.quantity_range as QuantityRange]} · ${toRelativeTime(row.created_at)}`,
      paybackAmount: row.customer_payback_amount ?? 0,
      createdAt: row.created_at,
    }));

    const plantItems: FeedItem[] = (plantResult.data ?? []).map((row) => ({
      id: row.id,
      kind: "plant" as const,
      titleLabel: `${toRegionLabel(row.pickup_address)} · ${row.plant_type}`,
      subLabel: `${row.quantity}개 · ${row.plant_size} · ${toRelativeTime(row.created_at)}`,
      paybackAmount: row.payback_amount ?? 0,
      createdAt: row.created_at,
    }));

    return [...wreathItems, ...plantItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  } catch (e) {
    console.error("[LiveFeed]", e);
    return [];
  }
}

export default async function LiveFeed() {
  const rows = await getRecentItems();

  if (rows.length === 0) {
    return (
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <h2 className="text-[20px] font-bold md:text-[24px]">실시간 접수 현황</h2>
          </div>
          <p className="mt-4 text-[14px] text-muted">
            아직 접수된 신청이 없어요. 첫 번째 신청자가 되어보세요!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border bg-white">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <h2 className="text-[20px] font-bold md:text-[24px]">실시간 접수 현황</h2>
        </div>
        <p className="mt-2 text-[13.5px] text-muted">
          방금 접수된 화환·화분 신청 내역이에요. (개인정보는 표시하지 않아요)
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {rows.map((row, i) => (
            <div
              key={`${row.kind}-${row.id}`}
              className="fade-up group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-border bg-surface px-4 py-3.5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {/* 카드가 나타날 때 왼쪽에서 오른쪽으로 살짝 스치는 하이라이트 */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-tint/60 to-transparent"
                style={{ animation: `shimmer 1.1s ease-out ${i * 90 + 120}ms forwards` }}
              />
              <div className="relative min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={
                      row.kind === "wreath"
                        ? { backgroundColor: "#E3F6EF", color: "#00A878" }
                        : { backgroundColor: "#F3E8DD", color: "#8B5A2B" }
                    }
                  >
                    {row.kind === "wreath" ? "화환" : "화분"}
                  </span>
                  <p className="truncate text-[13.5px] font-semibold">{row.titleLabel}</p>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-light">{row.subLabel}</p>
              </div>
              <span className="relative shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-[11.5px] font-semibold text-brand-dark">
                {row.paybackAmount > 0 ? formatKRW(row.paybackAmount) : "확인중"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
