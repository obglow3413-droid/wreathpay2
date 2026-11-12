"use client";

import { useState } from "react";

/** 수거한 화환의 처리 결과(재사용·폐기) 기록 — 고객 조회 화면에 "순환 결과"로 표시된다 */
export default function CirculationForm({ requestId, initial }: { requestId: string; initial: { reuse: number | null; discard: number | null } }) {
  const [reuse, setReuse] = useState(initial.reuse != null ? String(initial.reuse) : "");
  const [discard, setDiscard] = useState(initial.discard != null ? String(initial.discard) : "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/requests/${requestId}/circulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reuse: Number(reuse || 0), discard: Number(discard || 0) }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? "저장했어요. 고객 조회 화면에 표시돼요." : (j.error ?? "저장하지 못했어요."));
  }
  const input = "h-10 w-24 rounded-lg border border-border bg-white px-3 text-[14px] tabular-nums outline-none";
  return (
    <section className="mt-6 rounded-xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">순환 결과 (수거 후 처리)</h2>
      <p className="mt-1 text-[12.5px] text-muted">수거한 화환 중 재사용·폐기 수량을 기록하면 고객에게 처리 결과로 보여줘요.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-[12.5px] font-medium">
          재사용
          <input className={`${input} ml-2`} inputMode="numeric" value={reuse} onChange={(e) => setReuse(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="text-[12.5px] font-medium">
          폐기
          <input className={`${input} ml-2`} inputMode="numeric" value={discard} onChange={(e) => setDiscard(e.target.value.replace(/\D/g, ""))} />
        </label>
        <button type="button" disabled={busy} onClick={save} className="h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-40">
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
      {msg && <p className="mt-2 text-[12.5px] text-muted">{msg}</p>}
    </section>
  );
}
