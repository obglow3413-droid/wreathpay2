import type { Metadata } from "next";
import EstimateWizard from "@/components/estimate/EstimateWizard";
import BackHeader from "@/components/layout/BackHeader";
import SharedLinkBanner from "@/components/home/SharedLinkBanner";
import type { EventType } from "@/lib/types";
import { cleanAddress, getPlace } from "@/lib/places";

export const metadata: Metadata = {
  title: "사진으로 견적받기",
  description: "화환 사진을 올리고 예상 페이백 금액을 확인해보세요. 1분이면 신청이 끝나요.",
};

const VALID_EVENT_TYPES: EventType[] = ["funeral", "wedding", "opening", "corporate", "etc"];

export default async function EstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ bulk?: string; eventType?: string; source?: string; place?: string; pn?: string; ad?: string }>;
}) {
  const { bulk, eventType, source, place: placeSlug, pn, ad } = await searchParams;
  // 장소 페이지에서 넘어온 경우: 장소명·주소를 미리 채우고, 장례식장이면 화환 종류도 정해 둔다
  const place = placeSlug ? await getPlace(placeSlug) : null;
  const initialEventType = VALID_EVENT_TYPES.includes(eventType as EventType)
    ? (eventType as EventType)
    : place?.kind === "funeral"
      ? "funeral"
      : place?.kind === "wedding"
        ? "wedding"
        : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      {source === "share" && <SharedLinkBanner />}
      <main className="flex-1">
        <EstimateWizard
          initialBulk={bulk === "1"}
          initialEventType={initialEventType}
          initialPlace={
            place
              ? { name: place.name, address: cleanAddress(place.address), slug: place.slug }
              : pn && ad
                ? { name: pn.slice(0, 80), address: ad.slice(0, 200) }
                : null
          }
        />
      </main>
    </div>
  );
}
