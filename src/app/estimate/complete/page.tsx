import type { Metadata } from "next";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { EVENT_TYPE_LABEL, QUANTITY_RANGE_LABEL, type EventType, type QuantityRange } from "@/lib/types";

export const metadata: Metadata = {
  title: "견적 신청 완료",
};

async function getRequestSummary(requestNo: string) {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select("request_no, event_type, quantity_range, place_name, pickup_date")
      .eq("request_no", requestNo)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function EstimateCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>;
}) {
  const { req } = await searchParams;
  const requestNo = req ?? "-";
  const summary = requestNo !== "-" ? await getRequestSummary(requestNo) : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <div className="fade-up text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl">
          ✓
        </div>
        <h1 className="mt-5 text-[22px] font-bold leading-snug">
          화환 견적 신청이
          <br />
          완료되었습니다.
        </h1>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface px-5 py-5">
        <SummaryRow label="신청번호" value={requestNo} />
        <SummaryRow
          label="행사종류"
          value={summary ? EVENT_TYPE_LABEL[summary.event_type as EventType] : "-"}
        />
        <SummaryRow
          label="예상 화환수량"
          value={summary ? QUANTITY_RANGE_LABEL[summary.quantity_range as QuantityRange] : "-"}
        />
        <SummaryRow label="수거장소" value={summary?.place_name ?? "-"} />
        <SummaryRow label="수거희망일" value={summary?.pickup_date ?? "-"} isLast />
      </div>

      <p className="mt-6 text-center text-[14px] leading-relaxed text-muted">
        사진 확인 후 예상 페이백 금액과 수거 가능시간을 안내드립니다.
      </p>

      <div className="mt-8 space-y-2.5">
        <Link
          href="/status"
          className="hover-lift flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white"
        >
          접수현황 바로가기
        </Link>
        <a
          href="https://d5dpz.channel.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-[15px] font-semibold text-white"
        >
          상담하기
        </a>
        <Link
          href="/"
          className="flex h-13 items-center justify-center rounded-xl border border-border py-3.5 text-[15px] font-semibold text-foreground"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${!isLast ? "border-b border-border/70" : ""}`}>
      <span className="text-[13.5px] text-muted">{label}</span>
      <span className="text-[14px] font-medium">{value}</span>
    </div>
  );
}
