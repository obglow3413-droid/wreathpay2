"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";
import { useServiceTab, type ServiceKey } from "./ServiceTabContext";
import { SERVICE_CONTENT, SERVICE_ORDER } from "./serviceContent";

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
    <section className="bg-ivory">
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

        <div className="mt-8 md:grid md:min-h-[520px] md:grid-cols-[55fr_45fr] md:items-center md:gap-14">
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
          </div>

          {/* 오른쪽(PC) / 아래(모바일): 사진 견적 카드 */}
          <div
            key={`card-${active}`}
            className={`${transitionClass} mt-8 md:mt-0`}
            style={!hasInteracted ? { animationDelay: "360ms" } : undefined}
          >
            <Link
              href={content.ctaHref}
              className="hover-lift block rounded-[20px] border border-line bg-paper p-6 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.35)] md:p-8"
            >
              <p className="text-[15.5px] font-bold text-foreground md:text-[17px]">{content.cardTitle}</p>
              <p className="mt-1.5 text-[13px] text-muted">{content.cardDesc}</p>

              <div className="upload-card mt-6 flex flex-col items-center justify-center rounded-[14px] border border-dashed border-sage bg-ivory px-6 py-10 text-center">
                <div className="upload-card-icon flex h-11 w-11 items-center justify-center rounded-full border border-sage bg-paper text-foreground">
                  <Camera size={20} strokeWidth={1.6} />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-foreground">{content.uploadLabel}</p>
                <p className="mt-1 text-[11.5px] text-muted">JPG, PNG · 최대 10MB</p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1 text-[12px] font-medium text-muted">
                가입 없이 바로 확인
                <ChevronRight size={13} className="text-muted" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
