"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatKRW } from "@/lib/pricing";
import type { RequestStatus } from "@/lib/types";

export default function RequestQuickActions({
  requestId,
  status,
  customerPaybackAmount,
  suggestion = null,
}: {
  requestId: string;
  status: RequestStatus;
  customerPaybackAmount: number;
  /** 수량 기준 권장 범위(금액이 아직 0일 때 입력칸에 중간값을 미리 채운다) */
  suggestion?: { low: number; high: number; mid: number } | null;
}) {
  const router = useRouter();
  const unpriced = !customerPaybackAmount && status !== "settled" && status !== "cancelled";
  const [amount, setAmount] = useState(unpriced && suggestion ? suggestion.mid : (customerPaybackAmount ?? 0));
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState<"approve" | "paybackApprove" | "payback" | null>(null);

  async function patchRequest(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        res.status === 401
          ? "관리자 로그인이 만료됐어요. 새로고침 후 다시 로그인해 주세요."
          : body.error || `처리에 실패했어요. (오류 ${res.status})`
      );
    }
  }

  async function handleApprove() {
    setLoading("approve");
    try {
      await patchRequest({ status: "customer_approved" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "승인 처리에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  async function handlePaybackApprove() {
    const confirmed = window.confirm(
      amount > 0 ? `페이백 금액을 ${formatKRW(amount)}으로 승인할까요?` : "페이백 0원(무료회수)으로 승인할까요?"
    );
    if (!confirmed) return;
    setLoading("paybackApprove");
    try {
      await patchRequest({ status: "customer_approved", overridePaybackAmount: amount });
      setDone(`${formatKRW(amount)} 승인 완료`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "페이백 승인에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  async function handlePaybackComplete() {
    const confirmed = window.confirm(`${formatKRW(amount)}을 페이백 완료(지급완료) 처리할까요?`);
    if (!confirmed) return;
    setLoading("payback");
    try {
      await patchRequest({
        status: "settled",
        overridePaybackAmount: amount,
        payout: { status: "completed" },
      });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "페이백완료 처리에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5">
      <StatusBadge status={status} />

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          className="h-8 w-28 rounded-md border border-border px-2 text-[12px] tabular-nums"
        />
        <span className="text-[11px] text-muted-light">원</span>
      </div>
      {unpriced && suggestion && (
        <p className="text-[10.5px] leading-snug text-muted">
          수량 기준 권장 {formatKRW(suggestion.low)}~{formatKRW(suggestion.high)}
        </p>
      )}
      {unpriced && !suggestion && <p className="text-[10.5px] text-muted">별도 견적 대상 · 금액 직접 입력</p>}
      {done && <p className="text-[10.5px] font-semibold text-brass">{done}</p>}

      <div className="flex flex-wrap gap-1.5">
        {status !== "customer_approved" && status !== "settled" && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading !== null}
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted disabled:opacity-50"
          >
            {loading === "approve" ? "처리중" : "승인"}
          </button>
        )}
        {status !== "settled" && (
          <button
            type="button"
            onClick={handlePaybackApprove}
            disabled={loading !== null}
            className="rounded-md border border-brand bg-brand-tint px-2 py-1 text-[11px] font-semibold text-brand-dark disabled:opacity-50"
          >
            {loading === "paybackApprove" ? "처리중" : "페이백승인"}
          </button>
        )}
        {status !== "settled" && (
          <button
            type="button"
            onClick={handlePaybackComplete}
            disabled={loading !== null}
            className="rounded-md bg-brand px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {loading === "payback" ? "처리중" : "페이백완료"}
          </button>
        )}
      </div>
    </div>
  );
}
