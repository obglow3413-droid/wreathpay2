import Link from "next/link";

const TABLE_ROWS = [
  { qty: "1~4개", funeral: "무료회수 가능 여부 확인", celebration: "무료회수 가능 여부 확인" },
  { qty: "5~9개", funeral: "1만~3만원", celebration: "무료회수~2만원" },
  { qty: "10~14개", funeral: "4만~7만원", celebration: "2만~4만원" },
  { qty: "15~19개", funeral: "6만~10만원", celebration: "3만~6만원" },
  { qty: "20~29개", funeral: "9만~15만원", celebration: "5만~10만원" },
  { qty: "30~49개", funeral: "15만~25만원", celebration: "9만~16만원" },
  { qty: "50개 이상", funeral: "별도 견적", celebration: "별도 견적" },
];

export default function WreathTypes() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <h2 className="text-[24px] font-bold md:text-[30px]">내 화환은 얼마일까요?</h2>
        <p className="mt-2 text-[13.5px] text-muted">
          화환의 종류와 수량을 선택하면 예상 페이백 범위를 바로 확인할 수 있습니다.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-[13.5px] md:text-[14.5px]">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">수량</th>
                <th className="px-4 py-3 text-right font-medium md:text-left">근조화환</th>
                <th className="px-4 py-3 text-right font-medium md:text-left">축하·개업화환</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row) => (
                <tr key={row.qty} className="border-t border-border transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3.5 font-medium">{row.qty}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-brand-dark md:text-left">
                    {row.funeral}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-brand-dark md:text-left">
                    {row.celebration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-muted-light">
          화환의 상태와 수거지역에 따라 실제 금액은 달라질 수 있습니다. 재사용 가치가 수거비용보다
          낮은 경우에는 페이백 없이 무료회수만 가능하며, 최종 금액은 현장 확인 후 확정됩니다.
        </p>

        <Link
          href="/estimate"
          className="hover-lift mt-7 flex h-13 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(0,168,120,0.45)] md:inline-flex md:w-fit"
        >
          내 화환 예상금액 확인하기
        </Link>
      </div>
    </section>
  );
}
