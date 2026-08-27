interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export default function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 text-[24px] font-extrabold tabular-nums leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-[12px] text-muted-light">{hint}</p>}
    </div>
  );
}
