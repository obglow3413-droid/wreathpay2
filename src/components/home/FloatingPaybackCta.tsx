"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FloatingPaybackCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Hero 영역(대략 500px) 지나면 노출
      setVisible(window.scrollY > 500);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 z-40 px-4 transition-all duration-300 ${
        visible ? "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] opacity-100" : "pointer-events-none bottom-10 opacity-0"
      }`}
    >
      <Link
        href="/estimate"
        className="hover-lift mx-auto flex h-13 w-full max-w-md items-center justify-center gap-1.5 rounded-full bg-[#00A878] px-6 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(0,168,120,0.6)] hover:bg-[#008F68]"
      >
        지금바로 페이백 받기
        <ArrowRight size={17} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
