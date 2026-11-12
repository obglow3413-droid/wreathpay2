import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import AppBottomNav from "@/components/layout/AppBottomNav";
import PlaceBrowser from "@/components/places/PlaceBrowser";
import { getAllPlaces } from "@/lib/places";

export const metadata: Metadata = {
  title: "서울·경기 장례식장·웨딩홀 화환 수거 가능 장소",
  description: "서울·경기 장례식장·웨딩홀별 화환 수거 안내. 장소를 고르면 주소가 채워진 상태로 바로 수거를 신청할 수 있어요.",
  alternates: { canonical: "/places" },
};

export const revalidate = 3600;

export default async function PlacesPage() {
  const places = await getAllPlaces();
  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <BackHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">PLACES</p>
        <h1 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[28px]">서울·경기 화환 수거 가능 장소</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          장소를 고르면 주소가 채워진 상태로 수거 신청을 시작할 수 있어요. 목록에 없는 곳도 신청할 수 있습니다.
        </p>
        <PlaceBrowser
          places={places.map((p) => ({ slug: p.slug, kind: p.kind, name: p.name, sido: p.sido, sigungu: p.sigungu, address: p.address, isPartner: p.isPartner }))}
        />
        <p className="mt-8 text-[11.5px] leading-relaxed text-muted-light">
          장례식장 정보는 보건복지부 &lsquo;장례식장 현황&rsquo; 공공데이터를 바탕으로 한 KKOT PAY의 수거 가능 지역 안내이며(웨딩홀은 KKOT PAY가 직접 정리한 주요 시설), &lsquo;제휴&rsquo; 표시가 없는 시설은 KKOT PAY와 제휴 관계가 아닙니다. 시설 규정에 따라 화환 반출·수거가 제한될 수 있고, 시설 정보는 변경되었을 수 있어요.
        </p>
      </main>
      <AppBottomNav />
    </div>
  );
}
