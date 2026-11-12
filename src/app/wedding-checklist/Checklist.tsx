"use client";

import { useEffect, useState } from "react";

const ITEMS: { q: string; why: string }[] = [
  { q: "축하화환을 외부로 반출할 수 있나요?", why: "외부 업체 수거를 막거나 홀 지정 업체만 허용하는 곳이 있어요." },
  { q: "예식 후 화환 처분 권한이 누구에게 있나요?", why: "계약서·약관에 '화환은 홀이 처리한다'는 조항이 있는지 확인하세요." },
  { q: "화환 수거는 예식 종료 후 언제까지 가능한가요?", why: "다음 예식 준비로 30분~1시간 안에 빼야 하는 경우가 많아요." },
  { q: "화환을 두는 위치와 수량 제한이 있나요?", why: "로비·홀 앞 배치 개수를 제한하면 받을 수 있는 수량이 달라져요." },
  { q: "반출할 때 철거비·폐기비를 따로 받나요?", why: "비용이 붙는지, 직접 수거하면 면제되는지 물어보세요." },
  { q: "리본(보낸 분 이름)만 따로 챙길 수 있나요?", why: "감사 인사를 전하려면 리본이나 명단이 필요해요." },
  { q: "당일 화환 담당자 연락처를 받을 수 있나요?", why: "수거 기사와 홀 담당자가 바로 연락되면 예식 당일 신경 쓸 일이 없어요." },
];
const KEY = "kkotpay:wedding-checklist";

export default function Checklist() {
  const [done, setDone] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [shared, setShared] = useState("");
  // 체크 상태는 이 기기에만 기억(다음에 열어도 이어서 확인)
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(v) && v.length === ITEMS.length) setDone(v.map(Boolean));
    } catch {}
  }, []);
  function toggle(i: number) {
    setDone((d) => {
      const n = d.map((x, k) => (k === i ? !x : x));
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {}
      return n;
    });
  }
  async function share() {
    const url = "https://kkotpay.kr/wedding-checklist";
    const text = "웨딩홀 계약 전 화환 체크리스트 7가지";
    try {
      if (navigator.share) await navigator.share({ title: text, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShared("링크를 복사했어요");
      }
    } catch {}
  }
  const count = done.filter(Boolean).length;
  return (
    <div className="mt-6">
      <p className="text-[12.5px] font-semibold text-muted">
        {count} / {ITEMS.length} 확인
      </p>
      <div className="mt-1.5 h-1.5 rounded-full bg-sage">
        <div className="h-1.5 rounded-full bg-brass transition-all" style={{ width: `${(count / ITEMS.length) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-2.5">
        {ITEMS.map((it, i) => (
          <li key={it.q}>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 ${done[i] ? "border-brass bg-brand-tint" : "border-border bg-white"}`}>
              <input type="checkbox" checked={done[i]} onChange={() => toggle(i)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brass)]" />
              <span>
                <span className="block text-[14.5px] font-bold leading-snug">{it.q}</span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">{it.why}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <button type="button" onClick={share} className="mt-4 h-12 w-full rounded-xl border border-border bg-white text-[14.5px] font-semibold">
        예비부부 친구에게 보내기
      </button>
      {shared && <p className="mt-2 text-center text-[12.5px] text-muted">{shared}</p>}
    </div>
  );
}
