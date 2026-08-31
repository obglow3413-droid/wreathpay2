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
  }
> = {
  wreath: {
    badge: "세상의 모든 화환을 페이백해드립니다",
    titleLines: ["버려지는 화환이", "현금으로 돌아옵니다."],
    desc: ["받은 화환, 그냥 보내면 0원.", "사진 한 장이면 지금 받을 수 있는 페이백 가격을 확인할 수 있습니다."],
    ctaLabel: "지금바로 페이백 받기",
    ctaHref: "/estimate",
    footNote: "사진 견적 무료 · 방문수거 · 수거 완료 후 빠른 정산",
    cardTitle: "사진 올리고 페이백 확인하기",
    cardDesc: "등급별 시세도 함께 확인할 수 있어요.",
    uploadLabel: "화환 사진 올리기",
  },
  plant: {
    badge: "개업 후 남은 화분도 회수해드립니다",
    titleLines: ["사무실 화분 12개,", "관리 담당자는 아직도 공석입니다."],
    desc: ["개업 후 남은 화분, 그냥 두면 골칫거리.", "사진 한 장이면 회수 가능 여부를 바로 확인할 수 있습니다."],
    ctaLabel: "지금바로 화분 회수 신청",
    ctaHref: "/plant-collection",
    footNote: "사진 확인 무료 · 방문회수 · 상태 확인 후 안내",
    cardTitle: "사진 올리고 회수 가능여부 확인하기",
    cardDesc: "화분 종류·크기별 조건도 함께 확인할 수 있어요.",
    uploadLabel: "화분 사진 올리기",
  },
};

export default function Hero() {
  const [active, setActive] = useState<ServiceKey>("wreath");
  const content = SERVICE_CONTENT[active];

  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
        {/* 상단 탭: 화환 / 화분 (선택 시 forest, 절제된 슬라이딩) */}
        <div className="relative mx-auto flex max-w-[280px] rounded-full border border-line bg-paper p-1 md:mx-0">
          <div
            className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-forest transition-transform duration-200 ease-out"
            style={{
              transform: active === "wreath" ? "translateX(0%)" : "translateX(calc(100% + 8px))",
            }}
          />
          <button
            type="button"
            onClick={() => setActive("wreath")}
            className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors duration-200 ${
              active === "wreath" ? "text-ivory" : "text-muted"
            }`}
          >
            화환
          </button>
          <button
            type="button"
            onClick={() => setActive("plant")}
            className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors duration-200 ${
              active === "plant" ? "text-ivory" : "text-muted"
            }`}
          >
            화분
          </button>
        </div>

        <div className="mt-8 md:grid md:min-h-[520px] md:grid-cols-[55fr_45fr] md:items-center md:gap-14">
          {/* 왼쪽: 서비스 소개 문구 + CTA */}
          <div key={`copy-${active}`} className="fade-up">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold tracking-wide text-brass">
              <span className="h-1 w-1 rounded-full bg-brass" />
              {content.badge}
            </p>

            <h1 className="mt-3 break-keep text-[30px] font-extrabold leading-[1.25] tracking-tight text-foreground md:mt-4 md:text-[54px] md:leading-[1.15]">
              {content.titleLines[0]}
              <br />
              {content.titleLines[1]}
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-muted md:text-[16.5px]">
              {content.desc[0]}
              <br />
              {content.desc[1]}
            </p>

            <div className="mt-7">
              <Link
                href={content.ctaHref}
                className="hover-lift flex h-[56px] w-full items-center justify-center rounded-[14px] bg-forest px-7 text-[16px] font-bold text-ivory md:inline-flex md:w-auto"
              >
                {content.ctaLabel}
              </Link>
            </div>

            <p className="mt-4 text-[12.5px] text-muted">{content.footNote}</p>
          </div>

          {/* 오른쪽(PC) / 아래(모바일): 사진 견적 카드 */}
          <div key={`card-${active}`} className="fade-up mt-8 md:mt-0">
            <Link
              href={content.ctaHref}
              className="hover-lift block rounded-[18px] border border-line bg-paper p-6 shadow-[0_10px_24px_-20px_rgba(10,27,22,0.35)] md:p-8"
            >
              <p className="text-[15.5px] font-bold text-foreground md:text-[17px]">{content.cardTitle}</p>
              <p className="mt-1.5 text-[13px] text-muted">{content.cardDesc}</p>

              {/* 업로드 영역: sage 테두리 (무지개/네온 없음) */}
              <div className="mt-6 flex flex-col items-center justify-center rounded-[14px] border border-sage bg-ivory px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sage bg-paper text-forest">
                  {active === "wreath" ? (
                    <Camera size={20} strokeWidth={1.6} />
                  ) : (
                    <Leaf size={20} strokeWidth={1.6} />
                  )}
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
