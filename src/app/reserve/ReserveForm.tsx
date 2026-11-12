"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { id: "wedding", label: "결혼식" },
  { id: "opening", label: "개업" },
  { id: "corporate", label: "기업행사" },
  { id: "etc", label: "기타" },
];
const RANGES = ["1-4", "5-9", "10-29", "30-49", "50+"];
const RANGE_LABEL: Record<string, string> = { "1-4": "1~4개", "5-9": "5~9개", "10-29": "10~29개", "30-49": "30~49개", "50+": "50개 이상" };
const SLOTS = ["오전", "오후", "저녁", "시간 협의"];
const ymd = (d: Date) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

export default function ReserveForm() {
  const router = useRouter();
  const [f, setF] = useState({ eventType: "wedding", quantityRange: "10-29", pickupDate: "", pickupTimeSlot: "시간 협의", placeName: "", address: "", customerName: "", customerPhone: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [minDate] = useState(() => ymd(new Date(Date.now() + 86400_000)));
  const [maxDate] = useState(() => ymd(new Date(Date.now() + 180 * 86400_000)));
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const phoneOk = f.customerPhone.replace(/\D/g, "").length >= 10;
  const ready = f.pickupDate && f.placeName.trim() && f.address.trim().length > 4 && f.customerName.trim() && phoneOk && agree;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append("reserve", "1");
      fd.append("ribbonWanted", "0");
      try {
        const r = localStorage.getItem("kkotpay:ref");
        if (r) fd.append("sourceRef", `ref:${r}`);
      } catch {}
      const res = await fetch("/api/estimate", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error ?? "예약하지 못했어요. 잠시 후 다시 시도해 주세요.");
      else {
        try {
          sessionStorage.setItem(`kkotpay:phone:${j.requestNo}`, f.customerPhone);
        } catch {}
        router.push(`/estimate/complete?req=${encodeURIComponent(j.requestNo)}`);
      }
    } catch {
      setError("네트워크를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1.5 h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none";
  const label = "block text-[13px] font-semibold";
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <p className={label}>행사 종류</p>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setF({ ...f, eventType: t.id })} className={`h-11 rounded-xl border text-[13.5px] font-semibold ${f.eventType === t.id ? "border-forest bg-forest text-ivory" : "border-border bg-white text-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <label className={label}>
        행사 날짜(수거 희망일)
        <input type="date" required min={minDate} max={maxDate} value={f.pickupDate} onChange={set("pickupDate")} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          수거 시간대
          <select value={f.pickupTimeSlot} onChange={set("pickupTimeSlot")} className={input}>
            {SLOTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          예상 화환 수
          <select value={f.quantityRange} onChange={set("quantityRange")} className={input}>
            {RANGES.map((r) => (
              <option key={r} value={r}>
                {RANGE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={label}>
        장소 이름
        <input value={f.placeName} onChange={set("placeName")} placeholder="예: ○○웨딩홀 3층" className={input} />
      </label>
      <label className={label}>
        주소
        <input value={f.address} onChange={set("address")} placeholder="도로명 주소" className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          이름
          <input value={f.customerName} onChange={set("customerName")} className={input} autoComplete="name" />
        </label>
        <label className={label}>
          휴대폰번호
          <input value={f.customerPhone} onChange={set("customerPhone")} inputMode="tel" placeholder="010-0000-0000" className={input} autoComplete="tel" />
        </label>
      </div>
      <label className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>
          예약 안내 연락을 위한 개인정보 수집·이용에 동의하고, 페이백 금액은 행사 후 실제 수량·상태 확인 뒤 확정된다는 점을 확인했어요.
        </span>
      </label>
      {error && <p className="text-[13px] text-error">{error}</p>}
      <button type="submit" disabled={!ready || busy} className="h-13 w-full rounded-xl bg-brand py-3.5 text-[15.5px] font-bold text-white disabled:opacity-40">
        {busy ? "예약 중…" : "수거 예약하기"}
      </button>
      <p className="text-center text-[12px] text-muted-light">수거비 0원 · 예약 후 일정 변경·취소는 &lsquo;내 접수 조회&rsquo;에서 할 수 있어요</p>
    </form>
  );
}
