"use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import StatusTimeline from "@/components/status/StatusTimeline";
import { formatKRW } from "@/lib/pricing";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  type EventType,
  type QuantityRange,
  type RequestStatus,
} from "@/lib/types";

interface LookupResult {
  requestNo: string;
  eventType: EventType;
  quantityRange: QuantityRange;
  status: RequestStatus;
  pickupDate: string;
  pickupTimeSlot: string;
  paybackAmount: number;
  aiRange: { low: number; high: number } | null;
  createdAt: string;
}

export default function LookupForm({ initialRequestNo }: { initialRequestNo: string }) {
  const [requestNo, setRequestNo] = useState(initialRequestNo);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/status/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNo, phone }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "조회에 실패했어요.");
      else setResult(json as LookupResult);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-brand";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          value={requestNo}
          onChange={(e) => setRequestNo(e.target.value)}
          placeholder="접수번호 (예: WP-20260101-AB12)"
          autoCapitalize="characters"
          className={inputClass}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="신청 시 입력한 연락처"
          inputMode="tel"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading || !requestNo.trim() || phone.replace(/\D/g, "").length < 9}
          className="hover-lift h-13 w-full rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {loading ? "조회 중..." : "조회하기"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

      {result && (
        <div className="fade-up mt-6 rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-bold text-brand-dark">{result.requestNo}</p>
            <StatusBadge status={result.status} />
          </div>

          <div className="mt-5">
            <StatusTimeline status={result.status} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-y-1.5 border-t border-border pt-4 text-[13px] text-muted">
            <span>{EVENT_TYPE_LABEL[result.eventType]}</span>
            <span className="text-right">{QUANTITY_RANGE_LABEL[result.quantityRange]}</span>
            <span>{result.pickupDate}</span>
            <span className="text-right">{result.pickupTimeSlot}</span>
          </div>

          {(result.status === "received" || result.status === "estimating") && result.aiRange ? (
            <div className="mt-4 rounded-lg bg-surface px-4 py-3">
              <p className="text-[12px] text-muted">AI 예상 페이백 (현장 확인 후 확정)</p>
              <p className="mt-0.5 text-[17px] font-extrabold tabular-nums text-brand-dark">
                {formatKRW(result.aiRange.low)} ~ {formatKRW(result.aiRange.high)}
              </p>
            </div>
          ) : (
            result.paybackAmount > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-4 py-3">
              <span className="text-[13px] font-semibold">예상 페이백</span>
              <span className="text-[17px] font-extrabold tabular-nums text-brand-dark">
                {formatKRW(result.paybackAmount)}
              </span>
            </div>
            )
          )}
        </div>
      )}

      <a
        href="https://d5dpz.channel.io"
        target="_blank"
        rel="noopener noreferrer"
        className="hover-lift mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-border text-[14.5px] font-semibold"
      >
        💬 채널톡으로 문의하기
      </a>
    </>
  );
}
