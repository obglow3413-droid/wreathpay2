"use client";

import Logo from "@/components/layout/Logo";

import Link from "next/link";
import { ClipboardList, MessageCircle } from "lucide-react";

export default function AppTopBar() {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      <Logo />
      <div className="flex items-center gap-1.5">
        <Link
          href="/status/lookup"
          className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-paper px-3.5 text-[13px] font-semibold text-foreground"
        >
          <ClipboardList size={15} strokeWidth={2} />
          진행상황 조회
        </Link>
        <a
          href="https://d5dpz.channel.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface"
          aria-label="채널톡 상담"
        >
          <MessageCircle size={20} strokeWidth={1.8} />
        </a>
      </div>
    </header>
  );
}
