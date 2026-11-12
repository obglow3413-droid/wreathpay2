"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefPartners({ partners }: { partners: { code: string; name: string; kind: string | null; count: number }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("꽃집");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function post(body: unknown) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/ref-partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg(j.error ?? "처리하지 못했어요.");
    else {
      setName("");
      router.refresh();
    }
  }
  const input = "h-10 rounded-lg border border-border bg-white px-3 text-[13.5px] outline-none";
  return (
    <section className="mt-8 rounded-xl border border-border bg-white p-5">
      <h2 className="text-[16px] font-bold">제휴 추천 링크</h2>
      <p className="mt-1 text-[13px] text-muted">꽃집·예식장 등 제휴처마다 전용 링크를 만들어 주세요. 그 링크로 들어온 접수가 제휴처별로 집계돼요.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select className={input} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option>꽃집</option>
          <option>예식장</option>
          <option>장례식장</option>
          <option>기타</option>
        </select>
        <input className={`${input} min-w-0 flex-1`} placeholder="제휴처 이름" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="button" disabled={busy || name.trim().length < 2} onClick={() => post({ name, kind })} className="h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-40">
          링크 만들기
        </button>
      </div>
      {msg && <p className="mt-2 text-[12.5px] text-error">{msg}</p>}
      <ul className="mt-4 divide-y divide-border">
        {partners.length === 0 && <li className="py-3 text-[13px] text-muted">아직 만든 제휴 링크가 없어요.</li>}
        {partners.map((p) => (
          <li key={p.code} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">
                {p.name} <span className="ml-1 text-[12px] font-normal text-muted">{p.kind ?? ""}</span>
              </p>
              <p className="text-[12px] text-muted">kkotpay.kr/?r={p.code} · 접수 {p.count}건</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`https://kkotpay.kr/?r=${p.code}`);
                    setMsg("");
                  } catch {}
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium"
              >
                링크 복사
              </button>
              <button type="button" disabled={busy} onClick={() => confirm(`${p.name} 링크를 삭제할까요?`) && post({ remove: p.code })} className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted disabled:opacity-40">
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
