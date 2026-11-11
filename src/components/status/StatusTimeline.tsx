import type { RequestStatus } from "@/lib/types";

const STEPS = ["접수", "견적 확정", "수거", "정산"] as const;

/** 상세 상태를 4단계 진행 단계로 변환. -1이면 취소. */
export function getStepIndex(status: RequestStatus): number {
  switch (status) {
    case "received":
    case "estimating":
      return 0;
    case "estimated":
    case "customer_approved":
    case "dispatch_pending":
    case "dispatched":
      return 1;
    case "collecting":
    case "collected":
      return 2;
    case "settled":
      return 3;
    default:
      return -1;
  }
}

const HINT: Partial<Record<RequestStatus, string>> = {
  received: "신청이 접수되었습니다. 사진을 확인하고 있어요.",
  estimating: "사진을 확인해 견적을 산정하고 있어요.",
  estimated: "견적이 확정되었습니다. 안내드린 금액을 확인해 주세요.",
  customer_approved: "견적에 동의해 주셨어요. 수거 일정을 조율하고 있어요.",
  dispatch_pending: "수거 기사를 배정하고 있어요.",
  dispatched: "수거 기사가 배정되었습니다. 희망 일시에 방문합니다.",
  collecting: "수거가 진행 중이에요.",
  collected: "수거가 완료되었습니다. 곧 정산됩니다.",
  settled: "정산이 완료되었습니다. 이용해 주셔서 감사합니다.",
  cancelled: "취소된 신청입니다.",
};

export default function StatusTimeline({ status }: { status: RequestStatus }) {
  const current = getStepIndex(status);

  if (current === -1) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2.5 text-[12.5px] text-red-600">{HINT.cancelled}</p>
    );
  }

  // 수거 완료 / 정산 완료 상태는 해당 단계까지 모두 완료로 표시
  const completedThrough = status === "collected" ? 2 : status === "settled" ? 3 : current - 1;

  return (
    <div>
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const done = i <= completedThrough;
          const active = i === current && !done;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <span
                  className={`absolute right-1/2 top-[9px] h-[2px] w-full ${
                    i <= completedThrough || i === current ? "bg-brand" : "bg-border"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  done
                    ? "border-brand bg-brand text-white"
                    : active
                      ? "border-brand bg-white text-brand"
                      : "border-border bg-white text-muted-light"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`mt-1.5 text-[11.5px] ${
                  done || active ? "font-semibold text-foreground" : "text-muted-light"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      {HINT[status] && <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{HINT[status]}</p>}
    </div>
  );
}
