import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#F7F9F7]">
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:grid md:min-h-[600px] md:grid-cols-[55fr_45fr] md:items-center md:gap-14 md:px-8 md:py-0">
        {/* 왼쪽: 서비스 소개 문구 + CTA */}
        <div className="fade-up">
          <p className="text-[13px] font-semibold text-[#00A878]">세상의 모든 화환을 페이백해드립니다!</p>

          <h1 className="mt-3 break-keep text-[30px] font-extrabold leading-[1.25] tracking-tight text-[#171A18] md:mt-4 md:text-[58px] md:leading-[1.15]">
            버려지는 화환이
            <br />
            현금으로 돌아옵니다.
          </h1>

          <p className="mt-5 text-[15px] leading-relaxed text-[#59615D] md:text-[17px]">
            받은 화환, 그냥 보내면 0원.
            <br />
            사진 한 장이면 지금 받을 수 있는 페이백 가격을 확인할 수 있습니다.
          </p>

          <div className="mt-7">
            <Link
              href="/estimate"
              className="hover-lift flex h-[58px] w-full items-center justify-center rounded-[14px] bg-[#00A878] px-7 text-[17px] font-bold text-white hover:bg-[#008F68] md:inline-flex md:w-auto"
            >
              지금바로 페이백 받기
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-[#7A837E]">
            사진 견적 무료 · 방문수거 · 수거 완료 후 빠른 정산
          </p>
        </div>

        {/* 오른쪽(PC) / 아래(모바일): 사진 견적 카드 */}
        <div className="fade-up mt-8 md:mt-0" style={{ animationDelay: "80ms" }}>
          <Link
            href="/estimate"
            className="hover-lift block rounded-[22px] border border-[#E3E8E5] bg-white p-6 shadow-[0_16px_36px_-22px_rgba(23,26,24,0.18)] md:p-8"
          >
            <p className="text-[16px] font-bold text-[#171A18] md:text-[18px]">
              사진 올리고 페이백 확인하기
            </p>
            <p className="mt-1.5 text-[13.5px] text-[#59615D]">
              등급별 시세도 함께 확인할 수 있어요.
            </p>

            <div className="relative mt-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#E3E8E5] bg-[#F7F9F7] px-6 py-10 text-center">
              {/* 은은하게 반복해서 스치는 반짝임 */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
                style={{ animation: "shimmer 2.6s ease-in-out infinite" }}
              />
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A878]/30" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F6EF] text-[#00A878]">
                  <Camera size={24} strokeWidth={1.8} />
                </span>
              </div>
              <p className="relative mt-3 text-[14.5px] font-semibold text-[#171A18]">화환 사진 올리기</p>
              <p className="relative mt-1 text-[12px] text-[#7A837E]">JPG, PNG · 최대 10MB</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1 text-[12.5px] font-medium text-[#59615D]">
              가입 없이 바로 확인
              <ChevronRight size={14} className="text-[#7A837E]" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
