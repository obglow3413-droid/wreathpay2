import Link from "next/link";
import { ClipboardList } from "lucide-react";
import Logo from "./Logo";

/** 하위 페이지 공통 상단바: 로고(홈) + 진행상황 조회. 하단 탭 대신 이 두 가지만 항상 보인다. */
export default function BackHeader() {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-paper px-5">
      <Logo />
      <Link
        href="/status/lookup"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-paper px-3.5 text-[13px] font-semibold text-foreground"
      >
        <ClipboardList size={15} strokeWidth={2} />
        진행상황 조회
      </Link>
    </div>
  );
}
