"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRequestButton({
  requestId,
  requestNo,
  variant = "row",
  redirectTo,
  onDeleted,
}: {
  requestId: string;
  requestNo: string;
  variant?: "row" | "full";
  redirectTo?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `${requestNo} 신청을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (onDeleted) onDeleted();
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      alert("삭제에 실패했어요. 다시 시도해주세요.");
      setDeleting(false);
    }
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex h-12 w-full items-center justify-center rounded-xl border border-red-200 text-[14.5px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? "삭제 중..." : "이 신청 삭제하기"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? "삭제 중" : "삭제"}
    </button>
  );
}
