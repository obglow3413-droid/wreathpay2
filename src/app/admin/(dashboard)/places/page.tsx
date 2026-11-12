import { getAdminUser } from "@/lib/adminAuth";
import { getAllPlaces } from "@/lib/places";
import PlaceAdmin from "@/components/admin/PlaceAdmin";

export const dynamic = "force-dynamic";

export default async function PlacesAdminPage() {
  const places = (await getAdminUser()) ? await getAllPlaces(true) : [];
  return (
    <div>
      <h1 className="text-[20px] font-bold">수거 가능 장소</h1>
      <p className="mt-1 text-[13.5px] text-muted">
        고객에게 보이는 장소 목록이에요. 폐업·수거 불가 시설은 숨기고, 제휴한 곳은 &ldquo;제휴&rdquo;로 표시하세요. 웨딩홀 등 새 장소도 여기서 추가합니다.
      </p>
      <PlaceAdmin places={places.map((p) => ({ slug: p.slug, kind: p.kind, name: p.name, sigungu: `${p.sido} ${p.sigungu}`, isHidden: p.isHidden, isPartner: p.isPartner }))} />
    </div>
  );
}
