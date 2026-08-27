interface OptionCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionCard({ label, sublabel, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hover-lift w-full rounded-xl border px-5 py-4 text-left ${
        selected
          ? "border-brand bg-brand-tint shadow-[0_8px_20px_-10px_rgba(15,157,104,0.4)]"
          : "border-border bg-white hover:border-brand/30"
      }`}
    >
      <span
        className={`block text-[15.5px] font-semibold ${
          selected ? "text-brand-dark" : "text-foreground"
        }`}
      >
        {label}
      </span>
      {sublabel && <span className="mt-0.5 block text-[13px] text-muted">{sublabel}</span>}
    </button>
  );
}
