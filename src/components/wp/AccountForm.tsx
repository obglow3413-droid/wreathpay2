"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountForm({ banks, current }: { banks: string[]; current: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(!current);
  const [bank, setBank] = useState("");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/wp/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bank, holder, account }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg(j.error ?? "저장하지 못했어요.");
    else {
      setOpen(false);
      setAccount("");
      router.refresh();
    }
  }

  const input = "h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] outline-none";
  return (
    <div className="mt-4 rounded-xl bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">정산 계좌</p>
        {current && (
          <button type="button" onClick={() => setOpen(!open)} className="text-[12.5px] font-semibold underline">
            {open ? "닫기" : "변경"}
          </button>
        )}
      </div>
      {current && !open && <p className="mt-1 text-[13px] text-muted">{current}</p>}
      {open && (
        <div className="mt-3 space-y-2">
          <select value={bank} onChange={(e) => setBank(e.target.value)} className={input}>
            <option value="">은행 선택</option>
            {banks.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="예금주" className={input} />
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="계좌번호(숫자만)" inputMode="numeric" className={input} />
          {msg && <p className="text-[12.5px] text-error">{msg}</p>}
          <button type="button" disabled={busy || !bank || holder.trim().length < 2 || account.replace(/\D/g, "").length < 8} onClick={save} className="h-11 w-full rounded-xl bg-brand text-[14px] font-semibold text-white disabled:opacity-40">
            {busy ? "저장 중…" : "계좌 저장"}
          </button>
          <p className="text-[11.5px] text-muted-light">계좌번호는 암호화해서 보관해요.</p>
        </div>
      )}
    </div>
  );
}
