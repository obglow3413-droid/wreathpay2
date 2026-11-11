"use client";

import { useEffect, useRef, useState } from "react";

/** 화면에 들어오면 0에서 목표 숫자까지 올라가는 카운트업 (모션 최소화 환경에서는 즉시 표시) */
export default function CountUpNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced || value === 0) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("ko-KR")}
      {suffix}
    </span>
  );
}
