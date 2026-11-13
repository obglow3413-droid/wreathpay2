import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PaybackCalculator from "@/components/tools/PaybackCalculator";
import BottomCta from "@/components/layout/BottomCta";
import { LANDING_CONTENT, type LandingSlug } from "@/lib/landingContent";

export function generateStaticParams() {
  return Object.keys(LANDING_CONTENT).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const content = LANDING_CONTENT[type as LandingSlug];
  if (!content) return {};
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    openGraph: { title: content.seoTitle, description: content.seoDescription },
  };
}

export default async function AdLandingPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const content = LANDING_CONTENT[type as LandingSlug];
  if (!content) notFound();

  return (
    <div className="flex min-h-dvh flex-col pb-safe-cta">
      <main className="flex-1">
        <section className="mx-auto max-w-lg px-5 pt-14 pb-10">
          <p className="text-[13px] font-semibold text-brand">{content.eyebrow}</p>
          <h1 className="mt-3 whitespace-pre-line text-[30px] font-extrabold leading-[1.3] tracking-tight">
            {content.headline}
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{content.subcopy}</p>

          <Link
            href="/estimate"
            className="mt-8 flex h-14 items-center justify-center rounded-xl bg-brand px-8 text-[16px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,157,104,0.55)]"
          >
            사진으로 견적받기
          </Link>

          <ul className="mt-9 space-y-2.5 text-[14px] text-muted">
            {content.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border bg-surface px-5 py-10">
          <div className="mx-auto max-w-lg">
            <p className="text-[13.5px] text-muted">
              종류·상태·수량에 따라 매입가가 달라집니다. 사진을 등록하면 예상 견적을 바로
              안내드려요.
            </p>
            <div className="mt-6">
              <PaybackCalculator defaultKind={type === "wedding" ? "wedding" : type === "funeral" ? "funeral" : "opening"} />
            </div>
            {type === "wedding" && (
              <ol className="mt-6 space-y-3 rounded-2xl border border-border bg-white p-5 text-[13.5px] leading-relaxed text-muted">
                <li><b className="text-foreground">1. 계약 전</b> — 화환 반출이 되는지, 처분 권한이 누구에게 있는지 홀에 확인해요.</li>
                <li><b className="text-foreground">2. 예식 전</b> — 날짜에 맞춰 수거를 미리 예약해 둬요.</li>
                <li><b className="text-foreground">3. 예식 당일</b> — 화환 사진만 올리면 전담기사가 시간에 맞춰 수거해요.</li>
                <li><b className="text-foreground">4. 수거 후</b> — 수량·상태를 확인하고 등록한 계좌로 페이백해 드려요.</li>
              </ol>
            )}
            {type === "wedding" && (
              <div className="mt-5 space-y-2.5">
                <Link href="/wedding-checklist" className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 text-[14px] font-bold">
                  웨딩홀 계약 전 화환 체크리스트 7가지 <span aria-hidden>→</span>
                </Link>
                <Link href="/reserve" className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 text-[14px] font-bold">
                  예식 날짜에 맞춰 수거 미리 예약하기 <span aria-hidden>→</span>
                </Link>
                <Link href="/places" className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 text-[14px] font-bold">
                  우리 웨딩홀 찾아보기 <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomCta />
    </div>
  );
}
