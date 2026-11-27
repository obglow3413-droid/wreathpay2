import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BackHeader from "@/components/layout/BackHeader";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentPartner } from "@/lib/wpAuth";
import {
  PARTNER_STATUS_LABEL,
  WITHDRAWAL_STATUS_LABEL,
  commissionFor,
  computeBalance,
  loadWpSettings,
  maskName,
  tierLabel,
} from "@/lib/weddingPartners";
import { BANKS } from "@/lib/payoutAccount";
import ReferralTools from "@/components/wp/ReferralTools";
import AccountForm from "@/components/wp/AccountForm";
import WithdrawForm from "@/components/wp/WithdrawForm";
import LogoutButton from "@/components/wp/LogoutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "웨딩 파트너 대시보드", robots: { index: false, follow: false } };

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 파트너에게 보여주는 진행 단계 */
function stage(status: string, saleSettled: boolean, commission: string): { label: string; step: number } {
  if (status === "cancelled") return { label: "취소", step: -1 };
  if (commission === "confirmed") return { label: "소개비 확정", step: 5 };
  if (commission === "void") return { label: "지급 제외", step: -1 };
  if ((status === "collected" || status === "settled") && saleSettled) return { label: "판매 정산 완료", step: 4 };
  if (status === "collected" || status === "settled") return { label: "수거 완료 · 검수 중", step: 3 };
  if (status === "collecting") return { label: "수거 중", step: 2 };
  if (["customer_approved", "dispatch_pending", "dispatched"].includes(status)) return { label: "수거 일정 확정", step: 1 };
  return { label: "접수 완료", step: 0 };
}

type Row = {
  id: string;
  consent_share: boolean;
  commission_status: string;
  commission_amount: number;
  wreath_count: number | null;
  created_at: string;
  estimate_requests: {
    status: string;
    pickup_date: string;
    sale_settled_at: string | null;
    customers: { name: string } | { name: string }[] | null;
    pickup_orders: { actual_quantity: number | null } | { actual_quantity: number | null }[] | null;
  } | null;
};

