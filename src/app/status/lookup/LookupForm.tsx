"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccountForm from "@/components/status/AccountForm";
import NotifyButton from "@/components/status/NotifyButton";
import StatusBadge from "@/components/admin/StatusBadge";
import StatusTimeline from "@/components/status/StatusTimeline";
import { formatKRW } from "@/lib/pricing";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  type EventType,
  type QuantityRange,
  type RequestStatus,
} from "@/lib/types";

interface Item {
  requestNo: string;
  eventType: EventType;
  quantityRange: QuantityRange;
  status: RequestStatus;
  pickupDate: string;
  pickupTimeSlot: string;
  paybackAmount: number;
  aiRange: { low: number; high: number } | null;
  account: { bankName: string; last4: string } | null;
  createdAt: string;
  ribbonWanted: boolean;
  reviewed: boolean;
  proof: { actualQuantity: number | null; photo: string | null; collectedAt: string | null } | null;
  refCode: string | null;
  updatedAt: string;
  ribbon: { count: number | null; photos: string[]; listStatus: string; list: { sender: string; text: string; uncertain?: boolean }[] } | null;
}

interface Board {
  code: string;
  title: string;
  count: number;
  messages: { id: string; sender: string; text: string }[];
}

export default function LookupForm() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lookedPhone, setLookedPhone] = useState("");
  const phoneRef = useRef("");

  const fetchItems = useCallback(async (ph: string) => {
    const res = await fetch("/api/status/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: ph }),
    });
    const json = await res.json();
    return { ok: res.ok, status: res.status, json };
  }, []);

  // 문자 본인확인(서버에서 인증이 켜져 있을 때만 요구됨)
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  async function requestOtp(ph: string) {
    const res = await fetch("/api/status/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: ph }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setError(j.error ?? "인증번호를 보내지 못했어요.");
    else {
      setOtpStep(true);
      setError(null);
    }
  }
  async function submitOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code: otpCode }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "인증에 실패했어요.");
        return;
      }
      setOtpStep(false);
      setOtpCode("");
      await runLookup();
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // 진행 중인 건이 있으면 20초마다 자동 갱신(관리자·기사님이 상태를 바꾸면 화면에 바로 반영)
  const hasActive = items?.some((i) => i.status !== "settled" && i.status !== "cancelled") ?? false;
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible" || !phoneRef.current) return;
      try {
        const { ok, json } = await fetchItems(phoneRef.current);
        if (ok) {
          setItems(json.items as Item[]);
          setBoards((json.boards ?? []) as Board[]);
          setLastUpdated(new Date());
        }
      } catch {}
    }, 20000);
    return () => clearInterval(t);
  }, [hasActive, fetchItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runLookup();
  }

  async function runLookup() {
    setLoading(true);
    setError(null);
    setItems(null);
    try {
      const { ok, status, json } = await fetchItems(phone);
      if (!ok && status === 401 && json.otpRequired) await requestOtp(phone);
      else if (!ok) setError(json.error ?? "조회에 실패했어요.");
      else {
        phoneRef.current = phone;
        setLookedPhone(phone);
        setItems(json.items as Item[]);
        setBoards((json.boards ?? []) as Board[]);
        setLastUpdated(new Date());
      }
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-brand";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="휴대폰번호 (예: 010-1234-5678)"
          inputMode="tel"
          autoComplete="tel"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading || phone.replace(/\D/g, "").length < 10}
          className="hover-lift h-13 w-full rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {loading ? "조회 중..." : "조회하기"}
        </button>
      </form>

      {otpStep && (
        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <p className="text-[14px] font-bold">문자로 받은 인증번호를 입력해 주세요</p>
          <p className="mt-1 text-[12.5px] text-muted">접수하신 번호로 6자리 인증번호를 보냈어요. (5분 이내 입력)</p>
          <input
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="인증번호 6자리"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={`${inputClass} mt-3 tracking-[0.3em]`}
          />
          <button type="button" disabled={loading || otpCode.length !== 6} onClick={submitOtp} className="mt-3 h-12 w-full rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-40">
            {loading ? "확인 중..." : "인증하고 조회하기"}
          </button>
          <button type="button" onClick={() => requestOtp(phone)} className="mt-2 w-full text-[12.5px] text-muted underline">
            인증번호 다시 받기
          </button>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

      {items && (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const active = item.status !== "settled" && item.status !== "cancelled";
            return (
              <div
                key={item.requestNo}
                className={`fade-up rounded-xl border border-l-4 border-border bg-white p-5 ${
                  item.status === "cancelled" ? "border-l-sage opacity-80" : item.status === "settled" ? "border-l-forest" : "border-l-brass"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-bold text-brand-dark">
                    {EVENT_TYPE_LABEL[item.eventType]} · {QUANTITY_RANGE_LABEL[item.quantityRange]}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 text-[12px] text-muted-light">
                  {new Date(item.createdAt).toLocaleDateString("ko-KR")} 접수
                </p>

                {(item.status === "dispatched" || item.status === "collecting") && (
                  <div className="mt-4 rounded-lg bg-brand-tint px-4 py-3">
                    <p className="text-[14px] font-bold text-brand-dark">
                      {item.status === "collecting"
                        ? `🚚 꽃페이 전담기사님이 ${item.pickupDate} 수거를 위해 이동 중입니다`
                        : `꽃페이 전담기사님이 배정됐어요 · 수거 예정일 ${item.pickupDate}`}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">상태가 바뀌면 이 화면에 바로 반영돼요.</p>
                  </div>
                )}

                <div className="mt-5">
                  <StatusTimeline status={item.status} />
                </div>
                {active && lastUpdated && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-light">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    실시간 확인 중 · 마지막 확인{" "}
                    {lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-y-1.5 border-t border-border pt-4 text-[13px] text-muted">
                  <span>수거 희망일</span>
                  <span className="text-right">
                    {item.pickupDate} · {item.pickupTimeSlot}
                  </span>
                </div>

                {(item.status === "received" || item.status === "estimating") && item.aiRange ? (
                  <div className="mt-4 rounded-lg bg-surface px-4 py-3">
                    <p className="text-[12px] text-muted">AI 예상 페이백 (현장 확인 후 확정)</p>
                    <p className="mt-0.5 text-[17px] font-extrabold tabular-nums text-brand-dark">
                      {formatKRW(item.aiRange.low)} ~ {formatKRW(item.aiRange.high)}
                    </p>
                  </div>
                ) : (
                  item.paybackAmount > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                      <span className="text-[13px] font-semibold">예상 페이백</span>
                      <span className="text-[17px] font-extrabold tabular-nums text-brand-dark">
                        {formatKRW(item.paybackAmount)}
                      </span>
                    </div>
                  )
                )}

                <ManageSection item={item} phone={lookedPhone} onChanged={() => fetchItems(phoneRef.current).then(({ ok, json }) => ok && setItems(json.items as Item[]))} />

                {(item.status === "collected" || item.status === "settled") && <ProofSection item={item} />}

                {(item.status === "collected" || item.status === "settled") && <ReviewBox item={item} phone={lookedPhone} />}

                <RibbonSection item={item} phone={lookedPhone} onChanged={() => fetchItems(phoneRef.current).then(({ ok, json }) => ok && setItems(json.items as Item[]))} />

                {active && (
                  <>
                    <div className="mt-4">
                      <AccountForm requestNo={item.requestNo} phone={lookedPhone} initial={item.account} />
                    </div>
                    <div className="mt-3">
                      <NotifyButton requestNo={item.requestNo} phone={lookedPhone} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items && items.find((i) => i.refCode) && <ReferralBox code={items.find((i) => i.refCode)!.refCode!} />}

      {boards.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-[14px] font-bold">🎗 내가 만든 마음 전하기</p>
          {boards.map((b) => (
            <BoardCard key={b.code} board={b} phone={lookedPhone} onChanged={() => fetchItems(phoneRef.current).then(({ ok, json }) => ok && setBoards((json.boards ?? []) as Board[]))} />
          ))}
        </div>
      )}

      <a
        href="https://d5dpz.channel.io"
        target="_blank"
        rel="noopener noreferrer"
        className="hover-lift mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-border text-[14.5px] font-semibold"
      >
        💬 채널톡으로 문의하기
      </a>
    </>
  );
}

function BoardCard({ board, phone, onChanged }: { board: Board; phone: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  async function remove(id: string) {
    if (!window.confirm("이 문구를 삭제할까요?")) return;
    await fetch("/api/ribbon/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, messageId: id }) });
    onChanged();
  }
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-semibold">{board.title}</p>
        <a href={`/ribbon/${board.code}`} className="text-[12.5px] font-medium text-brand-dark underline">
          보드 열기
        </a>
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-[12.5px] text-muted">
        모인 마음 {board.count}개 {open ? "▲" : "▼"}
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {board.messages.map((m) => (
            <li key={m.id} className="rounded-lg bg-surface px-3 py-2 text-[13px]">
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <div className="mt-1 flex items-center justify-between text-[12px] text-muted">
                <span>— {m.sender}</span>
                <button type="button" onClick={() => remove(m.id)} className="underline">
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function csvEscape(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

/** 받은 화환 명단: 신청 전 안내 → 신청됨 → 수거 후 명단(복사·CSV) */
function RibbonSection({ item, phone, onChanged }: { item: Item; phone: string; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thanksCopied, setThanksCopied] = useState(false);
  const beforeCollect = !["collected", "settled", "cancelled"].includes(item.status);

  async function toggle(enable: boolean) {
    setBusy(true);
    await fetch("/api/status/ribbon-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestNo: item.requestNo, phone, enable }),
    });
    setBusy(false);
    onChanged();
  }

  if (!item.ribbonWanted) {
    if (!beforeCollect) return null;
    return (
      <div className="mt-4 rounded-lg border border-border px-4 py-3">
        <p className="text-[13px] font-bold">🎗 받은 화환 명단 정리</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
          리본을 못 챙기셨다면, 리본에 적힌 보낸 분·문구를 읽어 명단으로 정리해 드려요.
        </p>
        <button type="button" disabled={busy} onClick={() => toggle(true)} className="mt-2 h-10 w-full rounded-lg bg-brand text-[13.5px] font-semibold text-white disabled:opacity-50">
          {busy ? "처리 중..." : "명단 정리 신청하기"}
        </button>
      </div>
    );
  }

  const list = item.ribbon?.list ?? [];
  if (list.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-border px-4 py-3">
        <p className="text-[13px] font-bold">🎗 받은 화환 명단 · 신청됨</p>
        <p className="mt-0.5 text-[12px] text-muted">
          {beforeCollect ? "수거할 때 리본을 확인해서 수거 후 정리해 보여드려요." : "기사님이 올린 리본 사진을 정리하는 중이에요. 완료되면 여기에 보여요."}
        </p>
        {beforeCollect && (
          <button type="button" disabled={busy} onClick={() => toggle(false)} className="mt-1.5 text-[12px] text-muted underline">
            신청 취소
          </button>
        )}
      </div>
    );
  }

  const confirmed = item.ribbon?.listStatus === "confirmed";
  const asText = list.map((r, i) => `${i + 1}. ${r.sender}${r.text ? ` - ${r.text}` : ""}`).join("\n");
  function copy() {
    navigator.clipboard.writeText(asText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  function thanks() {
    const names = Array.from(new Set(list.map((r) => r.sender).filter(Boolean)));
    const text = names.map((n) => `${n}님, 바쁘신 중에도 마음을 전해 주셔서 진심으로 감사드립니다. 덕분에 큰 힘이 되었습니다.`).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setThanksCopied(true);
      setTimeout(() => setThanksCopied(false), 1800);
    });
  }
  function csv() {
    const body = ["번호,보낸 분,문구", ...list.map((r, i) => [i + 1, csvEscape(r.sender), csvEscape(r.text)].join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "받은화환명단.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-4 rounded-lg border border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold">🎗 내가 받은 화환 명단 ({list.length})</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${confirmed ? "bg-brand text-white" : "bg-surface text-muted"}`}>
          {confirmed ? "검수 완료" : "AI 정리본 · 검수 전"}
        </span>
      </div>
      {!confirmed && <p className="mt-0.5 text-[11.5px] text-muted">AI가 읽은 결과라 틀린 글자가 있을 수 있어요. 검수가 끝나면 표시가 바뀌어요.</p>}
      <ol className="mt-2 space-y-1.5">
        {list.map((r, i) => (
          <li key={i} className="rounded-lg bg-surface px-3 py-2 text-[13px]">
            <span className="font-semibold">{i + 1}. {r.sender || "(보낸 분 미상)"}</span>
            {r.text && <span className="text-muted"> · {r.text}</span>}
            {r.uncertain && !confirmed && <span className="text-amber-700"> (확인 필요)</span>}
          </li>
        ))}
      </ol>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className="h-10 rounded-lg border border-border text-[13px] font-medium">
          {copied ? "복사됨 ✓" : "텍스트 복사"}
        </button>
        <button type="button" onClick={csv} className="h-10 rounded-lg border border-border text-[13px] font-medium">
          엑셀(CSV) 받기
        </button>
      </div>
      <button type="button" onClick={thanks} className="mt-2 h-10 w-full rounded-lg border border-border text-[13px] font-medium">
        {thanksCopied ? "감사 문구 복사됨 ✓" : "💌 감사 인사 문구 복사"}
      </button>
      {item.ribbon && item.ribbon.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {item.ribbon.photos.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`리본 사진 ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-light">리본 사진과 명단은 수거 후 30일간 보관돼요.</p>
    </div>
  );
}

const EDITABLE = ["received", "estimating", "estimated", "customer_approved", "dispatch_pending"];

/** 기사 배정 전까지 고객이 직접 일정 변경·취소 */
function ManageSection({ item, phone, onChanged }: { item: Item; phone: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(item.pickupDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today] = useState(() => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10));
  if (!EDITABLE.includes(item.status)) return null;

  async function call(action: "cancel" | "reschedule") {
    if (action === "cancel" && !window.confirm("신청을 취소할까요?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/status/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestNo: item.requestNo, phone, action, pickupDate: date }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error ?? "처리하지 못했어요.");
    else {
      setOpen(false);
      onChanged();
    }
  }

  return (
    <div className="mt-4">
      {!open ? (
        <div className="flex items-center gap-3 text-[12.5px]">
          <button type="button" onClick={() => setOpen(true)} className="font-medium text-brand-dark underline">
            수거 일정 변경
          </button>
          <span className="text-muted-light">·</span>
          <button type="button" onClick={() => call("cancel")} disabled={busy} className="font-medium text-muted underline">
            신청 취소
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border px-4 py-3">
          <p className="text-[13px] font-bold">수거 희망일 변경</p>
          <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-[14px]" />
          {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-border text-[13px]">닫기</button>
            <button type="button" onClick={() => call("reschedule")} disabled={busy} className="h-10 rounded-lg bg-brand text-[13px] font-semibold text-white disabled:opacity-50">
              {busy ? "저장 중..." : "변경 저장"}
            </button>
          </div>
        </div>
      )}
      {!open && error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

function ReviewBox({ item, phone }: { item: Item; phone: string }) {
  const [done, setDone] = useState(item.reviewed);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (done)
    return <p className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-[13px] text-muted">소중한 후기 감사합니다. 확인 후 서비스 소개에 반영돼요.</p>;
  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/status/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNo: item.requestNo, phone, rating, body: text }),
      });
      const j = await res.json();
      if (res.ok || res.status === 409) setDone(true);
      else setErr(j.error ?? "문제가 생겼어요.");
    } catch {
      setErr("네트워크를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4 rounded-xl border border-border p-4">
      <p className="text-[14px] font-bold">수거는 어떠셨나요?</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}점`} className={`text-[26px] leading-none ${n <= rating ? "text-brass" : "text-sage"}`}>
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={400}
        rows={3}
        placeholder="이용 후기를 남겨주세요 (5자 이상)"
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-brass"
      />
      {err && <p className="mt-1 text-[12.5px] text-error">{err}</p>}
      <button type="button" disabled={busy || text.trim().length < 5} onClick={submit} className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-brand text-[14px] font-semibold text-white disabled:opacity-40">
        {busy ? "등록 중…" : "후기 남기기"}
      </button>
      <p className="mt-2 text-[11.5px] text-muted-light">승인 후 지역·행사 종류와 함께 표시되며, 이름과 연락처는 공개되지 않아요.</p>
    </div>
  );
}

/** 수거 완료 증빙(실제 수량·현장 사진) + 정산 완료 시 정산 내역 */
function ProofSection({ item }: { item: Item }) {
  const settled = item.status === "settled";
  const d = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "-");
  const rows: [string, string][] = [
    ["행사 종류", EVENT_TYPE_LABEL[item.eventType]],
    ["실제 수거 수량", item.proof?.actualQuantity != null ? `${item.proof.actualQuantity}개` : QUANTITY_RANGE_LABEL[item.quantityRange]],
    ["수거일", d(item.proof?.collectedAt ?? item.updatedAt)],
  ];
  if (settled) {
    rows.push(["정산 금액", `${item.paybackAmount.toLocaleString("ko-KR")}원`]);
    rows.push(["입금 계좌", item.account ? `${item.account.bankName} ****${item.account.last4}` : "-"]);
    rows.push(["정산일", d(item.updatedAt)]);
  }
  return (
    <div className="statement mt-4 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold">{settled ? "정산 내역서" : "수거 완료 확인"}</p>
        {settled && (
          <button type="button" onClick={() => window.print()} className="no-print rounded-lg border border-border px-2.5 py-1 text-[12px] font-medium text-muted">
            저장·인쇄
          </button>
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {item.proof?.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.proof.photo} alt="수거 완료 현장 사진" className="no-print mt-3 max-h-64 w-full rounded-lg object-cover" />
      )}
      {settled && <p className="mt-3 text-[11px] text-muted-light">발행: KKOT PAY ((주)루우크컴퍼니 · 사업자등록번호 230-88-03514)</p>}
    </div>
  );
}

/** 친구 추천 링크: 이 링크로 들어온 신청이 추천으로 집계된다 */
function ReferralBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://kkotpay.kr/?r=${code}`;
  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-4">
      <p className="text-[14px] font-bold">주변에 화환 받을 분이 있나요?</p>
      <p className="mt-1 text-[12.5px] text-muted">내 추천 링크를 보내주세요. 이 링크로 신청하면 추천으로 기록돼요.</p>
      <div className="mt-3 flex gap-2">
        <input readOnly value={url} className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-[12.5px]" onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          className="h-10 shrink-0 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white"
        >
          {copied ? "복사됨" : "링크 복사"}
        </button>
      </div>
    </div>
  );
}
