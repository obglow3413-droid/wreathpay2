"use client";

import { useState } from "react";

const TEMPLATES: Record<string, { label: string; texts: string[] }> = {
  wedding: {
    label: "청첩장",
    texts: [
      "보내주신 축하 화환은 예식 후 KKOT PAY를 통해 정리합니다. 마음만으로도 감사히 받겠습니다.\nkkotpay.kr",
      "축하 화환은 예식이 끝난 뒤 전문 수거 서비스(KKOT PAY)로 깔끔하게 정리할 예정입니다.\nkkotpay.kr",
    ],
  },
  funeral: {
    label: "부고",
    texts: [
      "보내주신 근조 화환은 발인 후 전문 수거 서비스(KKOT PAY)를 통해 정중히 정리하겠습니다.\nkkotpay.kr",
      "근조 화환은 장례 일정이 끝난 뒤 KKOT PAY에서 조용히 수거합니다. 깊이 감사드립니다.\nkkotpay.kr",
    ],
  },
  opening: {
    label: "개업 안내",
    texts: [
      "축하 화환·화분은 감사히 받겠습니다. 행사 후 화환은 KKOT PAY로 정리합니다.\nkkotpay.kr",
      "보내주신 개업 축하 화환은 일정이 끝난 뒤 KKOT PAY 수거 서비스로 정리할 예정입니다.\nkkotpay.kr",
    ],
  },
};

export default function ShareTextTool() {
  const [kind, setKind] = useState("wedding");
  const [copied, setCopied] = useState(-1);
  return (
    <div className="mt-6">
      <div className="flex gap-2">
        {Object.entries(TEMPLATES).map(([k, v]) => (
          <button key={k} type="button" onClick={() => { setKind(k); setCopied(-1); }} className={`h-10 flex-1 rounded-full border text-[13.5px] font-semibold ${kind === k ? "border-forest bg-forest text-ivory" : "border-border bg-white text-muted"}`}>
            {v.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {TEMPLATES[kind].texts.map((t, i) => (
          <li key={i} className="rounded-xl border border-border bg-white p-4">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{t}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(t);
                  setCopied(i);
                } catch {}
              }}
              className="mt-3 h-10 w-full rounded-lg bg-brand text-[13.5px] font-semibold text-white"
            >
              {copied === i ? "복사됐어요" : "문구 복사"}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] leading-relaxed text-muted-light">문구는 자유롭게 고쳐 쓰셔도 됩니다. 행사 날짜가 정해졌다면 사전 예약을 해 두면 더 편해요.</p>
      <a href="/reserve" className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-border bg-white text-[14.5px] font-semibold">
        수거 사전 예약하기
      </a>
    </div>
  );
}
