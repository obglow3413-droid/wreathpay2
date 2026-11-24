"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/faq";

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
