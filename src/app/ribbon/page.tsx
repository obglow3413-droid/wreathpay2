import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import CreateBoardForm from "./CreateBoardForm";

export const metadata: Metadata = {
  title: "마음 전하기",
  description: "링크 하나로 조문·축하 리본 문구를 모아요. 가입 없이 휴대폰번호만으로 만들 수 있어요.",
};

export default function RibbonPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-24">
        <h1 className="text-[22px] font-bold">디지털 리본, 마음 전하기</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          링크를 지인에게 공유하면 각자 리본 문구를 남길 수 있어요. 모인 마음은 한곳에 정리되고, 30일 동안 보관돼요.
          조문이나 축하 인사를 전하는 용도로 쓰는 서비스이며, 결제나 송금은 없어요.
        </p>
        <CreateBoardForm />
        <p className="mt-6 text-[12px] leading-relaxed text-muted-light">
          만든 뒤에는 &ldquo;진행상황 조회&rdquo;에서 같은 휴대폰번호로 다시 열어볼 수 있어요.
        </p>
      </div>
    </div>
  );
}
