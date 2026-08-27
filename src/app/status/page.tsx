import Link from "next/link";
import type { Metadata } from "next";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  STATUS_LABEL,
  type EventType,
  type QuantityRange,
  type RequestStatus,
} from "@/lib/types";
import { formatKRW } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";
import BackHeader from "@/components/layout/BackHeader";

export const metadata: Metadata = {
  title: "접수현황",
  description: "내가 신청한 화환 접수 현황과 페이백 지급현황을 확인해보세요.",
};

export const dynamic = "force-dynamic";

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: "지급대기",
  partial: "일부지급",
  completed: "지급완료",
};

const PAYOUT_STATUS_STYLE: Record<string, string> = {
  pending: "bg-surface text-muted",
  partial: "bg-amber-50 text-amber-700",
  completed: "bg-brand-tint text-brand-dark",
};

const GRADE_LABELS_KO: Record<string, string> = {
  premium: "Premium",
  a: "A급",
  b: "B급",
  c: "C급",
};

interface MyRequestRow {
  id: string;
  request_no: string;
  event_type: EventType;
  quantity_range: QuantityRange;
  status: RequestStatus;
  grade_premium_count: number | null;
  grade_a_count: number | null;
  grade_b_count: number | null;
  grade_c_count: number | null;
  estimated_sale_amount: number;
  customer_payback_amount: number;
  pickup_date: string;
  pickup_time_slot: string;
  created_at: string;
  payouts?:
    | { status: string; reserved_advance_amount: number }
    | { status: string; reserved_advance_amount: number }[]
    | null;
}

async function getImagesByRequest(requestIds: string[]): Promise<Record<string, string[]>> {
  if (requestIds.length === 0) return {};
  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_images")
      .select("estimate_request_id, storage_path, sort_order")
      .in("estimate_request_id", requestIds)
      .order("sort_order", { ascending: true });

    const map: Record<string, string[]> = {};
    for (const row of data ?? []) {
      const { data: signed } = await supabase.storage
        .from("estimate-photos")
        .createSignedUrl(row.storage_path, 60 * 60);
      if (signed?.signedUrl) {
        map[row.estimate_request_id] = [...(map[row.estimate_request_id] ?? []), signed.signedUrl];
      }
    }
    return map;
  } catch (e) {
    console.error("[status images]", e);
    return {};
  }
}

export default async function StatusPage() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        title="접수현황을 준비 중이에요"
        desc="Supabase가 연결되면 이 화면에서 신청 내역을 확인할 수 있어요."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <EmptyState
        title="로그인하면 접수현황을 볼 수 있어요"
        desc="이메일로 1초만에 가입하고, 내 신청 내역과 페이백 지급현황을 한눈에 확인해보세요."
        ctaHref="/signup"
        ctaLabel="가입 / 로그인 하러 가기"
      />
    );
  }

  const { data, error } = await supabase
    .from("estimate_requests")
    .select(
      "id, request_no, event_type, quantity_range, status, grade_premium_count, grade_a_count, grade_b_count, grade_c_count, estimated_sale_amount, customer_payback_amount, pickup_date, pickup_time_slot, created_at, payouts(status, reserved_advance_amount)"
    )
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[status page]", error);
  }

  const requests = (data ?? []) as MyRequestRow[];

  if (requests.length === 0) {
    return (
      <EmptyState
        title="아직 신청한 내역이 없어요"
        desc="화환 사진 한 장이면 바로 페이백 신청을 시작할 수 있어요."
        ctaHref="/estimate"
        ctaLabel="사진으로 견적받기"
      />
    );
  }

  const imagesByRequest = await getImagesByRequest(requests.map((r) => r.id));

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-24">
        <h1 className="text-[20px] font-bold">접수현황</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          내가 신청한 화환 접수 내역과 페이백 지급현황이에요.
        </p>

        <div className="mt-5 space-y-4">
          {requests.map((r) => {
            const payout = Array.isArray(r.payouts) ? r.payouts[0] : r.payouts;
            const payoutStatus = payout?.status ?? "pending";
            const reservedAdvance = payout?.reserved_advance_amount ?? 0;
            const photos = imagesByRequest[r.id] ?? [];
            const gradeCounts = [
              { code: "premium", count: r.grade_premium_count ?? 0 },
              { code: "a", count: r.grade_a_count ?? 0 },
              { code: "b", count: r.grade_b_count ?? 0 },
              { code: "c", count: r.grade_c_count ?? 0 },
            ].filter((g) => g.count > 0);

            return (
              <div key={r.id} className="rounded-xl border border-border bg-white p-4">
                {/* 상단: 신청번호 + 상태 */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-bold text-brand-dark">{r.request_no}</p>
                  <div className="flex shrink-0 gap-1.5">
                    <StatusBadge status={r.status} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYOUT_STATUS_STYLE[payoutStatus]}`}
                    >
                      {PAYOUT_STATUS_LABEL[payoutStatus]}
                    </span>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-[13px] text-muted">
                  <span>{EVENT_TYPE_LABEL[r.event_type]}</span>
                  <span className="text-right">{QUANTITY_RANGE_LABEL[r.quantity_range]}</span>
                  <span>{r.pickup_date}</span>
                  <span className="text-right">{r.pickup_time_slot}</span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted-light">
                  {new Date(r.created_at).toLocaleDateString("ko-KR")} 신청
                </p>

                {/* 업로드한 사진 */}
                {photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {photos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt={`업로드 사진 ${i + 1}`}
                        className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* 예상금액표 */}
                <div className="mt-3 rounded-lg bg-surface p-3">
                  {gradeCounts.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {gradeCounts.map((g) => (
                        <span
                          key={g.code}
                          className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] text-muted"
                        >
                          {GRADE_LABELS_KO[g.code]} {g.count}개
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-muted">예상 매각금액</span>
                    <span className="font-medium tabular-nums">{formatKRW(r.estimated_sale_amount)}</span>
                  </div>
                  {reservedAdvance > 0 && (
                    <div className="mt-1 flex items-center justify-between text-[12.5px]">
                      <span className="text-muted">예약 선지급</span>
                      <span className="font-medium tabular-nums">{formatKRW(reservedAdvance)}</span>
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
                    <span className="text-[13px] font-semibold">
                      {reservedAdvance > 0 ? "수거 후 잔금" : "예상 페이백"}
                    </span>
                    <span className="text-[16px] font-extrabold tabular-nums text-brand-dark">
                      {formatKRW(r.customer_payback_amount - reservedAdvance)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ConsultButton />
      </div>
    </div>
  );
}

function ConsultButton() {
  return (
    <a
      href="https://d5dpz.channel.io"
      target="_blank"
      rel="noopener noreferrer"
      className="hover-lift mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-border text-[14.5px] font-semibold text-foreground"
    >
      💬 상담하기
    </a>
  );
}

function EmptyState({
  title,
  desc,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  desc: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 pb-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl">
          📋
        </div>
        <h1 className="mt-5 text-[19px] font-bold leading-snug">{title}</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{desc}</p>
        {ctaHref && ctaLabel && (
          <Link
            href={ctaHref}
            className="hover-lift mt-6 flex h-13 w-full max-w-xs items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white"
          >
            {ctaLabel}
          </Link>
        )}
        <ConsultButton />
      </div>
    </div>
  );
}
