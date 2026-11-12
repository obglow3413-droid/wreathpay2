import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";
import WreathTypes from "@/components/home/WreathTypes";
import PaybackCalculator from "@/components/tools/PaybackCalculator";

export const metadata: Metadata = {
  title: "시세조회",
  description: "화환 수량별 예상 페이백 금액을 확인해보세요.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <BackHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 pt-8">
          <PaybackCalculator />
        </div>
        <WreathTypes />
      </main>

      {/* 스크롤해도 항상 따라다니는 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Link
          href="/estimate"
          className="hover-lift mx-auto flex h-13 w-full max-w-5xl items-center justify-center rounded-xl bg-brand px-6 text-[16px] font-semibold text-white "
        >
          내 화환 예상금액 확인하기
        </Link>
      </div>
    </div>
  );
}
