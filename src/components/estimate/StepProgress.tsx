interface StepProgressProps {
  current: number; // 1-based
  total: number;
}

export default function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-[12.5px] text-muted">
        <span>
          STEP {current} / {total}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
