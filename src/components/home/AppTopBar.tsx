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
          className="flex h-9 items-center gap-1 rounded-full px-2 text-[13.5px] font-semibold text-foreground underline-offset-4 hover:underline"
        >
          <ClipboardList size={17} strokeWidth={1.8} className="text-muted" />
          내 접수 조회
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
