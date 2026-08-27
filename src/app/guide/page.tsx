import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import HowItWorks from "@/components/home/HowItWorks";
import Faq from "@/components/home/Faq";

export const metadata: Metadata = {
  title: "이용안내",
  description: "꽃깞 이용방법과 자주 묻는 질문을 확인해보세요.",
};

export default function GuidePage() {
  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <BackHeader />
      <main className="flex-1">
        <HowItWorks />
        <Faq />
      </main>
    </div>
  );
}
