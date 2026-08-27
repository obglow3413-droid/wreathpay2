import Link from "next/link";

const BULK_ITEMS = [
  "10개 이상 우선 검토",
  "30개 이상 대량견적",
  "장례식 / 결혼식 / 기업행사 대량수거 가능",
];

export default function BulkSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-10 text-white md:px-12 md:py-14">
        {/* 배경 장식: 큰 숫자 워터마크 + 그라디언트 글로우 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-8 select-none text-[160px] font-extrabold leading-none text-white/[0.04] md:text-[220px]"
        >
          30+
        </span>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl"
        />

        <div className="relative">
          <h2 className="text-[22px] font-bold leading-snug md:text-[28px]">
            화환이 많을수록
            <br className="md:hidden" /> 더 빠르게 수거해드립니다.
          </h2>
          <ul className="mt-6 space-y-2 text-[14.5px] text-white/75">
            {BULK_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/estimate?bulk=1"
            className="hover-lift mt-7 inline-flex h-12 items-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white"
          >
            대량수거 문의하기
          </Link>
        </div>
      </div>
    </section>
  );
}
