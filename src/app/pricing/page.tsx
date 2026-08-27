
import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import WreathTypes from "@/components/home/WreathTypes";

export const metadata: Metadata = {
  title: "시세조회",
  description: "화환 수량별 예상 페이백 금액을 확인해보세요.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <BackHeader />
      <main className="flex-1">
        <WreathTypes />
      </main>
    </div>
  );
}
