"use client";

import CountUpAmount from "./CountUpAmount";

export interface TickerItem {
  id: string;
  kind: "funeral" | "celebration";
  title: string;
  sub: string;
  amount: number;
}

/**
 * 실시간 접수 티커: 최신 접수 건이 아래에서 위로 천천히 흐른다.
 * 마우스를 올리거나 터치하면 멈추고, 모션 최소화 환경에서는 정지된 목록으로 보인다.
 * 4건 미만이면 흐르지 않고 그대로 보여준다.
 */
export default function LiveTicker({ items }: { items: TickerItem[] }) {
  const scroll = items.length >= 4;
  const list = scroll ? [...items, ...items] : items;

  return (
    <div
      className="ticker-mask relative h-[268px] overflow-hidden"
      aria-label="실시간 접수 내역"
    >
      <ul className={`space-y-2.5 ${scroll ? "ticker-track" : ""}`} style={{ ["--ticker-count" as string]: items.length }}>
        {list.map((row, i) => (
          <li
            key={`${row.id}-${i}`}
            aria-hidden={i >= items.length ? true : undefined}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 rounded-full bg-brand-tint px-1.5 py-0.5 text-[9.5px] font-bold text-foreground">
                  {row.kind === "funeral" ? "근조" : "축하"}
                </span>
                <p className="truncate text-[13.5px] font-semibold">{row.title}</p>
              </div>
              <p className="mt-0.5 text-[12px] text-muted-light">{row.sub}</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-[11.5px] font-semibold text-foreground">
              {row.amount > 0 ? <CountUpAmount amount={row.amount} /> : "확인중"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
