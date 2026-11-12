"use client";

import { useState } from "react";
import { BANK_LIST } from "./banks";

/** 페이백 계좌 등록. 정산은 수거 완료 후 이 계좌로 입금돼요. 계좌번호는 서버에서 암호화해 저장. */
export default function AccountForm({
  requestNo,
  phone,
  initial,
}: {
  requestNo: string;
  phone: string;
  initial: { bankName: string; last4: string } | null;
}) {
  const [registered, setRegistered] = useState(initial);
  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState("");
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNo, phone, bankName: bank, holderName: holder, accountNumber: number }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "등록하지 못했어요.");
      } else {
        setRegistered({ bankName: json.bankName, last4: json.last4 });
        setOpen(false);
        setNumber("");
      }
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  const input = "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-brand";

  if (!open) {
    return (
      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-[12px] text-muted">페이백 입금 계좌 · 수거 완료 후 입금돼요</p>
        {registered ? (
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[14px] font-semibold">
              {registered.bankName} ····{registered.last4}
            </p>
            <button type="button" onClick={() => setOpen(true)} className="text-[12.5px] font-medium text-brand-dark underline">
              변경
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hover-lift mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-brand text-[14px] font-semibold text-white"
          >
            🏦 페이백 계좌 등록하기
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2.5 rounded-lg border border-border px-4 py-4">
      <p className="text-[13.5px] font-bold">페이백 받을 계좌</p>
      <select value={bank} onChange={(e) => setBank(e.target.value)} className={input} required>
        <option value="">은행 선택</option>
        {BANK_LIST.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="예금주" className={input} required />
      <input
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="계좌번호 (숫자만)"
        inputMode="numeric"
        autoComplete="off"
        className={input}
        required
      />
      <p className="text-[11.5px] leading-relaxed text-muted">계좌번호는 암호화되어 저장되며, 정산 입금 목적으로만 사용해요.</p>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-lg border border-border text-[14px] font-medium">
          취소
        </button>
        <button type="submit" disabled={loading} className="h-11 rounded-lg bg-brand text-[14px] font-semibold text-white disabled:opacity-50">
          {loading ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
