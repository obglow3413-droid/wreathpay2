import Link from "next/link";
import { Flower2, Leaf, ChevronRight } from "lucide-react";

export default function ServiceSelector() {
  return (
    <section className="border-b border-border bg-white px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-[20px] font-bold leading-snug text-foreground md:text-[26px]">
          행사가 끝난 뒤, 남은 화환과 화분을 정리하세요.
        </h2>
        <p className="mt-2 text-[13.5px] text-muted md:text-[15px]">
          꽃깞이 방문회수부터 가치 확인과 정산까지 연결합니다.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 카드 1: 화환 페이백 */}
          <Link
            href="/estimate"
            className="hover-lift group flex flex-col rounded-[20px] border border-border bg-white p-6 shadow-[0_10px_28px_-22px_rgba(23,26,24,0.25)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F6EF] text-[#00A878]">
              <Flower2 size={24} strokeWidth={1.8} />
            </div>
            <p className="mt-4 text-[17px] font-bold text-foreground">화환 페이백</p>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">
              받은 화환, 그냥 보내지 마세요. 사진 한 장으로 예상 페이백을 확인하고 방문회수를
              신청하세요.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#00A878]">
              화환 예상금액 확인하기
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* 카드 2: 개업화분 회수 */}
          <Link
            href="/plant-collection"
            className="hover-lift group flex flex-col rounded-[20px] border border-border bg-white p-6 shadow-[0_10px_28px_-22px_rgba(23,26,24,0.25)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F2EC] text-[#0B6B4F]">
              <Leaf size={24} strokeWidth={1.8} />
            </div>
            <p className="mt-4 text-[17px] font-bold text-foreground">개업화분 회수</p>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">
              개업 후 남은 화분, 관리가 어렵다면 맡겨주세요. 상태를 확인해 회수·정리·재배치
              가능 여부를 안내합니다.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#0B6B4F]">
              개업화분 회수 신청하기
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
