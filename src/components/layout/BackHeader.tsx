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
        className="flex h-9 items-center gap-1 rounded-full px-2 text-[13.5px] font-semibold text-foreground underline-offset-4 hover:underline"
      >
        <ClipboardList size={17} strokeWidth={1.8} className="text-muted" />
        내 접수 조회
      </Link>
    </div>
  );
}