export default async function PartnerDashboard() {
  const { user, partner } = await getCurrentPartner();
  if (!user) redirect("/wedding-partners/login");

  if (!partner) {
    return (
      <Shell>
        <h1 className="text-[22px] font-extrabold">웨딩 파트너 계정이 아니에요</h1>
        <p className="mt-2 text-[14px] text-muted">이 계정으로는 파트너 가입 신청이 없어요. 파트너로 가입하시려면 아래에서 신청해 주세요.</p>
        <Link href="/wedding-partners/join" className="mt-6 flex h-13 items-center justify-center rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white">
          파트너 가입 신청
        </Link>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </Shell>
    );
  }

  if (partner.status !== "approved") {
    return (
      <Shell>
        <p className="text-[12px] font-bold tracking-[0.24em] text-brass">WEDDING PARTNERS</p>
        <h1 className="mt-2 text-[22px] font-extrabold">{partner.name}님, {PARTNER_STATUS_LABEL[partner.status]}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          {partner.status === "pending" && "가입 신청을 확인하고 있어요. 승인이 끝나면 문자로 알려드리고, 이 화면에서 추천 링크와 QR코드를 바로 쓸 수 있어요."}
          {partner.status === "rejected" && "가입 신청이 승인되지 않았어요. 궁금한 점은 고객센터(010-5333-3413)로 문의해 주세요."}
          {partner.status === "suspended" && "파트너 이용이 일시 정지됐어요. 고객센터(010-5333-3413)로 문의해 주세요."}
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </Shell>
    );
  }

  const svc = await createServiceRoleClient();
  const [settings, { data: refData }, { data: wdData }] = await Promise.all([
    loadWpSettings(svc),
    svc
      .from("wp_referrals")
      .select(
        "id, consent_share, commission_status, commission_amount, wreath_count, created_at, estimate_requests(status, pickup_date, sale_settled_at, customers(name), pickup_orders(actual_quantity))"
      )
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(200),
    svc.from("wp_withdrawals").select("id, amount, status, requested_at, paid_at, account_last4, bank_name").eq("partner_id", partner.id).order("requested_at", { ascending: false }).limit(50),
  ]);

  const rows = ((refData ?? []) as unknown as Row[]).map((r) => {
    const er = Array.isArray(r.estimate_requests) ? r.estimate_requests[0] : r.estimate_requests;
    const c = er ? (Array.isArray(er.customers) ? er.customers[0] : er.customers) : null;
    const po = er ? (Array.isArray(er.pickup_orders) ? er.pickup_orders[0] : er.pickup_orders) : null;
    const qty = r.commission_status === "confirmed" ? r.wreath_count : po?.actual_quantity ?? null;
    const expected = r.commission_status === "pending" ? commissionFor(qty, settings.tiers) : 0;
    return {
      id: r.id,
      who: r.consent_share ? maskName(c?.name) : "고객(비공개)",
      date: r.consent_share ? er?.pickup_date ?? "-" : null,
      st: stage(er?.status ?? "received", Boolean(er?.sale_settled_at), r.commission_status),
      qty,
      commission: r.commission_status === "confirmed" ? r.commission_amount : expected,
      confirmed: r.commission_status === "confirmed",
      commission_status: r.commission_status,
      commission_amount: r.commission_amount,
      expected,
    };
  });
  const wds = wdData ?? [];
  const bal = computeBalance(rows, wds);
  const collected = rows.filter((r) => r.st.step >= 3).length;

  return (
    <Shell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold tracking-[0.24em] text-brass">WEDDING PARTNERS</p>
          <h1 className="mt-1.5 text-[22px] font-extrabold tracking-tight">{partner.name}님의 파트너 대시보드</h1>
          {partner.company && <p className="mt-0.5 text-[13px] text-muted">{partner.company}</p>}
        </div>
        <LogoutButton compact />
      </div>

      <section className="mt-6 grid grid-cols-2 gap-2.5">
        <Stat label="소개 접수" value={`${rows.length}건`} />
        <Stat label="수거 완료" value={`${collected}건`} />
        <Stat label="확정 수익(누적)" value={won(bal.confirmed)} strong />
        <Stat label="출금 가능" value={won(bal.available)} strong />
      </section>
      {bal.expected > 0 && <p className="mt-2 text-[12.5px] text-muted">진행 중인 건의 예상 소개비 {won(bal.expected)} · 판매 정산 후 확정돼요</p>}

      <ReferralTools code={partner.code} name={partner.name} />

      <section className="mt-8">
        <h2 className="text-[17px] font-bold">소개 고객 현황</h2>
        <div className="mt-3 space-y-2.5">
          {rows.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-8 text-center text-[13.5px] text-muted">
              아직 추천 링크로 들어온 접수가 없어요. 위의 링크나 QR코드를 신랑·신부님께 전해 보세요.
            </p>
          )}
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14.5px] font-bold">
                  {r.who} {r.date && <span className="ml-1 text-[12.5px] font-normal text-muted">예식 {r.date}</span>}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${r.st.step < 0 ? "bg-surface text-muted" : r.confirmed ? "bg-[#141211] text-[#e9cf97]" : "bg-brand-tint text-foreground"}`}>
                  {r.st.label}
                </span>
              </div>
              {r.st.step >= 0 && (
                <div className="mt-3 flex gap-1" aria-hidden>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= r.st.step ? "bg-[#141211]" : "bg-border"}`} />
                  ))}
                </div>
              )}
              <div className="mt-3 flex justify-between text-[12.5px] text-muted">
                <span>수거 수량 {r.qty != null ? `${r.qty}개` : "수거 후 확인"}</span>
                <span className="font-semibold text-foreground">
                  {r.confirmed ? `확정 ${won(r.commission)}` : r.commission_status === "void" ? "지급 제외" : r.commission > 0 ? `예상 ${won(r.commission)}` : "수거 후 산정"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-[17px] font-bold">수익금 출금</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          확정된 소개비만 출금할 수 있어요. 최소 {won(settings.minWithdrawal)} · 관리자 승인 후 등록 계좌로 지급돼요.
        </p>
        <AccountForm banks={[...BANKS]} current={partner.account_last4 ? `${partner.bank_name} ····${partner.account_last4} (${partner.account_holder})` : null} />
        <WithdrawForm available={bal.available} min={settings.minWithdrawal} hasAccount={Boolean(partner.account_last4)} />
        {wds.length > 0 && (
          <ul className="mt-5 divide-y divide-border border-t border-border">
            {wds.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3 text-[13px]">
                <span className="text-muted">{w.requested_at.slice(0, 10)}</span>
                <span className="font-semibold tabular-nums">{won(w.amount)}</span>
                <span className={w.status === "paid" ? "font-semibold" : "text-muted"}>{WITHDRAWAL_STATUS_LABEL[w.status] ?? w.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl bg-surface p-5 text-[12.5px] leading-relaxed text-muted">
        <p className="font-semibold text-foreground">소개비 기준</p>
        <ul className="mt-2 space-y-1">
          {tierLabel(settings.tiers).map((t) => (
            <li key={t.range}>
              화환 {t.range} · {won(t.amount)}
            </li>
          ))}
        </ul>
        <p className="mt-2">실제 수거·판매 정산 완료 건 기준 · 고객 페이백과 별도 · 중복·본인 추천은 제외돼요. 소속 회사의 제휴 규정을 꼭 지켜 주세요.</p>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-7 pb-16">{children}</main>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${strong ? "bg-[#141211] text-[#f7f4f0]" : "border border-border bg-white"}`}>
      <p className={`text-[12px] ${strong ? "text-[#f7f4f0]/65" : "text-muted"}`}>{label}</p>
      <p className={`mt-1 text-[19px] font-extrabold tabular-nums ${strong ? "text-[#e9cf97]" : ""}`}>{value}</p>
    </div>
  );
}
