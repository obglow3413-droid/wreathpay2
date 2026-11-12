"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKRW } from "@/lib/pricing";

/** 정산 대기 건: 계좌 전체 보기(복호화) + 입금 완료 처리 */
export default function SettlementActions({
  requestId,
  amount,
  hasAccount,
}: {
  requestId: string;
  amount: number;
  hasAccount: boolean;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState<"view" | "pay" | null>(null);

  async function reveal() {
    setBusy("view");
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/account`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "조회 실패");
      setAccount(`${json.bankName} ${json.accountNumber} (${json.holderName})`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "조회하지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  async function pay() {
    if (!window.confirm(`${formatKRW(amount)} 입금을 완료 처리할까요? (실제 입금을 마친 뒤에 눌러주세요)`)) return;
    setBusy("pay");
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "settled", overridePaybackAmount: amount, payout: { status: "completed" } }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "처리 실패");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리하지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      {hasAccount ? (
        account ? (
          <span className="select-all rounded bg-surface px-2 py-1 text-[12.5px] font-medium">{account}</span>
        ) : (
          <button type="button" onClick={reveal} disabled={busy !== null} className="text-[12.5px] font-medium text-brand-dark underline disabled:opacity-50">
            {busy === "view" ? "조회 중..." : "계좌 전체 보기"}
          </button>
        )
      ) : (
        <span className="text-[12.5px] text-amber-700">계좌 미등록</span>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={busy !== null || !hasAccount}
        className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40"
      >
        {busy === "pay" ? "처리 중..." : "입금 완료"}
      </button>
    </div>
  );
}
