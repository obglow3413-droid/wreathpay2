"use client";

import Link from "next/link";
import { useServiceTab } from "./ServiceTabContext";

const PRINCIPLES = [
  "30개 이상도 한 번에 수거해 드려요",
  "수량·상태 확인 후 금액을 안내하고, 수거 확인 뒤 정산합니다",
  "장례식장 · 예식장 · 개업 · 기업행사 모두 가능합니다",
];

export default function BulkSection() {
  const { active } = useServiceTab();
  const bulkHref = `/estimate?bulk=1&eventType=${active === "funeral" ? "funeral" : "opening"}`;

  return (
    <section className="bg-inverse-bg py-14 text-inverse-fg md:py-20">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">BULK</p>
        <h2 className="mt-2 text-[22px] font-bold leading-snug md:text-[28px]">
          행사장 전체 화환,
          <br className="md:hidden" /> 한 번에 정리해 드려요.
        </h2>

        <ul className="mt-7 space-y-3 border-t border-current/15 pt-6 text-[14.5px] opacity-90">
          {PRINCIPLES.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass" />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href={bulkHref}
          className="hover-lift mt-8 inline-flex h-12 items-center rounded-[14px] bg-inverse-fg px-6 text-[14.5px] font-semibold text-inverse-bg"
        >
          대량수거 문의하기
        </Link>
      </div>
    </section>
  );
}
