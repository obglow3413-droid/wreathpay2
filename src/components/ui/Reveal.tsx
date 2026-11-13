"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 뷰포트에 들어올 때 한 번만 fade-up 애니메이션을 재생하는 래퍼.
 * prefers-reduced-motion 환경에서는 애니메이션 없이 바로 보여줍니다.
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // 조금이라도 화면에 걸리면 바로 보여준다(빠르게 넘기거나 인앱 브라우저에서 놓치지 않도록)
      { threshold: 0, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(node);
    // 안전장치: 관찰이 어떤 이유로든 동작하지 않아도 내용이 빈 채로 남지 않게 한다
    const failsafe = setTimeout(() => setVisible(true), 3500);
    return () => {
      observer.disconnect();
      clearTimeout(failsafe);
    };
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
