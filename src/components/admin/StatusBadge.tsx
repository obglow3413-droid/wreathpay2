import { STATUS_LABEL, type RequestStatus } from "@/lib/types";

const STATUS_STYLE: Record<RequestStatus, string> = {
  received: "bg-slate-100 text-slate-600",
  estimating: "bg-blue-50 text-blue-600",
  estimated: "bg-blue-50 text-blue-600",
  customer_approved: "bg-indigo-50 text-indigo-600",
  dispatch_pending: "bg-amber-50 text-amber-700",
  dispatched: "bg-amber-50 text-amber-700",
  collecting: "bg-orange-50 text-orange-700",
  collected: "bg-emerald-50 text-emerald-700",
  settled: "bg-brand-tint text-brand-dark",
  cancelled: "bg-red-50 text-red-600",
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
