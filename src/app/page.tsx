import type { Metadata } from "next";
import AppTopBar from "@/components/home/AppTopBar";
import SiteFooter from "@/components/layout/SiteFooter";
import Hero from "@/components/home/Hero";
import LinkShareSection from "@/components/home/LinkShareSection";
import LiveFeed from "@/components/home/LiveFeed";
import SimpleSteps from "@/components/home/SimpleSteps";
import TrustSection from "@/components/home/TrustSection";
import RefCapture from "@/components/home/RefCapture";
import JsonLd from "@/components/JsonLd";
import { HOME_DESCRIPTION, HOME_TITLE, serviceLd } from "@/lib/seo";
import Track from "@/components/Track";
import NearbyToday from "@/components/home/NearbyToday";
import BulkSection from "@/components/home/BulkSection";
import FloatingPaybackCta from "@/components/home/FloatingPaybackCta";
import { ServiceTabProvider } from "@/components/home/ServiceTabContext";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
};

// 실시간 접수 현황이 항상 최신 데이터로 보이도록 매 요청마다 새로 렌더링
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  // ?demo=1 : 시연용 예시 데이터 화면 (화면에 "예시 데이터"가 항상 표시됨)
  const { demo } = await searchParams;
  return (
    <ServiceTabProvider>
      <AppTopBar />
      <main className="flex-1">
        <Hero />
        <Reveal>
          <LiveFeed demo={demo === "1"} />
        </Reveal>
        <Reveal>
          <SimpleSteps />
        </Reveal>
        {demo !== "1" && <NearbyToday />}
        {demo !== "1" && (
          <Reveal>
            <TrustSection />
          </Reveal>
        )}
        <LinkShareSection />
        <Reveal>
          <BulkSection />
        </Reveal>
      </main>
      <JsonLd data={serviceLd} />
      <RefCapture />
      <Track event="home_view" />
      <div className="bg-white pb-24">
        <SiteFooter />
      </div>
      <FloatingPaybackCta />
    </ServiceTabProvider>
  );
}

