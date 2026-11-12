"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/compressImage";
import { QUANTITY_RANGE_LABEL, type QuantityRange } from "@/lib/types";

export interface Job {
  id: string;
  requestNo: string;
  status: string;
  place: string;
  address: string;
  detail: string | null;
  date: string;
  slot: string;
  quantity: string;
  note: string | null;
  ribbonWanted: boolean;
  name: string;
  phone: string;
}

export default function DriverJobs({ token, driverName, jobs }: { token: string; driverName: string; jobs: Job[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [ribbonCount, setRibbonCount] = useState<Record<string, string>>({});
  const [ribbonFiles, setRibbonFiles] = useState<Record<string, File[]>>({});

  async function pickRibbon(id: string, list: FileList | null) {
    if (!list) return;
    const compressed = await Promise.all(Array.from(list).map(compressImage));
    setRibbonFiles((p) => ({ ...p, [id]: [...(p[id] ?? []), ...compressed].slice(0, 8) }));
  }

  async function act(job: Job, action: "start" | "complete") {
    setBusy(job.id + action);
    setError(null);
    try {
      // 수거 완료 전에 리본 개수·사진을 먼저 저장(고객에게 돌려줄 자료)
      if (action === "complete" && job.ribbonWanted) {
        const files = ribbonFiles[job.id] ?? [];
        // Vercel 요청 크기 제한을 피하려고 3장씩 나눠 올린다(서버가 장마다 AI로 문구를 읽어 이어 붙임)
        const chunks: File[][] = files.length ? [] : [[]];
        for (let i = 0; i < files.length; i += 3) chunks.push(files.slice(i, i + 3));
        for (let ci = 0; ci < chunks.length; ci++) {
          const fd = new FormData();
          fd.append("token", token);
          fd.append("requestId", job.id);
          if (ci === 0 && ribbonCount[job.id]) fd.append("count", ribbonCount[job.id]);
          chunks[ci].forEach((f) => fd.append("files", f));
          const rr = await fetch("/api/driver/ribbon", { method: "POST", body: fd });
          if (!rr.ok) {
            setError((await rr.json().catch(() => ({}))).error ?? "리본 정보를 저장하지 못했어요.");
            setBusy(null);
            return;
          }
        }
      }
      const res = await fetch("/api/driver/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          requestId: job.id,
          action,
          actualQuantity: qty[job.id] ? Number(qty[job.id]) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "처리하지 못했어요.");
      else router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="text-[20px] font-bold">{driverName} 기사님</h1>
      <p className="mt-1 text-[13px] text-muted">배정된 수거 {jobs.length}건 · 현장에 도착하면 아래 버튼을 눌러주세요.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

      <div className="mt-5 space-y-4">
        {jobs.length === 0 && (
          <p className="rounded-xl border border-border px-5 py-10 text-center text-[14px] text-muted">배정된 수거 건이 없어요.</p>
        )}
        {jobs.map((j) => {
          const moving = j.status === "collecting";
          const q = QUANTITY_RANGE_LABEL[j.quantity as QuantityRange] ?? j.quantity;
          return (
            <div key={j.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-brand-dark">{j.requestNo}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${moving ? "bg-brand text-white" : "bg-surface text-muted"}`}>
                  {moving ? "이동 중" : "수거 예정"}
                </span>
              </div>
              <p className="mt-3 text-[16px] font-bold">{j.place}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed">
                {j.address}
                {j.detail ? ` · ${j.detail}` : ""}
              </p>
              <p className="mt-2 text-[12.5px] text-muted">
                {j.date} · {j.slot} · {q}
              </p>
              {j.note && <p className="mt-1 text-[12.5px] text-muted">{j.note}</p>}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(j.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center rounded-lg border border-border text-[13px] font-medium"
                >
                  🗺 지도 보기
                </a>
                <a href={`tel:${j.phone.replace(/\D/g, "")}`} className="flex h-10 items-center justify-center rounded-lg border border-border text-[13px] font-medium">
                  📞 {j.name || "고객"}에게 전화
                </a>
              </div>

              {!moving ? (
                <button
                  type="button"
                  onClick={() => act(j, "start")}
                  disabled={busy !== null}
                  className="mt-4 h-12 w-full rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-50"
                >
                  {busy === j.id + "start" ? "처리 중..." : "🚚 이동 시작"}
                </button>
              ) : null}

              {j.ribbonWanted && (
                <div className="mt-4 rounded-xl border border-border bg-surface p-3.5">
                  <p className="text-[13px] font-bold">🎗 리본 명단 정리 (고객이 신청했어요)</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">리본마다 글씨가 선명하게 읽히도록 가까이 찍어주세요. (한 장에 여러 개 가능, 최대 8장) 사진을 보고 업체명·문구를 자동 정리해요.</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={500}
                      value={ribbonCount[j.id] ?? ""}
                      onChange={(e) => setRibbonCount((p) => ({ ...p, [j.id]: e.target.value }))}
                      placeholder="리본 개수"
                      className="h-11 w-28 rounded-lg border border-border bg-white px-3 text-[14px]"
                    />
                    <label className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-[13px] font-medium">
                      📷 리본 사진 {(ribbonFiles[j.id]?.length ?? 0) > 0 ? `(${ribbonFiles[j.id].length}장)` : "찍기"}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { pickRibbon(j.id, e.target.files); e.target.value = ""; }} />
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={500}
                  value={qty[j.id] ?? ""}
                  onChange={(e) => setQty((p) => ({ ...p, [j.id]: e.target.value }))}
                  placeholder="실제 수거 개수"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-border px-4 text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!qty[j.id]) return setError("실제 수거한 화환 개수를 입력해 주세요.");
                    if (window.confirm(`${qty[j.id]}개 수거 완료로 처리할까요?`)) act(j, "complete");
                  }}
                  disabled={busy !== null}
                  className="h-12 shrink-0 rounded-xl bg-foreground px-5 text-[14.5px] font-semibold text-white disabled:opacity-50"
                >
                  {busy === j.id + "complete" ? "처리 중..." : "수거 완료"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
