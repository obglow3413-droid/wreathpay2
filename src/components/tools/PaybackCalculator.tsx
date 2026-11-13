"use client";

import { useState } from "react";
import Link from "next/link";
import { suggestPayback } from "@/lib/pricing";

const KINDS = [
  { id: "funeral", label: "근조화환", href: "/estimate?eventType=funeral" },
  { id: "wedding", label: "결혼식", href: "/estimate?eventType=wedding" },
  { id: "opening", label: "개업·행사", href: "/estimate?eventType=opening" },
] as const;
const man = (n: number) => (n >= 10000 ? `${(n / 10000).toLocaleString("ko-KR")}만원` : `${n.toLocaleString("ko-KR")}원`);

/** 종류와 개수만 고르면 시세표 기준 예상 페이백 범위를 바로 보여준다(사진 견적 전 참고용). */
export default function PaybackCalculator({ defaultKind = "funeral" }: { defaultKind?: (typeof KINDS)[number]["id"] }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>(defaultKind);
  const [count, setCount] = useState(12);
  const s = suggestPayback(kind, "", count);
  const k = KINDS.find((x) => x.id === kind)!;
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="text-[15px] font-bold">내 화환, 얼마쯤 받을까요?</p>
      <div className="mt-3 flex gap-2">
        {KINDS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setKind(x.id)}
            className={`h-9 flex-1 rounded-full border text-[13px] font-semibold ${kind === x.id ? "border-forest bg-forest text-ivory" : "border-line bg-ivory text-muted"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13px] text-muted">화환 개수</span>
        <span className="text-[18px] font-extrabold tabular-nums">{count >= 50 ? "50개 이상" : `${count}개`}</span>
      </div>
      <input
        type="range"
        min={1}
        max={50}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--brass)]"
        aria-label="화환 개수"
      />
      <div className="mt-4 rounded-xl bg-ivory px-4 py-3.5 text-center">
        <p className="text-[12px] text-muted">예상 페이백</p>
        <p className="mt-0.5 text-[22px] font-extrabold tabular-nums">
          {!s ? "별도 견적" : s.high === 0 ? "무료회수 상담" : s.low === 0 ? `~${man(s.high)}` : `${man(s.low)} ~ ${man(s.high)}`}
        </p>
        <p className="mt-1 text-[11px] text-muted-light">시세표 기준 참고 범위예요. 실제 금액은 화환 상태에 따라 수거 후 확정돼요.</p>
      </div>
      <Link href={k.href} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[14.5px] font-semibold text-white">
        사진 올리고 정확한 금액 확인하기
      </Link>
    </div>
  );
}
