"use client";

import { useState } from "react";

export default function HomeStatsForm({ initial }: { initial: { weekCount: number; returnedAmount: number } }) {
  const [weekCount, setWeekCount] = useState(String(initial.weekCount));
  const [amount, setAmount] = useState(String(initial.returnedAmount));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeStats: { weekCount: Number(weekCount) || 0, returnedAmount: Number(amount) || 0 } }),
    });
    setBusy(false);
    setMsg(res.ok ? "저장했어요. 홈 화면에 바로 반영돼요." : "저장하지 못했어요.");
  }

  const input = "h-11 w-full rounded-lg border border-border bg-white px-3 text-[14px] tabular-nums outline-none";
  return (
    <section className="mt-8 rounded-xl border border-border bg-white p-5">
      <h2 className="text-[16px] font-bold">홈 화면 실적 표시</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        사이트 밖에서 처리해 DB에 없는 실적을 홈에 반영할 때 씁니다. 실제로 처리한 숫자만 넣어 주세요. 금액을 0으로 두면 DB의 누적 정산 금액이 자동으로 표시되고, 건수는 DB 집계가 더 크면 DB 값이 표시돼요.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block text-[13px] font-medium">
          최근 7일 건수
          <input className={`${input} mt-1.5`} inputMode="numeric" value={weekCount} onChange={(e) => setWeekCount(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="block text-[13px] font-medium">
          최근 7일간 돌려드린 금액(원) — 0이면 DB 자동
          <input className={`${input} mt-1.5`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      <button type="button" disabled={busy} onClick={save} className="mt-4 rounded-lg bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-40">
        {busy ? "저장 중…" : "저장"}
      </button>
      {msg && <p className="mt-2 text-[12.5px] text-muted">{msg}</p>}
    </section>
  );
}
