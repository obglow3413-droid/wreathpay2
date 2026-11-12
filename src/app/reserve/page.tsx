import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import ReserveForm from "./ReserveForm";

export const metadata: Metadata = {
  title: "화환 수거 사전 예약",
  description: "결혼식·개업식·행사 날짜가 정해졌다면 화환 수거를 미리 예약하세요. 행사 당일 사진만 올리면 됩니다.",
  alternates: { canonical: "/reserve" },
};

export default function ReservePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-12">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">RESERVE</p>
        <h1 className="mt-2 text-[22px] font-extrabold leading-snug">행사 전에 미리 예약하세요</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          결혼식·개업식처럼 날짜가 정해진 행사는 수거를 먼저 잡아 둘 수 있어요. 사진은 행사 당일에 올리면 됩니다.
        </p>
        <ReserveForm />
      </main>
    </div>
  );
}
