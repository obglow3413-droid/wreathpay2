"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  name: string;
  phone: string;
}

export default function DriverJobs({ token, driverName, jobs }: { token: string; driverName: string; jobs: Job[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function act(job: Job, action: "start" | "complete") {
    setBusy(job.id + action);
    setError(null);
    try {
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
