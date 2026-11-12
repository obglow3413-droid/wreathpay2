"use client";

import { useState } from "react";

export default function ShareLink({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = `${window.location.origin}/ribbon/${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "마음 전하기", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {}
  }
  return (
    <button type="button" onClick={share} className="mt-3 h-11 w-full rounded-xl border border-border text-[13.5px] font-semibold">
      {done ? "링크를 복사했어요 ✓" : "🔗 지인에게 링크 공유하기"}
    </button>
  );
}
