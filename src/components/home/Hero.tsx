"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useServiceTab, type ServiceKey } from "./ServiceTabContext";
import { SERVICE_CONTENT, SERVICE_ORDER } from "./serviceContent";
import SmallQuantitySheet from "./SmallQuantitySheet";

export default function Hero() {
  const { active, setActive } = useServiceTab();
  // 처음 한 번은 순차 등장(fade-up)을, 그 이후 탭 전환은 짧은 tab-fade를 쓰기 위한 플래그
  const [hasInteracted, setHasInteracted] = useState(false);
  const content = SERVICE_CONTENT[active];
  const transitionClass = hasInteracted ? "tab-fade" : "fade-up";
  const activeIndex = SERVICE_ORDER.indexOf(active);

  function handleTabChange(next: ServiceKey) {
    setHasInteracted(true);
    setActive(next);
  }

  return (
    <section>
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-16">
        {/* 상단 탭: 개업·축하화환 / 근조화환 (선택 시 테마 전체가 전환됨) */}
        <div
          role="tablist"
          aria-label="화환 종류"
          className="relative mx-auto flex max-w-[340px] rounded-full border border-line bg-paper p-1 md:mx-0"
        >
          <div
            className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-forest transition-transform duration-300 ease-out"
            style={{ transform: activeIndex === 0 ? "translateX(0%)" : "translateX(100%)" }}
          />
          {SERVICE_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => handleTabChange(key)}
              className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors duration-200 ${
                active === key ? "text-ivory" : "text-muted"
              }`}
            >
              {SERVICE_CONTENT[key].tabLabel}
            </button>
          ))}
        </div>

        <div className="mt-8 md:min-h-[420px] md:max-w-[640px]">
          {/* 왼쪽: 헤드라인 → 설명 → CTA 순으로 등장(첫 진입에만 스태거) */}
          <div key={`copy-${active}`}>
            <p
              className={`${transitionClass} flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-brass`}
            >
              <span className="brass-line h-px w-6 bg-brass" />
              {content.badge}
            </p>

            <h1
              className={`${transitionClass} mt-4 break-keep text-[32px] font-extrabold leading-[1.22] tracking-tight text-foreground md:text-[56px] md:leading-[1.14]`}
              style={!hasInteracted ? { animationDelay: "90ms" } : undefined}
            >
              {content.titleLines[0]}
              <br />
              {content.titleLines[1]}
            </h1>

            <p
              className={`${transitionClass} mt-5 break-keep text-[15px] leading-relaxed text-muted md:text-[16.5px]`}
              style={!hasInteracted ? { animationDelay: "180ms" } : undefined}
            >
              {content.desc[0]}
              <br className="hidden md:block" /> {content.desc[1]}
            </p>

            <div
              className={`${transitionClass} mt-8`}
              style={!hasInteracted ? { animationDelay: "270ms" } : undefined}
            >
              <Link
                href={content.ctaHref}
                className="hover-lift group flex h-[56px] w-full items-center justify-center gap-1.5 rounded-[14px] bg-forest px-7 text-[16px] font-bold text-ivory md:inline-flex md:w-auto"
              >
                {content.ctaLabel}
                <ChevronRight size={17} strokeWidth={2.4} className="hover-arrow" />
              </Link>
            </div>

            <p className="mt-4 text-[12.5px] text-muted">{content.footNote}</p>
            <SmallQuantitySheet ctaHref={content.ctaHref} />
          </div>

        </div>
      </div>
    </section>
  );
}
