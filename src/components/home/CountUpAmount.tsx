"use client";

import { useEffect, useRef, useState } from "react";
import { formatKRW } from "@/lib/pricing";

/**
 * 점수판처럼 0에서 실제 금액까지 숫자가 올라가는 카운트업.
 * - 실제 데이터(양수 금액)가 있을 때만 사용
 * - 화면에 들어올 때 한 번만 실행, 이후 재실행하지 않음
 * - prefers-reduced-motion 환경에서는 바로 최종 값을 보여줌
 */
export default function CountUpAmount({ amount }: { amount: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [display, setDisplay] = useState(prefersReducedMotion ? amount : 0);
  const [done, setDone] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion || done) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const duration = 800;
        const start = performance.now();

        function tick(now: number) {
          const progress = Math.min(1, (now - start) / duration);
          // ease-out
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(amount * eased));
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            setDisplay(amount);
            setDone(true);
          }
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatKRW(display)}
    </span>
  );
}
