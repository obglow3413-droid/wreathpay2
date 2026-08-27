const TRUST_ITEMS = [
  { value: "수거비용 0원", label: "" },
  { value: "사진 1장이면 충분", label: "" },
  { value: "가입 없이 바로 확인", label: "" },
];

export default function TrustIndicators() {
  return (
    <section className="border-t border-[#E3E8E5] bg-white">
      <div className="mx-auto grid max-w-[1120px] grid-cols-3 gap-3 px-5 py-7 md:gap-6 md:px-8 md:py-9">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.value}
            className="rounded-2xl border border-[#E3E8E5] bg-white px-3 py-4 text-center md:py-5"
          >
            <p className="text-[13.5px] font-bold text-[#171A18] md:text-[15px]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
