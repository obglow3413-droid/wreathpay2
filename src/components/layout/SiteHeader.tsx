"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "border-border shadow-[0_4px_16px_-8px_rgba(15,23,42,0.12)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="꽃깞" width={104} height={24} priority className="h-6 w-auto" />
        </Link>
        <Link
          href="/signup"
          className="hover-lift rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-brand/40 hover:text-brand-dark"
        >
          1초 가입
        </Link>
      </div>
    </header>
  );
}
