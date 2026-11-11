"use client";

import { useState } from "react";

/** 진행 알림(문자) 신청 버튼. 연락처를 알고 있으면(신청 직후) 바로, 아니면 조회 시 입력한 연락처로 신청. */
export default function NotifyButton({ requestNo, phone }: { requestNo: string; phone: string }) {
  const [state, setState] = useState<"idle" | "loading" | "on" | "error">("idle");
  const [smsReady, setSmsReady] = useState(true);
  const [msg, setMsg] = useState("");

  async function toggle() {
    const enable = state !== "on";
    setState("loading");
    try {
      const res = await fetch("/api/status/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNo, phone, enable }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "신청하지 못했어요.");
        setState("error");
        return;
      }
      setSmsReady(Boolean(json.smsReady));
      setState(json.enabled ? "on" : "idle");
    } catch {
      setMsg("네트워크 오류가 발생했어요.");
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={state === "loading" || !phone}
        className={`hover-lift flex h-13 w-full items-center justify-center gap-2 rounded-xl border py-3.5 text-[15px] font-semibold disabled:opacity-50 ${
          state === "on" ? "border-brand bg-brand-tint text-brand-dark" : "border-border bg-white"
        }`}
      >
        🔔 {state === "on" ? "알림 신청 완료 (누르면 해제)" : state === "loading" ? "처리 중..." : "진행 알림 신청하기"}
      </button>
      {state === "on" && (
        <p className="mt-1.5 text-center text-[12px] text-muted">
          {smsReady
            ? "배정·이동 중·수거 완료·정산 때 문자로 알려드려요."
            : "알림 신청이 저장됐어요. 문자 발송은 준비 중이라, 그동안은 이 화면에서 실시간으로 확인해 주세요."}
        </p>
      )}
      {state === "error" && <p className="mt-1.5 text-center text-[12px] text-red-600">{msg}</p>}
    </div>
  );
}
