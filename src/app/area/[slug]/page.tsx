import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import BackHeader from "@/components/layout/BackHeader";
import PaybackCalculator from "@/components/tools/PaybackCalculator";
import { PLACE_KIND_LABEL, getAllPlaces } from "@/lib/places";

export const revalidate = 3600;

/** 지역 주소 형식: /area/서울특별시-강남구 */
async function load(slug: string) {
  const [sido, sigungu] = decodeURIComponent(slug).split("-");
  if (!sido || !sigungu) return null;
  const places = (await getAllPlaces()).filter((p) => p.sido === sido && p.sigungu === sigungu);
  return places.length ? { sido, sigungu, places } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) return { title: "지역을 찾을 수 없어요" };
  return {
    title: `${d.sigungu} 화환 수거·페이백 (${d.sido})`,
    description: `${d.sido} ${d.sigungu} 장례식장·웨딩홀·매장의 근조화환, 축하화환 수거. 사진 한 장으로 신청하고 페이백 받으세요. 수거비 0원.`,
    alternates: { canonical: `/area/${encodeURIComponent(`${d.sido}-${d.sigungu}`)}` },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) notFound();
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 pb-12">
        <Link href="/places" className="text-[12.5px] text-muted underline underline-offset-4">← 전체 지역</Link>
        <p className="mt-4 text-[12.5px] font-semibold text-brass">{d.sido}</p>
        <h1 className="mt-1.5 text-[24px] font-extrabold leading-snug">{d.sigungu} 화환 수거·페이백</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          {d.sigungu}의 장례식장·웨딩홀·매장에서 받은 화환을 방문 수거하고, 수량과 상태에 따라 페이백해 드려요. 수거비는 0원입니다.
        </p>
        <Link href="/estimate" className="mt-5 flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-brand text-[16px] font-bold text-white">
          {d.sigungu}에서 수거 신청하기 <ChevronRight size={18} />
        </Link>

        <div className="mt-6">
          <PaybackCalculator />
        </div>

        <h2 className="mt-8 text-[15px] font-bold">{d.sigungu}의 수거 가능 장소 {d.places.length}곳</h2>
        <ul className="mt-3 space-y-2">
          {d.places.map((p) => (
            <li key={p.slug}>
              <Link href={`/places/${p.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3.5">
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-bold">{p.name}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-muted">{PLACE_KIND_LABEL[p.kind]} · {p.address}</span>
                </span>
                <ChevronRight size={17} className="shrink-0 text-muted-light" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[11.5px] leading-relaxed text-muted-light">
          목록에 없는 장소도 주소만 입력하면 신청할 수 있어요. &lsquo;제휴&rsquo; 표시가 없는 시설은 KKOT PAY와 제휴 관계가 아니며, 시설 규정에 따라 수거가 제한될 수 있어요.
        </p>
      </main>
    </div>
  );
}
