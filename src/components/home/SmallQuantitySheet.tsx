"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageCheck, X } from "lucide-react";

const RULES = [
  {
    title: "1~9개 (소량)",
    body: "수거 기사님이 도착하면 차량까지 직접 실어주셔야 해요. 소량도 페이백은 똑같이 받을 수 있어요.",
  },
  {
    title: "10개 이상",
    body: "기사님이 현장에서 직접 상차합니다. 수량이 많을수록 일정 조율이 빨라요.",
  },
];

/**
 * "소량도 페이백" 안내 버튼 + 하단 시트.
 * 수거 기준: 하루 기사 10분이 서울 권역을 돌며 회수하며, 5~10개 미만의 소량은 직접 실어주셔야 한다.
 */
export default function SmallQuantitySheet({ ctaHref }: { ctaHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover-lift mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[13px] font-semibold text-foreground"
      >
        <PackageCheck size={16} strokeWidth={1.9} className="text-brass" />
        1개부터 페이백 · 소량 수거 안내
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fade-up relative w-full max-w-lg rounded-t-3xl bg-paper p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground md:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-brass">SMALL ORDER</p>
                <h2 className="mt-1 text-[20px] font-extrabold leading-snug">소량도 페이백 받을 수 있어요</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {RULES.map((r) => (
                <li key={r.title} className="rounded-2xl border border-line bg-ivory px-4 py-4">
                  <p className="text-[14px] font-bold">{r.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{r.body}</p>
                </li>
              ))}
            </ul>

            <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-muted">
              하루 기사님 10분이 서울 권역을 돌며 회수하고 있어요. 소량 수거는 기사님 동선에 맞춰 시간을 안내해 드리고,
              도착하시면 화환을 차량까지 직접 옮겨 실어주셔야 합니다.
            </p>

            <Link
              href={ctaHref}
              className="hover-lift mt-5 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-forest text-[15px] font-bold text-ivory"
            >
              이 방법으로 신청하기
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
