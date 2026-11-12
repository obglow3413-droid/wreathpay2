import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ChevronRight } from "lucide-react";
import BackHeader from "@/components/layout/BackHeader";
import { PLACE_KIND_LABEL, getAllPlaces, getPlace } from "@/lib/places";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) return { title: "장소를 찾을 수 없어요" };
  const what = place.kind === "funeral" ? "근조화환" : "축하화환";
  return {
    title: `${place.name} ${what} 수거·페이백 안내`,
    description: `${place.sido} ${place.sigungu} ${place.name}에서 받은 ${what}, 사진 한 장으로 수거 신청하고 페이백 받으세요. 수거비 0원.`,
    alternates: { canonical: `/places/${place.slug}` },
  };
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) notFound();
  const funeral = place.kind === "funeral";
  const what = funeral ? "근조화환" : "축하화환";
  const nearby = (await getAllPlaces()).filter((p) => p.sigungu === place.sigungu && p.sido === place.sido && p.slug !== place.slug).slice(0, 5);
  const facts = [
    place.rooms ? `빈소 ${place.rooms}실` : null,
    place.parking ? `주차 ${place.parking.toLocaleString("ko-KR")}대` : null,
    place.operatorType ? `${place.operatorType} 운영` : null,
  ].filter(Boolean);

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <BackHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <Link href="/places" className="text-[12.5px] text-muted underline underline-offset-4">
          ← 장소 목록
        </Link>
        <p className="mt-4 flex items-center gap-2 text-[12.5px] font-semibold text-brass">
          {PLACE_KIND_LABEL[place.kind]} · {place.sido} {place.sigungu}
          {place.isPartner && <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10.5px] font-bold">제휴</span>}
        </p>
        <h1 className="mt-1.5 text-[24px] font-extrabold leading-snug">
          {place.name}
          <br />
          {what} 수거 안내
        </h1>
        <p className="mt-3 flex items-start gap-1.5 text-[13.5px] text-muted">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          {place.address}
        </p>
        <p className="mt-2 flex gap-3 text-[12.5px]">
          <a href={`https://map.naver.com/p/search/${encodeURIComponent(place.name)}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            지도에서 보기
          </a>
          <Link href={`/area/${encodeURIComponent(`${place.sido}-${place.sigungu}`)}`} className="underline underline-offset-4">
            {place.sigungu} 전체 보기
          </Link>
        </p>
        {facts.length > 0 && <p className="mt-1.5 text-[12.5px] text-muted-light">{facts.join(" · ")}</p>}

        <Link
          href={`/estimate?place=${place.slug}`}
          className="mt-6 flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-brand text-[16px] font-bold text-white"
        >
          여기서 {what} 수거 신청하기
          <ChevronRight size={18} />
        </Link>
        <p className="mt-2 text-center text-[12px] text-muted-light">수거비 0원 · 가입 없이 신청 · 주소가 자동으로 채워져요</p>

        <section className="mt-8 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">이렇게 진행돼요</h2>
          <ol className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-muted">
            <li><b className="text-foreground">1. 사진 한 장</b> — 화환이 보이게 찍어 올리면 예상 페이백을 안내해 드려요.</li>
            <li><b className="text-foreground">2. 방문 수거</b> — {funeral ? "발인 일정에 맞춰 조용히" : "행사 종료 시간에 맞춰"} 전담기사가 방문해요.</li>
            <li><b className="text-foreground">3. 수거 후 정산</b> — 수량·상태 확인 뒤 등록하신 계좌로 입금해요.</li>
          </ol>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">신청 전 확인해 주세요</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">
            <li>시설 규정에 따라 화환 반출·수거 시간이 제한될 수 있어요. 필요하면 저희가 일정에 맞춰 조율해 드려요.</li>
            <li>페이백 금액은 화환 수량과 상태에 따라 달라지며, 수거 후 확정돼요.</li>
            {!place.isPartner && <li>이 페이지는 KKOT PAY의 수거 가능 지역 안내이며, 해당 시설과 제휴 관계가 아닙니다.</li>}
          </ul>
        </section>

        {nearby.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[15px] font-bold">{place.sigungu}의 다른 장소</h2>
            <ul className="mt-3 space-y-2">
              {nearby.map((p) => (
                <li key={p.slug}>
                  <Link href={`/places/${p.slug}`} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-[14px] font-semibold">
                    <span className="truncate">{p.name}</span>
                    <ChevronRight size={16} className="shrink-0 text-muted-light" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
