import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";
import CountUpNumber from "./CountUpNumber";
import CountUpAmount from "./CountUpAmount";
import { MANUAL_WEEK_STATS, SIMULATED_RETURNED, getSimulatedReturnedAmount } from "@/lib/homeStats";
import LiveTicker, { type TickerItem } from "./LiveTicker";

interface FeedData {
  items: TickerItem[];
  todayCount: number;
  weekCount: number;
  returnedAmount: number;
  returnedCount: number;
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

/** 시연용 예시 데이터. 날짜별로 같은 값이 나오도록 시드 기반으로 만들며, 화면에 "예시 데이터"를 반드시 표시한다. */
function getDemoFeed(): FeedData {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  let seed = kst.getUTCFullYear() * 10000 + (kst.getUTCMonth() + 1) * 100 + kst.getUTCDate();
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  const regions = ["서울 송파구", "서울 강남구", "경기 성남시", "서울 서초구", "경기 고양시", "인천 연수구", "서울 마포구", "경기 용인시"];
  const types: { kind: "funeral" | "celebration"; label: string }[] = [
    { kind: "funeral", label: "장례식" },
    { kind: "celebration", label: "결혼식" },
    { kind: "celebration", label: "개업식" },
    { kind: "funeral", label: "장례식" },
    { kind: "celebration", label: "기업행사" },
  ];
  const quantities = ["1~4개", "5~9개", "10~29개", "5~9개", "30~49개"];

  const items: TickerItem[] = regions.map((region, i) => {
    const t = types[i % types.length];
    return {
      id: `demo-${i}`,
      kind: t.kind,
      title: `${region} · ${t.label}`,
      sub: `${quantities[between(0, quantities.length - 1)]} · ${between(2, 55)}분 전`,
      amount: between(18, 190) * 1000,
    };
  });

  const todayCount = between(30, 50);
  return {
    items,
    todayCount,
    weekCount: todayCount * 6 + between(0, 40),
    returnedAmount: between(180, 260) * 100000,
    returnedCount: between(310, 420),
  };
}

async function getFeed(): Promise<FeedData> {
  const empty: FeedData = { items: [], todayCount: 0, weekCount: 0, returnedAmount: 0, returnedCount: 0 };
  if (!isServiceRoleConfigured()) return empty;

  try {
    const supabase = await createServiceRoleClient();
    const startOfDay = new Date(Date.now() + 9 * 3600 * 1000);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const todayIso = new Date(startOfDay.getTime() - 9 * 3600 * 1000).toISOString();
    const weekIso = new Date(Date.now() - 7 * 86400000).toISOString();

    const [{ data }, { count: todayCount }, { count: weekCount }, { data: returned }] = await Promise.all([
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
      // 실제로 수거가 끝난(수거완료·정산완료) 건의 페이백 합계 = 지금까지 돌려드린 금액
      supabase
        .from("estimate_requests")
        .select("customer_payback_amount")
        .in("status", ["collected", "settled"])
        .limit(5000),
    ]);

    const returnedRows = returned ?? [];
    const returnedAmount = returnedRows.reduce((sum, r) => sum + (r.customer_payback_amount ?? 0), 0);

    return {
      todayCount: todayCount ?? 0,
      weekCount: weekCount ?? 0,
      returnedAmount,
      returnedCount: returnedRows.length,
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

export default async function LiveFeed({ demo = false }: { demo?: boolean }) {
  const feed = demo ? getDemoFeed() : await getFeed();
  const { items, todayCount, returnedCount } = feed;
  const weekCount = demo ? feed.weekCount : Math.max(feed.weekCount, MANUAL_WEEK_STATS.weekCount);
  // 운영자가 확인한 최근 7일 실적이 설정돼 있으면 DB 누적값 대신 그 값을 그대로 표시
  const simulated = !demo && SIMULATED_RETURNED.enabled;
  const manualAmount = !demo && (simulated || MANUAL_WEEK_STATS.returnedAmount > 0);
  const returnedAmount = simulated
    ? getSimulatedReturnedAmount()
    : manualAmount
      ? MANUAL_WEEK_STATS.returnedAmount
      : feed.returnedAmount;

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
              <p className="text-[12.5px] font-semibold tracking-wide text-brass">{demo ? "DEMO" : "LIVE"}</p>
              {demo && (
                <span className="rounded-full border border-brass px-2 py-0.5 text-[10.5px] font-bold text-brass">
                  예시 데이터 · 실제 접수 현황이 아닙니다
                </span>
              )}
            </div>
            <h2 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[28px]">
              지금도 화환 수거
              <br />
              신청이 들어오고 있어요
            </h2>

            {/* 실제 데이터가 있는 항목만 노출 (0건·0원은 보여주지 않음) */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {returnedAmount > 0 && (
                <div className="col-span-2 rounded-2xl border border-line bg-paper px-4 py-4">
                  <p className="text-[12px] text-muted">{manualAmount ? "최근 7일간 돌려드린 금액" : "지금까지 돌려드린 금액"}</p>
                  <p className="mt-1 text-[28px] font-extrabold leading-none">
                    <CountUpAmount amount={returnedAmount} />
                  </p>
                  <p className="mt-1.5 text-[11.5px] text-muted-light">{manualAmount ? "최근 7일 기준" : `수거 완료 ${returnedCount}건 기준`}</p>
                </div>
              )}
              {todayCount > 0 && (
                <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                  <p className="text-[12px] text-muted">오늘 접수</p>
                  <p className="mt-1 text-[26px] font-extrabold leading-none">
                    <CountUpNumber value={todayCount} suffix="건" />
                  </p>
                </div>
              )}
              {weekCount > 0 && (
                <div className="rounded-2xl border border-line bg-paper px-4 py-4">
                  <p className="text-[12px] text-muted">최근 7일</p>
                  <p className="mt-1 text-[26px] font-extrabold leading-none">
                    <CountUpNumber value={weekCount} suffix="건" />
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-[12px] text-muted-light">
              {demo
                ? "시연용 샘플 숫자입니다. 실제 서비스 화면에는 표시되지 않아요."
                : simulated
                  ? "※ 시범 운영 중 예시 수치이며 실제 정산 금액이 아닙니다. 개인정보는 표시하지 않아요."
                  : "개인정보는 표시하지 않아요."}
            </p>
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
