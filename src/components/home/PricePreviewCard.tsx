"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { formatKRW } from "@/lib/pricing";

export interface CategoryRange {
  label: string;
  min: number;
  max: number;
}

const COUNT_DURATION_MS = 900;
const CYCLE_INTERVAL_MS = 2800;

export default function PricePreviewCard({ categories }: { categories: CategoryRange[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayMin, setDisplayMin] = useState(0);
  const [displayMax, setDisplayMax] = useState(0);
  const [lineDrawn, setLineDrawn] = useState(false);

  const active = categories[activeIndex];

  // 화면에 들어오면 애니메이션 시작
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // 일정 간격으로 다음 화환 종류로 자동 전환 (실시간 갱신 느낌)
  useEffect(() => {
    if (!started || categories.length <= 1) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % categories.length);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [started, categories.length]);

  // 활성 카테고리가 바뀔 때마다 숫자 카운팅 + 그래프 다시 그리기
  useEffect(() => {
    if (!started || !active) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReduced ? 0 : COUNT_DURATION_MS;

    let raf: number;
    let cancelled = false;
    const start = performance.now();

    function tick(now: number) {
      if (cancelled) return;
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 2.4);
      setDisplayMin(Math.round(active.min * eased));
      setDisplayMax(Math.round(active.max * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 카테고리 전환 시 그래프를 새로 그리기 위한 의도적 리셋
    setLineDrawn(false);
    raf = requestAnimationFrame((now) => {
      setDisplayMin(0);
      setDisplayMax(0);
      tick(now);
    });
    const lineTimer = setTimeout(() => setLineDrawn(true), 120);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(lineTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, activeIndex]);

  if (!active) return null;

  return (
    <div ref={ref} className="fade-up mt-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            <p className="text-[12px] text-muted-light">실시간 매입가 참고범위</p>
          </div>
          <p key={activeIndex} className="fade-up mt-1.5 text-[13px] font-semibold text-brand-dark">
            {active.label}
          </p>
          <p className="mt-0.5 text-[20px] font-extrabold tabular-nums leading-tight">
            {formatKRW(displayMin)} ~ {formatKRW(displayMax)}
          </p>
        </div>
        <Sparkline drawn={lineDrawn} seed={activeIndex} />
      </div>

      {/* 카테고리 인디케이터 점 */}
      <div className="mt-3 flex gap-1.5">
        {categories.map((c, i) => (
          <span
            key={c.label}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i === activeIndex ? "bg-brand" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-brand-tint px-3.5 py-3">
        <p className="text-[12.5px] font-semibold text-brand-dark">
          등급·상태·수량에 따라 실시간으로 계산돼요
        </p>
        <p className="mt-0.5 text-[11.5px] text-brand-dark/70">
          방문수거 후 최종 확인하면 더 정확한 금액을 안내드려요.
        </p>
      </div>
    </div>
  );
}

/** 카테고리마다 모양이 살짝 달라지는 추세선 (참고용 그래픽, 특정 수치를 주장하지 않음) */
function Sparkline({ drawn, seed }: { drawn: boolean; seed: number }) {
  const points = generatePoints(seed);
  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <svg width="72" height="40" viewBox="0 0 72 40" fill="none">
        <polyline
          key={seed}
          points={pointsStr}
          stroke="#0F9D68"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={drawn ? 0 : 100}
          style={{ transition: "stroke-dashoffset 1s var(--ease-premium)" }}
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="3"
          fill="#0F9D68"
          className={drawn ? "opacity-100 animate-bounce transition-opacity duration-300" : "opacity-0"}
          style={{ animationDuration: "1.4s" }}
        />
      </svg>
      <span
        className={`flex items-center gap-0.5 text-[10px] font-semibold text-brand transition-opacity duration-300 ${
          drawn ? "opacity-100" : "opacity-0"
        }`}
      >
        <TrendingUp size={11} strokeWidth={2.5} />
        상승 추세
      </span>
    </div>
  );
}

/** seed(카테고리 인덱스)에 따라 살짝 다른 모양의 7개 포인트를 결정적으로 생성 */
function generatePoints(seed: number) {
  const xs = [2, 14, 26, 38, 50, 62, 70];
  return xs.map((x, i) => {
    const wave = Math.sin((i + seed * 1.7) * 0.9) * 8;
    const trend = -i * 1.6; // 전반적으로 우상향(값이 커질수록 y가 작아짐 = 위로)
    const y = Math.round(28 + wave + trend);
    return { x, y: Math.max(6, Math.min(32, y)) };
  });
}
