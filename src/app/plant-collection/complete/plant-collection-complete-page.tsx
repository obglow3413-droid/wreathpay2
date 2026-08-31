
import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";

export const metadata: Metadata = { title: "신청 완료" };

export default async function PlantCollectionCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>;
}) {
  const { req } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8DD] text-2xl">
          ✓
        </div>
        <h1 className="mt-5 text-[20px] font-bold leading-snug">
          개업화분 회수 신청이
          <br />
          완료되었습니다.
        </h1>
        {req && <p className="mt-2 text-[13.5px] text-muted">신청번호 {req}</p>}
        <p className="mt-4 text-[13px] leading-relaxed text-muted-light">
          화분의 상태·종류·수량·수거지역에 따라 무료회수, 페이백 또는 회수 불가로 안내될 수
          있습니다. 최종 조건은 사진 및 현장 확인 후 확정됩니다.
        </p>
        <Link
          href="/"
          className="hover-lift mt-8 flex h-13 w-full items-center justify-center rounded-xl border border-border text-[15px] font-semibold text-foreground"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
