import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import HowItWorks from "@/components/home/HowItWorks";
import Faq from "@/components/home/Faq";
import JsonLd from "@/components/JsonLd";
import { FAQ_ITEMS } from "@/lib/faq";
import { faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "화환 수거 이용안내·자주 묻는 질문",
  description: "화환 수거 신청 방법 3단계와 자주 묻는 질문. 수거 가능 수량, 정산 시점, 장례식장·웨딩홀 수거, 리본 명단 정리까지 안내합니다.",
  alternates: { canonical: "/guide" },
};

export default function GuidePage() {
  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <BackHeader />
      <JsonLd data={faqLd(FAQ_ITEMS)} />
      <main className="flex-1">
        <HowItWorks />
        <Faq />
      </main>
    </div>
  );
}
