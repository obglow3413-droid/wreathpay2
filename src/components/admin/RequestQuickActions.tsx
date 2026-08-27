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
}: {
  requestId: string;
  status: RequestStatus;
  customerPaybackAmount: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(customerPaybackAmount);
  const [loading, setLoading] = useState<"approve" | "paybackApprove" | "payback" | null>(null);

  async function patchRequest(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "처리에 실패했어요.");
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
    const confirmed = window.confirm(`페이백 금액을 ${formatKRW(amount)}으로 승인할까요?`);
    if (!confirmed) return;
    setLoading("paybackApprove");
    try {
      await patchRequest({ status: "customer_approved", overridePaybackAmount: amount });
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
          onChange={(e) => setAmount(Number(e.target.value))}
          className="h-8 w-28 rounded-md border border-border px-2 text-[12px] tabular-nums"
        />
        <span className="text-[11px] text-muted-light">원</span>
      </div>

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
