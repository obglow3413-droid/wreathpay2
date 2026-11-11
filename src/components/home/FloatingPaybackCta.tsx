"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useServiceTab } from "./ServiceTabContext";
import { SERVICE_CONTENT } from "./serviceContent";

export default function FloatingPaybackCta() {
  const { active } = useServiceTab();
  const content = SERVICE_CONTENT[active];
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
        visible
          ? "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] opacity-100"
          : "pointer-events-none bottom-10 opacity-0"
      }`}
    >
      <Link
        href={content.ctaHref}
        className="hover-lift mx-auto flex h-13 w-full max-w-md items-center justify-center gap-1.5 rounded-full bg-forest px-6 text-[15px] font-bold text-ivory shadow-[0_10px_28px_-10px_rgba(0,0,0,0.5)]"
      >
        {content.ctaLabel}
        <ArrowRight size={17} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
