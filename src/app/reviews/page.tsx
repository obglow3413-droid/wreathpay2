import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";

export const metadata: Metadata = {
  title: "이용 후기·정산 사례",
  description: "KKOT PAY로 화환을 정리한 고객 후기와 실제 정산 사례를 모았습니다.",
  alternates: { canonical: "/reviews" },
};
export const revalidate = 600;

async function load() {
  const out = { reviews: [] as { id: string; rating: number; body: string; region: string | null; event_type: string | null }[], cases: [] as { id: string; label: string; qty: string; amount: number; month: string }[] };
  if (!isServiceRoleConfigured()) return out;
  try {
    const svc = await createServiceRoleClient();
    const { data: rv } = await svc.from("reviews").select("id, rating, body, region, event_type").eq("approved", true).order("created_at", { ascending: false }).limit(60);
    out.reviews = rv ?? [];
    const { data: cs } = await svc
      .from("estimate_requests")
      .select("id, event_type, quantity_range, customer_payback_amount, created_at")
      .eq("status", "settled")
      .gt("customer_payback_amount", 0)
      .order("created_at", { ascending: false })
      .limit(20);
    out.cases = (cs ?? []).map((r) => ({
      id: r.id as string,
      label: EVENT_TYPE_LABEL[r.event_type as EventType] ?? "행사",
      qty: QUANTITY_RANGE_LABEL[r.quantity_range as QuantityRange] ?? "",
      amount: Number(r.customer_payback_amount) || 0,
      month: new Date(r.created_at as string).toLocaleDateString("ko-KR", { year: "numeric", month: "long" }),
    }));
  } catch (e) {
    console.error("[reviews page]", e);
  }
  return out;
}

export default async function ReviewsPage() {
  const { reviews, cases } = await load();
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 pb-12">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">REVIEWS</p>
        <h1 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[28px]">이용 후기와 정산 사례</h1>
        <p className="mt-2 text-[13.5px] text-muted">실제 이용 고객이 남긴 후기와 정산 완료된 내역이에요. 개인정보는 표시하지 않아요.</p>

        <h2 className="mt-8 text-[16px] font-bold">고객 후기</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border bg-white px-5 py-8 text-center text-[13.5px] text-muted">아직 등록된 후기가 없어요. 수거가 끝나면 &lsquo;내 접수 조회&rsquo;에서 후기를 남길 수 있어요.</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-white px-5 py-5">
                <p className="text-[14px] text-brass">{"★".repeat(r.rating)}<span className="text-sage">{"★".repeat(5 - r.rating)}</span></p>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed">{r.body}</p>
                <p className="mt-3 text-[11.5px] text-muted-light">{[r.region, r.event_type ? EVENT_TYPE_LABEL[r.event_type as EventType] : null].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}

        {cases.length > 0 && (
          <>
            <h2 className="mt-10 text-[16px] font-bold">정산 사례</h2>
            <ul className="mt-3 space-y-2.5">
              {cases.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold">{c.label} · {c.qty}</p>
                    <p className="mt-0.5 text-[12px] text-muted-light">{c.month} 정산 완료</p>
                  </div>
                  <span className="text-[15px] font-extrabold tabular-nums">{c.amount.toLocaleString("ko-KR")}원</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-muted-light">금액은 화환 수량·상태에 따라 달라져요.</p>
          </>
        )}

        <Link href="/estimate" className="mt-8 flex h-13 w-full items-center justify-center rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white">
          내 화환 페이백 확인하기
        </Link>
      </main>
    </div>
  );
}
