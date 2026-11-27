"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json().catch(() => ({}));
  return { ok: res.ok, j };
}

const btn = "rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold disabled:opacity-40";
const btnDark = "rounded-lg bg-brand px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40";

/** 파트너 승인·거절·정지·재개 + 메모 */
export function WpPartnerActions({ id, status, memo }: { id: string; status: string; memo: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [m, setM] = useState(memo ?? "");
  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErr("");
    const { ok, j } = await call(`/api/admin/wp/partners/${id}`, "PATCH", body);
    setBusy(false);
    if (!ok) setErr(j.error ?? "처리하지 못했어요.");
    else router.refresh();
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {status === "pending" && (
          <>
            <button className={btnDark} disabled={busy} onClick={() => act({ action: "approve" })}>승인</button>
            <button className={btn} disabled={busy} onClick={() => confirm("가입을 거절할까요?") && act({ action: "reject" })}>거절</button>
          </>
        )}
        {status === "approved" && <button className={btn} disabled={busy} onClick={() => confirm("이용을 정지할까요? 추천 링크도 멈춰요.") && act({ action: "suspend" })}>정지</button>}
        {(status === "suspended" || status === "rejected") && <button className={btn} disabled={busy} onClick={() => act({ action: "reinstate" })}>승인으로 변경</button>}
      </div>
      <div className="flex gap-1.5">
        <input value={m} onChange={(e) => setM(e.target.value)} placeholder="관리 메모" className="h-8 min-w-0 flex-1 rounded-lg border border-border px-2 text-[12px]" />
        <button className={btn} disabled={busy || m === (memo ?? "")} onClick={() => act({ memo: m })}>저장</button>
      </div>
      {err && <p className="text-[11.5px] text-error">{err}</p>}
    </div>
  );
}

/** 추천 건 소개비 확정/무효/되돌리기 */
export function WpReferralActions({ id, status, eligible, defaultCount }: { id: string; status: string; eligible: boolean; defaultCount: number | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [count, setCount] = useState(defaultCount != null ? String(defaultCount) : "");
  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErr("");
    const { ok, j } = await call(`/api/admin/wp/referrals/${id}`, "PATCH", body);
    setBusy(false);
    if (!ok) setErr(j.error ?? "처리하지 못했어요.");
    else router.refresh();
  };
  return (
    <div className="space-y-1.5">
      {status === "pending" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="수량" className="h-8 w-16 rounded-lg border border-border px-2 text-[12px] tabular-nums" />
          <button className={btnDark} disabled={busy || !eligible || !count} title={eligible ? "" : "수거 완료 + 판매 정산 완료 후 확정 가능"} onClick={() => confirm(`수거 ${count}개 기준으로 소개비를 확정할까요?`) && act({ action: "confirm", wreathCount: Number(count) })}>
            확정
          </button>
          <button
            className={btn}
            disabled={busy}
            onClick={() => {
              const reason = prompt("무효 사유(예: 중복 접수, 본인 추천)");
              if (reason) act({ action: "void", reason });
            }}
          >
            무효
          </button>
        </div>
      )}
      {status !== "pending" && (
        <button className={btn} disabled={busy} onClick={() => confirm("확정/무효를 되돌릴까요?") && act({ action: "reset" })}>되돌리기</button>
      )}
      {!eligible && status === "pending" && <p className="text-[11px] text-muted">수거·판매 정산 완료 후 확정 가능</p>}
      {err && <p className="text-[11.5px] text-error">{err}</p>}
    </div>
  );
}

/** 출금 신청 승인/지급 완료/반려 + 계좌 열람 */
export function WpWithdrawalActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [acct, setAcct] = useState<string | null>(null);
  const act = async (action: string) => {
    setBusy(true);
    setErr("");
    const { ok, j } = await call(`/api/admin/wp/withdrawals/${id}`, "PATCH", { action });
    setBusy(false);
    if (!ok) setErr(j.error ?? "처리하지 못했어요.");
    else router.refresh();
  };
  const reveal = async () => {
    setBusy(true);
    const { ok, j } = await call(`/api/admin/wp/withdrawals/${id}/account`, "GET");
    setBusy(false);
    if (ok) setAcct(`${j.bank} ${j.account} (${j.holder})`);
    else setErr(j.error ?? "열람하지 못했어요.");
  };
  const open = status === "requested" || status === "approved";
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {status === "requested" && <button className={btn} disabled={busy} onClick={() => act("approve")}>승인</button>}
        {open && <button className={btnDark} disabled={busy} onClick={() => confirm("입금을 마쳤나요? 지급 완료로 처리해요.") && act("paid")}>지급 완료</button>}
        {open && <button className={btn} disabled={busy} onClick={() => confirm("출금 신청을 반려할까요?") && act("reject")}>반려</button>}
        {open && !acct && <button className={btn} disabled={busy} onClick={reveal}>계좌 보기</button>}
      </div>
      {acct && <p className="text-[12px] font-semibold tabular-nums">{acct}</p>}
      {err && <p className="text-[11.5px] text-error">{err}</p>}
    </div>
  );
}

