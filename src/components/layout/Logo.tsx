import Link from "next/link";

/**
 * KKOT PAY 워드마크. currentColor 기반이라 화이트/블랙 테마와 관리자 화면 어디서든 그대로 쓰인다.
 * - 심볼: 네 장의 꽃잎을 단순화한 기하학적 마크
 * - 워드마크: KKOT(굵게) + PAY(가늘게, 포인트 컬러)
 */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="7" fill="currentColor" />
      <g fill="var(--logo-ink, #fff)">
        <circle cx="12" cy="7.2" r="3" />
        <circle cx="12" cy="16.8" r="3" />
        <circle cx="7.2" cy="12" r="3" />
        <circle cx="16.8" cy="12" r="3" />
      </g>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function Logo({
  href = "/",
  size = "md",
  className = "",
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const text = size === "lg" ? "text-[22px]" : size === "sm" ? "text-[14px]" : "text-[17px]";
  const mark = size === "lg" ? 30 : size === "sm" ? 18 : 24;

  const content = (
    <span
      className={`inline-flex items-center gap-2 text-foreground ${className}`}
      style={{ ["--logo-ink" as string]: "var(--background, #fff)" }}
    >
      <LogoMark size={mark} />
      <span className={`${text} leading-none tracking-[0.14em]`}>
        <span className="font-extrabold">KKOT</span>
        <span className="ml-[0.35em] font-light text-brass">PAY</span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="KKOT PAY 홈" className="inline-flex">
      {content}
    </Link>
  );
}
