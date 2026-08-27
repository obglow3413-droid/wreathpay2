"use client";

import Link from "next/link";
import { MessageCircle, Bell } from "lucide-react";

export default function AppTopBar() {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      <Link href="/" className="text-[17px] font-extrabold tracking-tight">
        KKOT<span className="text-brand"> PAY</span>
      </Link>
      <div className="flex items-center gap-1">
        <a
          href="https://d5dpz.channel.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface"
          aria-label="상담하기"
        >
          <MessageCircle size={20} strokeWidth={1.8} />
        </a>
        <button
          type="button"
          onClick={() => alert("알림 기능은 준비 중이에요. 곧 만나보실 수 있어요!")}
          className="hover-lift flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface"
          aria-label="알림"
        >
          <Bell size={20} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