/** 소개비 단가 구간·최소 출금액 수정 */
export function WpSettingsForm({ tiers, minWithdrawal }: { tiers: { min: number; amount: number }[]; minWithdrawal: number }) {
  const router = useRouter();
  const [rows, setRows] = useState(tiers.map((t) => ({ min: String(t.min), amount: String(t.amount) })));
  const [minW, setMinW] = useState(String(minWithdrawal));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setBusy(true);
    setMsg("");
    const { ok, j } = await call("/api/admin/wp/settings", "POST", {
      tiers: rows.map((r) => ({ min: Number(r.min), amount: Number(r.amount) })),
      minWithdrawal: Number(minW),
    });
    setBusy(false);
    setMsg(ok ? "저장했어요. 이미 확정된 소개비에는 영향이 없어요." : j.error ?? "저장하지 못했어요.");
    if (ok) router.refresh();
  };
  const input = "h-9 w-28 rounded-lg border border-border px-2 text-[13px] tabular-nums";
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <span className="text-muted">수거</span>
          <input className={input} value={r.min} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, min: e.target.value.replace(/\D/g, "") } : x)))} />
          <span className="text-muted">개 이상 →</span>
          <input className={input} value={r.amount} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, amount: e.target.value.replace(/\D/g, "") } : x)))} />
          <span className="text-muted">원</span>
          <button className="text-[12px] text-muted underline" onClick={() => setRows(rows.filter((_, k) => k !== i))}>삭제</button>
        </div>
      ))}
      <button className={btn} onClick={() => setRows([...rows, { min: "", amount: "" }])}>구간 추가</button>
      <div className="flex items-center gap-2 pt-2 text-[13px]">
        <span className="text-muted">최소 출금액</span>
        <input className={input} value={minW} onChange={(e) => setMinW(e.target.value.replace(/\D/g, ""))} />
        <span className="text-muted">원</span>
      </div>
      <button className={btnDark} disabled={busy} onClick={save}>{busy ? "저장 중…" : "단가 저장"}</button>
      {msg && <p className="text-[12px] text-muted">{msg}</p>}
    </div>
  );
}

/** 건별 실제 판매금액·차량비·물류비 입력 + 판매 정산 완료 */
export function ProfitEditor({
  id,
  sale,
  vehicle,
  logistics,
  settled,
  collected,
}: {
  id: string;
  sale: number | null;
  vehicle: number | null;
  logistics: number | null;
  settled: boolean;
  collected: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState({ sale: sale?.toString() ?? "", vehicle: vehicle?.toString() ?? "", logistics: logistics?.toString() ?? "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const dirty = v.sale !== (sale?.toString() ?? "") || v.vehicle !== (vehicle?.toString() ?? "") || v.logistics !== (logistics?.toString() ?? "");
  const save = async (extra?: Record<string, unknown>) => {
    setBusy(true);
    setErr("");
    const { ok, j } = await call(`/api/admin/profit/${id}`, "PATCH", {
      actualSale: v.sale === "" ? null : Number(v.sale),
      vehicleCost: v.vehicle === "" ? null : Number(v.vehicle),
      logisticsCost: v.logistics === "" ? null : Number(v.logistics),
      ...extra,
    });
    setBusy(false);
    if (!ok) setErr(j.error ?? "저장하지 못했어요.");
    else router.refresh();
  };
  const input = "h-8 w-24 rounded-lg border border-border px-2 text-right text-[12px] tabular-nums";
  const f = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "") });
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <input className={input} value={v.sale} onChange={f("sale")} placeholder="판매금액" aria-label="실제 판매금액" />
        <input className={input} value={v.vehicle} onChange={f("vehicle")} placeholder="차량비" aria-label="차량비" />
        <input className={input} value={v.logistics} onChange={f("logistics")} placeholder="물류비" aria-label="물류비" />
        <button className={btn} disabled={busy || !dirty} onClick={() => save()}>저장</button>
      </div>
      <div>
        {settled ? (
          <button className={btn} disabled={busy} onClick={() => confirm("판매 정산 완료를 취소할까요?") && save({ saleSettled: false })}>정산 완료 취소</button>
        ) : (
          <button className={btnDark} disabled={busy || !collected} title={collected ? "" : "수거 완료 후 가능"} onClick={() => confirm("검수·판매 정산을 완료로 처리할까요? (소개비 확정 조건)") && save({ saleSettled: true })}>
            판매 정산 완료
          </button>
        )}
      </div>
      {err && <p className="text-[11.5px] text-error">{err}</p>}
    </div>
  );
}
