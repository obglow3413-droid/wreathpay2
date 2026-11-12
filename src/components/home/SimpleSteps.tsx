import Link from "next/link";
import { Camera, CalendarCheck, Wallet, ChevronRight } from "lucide-react";

const STEPS = [
  { icon: Camera, title: "사진 한 장", desc: "화환이 보이게 찍어서 올려요" },
  { icon: CalendarCheck, title: "일정 선택", desc: "장소와 시간만 고르면 끝" },
  { icon: Wallet, title: "수거 후 정산", desc: "방문수거 뒤 바로 정산해요" },
];

export default function SimpleSteps() {
  return (
    <section className="border-t border-line bg-ivory">
      <div className="mx-auto max-w-[1120px] px-5 py-12 md:px-8 md:py-16">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">HOW IT WORKS</p>
        <h2 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[28px]">3단계면 끝나요</h2>
        <ol className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex items-center gap-4 rounded-2xl border border-line bg-paper px-5 py-5 md:flex-col md:items-start md:gap-5 md:py-7"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-ivory">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-[11.5px] font-semibold text-brass">STEP {i + 1}</p>
                  <p className="text-[16px] font-bold">{step.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <Link
          href="/guide"
          className="hover-arrow mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-muted hover:text-foreground"
        >
          자세한 이용안내와 자주 묻는 질문
          <ChevronRight size={15} />
        </Link>
        <Link
          href="/ribbon"
          className="hover-lift mt-4 flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4"
        >
          <span>
            <span className="block text-[15px] font-bold">🎗 디지털 리본, 마음 전하기</span>
            <span className="mt-0.5 block text-[12.5px] text-muted">링크 하나로 조문·축하 리본 문구를 모아요</span>
          </span>
          <ChevronRight size={18} className="text-muted" />
        </Link>
      </div>
    </section>
  );
}
