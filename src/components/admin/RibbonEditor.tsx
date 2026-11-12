"use client";

import { useEffect, useState } from "react";

/** 리본 사진을 보며 AI가 읽은 명단을 고치고 확정. 한 줄에 "보낸 분 | 문구" */
export default function RibbonEditor({ requestId }: { requestId: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("none");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/requests/${requestId}/ribbons`)
      .then((r) => r.json())
      .then((j) => {
        setPhotos(j.photos ?? []);
        setStatus(j.status ?? "none");
        setText(((j.items ?? []) as { sender: string; text: string; uncertain?: boolean }[]).map((i) => `${i.sender} | ${i.text}${i.uncertain ? " (?)" : ""}`).join("\n"));
      })
      .catch(() => setMsg("불러오지 못했어요."));
  }, [requestId]);

  async function save(confirm: boolean) {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/requests/${requestId}/ribbons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, confirm }),
    });
    setBusy(false);
    if (res.ok) {
      setStatus(confirm ? "confirmed" : "ai");
      setMsg(confirm ? "검수 완료로 저장했어요. 고객 화면에 반영됩니다." : "임시 저장했어요.");
    } else setMsg("저장하지 못했어요.");
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="grid grid-cols-3 gap-2">
        {photos.length === 0 && <p className="col-span-3 text-[12.5px] text-muted">올라온 리본 사진이 없어요.</p>}
        {photos.map((src, i) => (
          <a key={i} href={src} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`리본 ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
          </a>
        ))}
      </div>
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.min(14, Math.max(5, text.split("\n").length + 1))}
          placeholder={"(주)루우크 | 謹弔\n김철수 | 삼가 고인의 명복을 빕니다"}
          className="w-full rounded-lg border border-border p-3 text-[13px] leading-relaxed"
        />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" disabled={busy} onClick={() => save(false)} className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50">
            임시 저장
          </button>
          <button type="button" disabled={busy || !text.trim()} onClick={() => save(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40">
            검수 완료
          </button>
          <span className="text-[12px] text-muted">{status === "confirmed" ? "✓ 검수 완료" : status === "ai" ? "AI 정리본" : "미정리"}</span>
        </div>
        {msg && <p className="mt-1 text-[12px] text-muted">{msg}</p>}
      </div>
    </div>
  );
}
