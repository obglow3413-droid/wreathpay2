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
  ribbon: { count: number | null; photos: string[] } | null;
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
    return { ok: res.ok, json };
  }, []);

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
    setLoading(true);
    setError(null);
    setItems(null);
    try {
      const { ok, json } = await fetchItems(phone);
      if (!ok) setError(json.error ?? "조회에 실패했어요.");
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

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

      {items && (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const active = item.status !== "settled" && item.status !== "cancelled";
            return (
              <div key={item.requestNo} className="fade-up rounded-xl border border-border bg-white p-5">
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

                {item.ribbonWanted && (item.status === "collected" || item.status === "settled") && (
                  <div className="mt-4 rounded-lg border border-border px-4 py-3">
                    <p className="text-[13px] font-bold">🎗 리본 앨범</p>
                    {item.ribbon && item.ribbon.photos.length > 0 ? (
                      <>
                        <p className="mt-0.5 text-[12px] text-muted">
                          {item.ribbon.count != null ? `리본 ${item.ribbon.count}개를 챙겼어요. ` : ""}사진을 눌러 저장하세요. (수거 후 30일간 보관)
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {item.ribbon.photos.map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noopener noreferrer" download>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`리본 사진 ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                            </a>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="mt-0.5 text-[12px] text-muted">기사님이 리본을 정리하는 중이에요. 사진이 올라오면 여기에 보여요.</p>
                    )}
                  </div>
                )}

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
