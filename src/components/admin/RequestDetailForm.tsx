"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  STATUS_LABEL,
  type EventType,
  type QuantityRange,
  type RequestStatus,
} from "@/lib/types";
import { calculatePricing, formatKRW, DEFAULT_PAYBACK_RATE } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";
import DeleteRequestButton from "@/components/admin/DeleteRequestButton";

interface GradePriceItem {
  unit_price: number;
  wreath_grades: { code: string; label: string };
}

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  vehicle_number: string | null;
}

interface RequestDetailData {
  id: string;
  request_no: string;
  status: RequestStatus;
  customers?: { name: string; phone: string } | null;
  event_type: string;
  quantity_range: string;
  place_name: string;
  address: string;
  address_detail: string | null;
  pickup_date: string;
  pickup_time_slot: string;
  customer_note: string | null;
  grade_premium_count: number | null;
  grade_a_count: number | null;
  grade_b_count: number | null;
  grade_c_count: number | null;
  estimated_logistics_cost: number | null;
  estimated_other_cost: number | null;
  pickup_orders?:
    | { driver_id: string | null; scheduled_pickup_at: string | null; actual_quantity: number | null; notes: string | null }
    | { driver_id: string | null; scheduled_pickup_at: string | null; actual_quantity: number | null; notes: string | null }[]
    | null;
  payouts?:
    | { reserved_advance_amount: number | null; status: string | null }
    | { reserved_advance_amount: number | null; status: string | null }[]
    | null;
}

