"use client";

import Logo from "@/components/layout/Logo";

import { MessageCircle } from "lucide-react";

export default function AppTopBar() {
  return (
    <header className="flex h-14 items-center justify-between bg-ivory px-5">
      <Logo />
      <div className="flex items-center gap-1">
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
