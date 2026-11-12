"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendMessageForm({ code }: { code: string }) {
  const router = useRouter();
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ribbon/${code}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, message }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "보내지 못했어요.");
      else {
        setSent(true);
        setMessage("");
        router.refresh();
        setTimeout(() => setSent(false), 3000);
      }
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-brand";

  return (
    <form onSubmit={submit} className="mt-6 space-y-2.5 rounded-2xl border border-border bg-surface p-4">
      <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="보내는 분 (예: 김철수 / 회사명)" maxLength={20} className={`${input} h-12`} required />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="리본 문구 (예: 삼가 고인의 명복을 빕니다)"
        maxLength={100}
        rows={3}
        className={`${input} py-3`}
        required
      />
      <div className="flex items-center justify-between text-[12px] text-muted">
        <span>{message.length}/100</span>
        {error && <span className="text-red-600">{error}</span>}
        {sent && <span className="font-semibold text-brand-dark">마음이 전달됐어요 ✓</span>}
      </div>
      <button type="submit" disabled={loading} className="hover-lift h-12 w-full rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-50">
        {loading ? "보내는 중..." : "🎗 마음 전하기"}
      </button>
    </form>
  );
}
