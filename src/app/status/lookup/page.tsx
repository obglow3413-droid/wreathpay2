import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import LookupForm from "./LookupForm";
import Track from "@/components/Track";

export const metadata: Metadata = {
  title: "진행상황 조회",
  description: "가입 없이 휴대폰번호만으로 화환 수거 진행 상황을 확인하세요.",
};

export default function LookupPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-12">
        <h1 className="text-[20px] font-bold">진행상황 조회</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
          가입 없이, 신청할 때 입력한 휴대폰번호만으로 확인할 수 있어요.
        </p>
        <Track event="lookup_view" />
        <LookupForm />
      </div>
    </div>
  );
}
