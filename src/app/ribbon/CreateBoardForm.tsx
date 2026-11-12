"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { key: "funeral", label: "근조" },
  { key: "wedding", label: "결혼" },
  { key: "opening", label: "개업" },
  { key: "corporate", label: "행사" },
];

export default function CreateBoardForm() {
  const router = useRouter();
  const [eventType, setEventType] = useState("funeral");
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ribbon/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, eventType, hostName, hostPhone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "만들지 못했어요.");
        setLoading(false);
      } else {
        try {
          sessionStorage.setItem(`kkotpay:ribbon-host:${json.code}`, hostPhone);
        } catch {}
        router.push(`/ribbon/${json.code}`);
      }
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setLoading(false);
    }
  }

  const input = "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-brand";

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setEventType(t.key)}
            className={`h-11 rounded-lg border text-[13.5px] font-semibold ${eventType === t.key ? "border-brand bg-brand-tint text-brand-dark" : "border-border"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (예: 故 홍길동님 빈소)" maxLength={40} className={input} required />
      <input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="만드는 분 이름" maxLength={20} className={input} required />
      <input value={hostPhone} onChange={(e) => setHostPhone(e.target.value)} placeholder="휴대폰번호" inputMode="tel" className={input} required />
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="hover-lift h-13 w-full rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-50">
        {loading ? "만드는 중..." : "마음 전하기 링크 만들기"}
      </button>
    </form>
  );
}
