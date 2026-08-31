"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKRW } from "@/lib/pricing";

const ACCENT = "#102A22";

export default function PlantQuickActions({
  requestId,
  status,
  paybackAmount,
}: {
  requestId: string;
  status: string;
  paybackAmount: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(paybackAmount);
  const [loading, setLoading] = useState<"approve" | "complete" | "delete" | null>(null);

  async function patchRequest(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/plant-collection/${requestId}`, {
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
    const confirmed = window.confirm(`페이백 금액을 ${formatKRW(amount)}으로 승인할까요?`);
    if (!confirmed) return;
    setLoading("approve");
    try {
      await patchRequest({ status: "approved", paybackAmount: amount });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "승인 처리에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  async function handleComplete() {
    const confirmed = window.confirm(`${formatKRW(amount)} 페이백을 완료 처리할까요?`);
    if (!confirmed) return;
    setLoading("complete");
    try {
      await patchRequest({ status: "completed", paybackAmount: amount });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "페이백완료 처리에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("이 화분 회수 신청을 삭제할까요?\n삭제하면 되돌릴 수 없어요.");
    if (!confirmed) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/plant-collection/${requestId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="h-8 w-24 rounded-md border border-border px-2 text-[12px] tabular-nums"
        />
        <span className="text-[11px] text-muted-light">원</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {status !== "completed" && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading !== null}
            className="rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
            style={{ borderColor: ACCENT, backgroundColor: "#E7EBE4", color: ACCENT }}
          >
            {loading === "approve" ? "처리중" : "승인"}
          </button>
        )}
        {status !== "completed" && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={loading !== null}
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {loading === "complete" ? "처리중" : "페이백완료"}
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading !== null}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
        >
          {loading === "delete" ? "삭제중" : "삭제"}
        </button>
      </div>
    </div>
  );
}
