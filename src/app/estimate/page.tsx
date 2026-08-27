import type { Metadata } from "next";
import EstimateWizard from "@/components/estimate/EstimateWizard";
import BackHeader from "@/components/layout/BackHeader";
import type { EventType } from "@/lib/types";

export const metadata: Metadata = {
  title: "사진으로 견적받기",
  description: "화환 사진을 올리고 예상 페이백 금액을 확인해보세요. 1분이면 신청이 끝나요.",
};

const VALID_EVENT_TYPES: EventType[] = ["funeral", "wedding", "opening", "corporate", "etc"];

export default async function EstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ bulk?: string; eventType?: string }>;
}) {
  const { bulk, eventType } = await searchParams;
  const initialEventType = VALID_EVENT_TYPES.includes(eventType as EventType)
    ? (eventType as EventType)
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="flex-1">
        <EstimateWizard initialBulk={bulk === "1"} initialEventType={initialEventType} />
      </main>
    </div>
  );
}
