"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EventType, QuantityRange } from "@/lib/types";
import { QUANTITY_RANGE_LABEL } from "@/lib/types";
import {
  GRADE_LABELS,
  PUBLIC_GRADE_UNIT_PRICES,
  QUANTITY_TIER_BOUNDS,
  formatKRW,
} from "@/lib/pricing";

interface WreathTypeItem {
  label: string;
  eventType: EventType;
}

const TYPES: WreathTypeItem[] = [
  { label: "장례식 근조화환", eventType: "funeral" },
  { label: "결혼식 축하화환", eventType: "wedding" },
  { label: "개업화환", eventType: "opening" },
  { label: "기업행사 화환", eventType: "corporate" },
  { label: "생화화환", eventType: "etc" },
  { label: "조화화환", eventType: "etc" },
];

const QUANTITY_KEYS = Object.keys(QUANTITY_RANGE_LABEL) as QuantityRange[];

export default function WreathTypes() {
  const [typeIndex, setTypeIndex] = useState(0);
  const [gradeCode, setGradeCode] = useState<(typeof GRADE_LABELS)[number]["code"]>("a");

  const activeType = TYPES[typeIndex];
  const activeGrade = useMemo(
    () => GRADE_LABELS.find((g) => g.code === gradeCode)!,
    [gradeCode]
  );
  const unitPrice = PUBLIC_GRADE_UNIT_PRICES[gradeCode];

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <h2 className="text-[24px] font-bold md:text-[30px]">매입 가능한 화환</h2>
        <p className="mt-2 text-[13.5px] text-muted">
          화환 종류와 상태를 선택하면 수량 구간별 예상 시세를 바로 확인할 수 있어요.
        </p>

        {/* 1. 화환 종류 탭 */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {TYPES.map((type, i) => {
            const isActive = i === typeIndex;
            return (
              <button
                key={type.label}
                type="button"
                onClick={() => setTypeIndex(i)}
                aria-pressed={isActive}
                className={`rounded-xl border px-4 py-5 text-left text-[14.5px] font-medium transition ${
                  isActive
                    ? "border-brand bg-brand-tint text-brand-dark"
                    : "border-border bg-white text-foreground hover:border-brand/40 active:bg-surface"
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* 2. 시세 분석 패널 */}
        <div className="fade-up mt-6 rounded-2xl border border-brand/30 bg-white p-6 md:p-8">
          <p className="text-[13px] font-semibold text-brand">{activeType.label} 예상 시세표</p>

          {/* 상태(등급) 선택 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {GRADE_LABELS.map((g) => {
              const isActive = g.code === gradeCode;
              return (
                <button
                  key={g.code}
                  type="button"
                  onClick={() => setGradeCode(g.code)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
                    isActive
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-white text-muted hover:border-brand/40"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] text-muted-light">{activeGrade.desc}</p>

          {/* 수량 구간별 예상 시세 테이블 */}
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">수량</th>
                  <th className="px-4 py-2.5 font-medium">예상 매입가 (합계)</th>
                </tr>
              </thead>
              <tbody>
                {QUANTITY_KEYS.map((key) => {
                  const bounds = QUANTITY_TIER_BOUNDS[key];
                  const minTotal = unitPrice * bounds.min;
                  const maxTotal = bounds.max ? unitPrice * bounds.max : null;
                  return (
                    <tr key={key} className="border-t border-border transition-colors hover:bg-surface/60">
                      <td className="px-4 py-3">{QUANTITY_RANGE_LABEL[key]}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-brand-dark">
                        {maxTotal
                          ? `${formatKRW(minTotal)} ~ ${formatKRW(maxTotal)}`
                          : `${formatKRW(minTotal)} 이상`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[12px] text-muted-light">
            * 참고용 예상 시세이며, 실제 매입가는 현장 상태와 최종 수량 확인 후 결정돼요.
          </p>

          <Link
            href={`/estimate?eventType=${activeType.eventType}`}
            className="hover-lift mt-6 flex h-13 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,157,104,0.55)] md:inline-flex md:w-fit"
          >
            {activeType.label}으로 즉시 캐시백 받기
          </Link>
        </div>
      </div>
    </section>
  );
}
