"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroTabToggle() {
  const router = useRouter();
  const [active, setActive] = useState<"pricing" | "estimate">("pricing");

  function handlePricingClick() {
    setActive("pricing");
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleEstimateClick() {
    setActive("estimate");
    // 슬라이딩 애니메이션이 살짝 보인 뒤 이동
    setTimeout(() => router.push("/estimate"), 220);
  }

  return (
    <div className="relative flex rounded-full bg-surface p-1">
      {/* 슬라이딩 배경 */}
      <div
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-300 ease-out"
        style={{ transform: active === "pricing" ? "translateX(0%)" : "translateX(calc(100% + 8px))" }}
      />
      <button
        type="button"
        onClick={handlePricingClick}
        className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors ${
          active === "pricing" ? "text-white" : "text-muted"
        }`}
      >
        시세조회
      </button>
      <button
        type="button"
        onClick={handleEstimateClick}
        className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13.5px] font-semibold transition-colors ${
          active === "estimate" ? "text-white" : "text-muted"
        }`}
      >
        접수하기
      </button>
    </div>
  );
}
