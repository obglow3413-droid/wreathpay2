export default function ValueSection() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <h2 className="text-[24px] font-bold leading-snug md:text-[30px]">
          화환도 가치가 남아있습니다.
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted md:text-[16px]">
          상태가 좋은 고급 화환은 행사가 끝난 뒤에도 재사용 가치가 있습니다. 꽃깞은 종류와
          상태, 수량을 확인해 매입 가능 여부와 예상 금액을 안내해드립니다.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-[14px] text-muted">
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
          종류·상태·수량에 따라 매입가가 달라집니다.
        </div>
      </div>
    </section>
  );
}
