"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "화환 1개도 수거 가능한가요?",
    a: "가능합니다. 다만 1~4개는 지역과 일정에 따라 공동수거로 진행되거나 일정 협의가 필요할 수 있어요.",
  },
  {
    q: "언제 신청해야 하나요?",
    a: "행사 종료 예정 시점에 맞춰 미리 신청하시면 원활한 일정 조율이 가능합니다. 행사 종료 직후 신청도 가능해요.",
  },
  {
    q: "매입가격은 어떻게 결정되나요?",
    a: "화환의 종류, 생화/조화 여부, 상태, 수량을 종합적으로 확인해 등급을 산정하고 그에 따라 매입가가 결정됩니다.",
  },
  {
    q: "생화와 조화 모두 가능한가요?",
    a: "네, 생화화환과 조화화환 모두 매입 대상입니다. 상태에 따라 매입가가 달라질 수 있어요.",
  },
  {
    q: "수거 후 언제 입금되나요?",
    a: "현장 최종 검수 후 정산 절차에 따라 안내드리며, 조건 충족 시 일부 금액은 예약 선지급도 가능합니다.",
  },
  {
    q: "장례식장 또는 웨딩홀에서도 수거 가능한가요?",
    a: "가능합니다. 다만 시설 내부 반출 규정에 따라 수거 가능 여부와 시간이 제한될 수 있어 사전 확인이 필요해요.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <h2 className="text-[24px] font-bold md:text-[30px]">자주 묻는 질문</h2>
        <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-white">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface/60"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14.5px] font-medium">{item.q}</span>
                  <span
                    className={`shrink-0 text-lg text-muted transition-transform duration-200 ${
                      isOpen ? "rotate-45 text-brand" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="px-5 pb-4 text-[14px] leading-relaxed text-muted">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
