import Link from "next/link";

interface BottomCtaProps {
  label?: string;
  href?: string;
}

/**
 * 모바일 화면 하단에 항상 고정되는 CTA.
 * 브리프 3장: "모바일 화면 하단에 항상 '사진으로 견적받기' 버튼 고정"
 */
export default function BottomCta({
  label = "사진으로 견적받기",
  href = "/estimate",
}: BottomCtaProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
      <Link
        href={href}
        className="hover-lift flex h-13 w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-[16px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(15,157,104,0.55)]"
      >
        {label}
      </Link>
    </div>
  );
}
