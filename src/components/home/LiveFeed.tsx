import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";
import CountUpNumber from "./CountUpNumber";
import LiveTicker, { type TickerItem } from "./LiveTicker";

interface FeedData {
  items: TickerItem[];
  todayCount: number;
  weekCount: number;
}

/** 주소에서 "시/도 + 구/군" 정도까지만 노출 (개인정보 보호, 상세주소는 제외) */
function toRegionLabel(address: string): string {
  const parts = address.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(" ") || "수도권";
}

function toRelativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

async function getFeed(): Promise<FeedData> {
  const empty: FeedData = { items: [], todayCount: 0, weekCount: 0 };
  if (!isServiceRoleConfigured()) return empty;

  try {
    const supabase = await createServiceRoleClient();
    const startOfDay = new Date(Date.now() + 9 * 3600 * 1000);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const todayIso = new Date(startOfDay.getTime() - 9 * 3600 * 1000).toISOString();
    const weekIso = new Date(Date.now() - 7 * 86400000).toISOString();

    const [{ data }, { count: todayCount }, { count: weekCount }] = await Promise.all([
      supabase
        .from("estimate_requests")
        .select("id, event_type, quantity_range, address, customer_payback_amount, created_at, status")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("estimate_requests")
        .select("id", { count: "exact", head: true })
        .neq("status", "cancelled")
        .gte("created_at", todayIso),
      supabase
        .from("estimate_requests")
        .select("id", { count: "exact", head: true })
        .neq("status", "cancelled")
        .gte("created_at", weekIso),
    ]);

    return {
      todayCount: todayCount ?? 0,
      weekCount: weekCount ?? 0,
      items: (data ?? []).map((row) => ({
        id: row.id,
        kind: row.event_type === "funeral" ? ("funeral" as const) : ("celebration" as const),
        title: `${toRegionLabel(row.address)} · ${EVENT_TYPE_LABEL[row.event_type as EventType]}`,
        sub: `${QUANTITY_RANGE_LABEL[row.quantity_range as QuantityRange]} · ${toRelativeTime(row.created_at)}`,
        amount: row.customer_payback_amount ?? 0,
      })),
    };
  } catch (e) {
    console.error("[LiveFeed]", e);
    return empty;
  }
}

export default async function LiveFeed() {
  const { items, todayCount, weekCount } = await getFeed();

  return (
    <section className="border-t border-line bg-ivory">
      <div className="mx-auto max-w-[1120px] px-5 py-12 md:px-8 md:py-16">
        <div className="md:grid md:grid-cols-[2fr_3fr] md:items-center md:gap-14">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brass" />
              </span>
              <p className="text-[12.5px] font-semibold tracking-wide text-brass">LIVE</p>
            </div>
            <h2 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[28px]">
              지금도 화환 수거
              <br />
              신청이 들어오고 있어요
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                <p className="text-[12px] text-muted">오늘 접수</p>
                <p className="mt-1 text-[26px] font-extrabold leading-none">
                  <CountUpNumber value={todayCount} suffix="건" />
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                <p className="text-[12px] text-muted">최근 7일</p>
                <p className="mt-1 text-[26px] font-extrabold leading-none">
                  <CountUpNumber value={weekCount} suffix="건" />
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-muted-light">개인정보는 표시하지 않아요.</p>
          </div>

          <div className="mt-8 md:mt-0">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-line bg-paper px-5 py-10 text-center text-[14px] text-muted">
                아직 접수된 신청이 없어요. 첫 번째 신청자가 되어보세요!
              </p>
            ) : (
              <LiveTicker items={items} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
