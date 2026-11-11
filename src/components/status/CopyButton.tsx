"use client";

import { useState } from "react";

/** 접수번호 같은 짧은 텍스트를 한 번에 복사 */
export default function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // 복사 권한이 없으면 아무 일도 하지 않음
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted hover:text-foreground"
    >
      {done ? "복사됨 ✓" : label}
    </button>
  );
}
