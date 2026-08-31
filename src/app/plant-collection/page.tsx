import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import PlantWizard from "@/components/plant/PlantWizard";

export const metadata: Metadata = {
  title: "개업화분 회수 신청",
  description: "사진 한 장으로 개업화분 회수 가능 여부를 확인해보세요.",
};

export default function PlantCollectionPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="flex-1">
        <PlantWizard />
      </main>
    </div>
  );
}
