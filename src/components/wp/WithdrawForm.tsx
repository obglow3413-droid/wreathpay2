"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawForm({ available, min, hasAccount }: { available: number; min: number; hasAccount: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const n = Number(amount.replace(/\D/g, ""));
  const ok = hasAccount && n >= min && n <= available;

  async function submit() {
    if (!ok) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/wp/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg(j.error ?? "신청하지 못했어요.");
    else {
      setAmount("");
      setMsg("출금 신청이 접수됐어요. 승인 후 지급해 드려요.");
      router.refresh();
    }
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          value={amount ? Number(amount.replace(/\D/g, "")).toLocaleString("ko-KR") : ""}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder={available > 0 ? `최대 ${available.toLocaleString("ko-KR")}원` : "출금 가능 금액 없음"}
          disabled={!hasAccount || available < min}
          className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-white px-4 text-[15px] tabular-nums outline-none disabled:bg-surface"
        />
        <button type="button" onClick={() => setAmount(String(available))} disabled={!hasAccount || available < min} className="h-12 rounded-xl border border-border px-3 text-[13px] font-semibold disabled:opacity-40">
          전액
        </button>
      </div>
      <button type="button" onClick={submit} disabled={!ok || busy} className="mt-2 h-12 w-full rounded-xl bg-[#141211] text-[14.5px] font-bold text-[#e9cf97] disabled:opacity-40">
        {busy ? "신청 중…" : "출금 신청"}
      </button>
      {!hasAccount && <p className="mt-2 text-[12px] text-muted">정산 계좌를 먼저 등록해 주세요.</p>}
      {msg && <p className="mt-2 text-[12.5px] text-muted">{msg}</p>}
    </div>
  );
}
