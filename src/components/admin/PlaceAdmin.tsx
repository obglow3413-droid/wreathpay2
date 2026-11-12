"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import QRCode from "qrcode";

interface Row {
  slug: string;
  kind: "funeral" | "wedding";
  name: string;
  sigungu: string;
  isHidden: boolean;
  isPartner: boolean;
}

export default function PlaceAdmin({ places }: { places: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ kind: "wedding", name: "", sido: "서울특별시", sigungu: "", address: "" });

  async function post(body: unknown) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg(j.error ?? "저장하지 못했어요.");
    else router.refresh();
    return res.ok;
  }

  const k = q.trim().replace(/\s+/g, "");
  const list = places.filter((p) => !k || (p.name + p.sigungu).replace(/\s+/g, "").includes(k)).slice(0, 60);
  const input = "h-10 rounded-lg border border-border bg-white px-3 text-[13.5px] outline-none";

  return (
    <div className="mt-5 space-y-6">
      <section className="rounded-xl border border-border bg-white p-4">
        <p className="text-[14px] font-bold">새 장소 추가</p>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="wedding">웨딩홀</option>
            <option value="funeral">장례식장</option>
          </select>
          <input className={input} placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={input} value={form.sido} onChange={(e) => setForm({ ...form, sido: e.target.value })}>
            <option>서울특별시</option>
            <option>경기도</option>
            <option>인천광역시</option>
          </select>
          <input className={input} placeholder="시·군·구 (예: 강남구)" value={form.sigungu} onChange={(e) => setForm({ ...form, sigungu: e.target.value })} />
          <input className={input} placeholder="도로명 주소" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => (await post(form)) && setForm({ ...form, name: "", sigungu: "", address: "" })}
          className="mt-3 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          추가
        </button>
        {msg && <p className="mt-2 text-[12.5px] text-error">{msg}</p>}
      </section>

      <section>
        <input className={`${input} w-full md:w-80`} placeholder="이름·지역 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <p className="mt-2 text-[12px] text-muted">전체 {places.length}곳 · 최대 60곳까지 표시</p>
        <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-white">
          {list.map((p) => (
            <li key={p.slug} className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${p.isHidden ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">
                  {p.name} {p.isPartner && <span className="ml-1 rounded-full bg-brand-tint px-2 py-0.5 text-[10.5px] font-bold text-brass">제휴</span>}
                </p>
                <p className="text-[12px] text-muted">
                  {p.kind === "funeral" ? "장례식장" : "웨딩홀"} · {p.sigungu}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`https://kkotpay.kr/places/${p.slug}`);
                      setMsg(`${p.name} 전용 링크를 복사했어요.`);
                    } catch {}
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium"
                >
                  링크 복사
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const url = await QRCode.toDataURL(`https://kkotpay.kr/places/${p.slug}`, { width: 720, margin: 2 });
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `kkotpay-qr-${p.name}.png`;
                    a.click();
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium"
                >
                  QR 저장
                </button>
                <button type="button" disabled={busy} onClick={() => post({ slug: p.slug, isPartner: !p.isPartner })} className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-40">
                  {p.isPartner ? "제휴 해제" : "제휴 표시"}
                </button>
                <button type="button" disabled={busy} onClick={() => post({ slug: p.slug, isHidden: !p.isHidden })} className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-40">
                  {p.isHidden ? "다시 보이기" : "숨기기"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
