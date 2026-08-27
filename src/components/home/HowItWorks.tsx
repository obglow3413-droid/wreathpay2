const STEPS = [
  { title: "화환 사진 등록", desc: "화환 전체가 보이도록 사진을 최대 5장 올려주세요." },
  { title: "예상 견적 확인", desc: "수량과 상태를 바탕으로 예상 페이백 금액을 안내드려요." },
  { title: "수거 일정 확정", desc: "원하는 날짜와 시간대를 선택하면 일정을 조율해드려요." },
  { title: "방문수거", desc: "기사님이 방문해 현장에서 화환을 직접 수거합니다." },
  { title: "최종 검수 및 정산", desc: "최종 수량과 상태를 확인한 뒤 현금으로 정산해드려요." },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <h2 className="text-[24px] font-bold md:text-[30px]">이용방법</h2>
      <ol className="relative mt-10 grid grid-cols-1 gap-8 md:grid-cols-5 md:gap-4">
        {/* 데스크톱: 단계 사이를 잇는 가로 연결선 */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[10%] right-[10%] top-[13px] hidden h-px bg-border md:block"
        />
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 md:flex-col md:gap-3">
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[12.5px] font-bold tabular-nums text-white md:h-[26px] md:w-[26px]">
              {i + 1}
            </span>
            {/* 모바일: 단계 사이를 잇는 세로 연결선 */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-[calc(100%+8px)] w-px bg-border md:hidden"
              />
            )}
            <div className="pt-0.5 md:pt-1">
              <p className="text-[15px] font-semibold">{step.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
