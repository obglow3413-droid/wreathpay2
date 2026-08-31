"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, ChevronRight, Leaf } from "lucide-react";

type ServiceKey = "wreath" | "plant";

const SERVICE_CONTENT: Record<
  ServiceKey,
  {
    badge: string;
    titleLines: [string, string];
    desc: [string, string];
    ctaLabel: string;
    ctaHref: string;
    footNote: string;
    cardTitle: string;
    cardDesc: string;
    uploadLabel: string;
    accent: string; // 텍스트/포인트 컬러
    accentBg: string; // 아이콘 배경 컬러
  }
> = {
  wreath: {
    badge: "세상의 모든 화환을 페이백해드립니다!",
    titleLines: ["버려지는 화환이", "현금으로 돌아옵니다."],
    desc: ["받은 화환, 그냥 보내면 0원.", "사진 한 장이면 지금 받을 수 있는 페이백 가격을 확인할 수 있습니다."],
    ctaLabel: "지금바로 페이백 받기",
    ctaHref: "/estimate",
    footNote: "사진 견적 무료 · 방문수거 · 수거 완료 후 빠른 정산",
    cardTitle: "사진 올리고 페이백 확인하기",
    cardDesc: "등급별 시세도 함께 확인할 수 있어요.",
    uploadLabel: "화환 사진 올리기",
    accent: "#00A878",
    accentBg: "#E3F6EF",
  },
  plant: {
    badge: "개업 후 남은 화분도 회수해드립니다!",
    titleLines: ["정리하기 어려운 화분이", "깔끔하게 회수됩니다."],
    desc: ["개업 후 남은 화분, 그냥 두면 골칫거리.", "사진 한 장이면 회수 가능 여부를 바로 확인할 수 있습니다."],
    ctaLabel: "지금바로 화분 회수 신청",
    ctaHref: "/plant-collection",
    footNote: "사진 확인 무료 · 방문회수 · 상태 확인 후 안내",
    cardTitle: "사진 올리고 회수 가능여부 확인하기",
    cardDesc: "화분 종류·크기별 조건도 함께 확인할 수 있어요.",
    uploadLabel: "화분 사진 올리기",
    accent: "#0B6B4F",
    accentBg: "#E6F2EC",
  },
};

export default function Hero() {
  const [active, setActive] = useState<ServiceKey>("wreath");
  const content = SERVICE_CONTENT[active];

  return (
    <section className="bg-[#F7F9F7]">
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
        {/* 상단 탭: 화환 / 화분 (슬라이딩) */}
        <div className="relative mx-auto flex max-w-[280px] rounded-full bg-white p-1 shadow-[0_2px_10px_-4px_rgba(23,26,24,0.15)] md:mx-0">
          <div
            className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out"
            style={{
              backgroundColor: active === "wreath" ? "#00A878" : "#0B6B4F",
              transform: active === "wreath" ? "translateX(0%)" : "translateX(calc(100% + 8px))",
            }}
          />
          <button
            type="button"
            onClick={() => setActive("wreath")}
            className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors ${
              active === "wreath" ? "text-white" : "text-[#7A837E]"
            }`}
          >
            화환
          </button>
          <button
            type="button"
            onClick={() => setActive("plant")}
            className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors ${
              active === "plant" ? "text-white" : "text-[#7A837E]"
            }`}
          >
            화분
          </button>
        </div>

        <div className="mt-8 md:grid md:min-h-[540px] md:grid-cols-[55fr_45fr] md:items-center md:gap-14">
          {/* 왼쪽: 서비스 소개 문구 + CTA (전환 시 다시 페이드업) */}
          <div key={`copy-${active}`} className="fade-up">
            <p className="text-[13px] font-semibold" style={{ color: content.accent }}>
              {content.badge}
            </p>

            <h1 className="mt-3 break-keep text-[30px] font-extrabold leading-[1.25] tracking-tight text-[#171A18] md:mt-4 md:text-[58px] md:leading-[1.15]">
              {content.titleLines[0]}
              <br />
              {content.titleLines[1]}
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-[#59615D] md:text-[17px]">
              {content.desc[0]}
              <br />
              {content.desc[1]}
            </p>

            <div className="mt-7">
              <Link
                href={content.ctaHref}
                className="hover-lift flex h-[58px] w-full items-center justify-center rounded-[14px] px-7 text-[17px] font-bold text-white md:inline-flex md:w-auto"
                style={{ backgroundColor: content.accent }}
              >
                {content.ctaLabel}
              </Link>
            </div>

            <p className="mt-4 text-[13px] text-[#7A837E]">{content.footNote}</p>
          </div>

          {/* 오른쪽(PC) / 아래(모바일): 사진 견적 카드 (전환 시 다시 페이드업) */}
          <div key={`card-${active}`} className="fade-up mt-8 md:mt-0" style={{ animationDelay: "80ms" }}>
            <Link
              href={content.ctaHref}
              className="hover-lift block rounded-[22px] border border-[#E3E8E5] bg-white p-6 shadow-[0_16px_36px_-22px_rgba(23,26,24,0.18)] md:p-8"
            >
              <p className="text-[16px] font-bold text-[#171A18] md:text-[18px]">{content.cardTitle}</p>
              <p className="mt-1.5 text-[13.5px] text-[#59615D]">{content.cardDesc}</p>

              {/* 회전하는 무지개빛 테두리 박스 */}
              <div className="relative mt-6 overflow-hidden rounded-2xl p-[2.5px]">
                <span
                  aria-hidden
                  className="absolute inset-[-60%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,#ff6b6b,#feca57,#48dbfb,#54a0ff,#a29bfe,#ff6bcb,#ff6b6b)]"
                />
                <div className="relative flex flex-col items-center justify-center rounded-[15px] bg-[#F7F9F7] px-6 py-10 text-center shadow-[inset_0_2px_6px_rgba(23,26,24,0.08)]">
                  {/* 은은하게 반복해서 스치는 반짝임 */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    style={{ animation: "shimmer 2.6s ease-in-out infinite" }}
                  />
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full"
                      style={{ backgroundColor: `${content.accent}4D` }}
                    />
                    <span
                      className="relative flex h-12 w-12 items-center justify-center rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                      style={{ backgroundColor: content.accentBg, color: content.accent }}
                    >
                      {active === "wreath" ? (
                        <Camera size={24} strokeWidth={1.8} />
                      ) : (
                        <Leaf size={24} strokeWidth={1.8} />
                      )}
                    </span>
                  </div>
                  <p className="relative mt-3 text-[14.5px] font-semibold text-[#171A18]">
                    {content.uploadLabel}
                  </p>
                  <p className="relative mt-1 text-[12px] text-[#7A837E]">JPG, PNG · 최대 10MB</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1 text-[12.5px] font-medium text-[#59615D]">
                가입 없이 바로 확인
                <ChevronRight size={14} className="text-[#7A837E]" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
