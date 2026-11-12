interface StepProgressProps {
  current: number; // 1-based
  total: number;
  labels?: string[];
}

/** 단계 이름이 보이는 진행 표시: 지난 단계는 채워지고, 현재 단계는 강조된다. */
export default function StepProgress({ current, total, labels }: StepProgressProps) {
  const names = labels && labels.length === total ? labels : Array.from({ length: total }, (_, i) => `${i + 1}`);
  return (
    <div className="mb-7" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`${total}단계 중 ${current}단계`}>
      <ol className="flex gap-1.5">
        {names.map((name, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={name + i} className="min-w-0 flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-300 ${done || active ? "bg-brand" : "bg-sage"}`} />
              <p className={`mt-1.5 truncate text-[11.5px] ${active ? "font-bold text-foreground" : done ? "text-muted" : "text-muted-light"}`}>
                {done ? "✓ " : ""}
                {name}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
