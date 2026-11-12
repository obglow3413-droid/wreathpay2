import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";
import Checklist from "./Checklist";

export const metadata: Metadata = {
  title: "웨딩홀 계약 전 화환 체크리스트",
  description: "웨딩홀 계약 전에 확인할 화환 관련 조항 7가지. 예식 후 화환을 직접 정리하고 페이백 받으려면 꼭 확인하세요.",
  alternates: { canonical: "/wedding-checklist" },
};

export default function WeddingChecklistPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-12">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">웨딩 계약 전 필수 체크</p>
        <h1 className="mt-2 text-[23px] font-extrabold leading-snug">
          화환, 예식 끝나고
          <br />
          그냥 두고 나오지 마세요
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          받은 축하화환을 어떻게 처리할지는 웨딩홀 계약 내용에 따라 달라져요. 계약서에 서명하기 전에 아래 7가지를 홀 담당자에게 확인해 두세요.
        </p>
        <Checklist />
        <div className="mt-8 rounded-2xl border border-border bg-white p-5">
          <p className="text-[15px] font-bold">예식 날짜가 정해졌다면</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">수거를 미리 예약해 두면 예식 당일 사진만 올리면 돼요. 수거비는 0원이고, 화환 수량·상태에 따라 페이백해 드려요.</p>
          <Link href="/reserve" className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[14.5px] font-semibold text-white">
            화환 수거 사전 예약하기
          </Link>
          <Link href="/places" className="mt-2 flex h-11 w-full items-center justify-center text-[13.5px] font-medium text-muted underline underline-offset-4">
            우리 웨딩홀 찾아보기
          </Link>
        </div>
        <p className="mt-6 text-[11.5px] leading-relaxed text-muted-light">
          이 체크리스트는 일반적인 확인 항목 안내이며 법률 자문이 아닙니다. 화환 처리 권한과 조건은 각 웨딩홀의 계약서·약관에 따라 다를 수 있어요.
        </p>
      </main>
    </div>
  );
}
