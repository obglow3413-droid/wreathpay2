"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AutoEstimateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    if (!window.confirm("금액이 없는 접수 건에 수량 기준 권장 금액을 채우고 '견적 완료'로 바꿀까요?\n(지급 처리는 하지 않아요. 금액은 건별로 수정할 수 있어요.)")) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/requests/auto-estimate", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg(j.error ?? `실패했어요. (오류 ${res.status})`);
    else {
      setMsg(`${j.updated}건 산정 완료${j.skipped ? ` · ${j.skipped}건은 무료회수/별도 견적 대상이라 제외` : ""}`);
      router.refresh();
    }
  }
  return (
    <span className="flex items-center gap-2">
      {msg && <span className="text-[12px] text-muted">{msg}</span>}
      <button type="button" disabled={busy} onClick={run} className="rounded-lg border border-border bg-white px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-40">
        {busy ? "산정 중…" : "미산정 건 금액 자동 산정"}
      </button>
    </span>
  );
}
