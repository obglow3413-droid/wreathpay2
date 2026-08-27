"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DriverApplicationActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    if (action === "reject") {
      const confirmed = window.confirm("이 지원서를 거절할까요?");
      if (!confirmed) return;
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/driver-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("처리에 실패했어요.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="rounded-lg bg-brand px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
      >
        {loading === "approve" ? "처리중" : "승인"}
      </button>
      <button
        type="button"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted disabled:opacity-50"
      >
        {loading === "reject" ? "처리중" : "거절"}
      </button>
    </div>
  );
}
