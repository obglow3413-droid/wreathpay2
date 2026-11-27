import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import JoinForm from "@/components/wp/JoinForm";

export const metadata: Metadata = {
  title: "웨딩 파트너 가입",
  alternates: { canonical: "/wedding-partners/join" },
};

export default function JoinPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-8 pb-16">
        <p className="text-[12px] font-bold tracking-[0.24em] text-brass">WEDDING PARTNERS</p>
        <h1 className="mt-2 text-[24px] font-extrabold tracking-tight">웨딩 파트너 가입</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">가입 후 관리자 승인이 끝나면 추천 링크와 QR코드를 바로 쓸 수 있어요.</p>
        <JoinForm />
      </main>
    </div>
  );
}
