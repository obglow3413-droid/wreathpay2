import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";
import { ShieldCheck, Truck, Wallet, Lock } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, title: "사업자 등록 업체", desc: "(주)루우크컴퍼니 · 통신판매업 신고 완료" },
  { icon: Truck, title: "전담기사 방문수거", desc: "권역별 기사님이 직접 방문해요" },
  { icon: Wallet, title: "수거 후 정산", desc: "수거 확인 뒤 등록 계좌로 입금" },
  { icon: Lock, title: "정보 암호화", desc: "계좌는 암호화해 보관해요" },
];

interface Case { id: string; label: string; qty: string; amount: number; month: string }
interface Review { id: string; rating: number; body: string; region: string | null; event_type: string | null }

async function getProof(): Promise<{ cases: Case[]; reviews: Review[] }> {
  if (!isServiceRoleConfigured()) return { cases: [], reviews: [] };
  const out: { cases: Case[]; reviews: Review[] } = { cases: [], reviews: [] };
  try {
    const svc = await createServiceRoleClient();
    const { data } = await svc
      .from("estimate_requests")
      .select("id, event_type, quantity_range, customer_payback_amount, created_at")
      .eq("status", "settled")
      .gt("customer_payback_amount", 0)
      .order("created_at", { ascending: false })
      .limit(3);
    out.cases = (data ?? []).map((r) => ({
      id: r.id as string,
      label: EVENT_TYPE_LABEL[r.event_type as EventType] ?? "행사",
      qty: QUANTITY_RANGE_LABEL[r.quantity_range as QuantityRange] ?? "",
      amount: (r.customer_payback_amount as number) ?? 0,
      month: new Date(r.created_at as string).toLocaleDateString("ko-KR", { year: "numeric", month: "long" }),
    }));
  } catch {}
  try {
    const svc = await createServiceRoleClient();
    const { data } = await svc.from("reviews").select("id, rating, body, region, event_type").eq("approved", true).order("created_at", { ascending: false }).limit(6);
    out.reviews = (data ?? []) as Review[];
  } catch {}
  return out;
}

export default async function TrustSection() {
  const { cases, reviews } = await getProof();
  return (
    <section className="border-t border-line bg-ivory">
      <div className="mx-auto max-w-[1120px] px-5 py-12 md:px-8 md:py-16">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">TRUST</p>
        <h2 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[28px]">믿고 맡기실 수 있어요</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <li key={b.title} className="rounded-2xl border border-line bg-paper px-4 py-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-ivory">
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-[14px] font-bold">{b.title}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">{b.desc}</p>
              </li>
            );
          })}
        </ul>

        {cases.length > 0 && (
          <div className="mt-10">
            <h3 className="text-[16px] font-bold">최근 정산 사례</h3>
            <ul className="mt-3 space-y-2.5">
              {cases.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold">{c.label} · {c.qty}</p>
                    <p className="mt-0.5 text-[12px] text-muted-light">{c.month} 정산 완료</p>
                  </div>
                  <span className="text-[15px] font-extrabold tabular-nums">{c.amount.toLocaleString("ko-KR")}원</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-muted-light">실제 정산 내역이며 개인정보는 표시하지 않아요. 금액은 화환 수량·상태에 따라 달라져요.</p>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="mt-10">
            <h3 className="text-[16px] font-bold">고객 후기</h3>
            <ul className="mt-3 grid gap-3 md:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-line bg-paper px-5 py-5">
                  <p className="text-[14px] text-brass">{"★".repeat(r.rating)}<span className="text-sage">{"★".repeat(5 - r.rating)}</span></p>
                  <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed">{r.body}</p>
                  <p className="mt-3 text-[11.5px] text-muted-light">
                    {[r.region, r.event_type ? EVENT_TYPE_LABEL[r.event_type as EventType] : null].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
