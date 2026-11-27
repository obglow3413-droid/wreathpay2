import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { getAdminUser } from "@/lib/adminAuth";
import { formatKRW } from "@/lib/pricing";
import { STATUS_LABEL, type RequestStatus } from "@/lib/types";
import {
  FLAG_LABEL,
  PARTNER_STATUS_LABEL,
  WITHDRAWAL_STATUS_LABEL,
  commissionFor,
  isCommissionEligible,
  loadWpSettings,
} from "@/lib/weddingPartners";
import { WpPartnerActions, WpReferralActions, WpSettingsForm, WpWithdrawalActions } from "@/components/admin/WpActions";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "partners", label: "파트너" },
  { id: "referrals", label: "소개 건·소개비" },
  { id: "withdrawals", label: "출금 신청" },
  { id: "settings", label: "단가 설정" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export default async function AdminWeddingPartnersPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  const sp = await searchParams;
  const tab: Tab = (TABS.find((t) => t.id === sp.tab)?.id ?? "partners") as Tab;

  if (!isServiceRoleConfigured() || !(await getAdminUser())) {
    return <p className="text-[14px] text-muted">관리자 권한이 필요해요.</p>;
  }
  const svc = await createServiceRoleClient();
  const settings = await loadWpSettings(svc);

  const [{ data: partners }, { data: refs }, { data: wds }] = await Promise.all([
    svc.from("wedding_partners").select("id, code, name, company, phone, email, status, admin_memo, account_last4, bank_name, created_at, approved_at").order("created_at", { ascending: false }),
    svc
      .from("wp_referrals")
      .select(
        "id, partner_id, consent_share, flags, wreath_count, commission_amount, commission_status, void_reason, created_at, estimate_requests(id, request_no, status, pickup_date, place_name, customer_payback_amount, sale_settled_at, customers(name, phone), pickup_orders(actual_quantity))"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    svc.from("wp_withdrawals").select("id, partner_id, amount, status, bank_name, account_last4, account_holder, requested_at, approved_at, paid_at, admin_memo").order("requested_at", { ascending: false }).limit(300),
  ]);

  const pById = new Map((partners ?? []).map((p) => [p.id, p]));
  const metrics = new Map<string, { referrals: number; collected: number; confirmed: number; paid: number; pendingWd: number; flagged: number }>();
  for (const p of partners ?? []) metrics.set(p.id, { referrals: 0, collected: 0, confirmed: 0, paid: 0, pendingWd: 0, flagged: 0 });
  for (const r of refs ?? []) {
    const m = metrics.get(r.partner_id);
    if (!m) continue;
    const er = one(r.estimate_requests as unknown as { status: string } | { status: string }[]);
    m.referrals++;
    if (er && (er.status === "collected" || er.status === "settled")) m.collected++;
    if (r.commission_status === "confirmed") m.confirmed += r.commission_amount ?? 0;
    if ((r.flags ?? []).length && r.commission_status === "pending") m.flagged++;
  }
  for (const w of wds ?? []) {
    const m = metrics.get(w.partner_id);
    if (!m) continue;
    if (w.status === "paid") m.paid += w.amount;
    if (w.status === "requested" || w.status === "approved") m.pendingWd += w.amount;
  }

  const pendingPartners = (partners ?? []).filter((p) => p.status === "pending").length;
  const openWds = (wds ?? []).filter((w) => w.status === "requested" || w.status === "approved");
  const flaggedRefs = (refs ?? []).filter((r) => (r.flags ?? []).length && r.commission_status === "pending").length;
  const totalConfirmed = [...metrics.values()].reduce((s, m) => s + m.confirmed, 0);
  const totalPaid = [...metrics.values()].reduce((s, m) => s + m.paid, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-bold">웨딩 파트너스</h1>
          <p className="mt-1 text-[13px] text-muted">웨딩플래너 제휴 · 승인 → 추천 접수 → 수거·판매 정산 → 소개비 확정 → 출금 지급</p>
        </div>
        <Link href="/wedding-partners" target="_blank" className="text-[12.5px] font-semibold underline">
          파트너 모집 페이지 보기 ↗
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card label="승인 대기" value={`${pendingPartners}명`} hot={pendingPartners > 0} />
        <Card label="승인 파트너" value={`${(partners ?? []).filter((p) => p.status === "approved").length}명`} />
        <Card label="부정·중복 의심(미처리)" value={`${flaggedRefs}건`} hot={flaggedRefs > 0} />
        <Card label="확정 소개비 누적" value={formatKRW(totalConfirmed)} />
        <Card label="출금 대기" value={`${openWds.length}건 · ${formatKRW(openWds.reduce((s, w) => s + w.amount, 0))}`} hot={openWds.length > 0} />
      </div>
      <p className="mt-2 text-[12px] text-muted">지급 완료 누적 {formatKRW(totalPaid)}</p>

      <nav className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/wedding-partners?tab=${t.id}`}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold ${tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "partners" && (
        <Table head={["파트너", "연락처", "상태", "추천 코드", "접수 / 수거", "확정 / 지급", "정산 계좌", "처리"]} empty="가입한 파트너가 없어요." minW={1100}>
          {(partners ?? []).map((p) => {
            const m = metrics.get(p.id)!;
            return (
              <tr key={p.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[12px] text-muted">{p.company ?? "개인"} · 가입 {p.created_at.slice(0, 10)}</p>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-muted">
                  {p.phone}
                  <br />
                  {p.email}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.status === "approved" ? "ok" : p.status === "pending" ? "warn" : "mute"}>{PARTNER_STATUS_LABEL[p.status] ?? p.status}</Badge>
                  {m.flagged > 0 && <p className="mt-1 text-[11.5px] font-semibold text-error">의심 {m.flagged}건</p>}
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px]">{p.code}</td>
                <td className="px-4 py-3 tabular-nums">
                  {m.referrals} / {m.collected}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatKRW(m.confirmed)}
                  <br />
                  <span className="text-[12px] text-muted">지급 {formatKRW(m.paid)}</span>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-muted">{p.account_last4 ? `${p.bank_name} ····${p.account_last4}` : "-"}</td>
                <td className="w-[260px] px-4 py-3">
                  <WpPartnerActions id={p.id} status={p.status} memo={p.admin_memo} />
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {tab === "referrals" && (
        <>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            소개비는 <b>수거 완료 + 판매 정산 완료</b>(건별 수익 화면에서 처리) 건만 확정할 수 있어요. 수량은 기사님이 입력한 실제 수거 수량이 기본값이며 필요하면 고칠 수 있어요. 빨간 표시는 부정·중복 추천 의심이에요.
          </p>
          <Table head={["파트너", "접수", "고객", "진행", "수거 수량", "소개비", "의심 표시", "처리"]} empty="추천으로 들어온 접수가 없어요." minW={1200}>
            {(refs ?? []).map((r) => {
              const p = pById.get(r.partner_id);
              const er = one(
                r.estimate_requests as unknown as {
                  id: string;
                  request_no: string;
                  status: RequestStatus;
                  pickup_date: string;
                  place_name: string;
                  customer_payback_amount: number | null;
                  sale_settled_at: string | null;
                  customers: { name: string; phone: string } | { name: string; phone: string }[] | null;
                  pickup_orders: { actual_quantity: number | null } | { actual_quantity: number | null }[] | null;
                }
              );
              const c = one(er?.customers);
              const po = one(er?.pickup_orders);
              const qty = r.commission_status === "confirmed" ? r.wreath_count : po?.actual_quantity ?? null;
              const eligible = isCommissionEligible(er?.status, er?.sale_settled_at);
              return (
                <tr key={r.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{p?.name ?? "-"}</p>
                    <p className="text-[12px] text-muted">{p?.company ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    {er ? (
                      <Link href={`/admin/requests/${er.id}`} className="font-medium underline">
                        {er.request_no}
                      </Link>
                    ) : (
                      "-"
                    )}
                    <p className="text-[12px] text-muted">
                      {er?.place_name} · {er?.pickup_date}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    {c?.name ?? "-"}
                    <br />
                    <span className="text-muted">{c?.phone}</span>
                    <br />
                    <span className="text-[11.5px] text-muted">{r.consent_share ? "공유 동의" : "공유 미동의"}</span>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    {er ? STATUS_LABEL[er.status] : "-"}
                    <br />
                    <span className={er?.sale_settled_at ? "font-semibold" : "text-muted"}>{er?.sale_settled_at ? "판매 정산 완료" : "판매 정산 전"}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{qty != null ? `${qty}개` : "-"}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.commission_status === "confirmed" ? (
                      <b>{formatKRW(r.commission_amount)}</b>
                    ) : r.commission_status === "void" ? (
                      <span className="text-muted">무효 · {r.void_reason}</span>
                    ) : (
                      <span className="text-muted">예상 {formatKRW(commissionFor(qty, settings.tiers))}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-error">
                    {(r.flags ?? []).map((f: string) => (
                      <p key={f}>{FLAG_LABEL[f] ?? f}</p>
                    ))}
                  </td>
                  <td className="w-[220px] px-4 py-3">
                    <WpReferralActions id={r.id} status={r.commission_status} eligible={eligible} defaultCount={qty} />
                  </td>
                </tr>
              );
            })}
          </Table>
        </>
      )}

      {tab === "withdrawals" && (
        <Table head={["신청일", "파트너", "금액", "계좌", "상태", "처리"]} empty="출금 신청이 없어요." minW={900}>
          {(wds ?? []).map((w) => {
            const p = pById.get(w.partner_id);
            return (
              <tr key={w.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3 text-muted">{w.requested_at.slice(0, 16).replace("T", " ")}</td>
                <td className="px-4 py-3 font-semibold">{p?.name ?? "-"}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{formatKRW(w.amount)}</td>
                <td className="px-4 py-3 text-[12.5px] text-muted">
                  {w.bank_name} ····{w.account_last4} ({w.account_holder})
                </td>
                <td className="px-4 py-3">
                  <Badge tone={w.status === "paid" ? "ok" : w.status === "rejected" ? "mute" : "warn"}>{WITHDRAWAL_STATUS_LABEL[w.status] ?? w.status}</Badge>
                  {w.paid_at && <p className="mt-1 text-[11.5px] text-muted">{w.paid_at.slice(0, 10)}</p>}
                </td>
                <td className="w-[300px] px-4 py-3">
                  <WpWithdrawalActions id={w.id} status={w.status} />
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {tab === "settings" && (
        <section className="mt-5 max-w-xl rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">소개비 단가(수거 수량 구간별)</h2>
          <p className="mt-1 mb-4 text-[12.5px] text-muted">가장 낮은 구간 미만은 0원이에요. 바꾼 단가는 이후 확정하는 건부터 적용돼요.</p>
          <WpSettingsForm tiers={settings.tiers} minWithdrawal={settings.minWithdrawal} />
        </section>
      )}
    </div>
  );
}

function Card({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${hot ? "border-[#d9502a]" : "border-border"}`}>
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[16px] font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "warn" | "mute"; children: React.ReactNode }) {
  const cls = tone === "ok" ? "bg-brand-tint text-brand-dark" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-surface text-muted";
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${cls}`}>{children}</span>;
}

function Table({ head, empty, children, minW }: { head: string[]; empty: string; children: React.ReactNode; minW: number }) {
  const rows = Array.isArray(children) ? children : [children];
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-left text-[13px]" style={{ minWidth: minW }}>
        <thead className="border-b border-border bg-surface text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 || (rows.length === 1 && Array.isArray(rows[0]) && rows[0].length === 0) ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-10 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
