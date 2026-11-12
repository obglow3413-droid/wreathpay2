"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function call(method: "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    await fetch(`/api/admin/reviews/${id}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="mt-3 flex gap-2">
      <button type="button" disabled={busy} onClick={() => call("PATCH", { approved: !approved })} className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40">
        {approved ? "노출 해제" : "승인(홈에 노출)"}
      </button>
      <button type="button" disabled={busy} onClick={() => confirm("이 후기를 삭제할까요?") && call("DELETE")} className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted disabled:opacity-40">
        삭제
      </button>
    </div>
  );
}
