import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import LookupForm from "./LookupForm";

export const metadata: Metadata = {
  title: "접수번호로 조회",
  description: "가입 없이 접수번호와 연락처만으로 화환 수거 진행 상황을 확인하세요.",
};

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>;
}) {
  const { req } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-24">
        <h1 className="text-[20px] font-bold">접수번호로 진행상황 조회</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
          가입 없이 접수번호와 신청 시 입력한 연락처만으로 확인할 수 있어요.
        </p>
        <LookupForm initialRequestNo={req ?? ""} />
      </div>
    </div>
  );
}
