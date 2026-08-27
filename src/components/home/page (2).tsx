import type { Metadata } from "next";
import AppTopBar from "@/components/home/AppTopBar";
import AppBottomNav from "@/components/layout/AppBottomNav";
import SiteFooter from "@/components/layout/SiteFooter";
import Hero from "@/components/home/Hero";
import TrustIndicators from "@/components/home/TrustIndicators";
import ValueSection from "@/components/home/ValueSection";
import WreathTypes from "@/components/home/WreathTypes";
import LiveFeed from "@/components/home/LiveFeed";
import BulkSection from "@/components/home/BulkSection";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "꽃깞 - 세상의 모든 화환을 페이백 합니다.",
  description:
    "결혼식·장례식·개업식·기업행사 화환을 사진으로 간편하게 견적받고 현금으로 돌려받으세요.",
};

// 실시간 접수 현황이 항상 최신 데이터로 보이도록 매 요청마다 새로 렌더링
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <AppTopBar />
      <main className="flex-1 pb-24">
        <Hero />
        <TrustIndicators />
        <Reveal>
          <ValueSection />
        </Reveal>
        <Reveal>
          <WreathTypes />
        </Reveal>
        <Reveal>
          <LiveFeed />
        </Reveal>
        <Reveal>
          <BulkSection />
        </Reveal>
      </main>
      <SiteFooter />
      <AppBottomNav />
    </>
  );
}
