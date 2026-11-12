import Link from "next/link";
import { Truck } from "lucide-react";
import { getNearbyRegions } from "@/lib/nearby";

/**
 * "지금 근처 수거 중" 안내: 오늘·내일 방문이 잡힌 지역을 보여주고, 같은 지역이면 소량도 함께 수거할 수 있음을 알린다.
 * only 를 주면 그 지역(지역·장소 페이지)에 해당할 때만 한 줄 배너로 보여준다. 잡힌 수거가 없으면 아무것도 그리지 않는다.
 */
export default async function NearbyToday({ only }: { only?: { sido: string; sigungu: string } }) {
  const regions = await getNearbyRegions();
  if (only) {
    const hit = regions.find((r) => r.sido === only.sido && r.sigungu.replace(/\s+/g, "").startsWith(only.sigungu.replace(/\s+/g, "")));
    if (!hit) return null;
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-tint px-4 py-3 text-[13px] leading-relaxed">
        <Truck size={17} className="mt-0.5 shrink-0 text-brass" />
        <span>
          <b>{hit.today > 0 ? "오늘" : "내일"} {only.sigungu} 방문이 잡혀 있어요.</b> 같은 지역이라 1~4개 소량도 함께 수거할 수 있어요.
        </span>
      </p>
    );
  }
  if (regions.length === 0) return null;
  return (
    <section className="border-t border-line bg-ivory">
      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <Truck size={18} className="text-brass" /> 오늘·내일 방문 예정 지역
        </p>
        <p className="mt-1 text-[12.5px] text-muted">기사님이 가는 지역이면 1~4개 소량도 같이 실어 가요.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {regions.slice(0, 12).map((r) => (
            <li key={`${r.sido} ${r.sigungu}`} className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12.5px] font-medium">
              {r.sigungu} <span className="text-muted">{r.today > 0 ? "오늘" : "내일"}</span>
            </li>
          ))}
        </ul>
        <Link href="/estimate" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-[14px] font-semibold text-white">
          우리 지역도 같이 수거 신청하기
        </Link>
      </div>
    </section>
  );
}