export default function RequestDetailForm({
  request,
  imageUrls,
  gradePrices,
  drivers,
}: {
  request: RequestDetailData;
  imageUrls: string[];
  gradePrices: GradePriceItem[];
  drivers: DriverItem[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [gradeCounts, setGradeCounts] = useState({
    premium: request.grade_premium_count ?? 0,
    a: request.grade_a_count ?? 0,
    b: request.grade_b_count ?? 0,
    c: request.grade_c_count ?? 0,
  });

  const existingPickup = Array.isArray(request.pickup_orders)
    ? request.pickup_orders[0]
    : request.pickup_orders;
  const existingPayout = Array.isArray(request.payouts) ? request.payouts[0] : request.payouts;

  const [driverId, setDriverId] = useState(existingPickup?.driver_id ?? "");
  const [scheduledPickupAt, setScheduledPickupAt] = useState(
    existingPickup?.scheduled_pickup_at?.slice(0, 16) ?? ""
  );
  const [actualQuantity, setActualQuantity] = useState(existingPickup?.actual_quantity ?? "");
  const [dispatchNotes, setDispatchNotes] = useState(existingPickup?.notes ?? "");

  const [reservedAdvance, setReservedAdvance] = useState(
    existingPayout?.reserved_advance_amount ?? 0
  );
  const [payoutStatus, setPayoutStatus] = useState(existingPayout?.status ?? "pending");

  const priceByCode = useMemo(() => {
    const map: Record<string, number> = {};
    for (const gp of gradePrices) map[gp.wreath_grades.code] = gp.unit_price;
    return map;
  }, [gradePrices]);

  const pricing = useMemo(
    () =>
      calculatePricing(
        gradeCounts,
        {
          premium: priceByCode.premium ?? 0,
          a: priceByCode.a ?? 0,
          b: priceByCode.b ?? 0,
          c: priceByCode.c ?? 0,
        },
        {
          logisticsCost: request.estimated_logistics_cost || 30000,
          otherCost: request.estimated_other_cost || 5000,
          paybackRate: DEFAULT_PAYBACK_RATE,
        }
      ),
    [gradeCounts, priceByCode, request]
  );

  async function handleSave(overrides?: { status?: RequestStatus; payoutStatus?: string }) {
    const nextStatus = overrides?.status ?? status;
    const nextPayoutStatus = overrides?.payoutStatus ?? payoutStatus;

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradePremiumCount: gradeCounts.premium,
          gradeACount: gradeCounts.a,
          gradeBCount: gradeCounts.b,
          gradeCCount: gradeCounts.c,
          status: nextStatus,
          dispatch: {
            driverId: driverId || null,
            scheduledPickupAt: scheduledPickupAt || null,
            actualQuantity,
            notes: dispatchNotes,
          },
          payout: {
            reservedAdvanceAmount: reservedAdvance,
            status: nextPayoutStatus,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setStatus(nextStatus);
      setPayoutStatus(nextPayoutStatus);
      setSaved(true);
      router.refresh();
    } catch {
      alert("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  const [quickAction, setQuickAction] = useState<"approve" | "payback" | null>(null);

  async function handleApprove() {
    setQuickAction("approve");
    await handleSave({ status: "customer_approved" });
    setQuickAction(null);
  }

  async function handlePaybackComplete() {
    const confirmed = window.confirm(
      `${formatKRW(pricing.customerPaybackAmount)}을 페이백 완료 처리할까요?`
    );
    if (!confirmed) return;
    setQuickAction("payback");
    await handleSave({ status: "settled", payoutStatus: "completed" });
    setQuickAction(null);
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">{request.request_no}</h2>
            <StatusBadge status={request.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[13.5px]">
            <DL label="고객명" value={request.customers?.name ?? "-"} />
            <DL label="연락처" value={request.customers?.phone ?? "-"} />
            <DL label="행사종류" value={EVENT_TYPE_LABEL[request.event_type as EventType]} />
            <DL
              label="예상수량"
              value={QUANTITY_RANGE_LABEL[request.quantity_range as QuantityRange]}
            />
            <DL label="수거장소" value={`${request.place_name} (${request.address})`} full />
            <DL label="상세위치" value={request.address_detail ?? "-"} />
            <DL label="수거희망시간" value={`${request.pickup_date} · ${request.pickup_time_slot}`} />
            {request.customer_note && (
              <DL label="고객 요청사항" value={request.customer_note} full />
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">업로드 사진</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5 md:grid-cols-5">
            {imageUrls.length === 0 && (
              <p className="col-span-full text-[13px] text-muted">등록된 사진이 없어요.</p>
            )}
            {imageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`화환 사진 ${i + 1}`}
                className="aspect-square rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">등급별 수량 입력</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {(["premium", "a", "b", "c"] as const).map((code) => {
              const meta = gradePrices.find((g) => g.wreath_grades.code === code);
              return (
                <div key={code}>
                  <label className="mb-1 block text-[12.5px] text-muted">
                    {meta?.wreath_grades.label ?? code} ({formatKRW(meta?.unit_price ?? 0)}/개)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gradeCounts[code]}
                    onChange={(e) =>
                      setGradeCounts((prev) => ({ ...prev, [code]: Number(e.target.value) }))
                    }
                    className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">배차 정보</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">배차기사</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              >
                <option value="">미배정</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicle_number ?? "차량번호 미등록"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">픽업 예정시간</label>
              <input
                type="datetime-local"
                value={scheduledPickupAt}
                onChange={(e) => setScheduledPickupAt(e.target.value)}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">실제 수거수량</label>
              <input
                type="number"
                min={0}
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">비고</label>
              <input
                type="text"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">빠른 처리</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleApprove}
              disabled={quickAction !== null || status === "customer_approved"}
              className="flex h-11 items-center justify-center rounded-lg border border-brand bg-brand-tint text-[13.5px] font-semibold text-brand-dark disabled:opacity-50"
            >
              {quickAction === "approve" ? "처리 중..." : "승인"}
            </button>
            <button
              type="button"
              onClick={handlePaybackComplete}
              disabled={quickAction !== null || status === "settled"}
              className="flex h-11 items-center justify-center rounded-lg bg-brand text-[13.5px] font-semibold text-white disabled:opacity-50"
            >
              {quickAction === "payback" ? "처리 중..." : "페이백완료"}
            </button>
          </div>
          {status === "customer_approved" && (
            <p className="mt-2 text-[12px] text-brand-dark">✓ 이미 승인된 신청이에요.</p>
          )}
          {status === "settled" && (
            <p className="mt-2 text-[12px] text-brand-dark">✓ 페이백이 완료된 신청이에요.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">진행상태</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RequestStatus)}
            className="mt-3 h-11 w-full rounded-lg border border-border px-3 text-[14px]"
          >
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">자동 계산</h2>
          <dl className="mt-3 space-y-2 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-muted">예상 매각금액</dt>
              <dd className="font-medium tabular-nums">{formatKRW(pricing.estimatedSaleAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">고객 페이백</dt>
              <dd className="font-medium tabular-nums">{formatKRW(pricing.customerPaybackAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">물류비</dt>
              <dd className="tabular-nums">{formatKRW(pricing.logisticsCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">기타 직접비용</dt>
              <dd className="tabular-nums">{formatKRW(pricing.otherCost)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-semibold">예상 공헌이익</dt>
              <dd className="font-bold tabular-nums text-brand-dark">
                {formatKRW(pricing.estimatedContributionMargin)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold">페이백 지급</h2>
          <div className="mt-3 space-y-3 text-[13.5px]">
            <div className="flex justify-between">
              <span className="text-muted">예상 페이백</span>
              <span className="font-medium tabular-nums">{formatKRW(pricing.customerPaybackAmount)}</span>
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">예약 선지급</label>
              <input
                type="number"
                min={0}
                value={reservedAdvance}
                onChange={(e) => setReservedAdvance(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted">수거 후 잔금</span>
              <span className="font-medium tabular-nums">
                {formatKRW(pricing.customerPaybackAmount - reservedAdvance)}
              </span>
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">지급 상태</label>
              <select
                value={payoutStatus}
                onChange={(e) => setPayoutStatus(e.target.value)}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              >
                <option value="pending">지급대기</option>
                <option value="partial">일부지급</option>
                <option value="completed">지급완료</option>
              </select>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[14.5px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "변경사항 저장"}
        </button>

        <DeleteRequestButton
          requestId={request.id}
          requestNo={request.request_no}
          variant="full"
          redirectTo="/admin/requests"
        />
      </div>
    </div>
  );
}

function DL({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-muted-light">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
